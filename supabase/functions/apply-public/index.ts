import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { job_id, applicant_name, applicant_email, applicant_phone, cover_letter } = await req.json();

    if (!job_id || !applicant_name || !applicant_email) {
      return new Response(
        JSON.stringify({ error: "job_id, applicant_name, and applicant_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicant_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the job posting exists, is open, and is public
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("id, status, is_public")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      console.error("Job not found:", jobError);
      return new Response(
        JSON.stringify({ error: "Job posting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status !== "open" || !job.is_public) {
      return new Response(
        JSON.stringify({ error: "This position is no longer accepting applications" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", job_id)
      .eq("applicant_email", applicant_email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "You have already applied for this position" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the application
    const { error: insertError } = await supabase.from("job_applications").insert({
      job_id,
      applicant_name,
      applicant_email,
      applicant_phone: applicant_phone || null,
      cover_letter: cover_letter || null,
      status: "new",
    });

    if (insertError) {
      console.error("Failed to insert application:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit application" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`New application received for job ${job_id} from ${applicant_email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Application submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in apply-public:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import { Loader2, UserPlus } from "lucide-react";
 
 interface JoinCompanyDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess: () => void;
 }
 
 export default function JoinCompanyDialog({
   open,
   onOpenChange,
   onSuccess,
 }: JoinCompanyDialogProps) {
   const [code, setCode] = useState("");
   const [loading, setLoading] = useState(false);
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       // Find the invitation code
       const { data: invitation, error: inviteError } = await supabase
         .from("invitation_codes")
         .select("*")
         .eq("code", code.trim().toUpperCase())
         .eq("is_used", false)
         .single();
 
       if (inviteError || !invitation) {
         throw new Error("Invalid or expired invitation code");
       }
 
       // Check if code is expired
       if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
         throw new Error("This invitation code has expired");
       }
 
       // Check if user is already a member
       const { data: existingMembership } = await supabase
         .from("company_memberships")
         .select("id")
         .eq("user_id", user.id)
         .eq("company_id", invitation.company_id)
         .single();
 
       if (existingMembership) {
         throw new Error("You are already a member of this company");
       }
 
       // Create membership
       const { error: membershipError } = await supabase
         .from("company_memberships")
         .insert({
           user_id: user.id,
           company_id: invitation.company_id,
           role: invitation.role,
         });
 
       if (membershipError) throw membershipError;
 
       // Mark code as used
       const { error: updateError } = await supabase
         .from("invitation_codes")
         .update({
           is_used: true,
           used_by: user.id,
           used_at: new Date().toISOString(),
         })
         .eq("id", invitation.id);
 
       if (updateError) throw updateError;
 
       setCode("");
       onSuccess();
     } catch (error: any) {
       toast({
         variant: "destructive",
         title: "Error joining company",
         description: error.message,
       });
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <div className="mx-auto mb-2 p-3 rounded-xl bg-accent/50 w-fit">
             <UserPlus className="w-6 h-6 text-accent-foreground" />
           </div>
           <DialogTitle className="text-center">Join a Company</DialogTitle>
           <DialogDescription className="text-center">
             Enter the invitation code provided by your company administrator
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="code">Invitation Code</Label>
             <Input
               id="code"
               value={code}
               onChange={(e) => setCode(e.target.value.toUpperCase())}
               placeholder="XXXX-XXXX-XXXX"
               className="text-center text-lg tracking-widest font-mono"
               required
             />
           </div>
 
           <Button type="submit" variant="gradient" className="w-full" disabled={loading || !code.trim()}>
             {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
             Join Company
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
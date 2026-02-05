 import { useState, useEffect } from "react";
 import { useNavigate, Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Building2, Users, Shield, BarChart3, LogOut } from "lucide-react";
 
 export default function Landing() {
   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         setLoading(false);
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       setLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const handleSignOut = async () => {
     await supabase.auth.signOut();
   };
 
   const features = [
     {
       icon: Building2,
       title: "Multi-Company Management",
       description: "Manage multiple companies from a single dashboard with role-based access control."
     },
     {
       icon: Users,
       title: "Employee Management",
       description: "Complete employee lifecycle management from onboarding to offboarding."
     },
     {
       icon: Shield,
       title: "Compliance & Security",
       description: "Stay compliant with NAPSA, PAYE, and NHIMA statutory requirements."
     },
     {
       icon: BarChart3,
       title: "Analytics & Reports",
       description: "Generate comprehensive payroll, attendance, and performance reports."
     }
   ];
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
       {/* Header */}
       <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-primary/10">
               <Building2 className="w-6 h-6 text-primary" />
             </div>
             <span className="text-xl font-bold">HR Platform</span>
           </div>
           <div className="flex items-center gap-3">
             {loading ? (
               <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
             ) : user ? (
               <>
                 <Button variant="outline" onClick={() => navigate("/get-started")}>
                   Dashboard
                 </Button>
                 <Button variant="ghost" size="icon" onClick={handleSignOut}>
                   <LogOut className="w-4 h-4" />
                 </Button>
               </>
             ) : (
               <>
                 <Button variant="ghost" asChild>
                   <Link to="/auth?tab=signin">Log In</Link>
                 </Button>
                 <Button variant="gradient" asChild>
                   <Link to="/auth?tab=signup">Sign Up</Link>
                 </Button>
               </>
             )}
           </div>
         </div>
       </header>
 
       {/* Hero Section */}
       <section className="container mx-auto px-4 py-20 text-center">
         <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
           Enterprise HR Management
         </h1>
         <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
           Streamline your human resources operations with our comprehensive platform. 
           Manage payroll, attendance, performance, and compliance all in one place.
         </p>
         <div className="flex gap-4 justify-center">
           {user ? (
             <Button size="lg" variant="gradient" onClick={() => navigate("/get-started")}>
               Go to Dashboard
             </Button>
           ) : (
             <>
               <Button size="lg" variant="gradient" asChild>
                 <Link to="/auth?tab=signup">Get Started Free</Link>
               </Button>
               <Button size="lg" variant="outline" asChild>
                 <Link to="/auth?tab=signin">Sign In</Link>
               </Button>
             </>
           )}
         </div>
       </section>
 
       {/* Features Section */}
       <section className="container mx-auto px-4 py-16">
         <h2 className="text-3xl font-bold text-center mb-12">
           Everything You Need to Manage Your Workforce
         </h2>
         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           {features.map((feature) => (
             <Card key={feature.title} className="glass-card hover:shadow-lg transition-shadow">
               <CardContent className="p-6 text-center">
                 <div className="mx-auto mb-4 p-3 rounded-xl bg-primary/10 w-fit">
                   <feature.icon className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="font-semibold mb-2">{feature.title}</h3>
                 <p className="text-sm text-muted-foreground">{feature.description}</p>
               </CardContent>
             </Card>
           ))}
         </div>
       </section>
 
       {/* Trust Section */}
       <section className="container mx-auto px-4 py-16 text-center">
         <div className="bg-primary/5 rounded-2xl p-12">
           <h2 className="text-2xl font-bold mb-4">Trusted by Growing Businesses</h2>
           <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
             Join hundreds of companies managing their HR operations efficiently with our platform.
           </p>
           <div className="flex justify-center gap-8 text-muted-foreground">
             <div>
               <div className="text-3xl font-bold text-primary">500+</div>
               <div className="text-sm">Companies</div>
             </div>
             <div>
               <div className="text-3xl font-bold text-primary">50,000+</div>
               <div className="text-sm">Employees</div>
             </div>
             <div>
               <div className="text-3xl font-bold text-primary">99.9%</div>
               <div className="text-sm">Uptime</div>
             </div>
           </div>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="border-t py-8 mt-16">
         <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
           © {new Date().getFullYear()} HR Platform. All rights reserved.
         </div>
       </footer>
     </div>
   );
 }
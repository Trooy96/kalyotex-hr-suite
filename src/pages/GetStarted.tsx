 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Building2, LogIn, UserPlus, LogOut, ChevronDown } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import CreateCompanyDialog from "@/components/company/CreateCompanyDialog";
 import JoinCompanyDialog from "@/components/company/JoinCompanyDialog";
 
 interface Company {
   id: string;
   name: string;
   role: string;
 }
 
 export default function GetStarted() {
   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [companies, setCompanies] = useState<Company[]>([]);
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [showJoinDialog, setShowJoinDialog] = useState(false);
   const navigate = useNavigate();
   const { toast } = useToast();
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         if (!session?.user) {
           navigate("/auth");
         } else {
           setTimeout(() => fetchUserCompanies(session.user.id), 0);
         }
         setLoading(false);
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       if (!session?.user) {
         navigate("/auth");
       } else {
         fetchUserCompanies(session.user.id);
       }
       setLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, [navigate]);
 
   const fetchUserCompanies = async (userId: string) => {
     const { data, error } = await supabase
       .from("company_memberships")
       .select(`
         company_id,
         role,
         companies:company_id (
           id,
           name
         )
       `)
       .eq("user_id", userId)
       .eq("is_active", true);
 
     if (error) {
       console.error("Error fetching companies:", error);
       return;
     }
 
     const formattedCompanies = data?.map((item: any) => ({
       id: item.companies.id,
       name: item.companies.name,
       role: item.role,
     })) || [];
 
     setCompanies(formattedCompanies);
   };
 
   const handleSignOut = async () => {
     await supabase.auth.signOut();
     navigate("/");
   };
 
   const handleLoginToCompany = (companyId: string) => {
     localStorage.setItem("selectedCompanyId", companyId);
     navigate("/");
   };
 
   const handleCompanyCreated = () => {
     setShowCreateDialog(false);
     if (user) {
       fetchUserCompanies(user.id);
     }
     toast({
       title: "Company Created",
       description: "Your company has been created successfully. You are now the Super Admin.",
     });
   };
 
   const handleCompanyJoined = () => {
     setShowJoinDialog(false);
     if (user) {
       fetchUserCompanies(user.id);
     }
     toast({
       title: "Joined Company",
       description: "You have successfully joined the company.",
     });
   };
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
         <div className="animate-pulse text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   const hasCompanies = companies.length > 0;
 
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
             <span className="text-sm text-muted-foreground">{user?.email}</span>
             <Button variant="outline" size="sm" onClick={handleSignOut}>
               <LogOut className="w-4 h-4 mr-2" />
               Log Out
             </Button>
           </div>
         </div>
       </header>
 
       <div className="container mx-auto px-4 py-12">
         <div className="text-center mb-12">
           <h1 className="text-3xl font-bold mb-4">Welcome to HR Platform</h1>
           <p className="text-muted-foreground">
             {hasCompanies 
               ? "Select a company to continue or create a new one" 
               : "Get started by creating a company or joining an existing one"}
           </p>
         </div>
 
         {/* Existing Companies */}
         {hasCompanies && (
           <div className="mb-12">
             <h2 className="text-xl font-semibold mb-4 text-center">Your Companies</h2>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
               {companies.map((company) => (
                 <Card key={company.id} className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => handleLoginToCompany(company.id)}>
                   <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="p-2 rounded-lg bg-primary/10">
                         <Building2 className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                         <h3 className="font-semibold">{company.name}</h3>
                         <span className="text-xs text-muted-foreground capitalize">
                           {company.role.replace("_", " ")}
                         </span>
                       </div>
                     </div>
                     <Button variant="gradient" className="w-full" size="sm">
                       <LogIn className="w-4 h-4 mr-2" />
                       Enter Company
                     </Button>
                   </CardContent>
                 </Card>
               ))}
             </div>
           </div>
         )}
 
         {/* Action Cards */}
         <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
           <Card className="glass-card hover:shadow-lg transition-shadow">
             <CardHeader className="text-center">
               <div className="mx-auto mb-2 p-3 rounded-xl bg-primary/10 w-fit">
                 <Building2 className="w-8 h-8 text-primary" />
               </div>
               <CardTitle>Create Company</CardTitle>
               <CardDescription>
                 Set up a new company and become the Super Admin
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Button 
                 variant="gradient" 
                 className="w-full"
                 onClick={() => setShowCreateDialog(true)}
               >
                 Create Company
               </Button>
             </CardContent>
           </Card>
 
           {hasCompanies && (
             <Card className="glass-card hover:shadow-lg transition-shadow">
               <CardHeader className="text-center">
                 <div className="mx-auto mb-2 p-3 rounded-xl bg-secondary/50 w-fit">
                   <LogIn className="w-8 h-8 text-secondary-foreground" />
                 </div>
                 <CardTitle>Login to Company</CardTitle>
                 <CardDescription>
                   Access one of your existing companies
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="w-full">
                       Select Company
                       <ChevronDown className="w-4 h-4 ml-2" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-56">
                     {companies.map((company) => (
                       <DropdownMenuItem 
                         key={company.id}
                         onClick={() => handleLoginToCompany(company.id)}
                       >
                         <Building2 className="w-4 h-4 mr-2" />
                         {company.name}
                       </DropdownMenuItem>
                     ))}
                   </DropdownMenuContent>
                 </DropdownMenu>
               </CardContent>
             </Card>
           )}
 
           <Card className="glass-card hover:shadow-lg transition-shadow">
             <CardHeader className="text-center">
               <div className="mx-auto mb-2 p-3 rounded-xl bg-accent/50 w-fit">
                 <UserPlus className="w-8 h-8 text-accent-foreground" />
               </div>
               <CardTitle>Join with Code</CardTitle>
               <CardDescription>
                 Enter an invitation code to join a company
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Button 
                 variant="outline" 
                 className="w-full"
                 onClick={() => setShowJoinDialog(true)}
               >
                 Enter Code
               </Button>
             </CardContent>
           </Card>
         </div>
       </div>
 
       <CreateCompanyDialog 
         open={showCreateDialog} 
         onOpenChange={setShowCreateDialog}
         onSuccess={handleCompanyCreated}
       />
 
       <JoinCompanyDialog
         open={showJoinDialog}
         onOpenChange={setShowJoinDialog}
         onSuccess={handleCompanyJoined}
       />
     </div>
   );
 }
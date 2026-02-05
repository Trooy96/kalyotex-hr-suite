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
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useToast } from "@/hooks/use-toast";
 import { Loader2, Copy, Check, Mail } from "lucide-react";
 
 interface InviteUserDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   companyId: string;
   companyName: string;
 }
 
 export default function InviteUserDialog({
   open,
   onOpenChange,
   companyId,
   companyName,
 }: InviteUserDialogProps) {
   const [role, setRole] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const [generatedCode, setGeneratedCode] = useState<string | null>(null);
   const [copied, setCopied] = useState(false);
   const { toast } = useToast();
 
   const generateCode = () => {
     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
     let code = "";
     for (let i = 0; i < 12; i++) {
       if (i > 0 && i % 4 === 0) code += "-";
       code += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     return code;
   };
 
   const handleGenerateCode = async () => {
     if (!role) {
       toast({
         variant: "destructive",
         title: "Select a role",
         description: "Please select a role for the invitation",
       });
       return;
     }
 
     setLoading(true);
 
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       const code = generateCode();
 
       const { error } = await supabase.from("invitation_codes").insert({
         code,
         company_id: companyId,
         role,
         created_by: user.id,
         expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
       });
 
       if (error) throw error;
 
       setGeneratedCode(code);
     } catch (error: any) {
       toast({
         variant: "destructive",
         title: "Error generating code",
         description: error.message,
       });
     } finally {
       setLoading(false);
     }
   };
 
   const handleCopy = () => {
     if (generatedCode) {
       navigator.clipboard.writeText(generatedCode);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
       toast({
         title: "Code copied",
         description: "Invitation code copied to clipboard",
       });
     }
   };
 
   const handleClose = () => {
     setRole("");
     setGeneratedCode(null);
     setCopied(false);
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <div className="mx-auto mb-2 p-3 rounded-xl bg-primary/10 w-fit">
             <Mail className="w-6 h-6 text-primary" />
           </div>
           <DialogTitle className="text-center">Invite User</DialogTitle>
           <DialogDescription className="text-center">
             Generate an invitation code for {companyName}
           </DialogDescription>
         </DialogHeader>
 
         {!generatedCode ? (
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Role</Label>
               <Select value={role} onValueChange={setRole}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select role for new user" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="admin">Admin</SelectItem>
                   <SelectItem value="hr_manager">HR Manager</SelectItem>
                   <SelectItem value="employee">Employee</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             <Button
               variant="gradient"
               className="w-full"
               onClick={handleGenerateCode}
               disabled={loading || !role}
             >
               {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
               Generate Invitation Code
             </Button>
           </div>
         ) : (
           <div className="space-y-4">
             <div className="p-4 bg-muted rounded-lg text-center">
               <p className="text-sm text-muted-foreground mb-2">Invitation Code</p>
               <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                 {generatedCode}
               </p>
               <p className="text-xs text-muted-foreground mt-2">
                 Role: <span className="capitalize">{role.replace("_", " ")}</span> • Expires in 7 days
               </p>
             </div>
 
             <Button
               variant="outline"
               className="w-full"
               onClick={handleCopy}
             >
               {copied ? (
                 <Check className="w-4 h-4 mr-2" />
               ) : (
                 <Copy className="w-4 h-4 mr-2" />
               )}
               {copied ? "Copied!" : "Copy Code"}
             </Button>
 
             <Button variant="ghost" className="w-full" onClick={handleClose}>
               Done
             </Button>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }
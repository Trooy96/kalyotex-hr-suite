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
 import { Textarea } from "@/components/ui/textarea";
 import { useToast } from "@/hooks/use-toast";
 import { Loader2, Building2 } from "lucide-react";
 
 interface CreateCompanyDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess: () => void;
 }
 
 export default function CreateCompanyDialog({ 
   open, 
   onOpenChange, 
   onSuccess 
 }: CreateCompanyDialogProps) {
   const [name, setName] = useState("");
   const [address, setAddress] = useState("");
   const [phone, setPhone] = useState("");
   const [email, setEmail] = useState("");
   const [loading, setLoading] = useState(false);
   const { toast } = useToast();
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-company", {
        body: {
          name,
          address,
          phone,
          email,
        },
      });

      if (error) throw error;
      if (!data?.company?.id) throw new Error("Company creation failed");

      // Reset form
      setName("");
      setAddress("");
      setPhone("");
      setEmail("");

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating company",
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
           <div className="mx-auto mb-2 p-3 rounded-xl bg-primary/10 w-fit">
             <Building2 className="w-6 h-6 text-primary" />
           </div>
           <DialogTitle className="text-center">Create New Company</DialogTitle>
           <DialogDescription className="text-center">
             Set up your company and become the Super Admin
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="name">Company Name *</Label>
             <Input
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Acme Corporation"
               required
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="address">Address</Label>
             <Textarea
               id="address"
               value={address}
               onChange={(e) => setAddress(e.target.value)}
               placeholder="123 Business Street, City"
               rows={2}
             />
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="phone">Phone</Label>
               <Input
                 id="phone"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 placeholder="+260 XXX XXX XXX"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="info@company.com"
               />
             </div>
           </div>
 
           <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
             {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
             Create Company
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
import { Bell, Search, Menu, LogOut, Building2, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const selectedCompanyId = localStorage.getItem("selectedCompanyId");
      if (selectedCompanyId && user) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", selectedCompanyId)
          .single();
        setCompany(companyData);

        const { data: membershipData } = await supabase
          .from("company_memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("company_id", selectedCompanyId)
          .single();
        setMembership(membershipData);
      }
    };

    fetchUserAndCompany();
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem("selectedCompanyId");
    await supabase.auth.signOut();
    navigate("/landing");
  };

  const handleSwitchCompany = () => {
    localStorage.removeItem("selectedCompanyId");
    navigate("/get-started");
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {(subtitle || company) && (
              <p className="text-sm text-muted-foreground">
                {subtitle || company?.name}
              </p>
            )}
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees, documents..."
              className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Leave Request Pending</span>
                <span className="text-xs text-muted-foreground">
                  John Smith requested 3 days leave
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">New Employee Onboarding</span>
                <span className="text-xs text-muted-foreground">
                  Sarah Johnson starts tomorrow
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Payroll Processed</span>
                <span className="text-xs text-muted-foreground">
                  January payroll completed
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {membership?.role?.replace("_", " ") || "Loading..."}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSwitchCompany}>
                <Building2 className="w-4 h-4 mr-2" />
                Switch Company
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

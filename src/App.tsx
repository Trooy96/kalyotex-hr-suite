import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import GetStarted from "./pages/GetStarted";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Departments from "./pages/Departments";
import Payroll from "./pages/Payroll";
import Recruitment from "./pages/Recruitment";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import PerformanceReviews from "./pages/PerformanceReviews";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedIndex />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/recruitment" element={<Recruitment />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/performance" element={<PerformanceReviews />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// Protected route wrapper that checks for company selection
function ProtectedIndex() {
  const selectedCompanyId = localStorage.getItem("selectedCompanyId");
  
  if (!selectedCompanyId) {
    return <GetStarted />;
  }
  
  return <Index />;
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Doctors from "./pages/Doctors";
import BookAppointment from "./pages/BookAppointment";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="animate-fade-in" key={location.pathname}>
      {children}
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PageTransition><Index /></PageTransition>} />
    <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
    <Route path="/admin-login" element={<PageTransition><AdminLogin /></PageTransition>} />
    <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
    <Route path="/doctor-dashboard" element={<PageTransition><DoctorDashboard /></PageTransition>} />
    <Route path="/doctors" element={<PageTransition><Doctors /></PageTransition>} />
    <Route path="/book" element={<PageTransition><BookAppointment /></PageTransition>} />
    <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
  </Routes>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Car, Users, LogOut, Wrench, Fuel, FileText, MapPin, ClipboardCheck, BarChart3, Shield, Bell, Calendar, TrendingUp, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canView, isAdmin } = usePermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/auth");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard", resource: null },
    { path: "/vehicles", icon: Car, label: "Véhicules", resource: "vehicles" as const },
    { path: "/drivers", icon: Users, label: "Conducteurs", resource: "drivers" as const },
    { path: "/maintenance", icon: Wrench, label: "Maintenance", resource: "maintenance" as const },
    { path: "/fuel", icon: Fuel, label: "Carburant", resource: "fuel" as const },
    { path: "/documents", icon: FileText, label: "Documents", resource: "documents" as const },
    { path: "/tours", icon: MapPin, label: "Tournées", resource: "tours" as const },
    { path: "/inspections", icon: ClipboardCheck, label: "Inspections", resource: "inspections" as const },
    { path: "/reports", icon: BarChart3, label: "Rapports", resource: "reports" as const },
    { path: "/planning", icon: Calendar, label: "Planning", resource: null },
    { path: "/analytics", icon: TrendingUp, label: "Analytics", resource: null },
    { path: "/notifications", icon: Bell, label: "Notifications", resource: null },
    ...(isAdmin ? [{ path: "/admin", icon: Shield, label: "Administration", resource: null }] : []),
  ];

  const NavigationContent = () => (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-brand bg-clip-text text-transparent">
            FleetManager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion de Flotte</p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          if (!item.resource || canView(item.resource)) {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive ? "gradient-brand text-white" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          }
          return null;
        })}
      </nav>

      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5" />
        Déconnexion
      </Button>
    </>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 glass border-r border-white/20 p-6 flex-col animate-slide-up">
        <NavigationContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/20 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold gradient-brand bg-clip-text text-transparent">
          FleetManager
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-6 glass">
              <NavigationContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto pt-20 md:pt-8">
        {children}
      </main>

      {/* Floating Action Button (Mobile) */}
      <Button
        size="icon"
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg gradient-brand z-50 hover-lift"
        onClick={() => navigate("/vehicles")}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Layout;
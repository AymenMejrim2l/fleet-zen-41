import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Car, Users, LogOut, Wrench, Fuel, FileText, MapPin, ClipboardCheck, BarChart3, Shield, Bell, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canView, isAdmin } = usePermissions();

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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/20 p-6 flex flex-col animate-slide-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold gradient-brand bg-clip-text text-transparent">
            FleetManager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion de Flotte</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            // Show dashboard and admin to everyone (admin is filtered above)
            if (!item.resource || canView(item.resource)) {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
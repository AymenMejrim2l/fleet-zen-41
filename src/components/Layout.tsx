import { Link, useLocation } from "react-router-dom";
import { Home, Car, Users, LogOut, Wrench, Fuel, FileText, MapPin, ClipboardCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/auth");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/vehicles", icon: Car, label: "Véhicules" },
    { path: "/drivers", icon: Users, label: "Conducteurs" },
    { path: "/maintenance", icon: Wrench, label: "Maintenance" },
    { path: "/fuel", icon: Fuel, label: "Carburant" },
    { path: "/documents", icon: FileText, label: "Documents" },
    { path: "/tours", icon: MapPin, label: "Tournées" },
    { path: "/inspections", icon: ClipboardCheck, label: "Inspections" },
    { path: "/reports", icon: BarChart3, label: "Rapports" },
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
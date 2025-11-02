import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const NetworkStatus = () => {
  const isOnline = useOnlineStatus();
  const [showStatus, setShowStatus] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
      setWasOffline(true);
      toast.error("Connexion perdue", {
        description: "Travaillant en mode hors ligne",
        icon: <WifiOff className="h-4 w-4" />,
      });
    } else if (wasOffline && isOnline) {
      setShowStatus(true);
      toast.success("Connexion rétablie", {
        description: "Synchronisation en cours...",
        icon: <Wifi className="h-4 w-4" />,
      });
      
      setTimeout(() => {
        setShowStatus(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  if (!showStatus) return null;

  return (
    <Badge
      variant={isOnline ? "default" : "destructive"}
      className={`fixed top-20 md:top-4 right-4 z-50 gap-2 animate-fade-in ${
        isOnline ? "gradient-brand" : ""
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>En ligne</span>
          <RefreshCw className="h-3 w-3 animate-spin" />
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Hors ligne</span>
        </>
      )}
    </Badge>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, AlertTriangle, FileText, Wrench, Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
}

interface NotificationSettings {
  maintenance_days_before: number;
  document_days_before: number;
  fuel_consumption_threshold: number;
  email_enabled: boolean;
}

interface Alert {
  vehicleName: string;
  daysUntil: number;
  scheduledDate: string;
}

interface DocumentAlert {
  title: string;
  entityType: string;
  expiryDate: string;
  daysUntil: number;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    maintenance_days_before: 7,
    document_days_before: 30,
    fuel_consumption_threshold: 20.0,
    email_enabled: true,
  });
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<Alert[]>([]);
  const [documentAlerts, setDocumentAlerts] = useState<DocumentAlert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    loadSettings();
    loadAlerts();
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setNotifications(data);
  };

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setSettings({
        maintenance_days_before: data.maintenance_days_before,
        document_days_before: data.document_days_before,
        fuel_consumption_threshold: parseFloat(String(data.fuel_consumption_threshold)),
        email_enabled: data.email_enabled,
      });
    }
  };

  const loadAlerts = async () => {
    // Load upcoming maintenance
    const { data: maintenance, error: maintenanceError } = await supabase.rpc("check_upcoming_maintenance");
    if (maintenance && !maintenanceError) {
      setMaintenanceAlerts(maintenance.map((m: any) => ({
        vehicleName: String(m.vehicle_name),
        daysUntil: Number(m.days_until_maintenance),
        scheduledDate: String(m.scheduled_date),
      })));
    }

    // Load expiring documents
    const { data: documents } = await supabase.rpc("check_expiring_documents");
    if (documents) {
      setDocumentAlerts(documents.map((d: any) => ({
        title: d.title,
        entityType: d.entity_type,
        expiryDate: d.expiry_date,
        daysUntil: d.days_until_expiry,
      })));
    }
  };

  const saveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notification_settings")
      .upsert(
        {
          user_id: user.id,
          ...settings,
        },
        {
          onConflict: 'user_id'
        }
      );

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Paramètres enregistrés" });
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    loadNotifications();
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    
    loadNotifications();
    toast({ title: "Toutes les notifications marquées comme lues" });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    loadNotifications();
    toast({ title: "Notification supprimée" });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-5 w-5 text-orange-400" />;
      case "document":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Alertes et notifications système</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Notifications récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notif.read
                      ? "border-white/10 bg-white/5"
                      : "border-primary/30 bg-primary/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {getIcon(notif.type)}
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white">{notif.title}</h3>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notif.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notif.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notif.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>Configurer les alertes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alerte maintenance (jours avant)</Label>
                <Input
                  type="number"
                  value={settings.maintenance_days_before}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSettings({ ...settings, maintenance_days_before: isNaN(value) ? 0 : value });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Alerte documents (jours avant expiration)</Label>
                <Input
                  type="number"
                  value={settings.document_days_before}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSettings({ ...settings, document_days_before: isNaN(value) ? 0 : value });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Seuil consommation anormale (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.fuel_consumption_threshold}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setSettings({ ...settings, fuel_consumption_threshold: isNaN(value) ? 0 : value });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Notifications email</Label>
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, email_enabled: checked })
                  }
                />
              </div>

              <Button onClick={saveSettings} className="w-full">
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          {maintenanceAlerts.length > 0 && (
            <Card className="glass-card border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-400">
                  <Wrench className="h-5 w-5" />
                  Maintenances à venir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {maintenanceAlerts.map((alert, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{alert.vehicleName}</p>
                    <p className="text-muted-foreground">
                      Dans {alert.daysUntil} jour(s) - {format(new Date(alert.scheduledDate), "d MMM", { locale: fr })}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {documentAlerts.length > 0 && (
            <Card className="glass-card border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <FileText className="h-5 w-5" />
                  Documents à renouveler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documentAlerts.map((alert, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-muted-foreground">
                      Expire dans {alert.daysUntil} jour(s)
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
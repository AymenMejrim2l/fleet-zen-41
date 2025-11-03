import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Wrench, CheckCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Véhicule requis"),
  type: z.string().min(1, "Type requis"),
  description: z.string().optional(),
  cost: z.number().optional(),
  provider: z.string().optional(),
  status: z.string().default("scheduled"),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  mileage: z.number().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface Maintenance {
  id: string;
  vehicle_id: string;
  type: string;
  description?: string;
  cost?: number;
  provider?: string;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  mileage?: number;
  notes?: string;
  vehicles?: {
    registration: string;
    make: string;
    model: string;
  };
}

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
}

const Maintenance = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: "",
      type: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    loadMaintenances();
    loadVehicles();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadMaintenances = async () => {
    const { data, error } = await supabase
      .from("maintenance")
      .select(`
        *,
        vehicles:vehicle_id (registration, make, model)
      `)
      .order("scheduled_date", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement");
      return;
    }

    setMaintenances(data || []);
  };

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, registration, make, model")
      .eq("status", "active");

    if (error) {
      toast.error("Erreur lors du chargement des véhicules");
      return;
    }

    setVehicles(data || []);
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    if (!userId) {
      toast.error("Utilisateur non connecté");
      return;
    }

    if (editingMaintenance) {
      const { error } = await supabase
        .from("maintenance")
        .update(data)
        .eq("id", editingMaintenance.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      toast.success("Maintenance mise à jour");
    } else {
      const { error } = await supabase.from("maintenance").insert({
        vehicle_id: data.vehicle_id,
        type: data.type,
        description: data.description,
        cost: data.cost,
        provider: data.provider,
        status: data.status,
        scheduled_date: data.scheduled_date,
        completed_date: data.completed_date,
        mileage: data.mileage,
        notes: data.notes,
        user_id: userId,
      });

      if (error) {
        toast.error("Erreur lors de l'ajout");
        return;
      }

      toast.success("Maintenance ajoutée");
    }

    loadMaintenances();
    setIsDialogOpen(false);
    setEditingMaintenance(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette maintenance ?")) return;

    const { error } = await supabase.from("maintenance").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Maintenance supprimée");
    loadMaintenances();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "in_progress":
        return <Wrench className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminée";
      case "in_progress":
        return "En cours";
      default:
        return "Planifiée";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion de la Maintenance</h1>
          <p className="text-muted-foreground">
            Suivez les opérations de maintenance
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-warning text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMaintenance ? "Modifier la maintenance" : "Nouvelle maintenance"}
              </DialogTitle>
              <DialogDescription>
                {editingMaintenance ? "Modifier les informations de la maintenance" : "Planifier une nouvelle maintenance"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicle_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Véhicule</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un véhicule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.registration} - {vehicle.make} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type de maintenance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="preventive">Préventive</SelectItem>
                            <SelectItem value="corrective">Corrective</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scheduled">Planifiée</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduled_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date prévue</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Garage XYZ" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Détails de l'intervention" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingMaintenance(null);
                      form.reset();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-warning text-white">
                    {editingMaintenance ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Maintenances List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenances.map((maintenance, index) => (
          <Card
            key={maintenance.id}
            className="glass-card border-0 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(maintenance.status)}
                  <span className="text-sm">{maintenance.vehicles?.registration}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingMaintenance(maintenance);
                      form.reset(maintenance);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(maintenance.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{maintenance.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium">{getStatusLabel(maintenance.status)}</span>
              </div>
              {maintenance.scheduled_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date prévue</span>
                  <span className="font-medium">
                    {format(new Date(maintenance.scheduled_date), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
              {maintenance.cost && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coût</span>
                  <span className="font-medium">{formatCurrency(maintenance.cost)}</span>
                </div>
              )}
              {maintenance.provider && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fournisseur</span>
                  <span className="font-medium">{maintenance.provider}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {maintenances.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune maintenance enregistrée</p>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
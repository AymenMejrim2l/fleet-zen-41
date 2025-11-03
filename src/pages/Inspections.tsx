import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, ClipboardCheck } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Véhicule requis"),
  driver_id: z.string().optional(),
  date: z.string().min(1, "Date requise"),
  mileage: z.number().optional(),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface Inspection {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  date: string;
  mileage?: number;
  status: string;
  notes?: string;
  vehicles?: {
    registration: string;
  };
  drivers?: {
    first_name: string;
    last_name: string;
  };
}

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
}

const INSPECTION_ITEMS = [
  "Pneus avant",
  "Pneus arrière",
  "Freins avant",
  "Freins arrière",
  "Niveau huile moteur",
  "Niveau liquide de refroidissement",
  "Niveau lave-glace",
  "Éclairage avant",
  "Éclairage arrière",
  "Clignotants",
  "Essuie-glaces",
  "Klaxon",
];

const Inspections = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [inspectionItems, setInspectionItems] = useState<
    { name: string; status: string; observations: string }[]
  >([]);

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    },
  });

  useEffect(() => {
    loadInspections();
    loadVehicles();
    loadDrivers();
    getCurrentUser();
    initializeInspectionItems();
  }, []);

  const initializeInspectionItems = () => {
    setInspectionItems(
      INSPECTION_ITEMS.map((item) => ({
        name: item,
        status: "OK",
        observations: "",
      }))
    );
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadInspections = async () => {
    const { data, error } = await supabase
      .from("inspections")
      .select(`
        *,
        vehicles:vehicle_id (registration),
        drivers:driver_id (first_name, last_name)
      `)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement");
      return;
    }

    setInspections(data || []);
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

  const loadDrivers = async () => {
    const { data, error } = await supabase
      .from("drivers")
      .select("id, first_name, last_name")
      .eq("status", "active");

    if (error) {
      toast.error("Erreur lors du chargement des conducteurs");
      return;
    }

    setDrivers(data || []);
  };

  const onSubmit = async (data: InspectionFormData) => {
    if (!userId) {
      toast.error("Utilisateur non connecté");
      return;
    }

    const { data: inspectionData, error: inspectionError } = await supabase
      .from("inspections")
      .insert({
        vehicle_id: data.vehicle_id,
        driver_id: data.driver_id || null,
        date: data.date,
        mileage: data.mileage,
        status: data.status,
        notes: data.notes,
        user_id: userId,
      })
      .select()
      .single();

    if (inspectionError) {
      toast.error("Erreur lors de l'ajout");
      return;
    }

    // Insert inspection items
    const itemsToInsert = inspectionItems.map((item) => ({
      inspection_id: inspectionData.id,
      item_name: item.name,
      status: item.status,
      observations: item.observations || null,
    }));

    const { error: itemsError } = await supabase
      .from("inspection_items")
      .insert(itemsToInsert);

    if (itemsError) {
      toast.error("Erreur lors de l'ajout des items");
      return;
    }

    // Create maintenance tasks for NOK items
    const nokItems = inspectionItems.filter((item) => item.status === "NOK");
    if (nokItems.length > 0) {
      const maintenanceTasks = nokItems.map((item) => ({
        vehicle_id: data.vehicle_id,
        type: "corrective",
        description: `Problème détecté lors de l'inspection : ${item.name}`,
        status: "scheduled",
        notes: item.observations,
        user_id: userId,
      }));

      await supabase.from("maintenance").insert(maintenanceTasks);
      toast.info(`${nokItems.length} tâche(s) de maintenance créée(s)`);
    }

    toast.success("Inspection ajoutée");
    loadInspections();
    setIsDialogOpen(false);
    form.reset();
    initializeInspectionItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette inspection ?")) return;

    const { error } = await supabase.from("inspections").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Inspection supprimée");
    loadInspections();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Inspections</h1>
          <p className="text-muted-foreground">
            Effectuez des contrôles détaillés de vos véhicules
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle inspection</DialogTitle>
              <DialogDescription>
                Créer une nouvelle inspection de véhicule
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              <SelectValue placeholder="Sélectionner" />
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
                    name="driver_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conducteur</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Optionnel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.first_name} {driver.last_name}
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilométrage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Inspection Items */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Points de contrôle</h3>
                  <div className="space-y-3">
                    {inspectionItems.map((item, index) => (
                      <div key={index} className="glass p-4 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.name}</span>
                          <div className="flex gap-2">
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={item.status === "OK"}
                                onCheckedChange={(checked) => {
                                  const newItems = [...inspectionItems];
                                  newItems[index].status = checked ? "OK" : "NOK";
                                  setInspectionItems(newItems);
                                }}
                              />
                              <span className="text-sm text-success">OK</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={item.status === "NOK"}
                                onCheckedChange={(checked) => {
                                  const newItems = [...inspectionItems];
                                  newItems[index].status = checked ? "NOK" : "OK";
                                  setInspectionItems(newItems);
                                }}
                              />
                              <span className="text-sm text-destructive">NOK</span>
                            </label>
                          </div>
                        </div>
                        {item.status === "NOK" && (
                          <Input
                            placeholder="Observations..."
                            value={item.observations}
                            onChange={(e) => {
                              const newItems = [...inspectionItems];
                              newItems[index].observations = e.target.value;
                              setInspectionItems(newItems);
                            }}
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes générales</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Observations générales" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                      initializeInspectionItems();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brand text-white">
                    Enregistrer l'inspection
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inspections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspections.map((inspection, index) => (
          <Card
            key={inspection.id}
            className="glass-card border-0 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm">{inspection.vehicles?.registration}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(inspection.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {format(new Date(inspection.date), "dd/MM/yyyy")}
                </span>
              </div>
              {inspection.drivers && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conducteur</span>
                  <span className="font-medium">
                    {inspection.drivers.first_name} {inspection.drivers.last_name}
                  </span>
                </div>
              )}
              {inspection.mileage && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kilométrage</span>
                  <span className="font-medium">
                    {inspection.mileage.toLocaleString()} km
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span
                  className={`font-medium ${
                    inspection.status === "completed"
                      ? "text-success"
                      : inspection.status === "in_progress"
                      ? "text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  {inspection.status === "completed"
                    ? "Terminée"
                    : inspection.status === "in_progress"
                    ? "En cours"
                    : "En attente"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inspections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune inspection enregistrée</p>
        </div>
      )}
    </div>
  );
};

export default Inspections;
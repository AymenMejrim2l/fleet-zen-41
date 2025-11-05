import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, MapPin, Play, CheckCircle } from "lucide-react";
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
import { format } from "date-fns";
import { useTours, useCreateTour, useUpdateTour, useDeleteTour } from "@/hooks/useToursQuery";
import SkeletonLoader from "@/components/ui/skeleton-loader";
import { CustomPagination } from "@/components/ui/custom-pagination";

const tourSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().optional(),
  start_mileage: z.number().optional(),
  end_mileage: z.number().optional(),
  status: z.string().default("planned"),
  notes: z.string().optional(),
});

type TourFormData = z.infer<typeof tourSchema>;

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

const Tours = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);

  const { data: toursData, isLoading } = useTours({ page: currentPage, limit: 15 });
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const deleteTour = useDeleteTour();

  const form = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      title: "",
      status: "planned",
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    loadVehicles();
    loadDrivers();
  }, []);

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, registration, make, model")
      .eq("status", "active");

    if (!error && data) {
      setVehicles(data);
    }
  };

  const loadDrivers = async () => {
    const { data, error } = await supabase
      .from("drivers")
      .select("id, first_name, last_name")
      .eq("status", "active");

    if (!error && data) {
      setDrivers(data);
    }
  };

  const onSubmit = async (data: TourFormData) => {
    if (editingTour) {
      updateTour.mutate({ id: editingTour.id, ...data });
    } else {
      createTour.mutate({
        title: data.title,
        vehicle_id: data.vehicle_id || undefined,
        driver_id: data.driver_id || undefined,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        start_mileage: data.start_mileage,
        end_mileage: data.end_mileage,
        status: data.status,
        notes: data.notes,
      });
    }
    setIsDialogOpen(false);
    setEditingTour(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tournée ?")) return;
    deleteTour.mutate(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "in_progress":
        return <Play className="h-5 w-5 text-warning" />;
      default:
        return <MapPin className="h-5 w-5 text-primary" />;
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

  const tours = toursData?.tours || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Tournées</h1>
          <p className="text-muted-foreground">
            Planifiez et suivez les missions de votre flotte
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-success text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle tournée
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTour ? "Modifier la tournée" : "Nouvelle tournée"}
              </DialogTitle>
              <DialogDescription>
                {editingTour ? "Modifier les informations de la tournée" : "Créer une nouvelle tournée"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Livraison Paris" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                              <SelectValue placeholder="Sélectionner" />
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
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="start_mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilométrage départ</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="end_mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilométrage arrivée</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planned">Planifiée</SelectItem>
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Informations complémentaires" />
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
                      setEditingTour(null);
                      form.reset();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-success text-white">
                    {editingTour ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tours List */}
      {isLoading ? (
        <SkeletonLoader count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour, index) => (
              <Card
                key={tour.id}
                className="glass-card border-0 hover-lift animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tour.status)}
                      <span className="text-sm truncate">{tour.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingTour(tour);
                          form.reset(tour);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(tour.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-medium">{getStatusLabel(tour.status)}</span>
                  </div>
                  {tour.vehicles && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Véhicule</span>
                      <span className="font-medium">{tour.vehicles.registration}</span>
                    </div>
                  )}
                  {tour.drivers && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conducteur</span>
                      <span className="font-medium">
                        {tour.drivers.first_name} {tour.drivers.last_name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Début</span>
                    <span className="font-medium">
                      {format(new Date(tour.start_date), "dd/MM/yyyy")}
                    </span>
                  </div>
                  {tour.end_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fin</span>
                      <span className="font-medium">
                        {format(new Date(tour.end_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}
                  {tour.start_mileage && tour.end_mileage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-medium">
                        {(tour.end_mileage - tour.start_mileage).toLocaleString()} km
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {tours.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune tournée enregistrée</p>
            </div>
          )}

          <CustomPagination
            currentPage={currentPage}
            totalPages={toursData?.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={toursData?.total}
            itemsPerPage={15}
          />
        </>
      )}
    </div>
  );
};

export default Tours;

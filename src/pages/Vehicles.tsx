import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, Vehicle } from "@/hooks/useVehiclesQuery";
import { VehicleCardSkeleton } from "@/components/ui/skeleton-loader";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

const vehicleSchema = z.object({
  registration: z.string().min(1, "Immatriculation requise"),
  make: z.string().min(1, "Marque requise"),
  model: z.string().min(1, "Modèle requis"),
  year: z.number().optional(),
  fuel_type: z.string().optional(),
  status: z.string().default("active"),
  mileage: z.number().default(0),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const Vehicles = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // React Query hooks
  const { data, isLoading } = useVehicles({ page: currentPage, limit: 50, search: searchQuery });
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registration: "",
      make: "",
      model: "",
      status: "active",
      mileage: 0,
    },
  });

  const onSubmit = async (vehicleData: VehicleFormData) => {
    if (editingVehicle) {
      await updateMutation.mutateAsync({ id: editingVehicle.id, ...vehicleData });
    } else {
      await createMutation.mutateAsync({
        registration: vehicleData.registration,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        fuel_type: vehicleData.fuel_type,
        status: vehicleData.status,
        mileage: vehicleData.mileage,
      });
    }

    setIsDialogOpen(false);
    setEditingVehicle(null);
    form.reset();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.reset(vehicle);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) return;
    await deleteMutation.mutateAsync(id);
  };

  const vehicles = data?.vehicles || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Véhicules</h1>
          <p className="text-muted-foreground">
            Gérez votre flotte de véhicules
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Modifier le véhicule" : "Nouveau véhicule"}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle ? "Modifier les informations du véhicule" : "Ajouter un nouveau véhicule à la flotte"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Immatriculation</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AB-123-CD" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Renault" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modèle</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Clio" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Année</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            placeholder="2023"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de carburant</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="essence">Essence</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="electrique">Électrique</SelectItem>
                            <SelectItem value="hybride">Hybride</SelectItem>
                          </SelectContent>
                        </Select>
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
                            placeholder="50000"
                          />
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
                      setEditingVehicle(null);
                      form.reset();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brand text-white">
                    {editingVehicle ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un véhicule..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass"
        />
      </div>

      {/* Vehicles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, index) => (
          <Card
            key={vehicle.id}
            className="glass-card border-0 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{vehicle.registration}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(vehicle.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Marque</span>
                <span className="font-medium">{vehicle.make}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Modèle</span>
                <span className="font-medium">{vehicle.model}</span>
              </div>
              {vehicle.year && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Année</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kilométrage</span>
                <span className="font-medium">{vehicle.mileage.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span
                  className={`font-medium ${
                    vehicle.status === "active"
                      ? "text-success"
                      : "text-muted-foreground"
                  }`}
                >
                  {vehicle.status === "active" ? "Actif" : "Inactif"}
                </span>
              </div>
            </CardContent>
            </Card>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun véhicule trouvé</p>
          </div>
        )}

        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={50}
          onPageChange={setCurrentPage}
        />
      </>
      )}
    </div>
  );
};

export default Vehicles;
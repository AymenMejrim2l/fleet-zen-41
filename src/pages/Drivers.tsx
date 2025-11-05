import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Mail, Phone } from "lucide-react";
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
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from "@/hooks/useDriversQuery";
import SkeletonLoader from "@/components/ui/skeleton-loader";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { useDebouncedValue } from "@/hooks/use-debounce";

const driverSchema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  license_number: z.string().min(1, "Numéro de permis requis"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  status: z.string().default("active"),
});

type DriverFormData = z.infer<typeof driverSchema>;

const Drivers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const { data: driversData, isLoading } = useDrivers({ page: currentPage, limit: 15, search: debouncedSearch });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      license_number: "",
      phone: "",
      email: "",
      status: "active",
    },
  });

  const onSubmit = async (data: DriverFormData) => {
    if (editingDriver) {
      updateDriver.mutate({ id: editingDriver.id, ...data });
    } else {
      createDriver.mutate({
        first_name: data.first_name,
        last_name: data.last_name,
        license_number: data.license_number,
        phone: data.phone,
        email: data.email,
        status: data.status,
      });
    }
    setIsDialogOpen(false);
    setEditingDriver(null);
    form.reset();
  };

  const handleEdit = (driver: any) => {
    setEditingDriver(driver);
    form.reset(driver);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce conducteur ?")) return;
    deleteDriver.mutate(id);
  };

  const drivers = driversData?.drivers || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Conducteurs</h1>
          <p className="text-muted-foreground">
            Gérez vos conducteurs de flotte
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-success text-white gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un conducteur
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDriver ? "Modifier le conducteur" : "Nouveau conducteur"}
              </DialogTitle>
              <DialogDescription>
                {editingDriver ? "Modifier les informations du conducteur" : "Ajouter un nouveau conducteur"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jean" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dupont" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de permis</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456789" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+33 6 12 34 56 78" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="jean.dupont@example.com" />
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
                      setEditingDriver(null);
                      form.reset();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-success text-white">
                    {editingDriver ? "Mettre à jour" : "Ajouter"}
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
          placeholder="Rechercher un conducteur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass"
        />
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <SkeletonLoader count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver, index) => (
              <Card
                key={driver.id}
                className="glass-card border-0 hover-lift animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {driver.first_name} {driver.last_name}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(driver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(driver.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Permis</span>
                    <span className="font-medium">{driver.license_number}</span>
                  </div>
                  {driver.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{driver.phone}</span>
                    </div>
                  )}
                  {driver.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{driver.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <span
                      className={`font-medium ${
                        driver.status === "active"
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      {driver.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {drivers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun conducteur trouvé</p>
            </div>
          )}

          <CustomPagination
            currentPage={currentPage}
            totalPages={driversData?.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={driversData?.total}
            itemsPerPage={15}
          />
        </>
      )}
    </div>
  );
};

export default Drivers;

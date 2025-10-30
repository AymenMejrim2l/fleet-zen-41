import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Fuel as FuelIcon, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fuelSchema = z.object({
  vehicle_id: z.string().min(1, "Véhicule requis"),
  date: z.string().min(1, "Date requise"),
  fuel_type: z.string().optional(),
  volume: z.number().min(0.1, "Volume requis"),
  cost: z.number().min(0.01, "Coût requis"),
  mileage: z.number().min(0, "Kilométrage requis"),
  station: z.string().optional(),
  notes: z.string().optional(),
});

type FuelFormData = z.infer<typeof fuelSchema>;

interface FuelRecord {
  id: string;
  vehicle_id: string;
  date: string;
  fuel_type?: string;
  volume: number;
  cost: number;
  mileage: number;
  station?: string;
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

const Fuel = () => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalCost: 0, totalVolume: 0, avgConsumption: 0 });

  const form = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      vehicle_id: "",
      date: new Date().toISOString().split("T")[0],
      volume: 0,
      cost: 0,
      mileage: 0,
    },
  });

  useEffect(() => {
    loadFuelRecords();
    loadVehicles();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadFuelRecords = async () => {
    const { data, error } = await supabase
      .from("fuel")
      .select(`
        *,
        vehicles:vehicle_id (registration, make, model)
      `)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement");
      return;
    }

    setFuelRecords(data || []);
    calculateStats(data || []);
  };

  const calculateStats = (records: FuelRecord[]) => {
    const totalCost = records.reduce((sum, r) => sum + Number(r.cost), 0);
    const totalVolume = records.reduce((sum, r) => sum + Number(r.volume), 0);
    const avgConsumption = totalVolume > 0 ? totalCost / totalVolume : 0;
    setStats({ totalCost, totalVolume, avgConsumption });
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

  const onSubmit = async (data: FuelFormData) => {
    if (!userId) {
      toast.error("Utilisateur non connecté");
      return;
    }

    if (editingRecord) {
      const { error } = await supabase
        .from("fuel")
        .update(data)
        .eq("id", editingRecord.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      toast.success("Ravitaillement mis à jour");
    } else {
      const { error } = await supabase.from("fuel").insert({
        vehicle_id: data.vehicle_id,
        date: data.date,
        fuel_type: data.fuel_type,
        volume: data.volume,
        cost: data.cost,
        mileage: data.mileage,
        station: data.station,
        notes: data.notes,
        user_id: userId,
      });

      if (error) {
        toast.error("Erreur lors de l'ajout");
        return;
      }

      toast.success("Ravitaillement ajouté");
    }

    loadFuelRecords();
    setIsDialogOpen(false);
    setEditingRecord(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ravitaillement ?")) return;

    const { error } = await supabase.from("fuel").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Ravitaillement supprimé");
    loadFuelRecords();
  };

  const chartData = fuelRecords
    .slice(0, 10)
    .reverse()
    .map((record) => ({
      date: format(new Date(record.date), "dd/MM"),
      cost: Number(record.cost),
    }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion du Carburant</h1>
          <p className="text-muted-foreground">
            Suivez les ravitaillements et la consommation
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouveau ravitaillement
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Modifier le ravitaillement" : "Nouveau ravitaillement"}
              </DialogTitle>
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
                    name="volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume (L)</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="station"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Station</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Total, Shell..." />
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
                      setEditingRecord(null);
                      form.reset();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brand text-white">
                    {editingRecord ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coût Total
            </CardTitle>
            <FuelIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCost.toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} L</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prix Moyen/L
            </CardTitle>
            <FuelIcon className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConsumption.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {fuelRecords.length > 0 && (
        <Card className="glass-card border-0 animate-slide-up">
          <CardHeader>
            <CardTitle>Évolution des Coûts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fuelRecords.map((record, index) => (
          <Card
            key={record.id}
            className="glass-card border-0 hover-lift animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm">{record.vehicles?.registration}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingRecord(record);
                      form.reset(record);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(record.id)}
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
                  {format(new Date(record.date), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-medium">{Number(record.volume).toFixed(2)} L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coût</span>
                <span className="font-medium">{Number(record.cost).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kilométrage</span>
                <span className="font-medium">{record.mileage.toLocaleString()} km</span>
              </div>
              {record.station && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Station</span>
                  <span className="font-medium">{record.station}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {fuelRecords.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun ravitaillement enregistré</p>
        </div>
      )}
    </div>
  );
};

export default Fuel;
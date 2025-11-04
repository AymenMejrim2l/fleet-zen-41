import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Fuel, Wrench, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { formatCurrency } from "@/lib/utils";
import { useVehicles } from "@/hooks/useVehiclesQuery";
import { calculateVehicleAnalytics, generateMonthlyData, VehicleAnalytics } from "@/services/analyticsService";
import { ChartSkeleton, StatCardSkeleton } from "@/components/ui/skeleton-loader";

const Analytics = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [period, setPeriod] = useState<string>("30");
  const [costData, setCostData] = useState<VehicleAnalytics[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const { data: vehiclesData } = useVehicles({ limit: 1000 });
  const vehicles = vehiclesData?.vehicles || [];

  useEffect(() => {
    loadAnalytics();
  }, [selectedVehicle, period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Calculer les analytics avec le service optimisé
      const vehicleId = selectedVehicle === "all" ? null : selectedVehicle;
      const analytics = await calculateVehicleAnalytics(vehicleId, startDate, endDate);
      setCostData(analytics);

      // Générer les données mensuelles
      const monthly = await generateMonthlyData(6);
      setMonthlyData(monthly);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const exportToExcel = () => {
    const exportData = costData.map(d => ({
      "Véhicule": d.vehicleName,
      "Coût Carburant (TND)": d.totalFuelCost.toFixed(2),
      "Coût Maintenance (TND)": d.totalMaintenanceCost.toFixed(2),
      "Distance Parcourue (km)": d.distancePeriod,
      "Coût/km (TND)": d.costPerKm.toFixed(3),
      "Consommation Moyenne (L/100km)": d.avgConsumption.toFixed(2),
      "Volume Total (L)": d.totalFuelVolume.toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analyse");
    XLSX.writeFile(workbook, `analyse-couts-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Export réussi", description: "Le fichier Excel a été téléchargé" });
  };

  const totalStats = {
    totalFuel: costData.reduce((sum, v) => sum + v.totalFuelCost, 0),
    totalMaintenance: costData.reduce((sum, v) => sum + v.totalMaintenanceCost, 0),
    avgCostPerKm: costData.length > 0 
      ? costData.reduce((sum, v) => sum + v.costPerKm, 0) / costData.length 
      : 0,
    avgConsumption: costData.length > 0 
      ? costData.reduce((sum, v) => sum + v.avgConsumption, 0) / costData.length 
      : 0,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analyse des Coûts</h1>
            <p className="text-muted-foreground mt-1">Suivi détaillé et optimisation budgétaire</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analyse des Coûts</h1>
          <p className="text-muted-foreground mt-1">Suivi détaillé et optimisation budgétaire</p>
        </div>
        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter Excel
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les véhicules</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.make} {v.model} - {v.registration}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">Année complète</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coût Carburant</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalFuel)}</div>
            <p className="text-xs text-muted-foreground mt-1">Période sélectionnée</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coût Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalMaintenance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Période sélectionnée</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coût moyen/km</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.avgCostPerKm, 3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Moyenne flotte</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consommation Moy</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgConsumption.toFixed(2)} L/100km</div>
            <p className="text-xs text-muted-foreground mt-1">Moyenne flotte</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
            <CardDescription>Coûts, distance et consommation sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="carburant" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="maintenance" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Répartition des coûts</CardTitle>
            <CardDescription>Par véhicule</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costData.map(v => ({
                    name: v.vehicleName,
                    value: v.totalFuelCost + v.totalMaintenanceCost
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Détail par véhicule</CardTitle>
          <CardDescription>Analyse complète des coûts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="vehicleName" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <Legend />
              <Bar dataKey="totalFuelCost" fill="#0088FE" name="Carburant (TND)" />
              <Bar dataKey="totalMaintenanceCost" fill="#00C49F" name="Maintenance (TND)" />
              <Bar dataKey="distancePeriod" fill="#FFBB28" name="Distance (km)" yAxisId="right" />
              <Bar dataKey="avgConsumption" fill="#FF8042" name="Consommation (L/100km)" yAxisId="right" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
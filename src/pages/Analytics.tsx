import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Fuel, Wrench, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { formatCurrency } from "@/lib/utils";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
}

interface CostAnalysis {
  vehicleId: string;
  vehicleName: string;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalDistance: number;
  costPerKm: number;
}

const Analytics = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [period, setPeriod] = useState<string>("30");
  const [costData, setCostData] = useState<CostAnalysis[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
    loadAnalytics();
  }, [selectedVehicle, period]);

  const loadVehicles = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("id, make, model, registration")
      .eq("status", "active");
    if (data) setVehicles(data);
  };

  const loadAnalytics = async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Load fuel costs
    let fuelQuery = supabase
      .from("fuel")
      .select("vehicle_id, cost, volume, vehicles(make, model)")
      .gte("date", startDate.toISOString().split('T')[0])
      .lte("date", endDate.toISOString().split('T')[0]);

    if (selectedVehicle !== "all") {
      fuelQuery = fuelQuery.eq("vehicle_id", selectedVehicle);
    }

    const { data: fuelData } = await fuelQuery;

    // Load maintenance costs
    let maintenanceQuery = supabase
      .from("maintenance")
      .select("vehicle_id, cost, vehicles(make, model)")
      .gte("completed_date", startDate.toISOString().split('T')[0])
      .lte("completed_date", endDate.toISOString().split('T')[0]);

    if (selectedVehicle !== "all") {
      maintenanceQuery = maintenanceQuery.eq("vehicle_id", selectedVehicle);
    }

    const { data: maintenanceData } = await maintenanceQuery;

    // Aggregate data by vehicle
    const vehicleCosts: Record<string, CostAnalysis> = {};

    fuelData?.forEach((f: any) => {
      const vehicleKey = f.vehicle_id;
      if (!vehicleCosts[vehicleKey]) {
        vehicleCosts[vehicleKey] = {
          vehicleId: vehicleKey,
          vehicleName: `${f.vehicles.make} ${f.vehicles.model}`,
          totalFuelCost: 0,
          totalMaintenanceCost: 0,
          totalDistance: 0,
          costPerKm: 0,
        };
      }
      vehicleCosts[vehicleKey].totalFuelCost += parseFloat(f.cost) || 0;
    });

    maintenanceData?.forEach((m: any) => {
      const vehicleKey = m.vehicle_id;
      if (!vehicleCosts[vehicleKey]) {
        vehicleCosts[vehicleKey] = {
          vehicleId: vehicleKey,
          vehicleName: `${m.vehicles.make} ${m.vehicles.model}`,
          totalFuelCost: 0,
          totalMaintenanceCost: 0,
          totalDistance: 0,
          costPerKm: 0,
        };
      }
      vehicleCosts[vehicleKey].totalMaintenanceCost += parseFloat(m.cost) || 0;
    });

    // Calculate cost per km
    for (const key in vehicleCosts) {
      const vehicle = await supabase
        .from("vehicles")
        .select("mileage")
        .eq("id", key)
        .single();
      
      if (vehicle.data) {
        vehicleCosts[key].totalDistance = vehicle.data.mileage || 0;
        const totalCost = vehicleCosts[key].totalFuelCost + vehicleCosts[key].totalMaintenanceCost;
        vehicleCosts[key].costPerKm = vehicleCosts[key].totalDistance > 0 
          ? totalCost / vehicleCosts[key].totalDistance 
          : 0;
      }
    }

    setCostData(Object.values(vehicleCosts));
    generateMonthlyData();
  };

  const generateMonthlyData = async () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { data: fuelData } = await supabase
        .from("fuel")
        .select("cost")
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0]);

      const { data: maintenanceData } = await supabase
        .from("maintenance")
        .select("cost")
        .gte("completed_date", startDate.toISOString().split('T')[0])
        .lte("completed_date", endDate.toISOString().split('T')[0]);

      const fuelCost = fuelData?.reduce((sum, f) => sum + parseFloat(String(f.cost)), 0) || 0;
      const maintenanceCost = maintenanceData?.reduce((sum, m) => sum + parseFloat(String(m.cost)), 0) || 0;

      months.push({
        month: monthName,
        carburant: fuelCost,
        maintenance: maintenanceCost,
      });
    }
    setMonthlyData(months);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(costData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analyse");
    XLSX.writeFile(workbook, `analyse-couts-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Export réussi", description: "Le fichier Excel a été téléchargé" });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const totalStats = {
    totalFuel: costData.reduce((sum, v) => sum + v.totalFuelCost, 0),
    totalMaintenance: costData.reduce((sum, v) => sum + v.totalMaintenanceCost, 0),
    avgCostPerKm: costData.length > 0 
      ? costData.reduce((sum, v) => sum + v.costPerKm, 0) / costData.length 
      : 0,
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
            <CardDescription>Coûts carburant et maintenance sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
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
              <Bar dataKey="totalFuelCost" fill="#0088FE" name="Carburant" />
              <Bar dataKey="totalMaintenanceCost" fill="#00C49F" name="Maintenance" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
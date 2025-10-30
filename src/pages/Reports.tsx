import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Fuel, Wrench, FileText, TrendingUp } from "lucide-react";

const Reports = () => {
  const [fuelStats, setFuelStats] = useState({ totalCost: 0, avgCost: 0 });
  const [maintenanceStats, setMaintenanceStats] = useState<any[]>([]);
  const [vehicleStats, setVehicleStats] = useState<any[]>([]);
  const [monthlyFuelData, setMonthlyFuelData] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    // Fuel statistics
    const { data: fuelData } = await supabase
      .from("fuel")
      .select("cost, date, vehicle_id");

    if (fuelData) {
      const total = fuelData.reduce((sum, r) => sum + Number(r.cost), 0);
      const avg = fuelData.length > 0 ? total / fuelData.length : 0;
      setFuelStats({ totalCost: total, avgCost: avg });

      // Monthly fuel data
      const monthlyData: any = {};
      fuelData.forEach((record) => {
        const month = new Date(record.date).toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += Number(record.cost);
      });

      setMonthlyFuelData(
        Object.entries(monthlyData).map(([month, cost]) => ({
          month,
          cost: Number(cost),
        }))
      );
    }

    // Maintenance statistics by type
    const { data: maintenanceData } = await supabase
      .from("maintenance")
      .select("type, cost");

    if (maintenanceData) {
      const stats: any = {};
      maintenanceData.forEach((m) => {
        if (!stats[m.type]) {
          stats[m.type] = { type: m.type, count: 0, totalCost: 0 };
        }
        stats[m.type].count++;
        stats[m.type].totalCost += Number(m.cost || 0);
      });

      setMaintenanceStats(Object.values(stats));
    }

    // Vehicle statistics
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("status");

    if (vehiclesData) {
      const stats: any = {};
      vehiclesData.forEach((v) => {
        if (!stats[v.status]) {
          stats[v.status] = { status: v.status, count: 0 };
        }
        stats[v.status].count++;
      });

      setVehicleStats(Object.values(stats));
    }
  };

  const COLORS = {
    primary: "hsl(var(--primary))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    muted: "hsl(var(--muted))",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rapports & Analyses</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des performances de votre flotte
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card border-0 animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coût Carburant Total
            </CardTitle>
            <Fuel className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fuelStats.totalCost.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">
              Moyenne: {fuelStats.avgCost.toFixed(2)} €
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenances
            </CardTitle>
            <Wrench className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceStats.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total interventions
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coût Maintenance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceStats.reduce((sum, s) => sum + s.totalCost, 0).toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total dépensé
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 animate-scale-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Véhicules
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicleStats.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total flotte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Fuel Costs */}
        {monthlyFuelData.length > 0 && (
          <Card className="glass-card border-0 animate-slide-up">
            <CardHeader>
              <CardTitle>Coûts Carburant Mensuels</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyFuelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="cost" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Maintenance by Type */}
        {maintenanceStats.length > 0 && (
          <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Répartition des Maintenances</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={maintenanceStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {maintenanceStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? COLORS.primary
                            : index === 1
                            ? COLORS.success
                            : COLORS.warning
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Status */}
        {vehicleStats.length > 0 && (
          <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle>Statut des Véhicules</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vehicleStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="status" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Maintenance Cost Details */}
      {maintenanceStats.length > 0 && (
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle>Détail des Coûts de Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 glass rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{stat.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.count} intervention(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{stat.totalCost.toFixed(2)} €</p>
                    <p className="text-sm text-muted-foreground">
                      {(stat.totalCost / stat.count).toFixed(2)} € / intervention
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
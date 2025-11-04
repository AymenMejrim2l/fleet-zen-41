import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, AlertCircle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDashboardStats, useMonthlyChartData, useDashboardRealtime } from "@/hooks/useDashboardQuery";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: monthlyData = [] } = useMonthlyChartData();

  // Temps réel
  useDashboardRealtime(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["monthly-chart"] });
  });

  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const vehicleStatusData = [
    { name: "Actifs", value: stats.activeVehicles, color: "hsl(var(--success))" },
    { name: "Inactifs", value: stats.totalVehicles - stats.activeVehicles, color: "hsl(var(--muted))" },
  ];

  const statCards = [
    {
      title: "Total Véhicules",
      value: stats.totalVehicles,
      subtitle: `${stats.activeVehicles} actifs`,
      icon: Car,
      gradient: "gradient-brand",
    },
    {
      title: "Total Conducteurs",
      value: stats.totalDrivers,
      subtitle: `${stats.activeDrivers} actifs`,
      icon: Users,
      gradient: "gradient-success",
    },
    {
      title: "Maintenances à venir",
      value: stats.upcomingMaintenance,
      subtitle: "30 prochains jours",
      icon: AlertCircle,
      gradient: "gradient-warning",
    },
    {
      title: "Coût Carburant",
      value: formatCurrency(stats.totalFuelCost),
      subtitle: `${stats.fuelCostChange >= 0 ? '+' : ''}${stats.fuelCostChange}% ce mois`,
      icon: TrendingUp,
      gradient: stats.fuelCostChange >= 0 ? "gradient-warning" : "gradient-success",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tableau de Bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre flotte automobile
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="glass-card hover-lift animate-scale-in border-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.gradient} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="glass-card border-0 animate-slide-up">
          <CardHeader>
            <CardTitle>Évolution du Kilométrage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
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
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle>Répartition des Véhicules</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
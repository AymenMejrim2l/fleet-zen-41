import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMonthlyTrends, useVehicleComparison, useCostPrediction } from "@/hooks/useAdvancedAnalytics";
import { useVehicles } from "@/hooks/useVehiclesQuery";
import SkeletonLoader from "@/components/ui/skeleton-loader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatNumber } from "@/lib/exportUtils";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Analytics() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("12");

  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles({ page: 1, limit: 100 });
  const { data: monthlyTrends, isLoading: trendsLoading } = useMonthlyTrends(
    selectedVehicle || undefined,
    parseInt(timeRange)
  );
  const { data: vehicleComparison, isLoading: comparisonLoading } = useVehicleComparison(
    parseInt(timeRange)
  );
  const { data: costPrediction, isLoading: predictionLoading } = useCostPrediction(
    selectedVehicle || undefined,
    parseInt(timeRange),
    6
  );

  const handleExportExcel = () => {
    if (!monthlyTrends) return;

    exportToExcel({
      title: "Tendances Mensuelles",
      data: monthlyTrends.map((trend) => ({
        Mois: format(new Date(trend.month + "-01"), "MMMM yyyy", { locale: fr }),
        "Consommation (L)": formatNumber(trend.consumption),
        "Coût Carburant": formatCurrency(trend.fuelCost),
        "Coût Maintenance": formatCurrency(trend.maintenanceCost),
        "Distance (km)": trend.distance,
      })),
      columns: [
        { key: "Mois", label: "Mois" },
        { key: "Consommation (L)", label: "Consommation (L)" },
        { key: "Coût Carburant", label: "Coût Carburant" },
        { key: "Coût Maintenance", label: "Coût Maintenance" },
        { key: "Distance (km)", label: "Distance (km)" },
      ],
    });
  };

  const handleExportPDF = () => {
    if (!monthlyTrends) return;

    exportToPDF({
      title: "Rapport d'Analytics - Tendances Mensuelles",
      data: monthlyTrends.map((trend) => ({
        Mois: format(new Date(trend.month + "-01"), "MMMM yyyy", { locale: fr }),
        "Consommation (L)": formatNumber(trend.consumption),
        "Coût Carburant": formatCurrency(trend.fuelCost),
        "Coût Maintenance": formatCurrency(trend.maintenanceCost),
        "Distance (km)": trend.distance,
      })),
      columns: [
        { key: "Mois", label: "Mois" },
        { key: "Consommation (L)", label: "Consommation (L)" },
        { key: "Coût Carburant", label: "Coût Carburant" },
        { key: "Coût Maintenance", label: "Coût Maintenance" },
        { key: "Distance (km)", label: "Distance (km)" },
      ],
    });
  };

  const handleExportComparison = () => {
    if (!vehicleComparison) return;

    exportToExcel({
      title: "Comparaison Véhicules",
      data: vehicleComparison.map((v) => ({
        Véhicule: v.vehicleName,
        "Distance totale (km)": v.totalDistance,
        "Coût carburant": formatCurrency(v.totalFuelCost),
        "Coût maintenance": formatCurrency(v.totalMaintenanceCost),
        "Consommation moyenne (L/100km)": formatNumber(v.avgConsumption),
        "Coût par km": formatCurrency(v.costPerKm),
      })),
      columns: [
        { key: "Véhicule", label: "Véhicule" },
        { key: "Distance totale (km)", label: "Distance totale (km)" },
        { key: "Coût carburant", label: "Coût carburant" },
        { key: "Coût maintenance", label: "Coût maintenance" },
        { key: "Consommation moyenne (L/100km)", label: "Consommation moyenne (L/100km)" },
        { key: "Coût par km", label: "Coût par km" },
      ],
    });
  };

  if (vehiclesLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Analytics Avancées</h1>
          <SkeletonLoader count={4} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Avancées</h1>
            <p className="text-muted-foreground">
              Tendances, prédictions et comparaisons détaillées
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportExcel} variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Véhicule</label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les véhicules</SelectItem>
                {vehiclesData?.vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.registration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Période</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 mois</SelectItem>
                <SelectItem value="6">6 mois</SelectItem>
                <SelectItem value="12">12 mois</SelectItem>
                <SelectItem value="24">24 mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tendances mensuelles */}
        <Card>
          <CardHeader>
            <CardTitle>Tendances de Consommation et Coûts</CardTitle>
            <CardDescription>
              Évolution mensuelle sur {timeRange} mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : monthlyTrends && monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value + "-01"), "MMM yyyy", { locale: fr })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value + "-01"), "MMMM yyyy", { locale: fr })}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="fuelCost" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorFuel)" 
                    name="Coût Carburant"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="maintenanceCost" 
                    stroke="#ec4899" 
                    fillOpacity={1} 
                    fill="url(#colorMaintenance)" 
                    name="Coût Maintenance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prédictions de coûts */}
        <Card>
          <CardHeader>
            <CardTitle>Prédictions de Coûts Futurs</CardTitle>
            <CardDescription>
              Projection sur 6 mois basée sur l'historique
            </CardDescription>
          </CardHeader>
          <CardContent>
            {predictionLoading ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : costPrediction && costPrediction.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={costPrediction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    tickFormatter={(value) => format(new Date(value + "-01"), "MMM yyyy", { locale: fr })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value + "-01"), "MMMM yyyy", { locale: fr })}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="predictedFuelCost" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Carburant prédit"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedMaintenanceCost" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    name="Maintenance prédite"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedTotal" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    name="Total prédit"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Pas assez de données pour prédire</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparaison inter-véhicules */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Comparaison Inter-Véhicules</CardTitle>
                <CardDescription>
                  Performance comparative sur {timeRange} mois
                </CardDescription>
              </div>
              <Button onClick={handleExportComparison} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : vehicleComparison && vehicleComparison.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vehicleComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="vehicleName" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalFuelCost" fill="#8b5cf6" name="Coût Carburant" />
                    <Bar dataKey="totalMaintenanceCost" fill="#ec4899" name="Coût Maintenance" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Détails par véhicule</h3>
                  <div className="grid gap-4">
                    {vehicleComparison.map((vehicle) => (
                      <Card key={vehicle.vehicleId}>
                        <CardContent className="pt-6">
                          <h4 className="font-medium mb-3">{vehicle.vehicleName}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Distance</p>
                              <p className="font-semibold">{vehicle.totalDistance} km</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Consommation moy.</p>
                              <p className="font-semibold">{formatNumber(vehicle.avgConsumption)} L/100km</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Coût/km</p>
                              <p className="font-semibold">{formatCurrency(vehicle.costPerKm)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Carburant total</p>
                              <p className="font-semibold">{formatCurrency(vehicle.totalFuelCost)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Maintenance total</p>
                              <p className="font-semibold">{formatCurrency(vehicle.totalMaintenanceCost)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Coût total</p>
                              <p className="font-semibold text-primary">
                                {formatCurrency(vehicle.totalFuelCost + vehicle.totalMaintenanceCost)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune donnée de comparaison disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

import { supabase } from "@/integrations/supabase/client";

export interface VehicleAnalytics {
  vehicleId: string;
  vehicleName: string;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  distancePeriod: number;
  costPerKm: number;
  avgConsumption: number; // L/100km
  totalFuelVolume: number;
}

export interface MonthlyData {
  month: string;
  carburant: number;
  maintenance: number;
  distance: number;
}

/**
 * Calcule les analytics pour une période donnée avec cache
 */
export const calculateVehicleAnalytics = async (
  vehicleId: string | null,
  startDate: Date,
  endDate: Date
): Promise<VehicleAnalytics[]> => {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Construire la requête avec JOINs optimisés
  let vehicleQuery = supabase
    .from("vehicles")
    .select(`
      id,
      make,
      model,
      fuel:fuel(date, cost, volume, mileage),
      maintenance:maintenance(completed_date, cost)
    `)
    .eq("status", "active");

  if (vehicleId) {
    vehicleQuery = vehicleQuery.eq("id", vehicleId);
  }

  const { data: vehicles, error } = await vehicleQuery;

  if (error) throw error;

  const analytics: VehicleAnalytics[] = [];

  for (const vehicle of vehicles || []) {
    // Filtrer les données de carburant par période
    const fuelData = (vehicle.fuel as any[])?.filter(
      (f) => f.date >= startDateStr && f.date <= endDateStr
    ) || [];

    // Filtrer les données de maintenance par période
    const maintenanceData = (vehicle.maintenance as any[])?.filter(
      (m) => m.completed_date && m.completed_date >= startDateStr && m.completed_date <= endDateStr
    ) || [];

    // Calculs
    const totalFuelCost = fuelData.reduce((sum, f) => sum + Number(f.cost || 0), 0);
    const totalFuelVolume = fuelData.reduce((sum, f) => sum + Number(f.volume || 0), 0);
    const totalMaintenanceCost = maintenanceData.reduce((sum, m) => sum + Number(m.cost || 0), 0);

    // Calculer la distance parcourue pendant la période
    let distancePeriod = 0;
    let avgConsumption = 0;

    if (fuelData.length >= 2) {
      const sortedFuel = [...fuelData].sort((a, b) => a.mileage - b.mileage);
      const startMileage = sortedFuel[0].mileage;
      const endMileage = sortedFuel[sortedFuel.length - 1].mileage;
      distancePeriod = endMileage - startMileage;

      // Consommation moyenne L/100km
      if (distancePeriod > 0 && totalFuelVolume > 0) {
        avgConsumption = (totalFuelVolume / distancePeriod) * 100;
      }
    }

    // Coût par km (basé sur la distance parcourue, pas le kilométrage total)
    const totalCost = totalFuelCost + totalMaintenanceCost;
    const costPerKm = distancePeriod > 0 ? totalCost / distancePeriod : 0;

    analytics.push({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      totalFuelCost,
      totalMaintenanceCost,
      distancePeriod,
      costPerKm: Number(costPerKm.toFixed(3)),
      avgConsumption: Number(avgConsumption.toFixed(2)),
      totalFuelVolume: Number(totalFuelVolume.toFixed(2)),
    });
  }

  // Sauvegarder dans le cache
  await saveToCache(analytics, startDateStr, endDateStr);

  return analytics;
};

/**
 * Génère les données mensuelles avec une seule requête optimisée
 */
export const generateMonthlyData = async (months: number = 6): Promise<MonthlyData[]> => {
  const result: MonthlyData[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Récupérer toutes les données en une seule requête
  const [fuelResult, maintenanceResult] = await Promise.all([
    supabase
      .from("fuel")
      .select("date, cost, volume, mileage")
      .gte("date", startDate.toISOString().split('T')[0])
      .lte("date", endDate.toISOString().split('T')[0]),
    supabase
      .from("maintenance")
      .select("completed_date, cost")
      .gte("completed_date", startDate.toISOString().split('T')[0])
      .lte("completed_date", endDate.toISOString().split('T')[0])
      .not("completed_date", "is", null),
  ]);

  // Agréger par mois
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    const fuelCost = (fuelResult.data || [])
      .filter((f) => f.date >= monthStartStr && f.date <= monthEndStr)
      .reduce((sum, f) => sum + Number(f.cost), 0);

    const maintenanceCost = (maintenanceResult.data || [])
      .filter((m) => m.completed_date && m.completed_date >= monthStartStr && m.completed_date <= monthEndStr)
      .reduce((sum, m) => sum + Number(m.cost), 0);

    // Calculer la distance parcourue ce mois
    const monthFuel = (fuelResult.data || [])
      .filter((f) => f.date >= monthStartStr && f.date <= monthEndStr)
      .sort((a, b) => a.mileage - b.mileage);

    const distance = monthFuel.length >= 2
      ? monthFuel[monthFuel.length - 1].mileage - monthFuel[0].mileage
      : 0;

    result.push({
      month: monthName,
      carburant: Number(fuelCost.toFixed(2)),
      maintenance: Number(maintenanceCost.toFixed(2)),
      distance,
    });
  }

  return result;
};

/**
 * Sauvegarde les analytics dans le cache
 */
const saveToCache = async (
  analytics: VehicleAnalytics[],
  startDate: string,
  endDate: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const cacheData = analytics.map((a) => ({
    user_id: user.id,
    vehicle_id: a.vehicleId,
    period_start: startDate,
    period_end: endDate,
    total_fuel_cost: a.totalFuelCost,
    total_maintenance_cost: a.totalMaintenanceCost,
    total_distance: a.distancePeriod,
    cost_per_km: a.costPerKm,
  }));

  // Upsert pour éviter les doublons
  await supabase
    .from("analytics_cache")
    .upsert(cacheData, {
      onConflict: "user_id,vehicle_id,period_start,period_end",
    });
};

/**
 * Récupère les analytics depuis le cache si disponible
 */
export const getFromCache = async (
  vehicleId: string | null,
  startDate: string,
  endDate: string
): Promise<VehicleAnalytics[] | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("analytics_cache")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_start", startDate)
    .eq("period_end", endDate);

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  // Transformer en format VehicleAnalytics
  return data.map((d) => ({
    vehicleId: d.vehicle_id || "",
    vehicleName: "", // Sera rechargé si nécessaire
    totalFuelCost: Number(d.total_fuel_cost || 0),
    totalMaintenanceCost: Number(d.total_maintenance_cost || 0),
    distancePeriod: d.total_distance || 0,
    costPerKm: Number(d.cost_per_km || 0),
    avgConsumption: 0, // Calculé séparément
    totalFuelVolume: 0,
  }));
};

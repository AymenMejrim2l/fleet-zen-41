import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";

export interface MonthlyTrend {
  month: string;
  consumption: number;
  fuelCost: number;
  maintenanceCost: number;
  distance: number;
  vehicleId?: string;
  vehicleName?: string;
}

export interface VehicleComparison {
  vehicleId: string;
  vehicleName: string;
  totalDistance: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  avgConsumption: number;
  costPerKm: number;
}

export interface CostPrediction {
  month: string;
  predictedFuelCost: number;
  predictedMaintenanceCost: number;
  predictedTotal: number;
}

export const useMonthlyTrends = (vehicleId?: string, months: number = 12) => {
  return useQuery({
    queryKey: ["monthly_trends", vehicleId, months],
    queryFn: async () => {
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      const endDate = endOfMonth(new Date());

      let fuelQuery = supabase
        .from("fuel")
        .select("*, vehicles(id, make, model, registration)")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (vehicleId) {
        fuelQuery = fuelQuery.eq("vehicle_id", vehicleId);
      }

      const { data: fuelData, error: fuelError } = await fuelQuery;
      if (fuelError) throw fuelError;

      let maintenanceQuery = supabase
        .from("maintenance")
        .select("*, vehicles(id, make, model, registration)")
        .gte("completed_date", startDate.toISOString().split("T")[0])
        .lte("completed_date", endDate.toISOString().split("T")[0])
        .eq("status", "completed");

      if (vehicleId) {
        maintenanceQuery = maintenanceQuery.eq("vehicle_id", vehicleId);
      }

      const { data: maintenanceData, error: maintenanceError } = await maintenanceQuery;
      if (maintenanceError) throw maintenanceError;

      // Grouper par mois
      const monthlyData = new Map<string, MonthlyTrend>();

      // Traiter les données de carburant
      for (const record of fuelData || []) {
        const monthKey = format(new Date(record.date), "yyyy-MM");
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthKey,
            consumption: 0,
            fuelCost: 0,
            maintenanceCost: 0,
            distance: 0,
            vehicleId: record.vehicle_id,
            vehicleName: `${record.vehicles.make} ${record.vehicles.model}`,
          });
        }

        const data = monthlyData.get(monthKey)!;
        data.fuelCost += parseFloat(record.cost.toString());
        data.consumption += parseFloat(record.volume.toString());
      }

      // Calculer les distances par mois
      const vehicleFuelRecords = new Map<string, any[]>();
      for (const record of fuelData || []) {
        if (!vehicleFuelRecords.has(record.vehicle_id)) {
          vehicleFuelRecords.set(record.vehicle_id, []);
        }
        vehicleFuelRecords.get(record.vehicle_id)!.push(record);
      }

      for (const [vId, records] of vehicleFuelRecords) {
        const sorted = records.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (let i = 1; i < sorted.length; i++) {
          const current = sorted[i];
          const previous = sorted[i - 1];
          const distance = current.mileage - previous.mileage;
          
          if (distance > 0) {
            const monthKey = format(new Date(current.date), "yyyy-MM");
            if (monthlyData.has(monthKey)) {
              monthlyData.get(monthKey)!.distance += distance;
            }
          }
        }
      }

      // Traiter les données de maintenance
      for (const record of maintenanceData || []) {
        if (!record.completed_date) continue;
        const monthKey = format(new Date(record.completed_date), "yyyy-MM");
        
        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey)!;
          data.maintenanceCost += parseFloat(record.cost?.toString() || "0");
        } else if (!vehicleId) {
          monthlyData.set(monthKey, {
            month: monthKey,
            consumption: 0,
            fuelCost: 0,
            maintenanceCost: parseFloat(record.cost?.toString() || "0"),
            distance: 0,
          });
        }
      }

      return Array.from(monthlyData.values()).sort((a, b) => 
        a.month.localeCompare(b.month)
      );
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useVehicleComparison = (months: number = 12) => {
  return useQuery({
    queryKey: ["vehicle_comparison", months],
    queryFn: async () => {
      const startDate = subMonths(new Date(), months);

      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active");

      if (vehiclesError) throw vehiclesError;

      const comparisons: VehicleComparison[] = [];

      for (const vehicle of vehicles || []) {
        const { data: fuelData } = await supabase
          .from("fuel")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .gte("date", startDate.toISOString().split("T")[0])
          .order("date", { ascending: true });

        const { data: maintenanceData } = await supabase
          .from("maintenance")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .gte("completed_date", startDate.toISOString().split("T")[0])
          .eq("status", "completed");

        let totalFuelCost = 0;
        let totalVolume = 0;
        let totalDistance = 0;
        let totalMaintenanceCost = 0;

        // Calculer les coûts de carburant et distance
        if (fuelData && fuelData.length > 1) {
          const sorted = [...fuelData].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          for (let i = 1; i < sorted.length; i++) {
            totalFuelCost += parseFloat(sorted[i].cost.toString());
            totalVolume += parseFloat(sorted[i].volume.toString());
            const distance = sorted[i].mileage - sorted[i - 1].mileage;
            if (distance > 0) {
              totalDistance += distance;
            }
          }
        }

        // Calculer les coûts de maintenance
        for (const record of maintenanceData || []) {
          totalMaintenanceCost += parseFloat(record.cost?.toString() || "0");
        }

        const avgConsumption = totalDistance > 0 ? (totalVolume / totalDistance) * 100 : 0;
        const costPerKm = totalDistance > 0 ? (totalFuelCost + totalMaintenanceCost) / totalDistance : 0;

        comparisons.push({
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.registration})`,
          totalDistance,
          totalFuelCost,
          totalMaintenanceCost,
          avgConsumption,
          costPerKm,
        });
      }

      return comparisons.filter(c => c.totalDistance > 0);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCostPrediction = (vehicleId?: string, monthsHistory: number = 12, monthsPredict: number = 6) => {
  return useQuery({
    queryKey: ["cost_prediction", vehicleId, monthsHistory, monthsPredict],
    queryFn: async () => {
      const startDate = subMonths(new Date(), monthsHistory);

      let fuelQuery = supabase
        .from("fuel")
        .select("*")
        .gte("date", startDate.toISOString().split("T")[0]);

      if (vehicleId) {
        fuelQuery = fuelQuery.eq("vehicle_id", vehicleId);
      }

      const { data: fuelData, error: fuelError } = await fuelQuery;
      if (fuelError) throw fuelError;

      let maintenanceQuery = supabase
        .from("maintenance")
        .select("*")
        .gte("completed_date", startDate.toISOString().split("T")[0])
        .eq("status", "completed");

      if (vehicleId) {
        maintenanceQuery = maintenanceQuery.eq("vehicle_id", vehicleId);
      }

      const { data: maintenanceData, error: maintenanceError } = await maintenanceQuery;
      if (maintenanceError) throw maintenanceError;

      // Calculer les moyennes mensuelles
      const monthlyFuelCosts: number[] = [];
      const monthlyMaintenanceCosts: number[] = [];

      for (let i = 0; i < monthsHistory; i++) {
        const monthStart = startOfMonth(subMonths(new Date(), monthsHistory - i - 1));
        const monthEnd = endOfMonth(monthStart);

        const fuelCost = (fuelData || [])
          .filter(r => {
            const date = new Date(r.date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, r) => sum + parseFloat(r.cost.toString()), 0);

        const maintenanceCost = (maintenanceData || [])
          .filter(r => {
            if (!r.completed_date) return false;
            const date = new Date(r.completed_date);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, r) => sum + parseFloat(r.cost?.toString() || "0"), 0);

        monthlyFuelCosts.push(fuelCost);
        monthlyMaintenanceCosts.push(maintenanceCost);
      }

      // Calcul de la moyenne mobile pour la prédiction
      const avgFuelCost = monthlyFuelCosts.reduce((a, b) => a + b, 0) / monthlyFuelCosts.length;
      const avgMaintenanceCost = monthlyMaintenanceCosts.reduce((a, b) => a + b, 0) / monthlyMaintenanceCosts.length;

      // Calculer la tendance (régression linéaire simple)
      const fuelTrend = calculateTrend(monthlyFuelCosts);
      const maintenanceTrend = calculateTrend(monthlyMaintenanceCosts);

      // Générer les prédictions
      const predictions: CostPrediction[] = [];
      for (let i = 1; i <= monthsPredict; i++) {
        const futureMonth = format(subMonths(new Date(), -i), "yyyy-MM");
        const predictedFuelCost = Math.max(0, avgFuelCost + fuelTrend * (monthsHistory + i));
        const predictedMaintenanceCost = Math.max(0, avgMaintenanceCost + maintenanceTrend * (monthsHistory + i));

        predictions.push({
          month: futureMonth,
          predictedFuelCost,
          predictedMaintenanceCost,
          predictedTotal: predictedFuelCost + predictedMaintenanceCost,
        });
      }

      return predictions;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Fonction de régression linéaire simple
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  upcomingMaintenance: number;
  totalFuelCost: number;
  fuelCostChange: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Requêtes parallèles pour performance
      const [vehiclesResult, driversResult, maintenanceResult, fuelResult, lastMonthFuelResult] = await Promise.all([
        supabase.from("vehicles").select("status", { count: "exact" }),
        supabase.from("drivers").select("status", { count: "exact" }),
        supabase
          .from("maintenance")
          .select("id", { count: "exact" })
          .eq("status", "scheduled")
          .gte("scheduled_date", now.toISOString().split('T')[0])
          .lte("scheduled_date", new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase
          .from("fuel")
          .select("cost")
          .gte("date", monthStart.toISOString().split('T')[0]),
        supabase
          .from("fuel")
          .select("cost")
          .gte("date", lastMonthStart.toISOString().split('T')[0])
          .lte("date", lastMonthEnd.toISOString().split('T')[0]),
      ]);

      const totalFuelCost = (fuelResult.data || []).reduce((sum, f) => sum + Number(f.cost), 0);
      const lastMonthFuelCost = (lastMonthFuelResult.data || []).reduce((sum, f) => sum + Number(f.cost), 0);
      const fuelCostChange = lastMonthFuelCost > 0 
        ? ((totalFuelCost - lastMonthFuelCost) / lastMonthFuelCost) * 100 
        : 0;

      const stats: DashboardStats = {
        totalVehicles: vehiclesResult.count || 0,
        activeVehicles: (vehiclesResult.data || []).filter((v) => v.status === "active").length,
        totalDrivers: driversResult.count || 0,
        activeDrivers: (driversResult.data || []).filter((d) => d.status === "active").length,
        upcomingMaintenance: maintenanceResult.count || 0,
        totalFuelCost: Number(totalFuelCost.toFixed(2)),
        fuelCostChange: Number(fuelCostChange.toFixed(1)),
      };

      return stats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

export const useMonthlyChartData = () => {
  return useQuery({
    queryKey: ["monthly-chart"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

        months.push({
          month: monthName,
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0],
        });
      }

      // Récupérer toutes les données de fuel en une requête
      const startDate = months[0].start;
      const endDate = months[months.length - 1].end;

      const { data: fuelData } = await supabase
        .from("fuel")
        .select("date, mileage")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      // Agréger par mois
      const result = months.map(({ month, start, end }) => {
        const monthFuel = (fuelData || []).filter(
          (f) => f.date >= start && f.date <= end
        );

        const distance = monthFuel.length >= 2
          ? monthFuel[monthFuel.length - 1].mileage - monthFuel[0].mileage
          : 0;

        return {
          month,
          value: distance,
        };
      });

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour activer le temps réel sur le dashboard
export const useDashboardRealtime = (onUpdate: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fuel'
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance'
        },
        onUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
};

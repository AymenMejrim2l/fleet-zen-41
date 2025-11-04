import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FuelRecord {
  id: string;
  vehicle_id: string;
  date: string;
  volume: number;
  cost: number;
  mileage: number;
  station?: string;
  fuel_type?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface FuelQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
}

export const useFuelRecords = (params: FuelQueryParams = {}) => {
  const { page = 1, limit = 50, vehicleId, startDate, endDate } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["fuel", page, limit, vehicleId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("fuel")
        .select("*, vehicles(make, model, registration)", { count: "exact" })
        .order("date", { ascending: false })
        .range(from, to);

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      if (startDate) {
        query = query.gte("date", startDate);
      }

      if (endDate) {
        query = query.lte("date", endDate);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        records: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateFuelRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<FuelRecord, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("fuel")
        .insert({ ...record, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Plein enregistré");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    },
  });
};

export const useUpdateFuelRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...record }: Partial<FuelRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("fuel")
        .update(record)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Plein mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteFuelRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fuel").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Plein supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

// Calcul de consommation
export const useFuelConsumption = (vehicleId: string, period: number = 30) => {
  return useQuery({
    queryKey: ["fuel-consumption", vehicleId, period],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const { data, error } = await supabase
        .from("fuel")
        .select("volume, mileage")
        .eq("vehicle_id", vehicleId)
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0])
        .order("mileage", { ascending: true });

      if (error) throw error;

      if (!data || data.length < 2) {
        return {
          avgConsumption: 0,
          totalVolume: 0,
          totalDistance: 0,
          efficiency: 0,
        };
      }

      const totalVolume = data.reduce((sum, r) => sum + Number(r.volume), 0);
      const totalDistance = data[data.length - 1].mileage - data[0].mileage;

      const avgConsumption = totalDistance > 0 ? (totalVolume / totalDistance) * 100 : 0;
      const efficiency = totalVolume > 0 ? totalDistance / totalVolume : 0;

      return {
        avgConsumption: Number(avgConsumption.toFixed(2)), // L/100km
        totalVolume: Number(totalVolume.toFixed(2)),
        totalDistance,
        efficiency: Number(efficiency.toFixed(2)), // km/L
      };
    },
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000,
  });
};

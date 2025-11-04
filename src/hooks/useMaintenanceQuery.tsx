import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  description?: string;
  cost?: number;
  provider?: string;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  mileage?: number;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface MaintenanceQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  status?: string;
}

export const useMaintenanceRecords = (params: MaintenanceQueryParams = {}) => {
  const { page = 1, limit = 50, vehicleId, status } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["maintenance", page, limit, vehicleId, status],
    queryFn: async () => {
      let query = supabase
        .from("maintenance")
        .select("*, vehicles(make, model, registration)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        records: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<MaintenanceRecord, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("maintenance")
        .insert({ ...record, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Maintenance enregistrée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    },
  });
};

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...record }: Partial<MaintenanceRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("maintenance")
        .update(record)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Maintenance mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Maintenance supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year?: number;
  fuel_type?: string;
  status: string;
  mileage: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface VehiclesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const useVehicles = (params: VehiclesQueryParams = {}) => {
  const { page = 1, limit = 50, search, status } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["vehicles", page, limit, search, status],
    queryFn: async () => {
      let query = supabase
        .from("vehicles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`registration.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        vehicles: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVehicle = (id: string | null) => {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("vehicles")
        .insert({ ...vehicle, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Véhicule ajouté avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du véhicule");
      console.error(error);
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...vehicle }: Partial<Vehicle> & { id: string }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .update(vehicle)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", data.id] });
      toast.success("Véhicule mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Véhicule supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tour {
  id: string;
  title: string;
  vehicle_id?: string;
  driver_id?: string;
  start_date: string;
  end_date?: string;
  start_mileage?: number;
  end_mileage?: number;
  status: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  vehicles?: {
    registration: string;
    make: string;
    model: string;
  };
  drivers?: {
    first_name: string;
    last_name: string;
  };
}

interface ToursQueryParams {
  page?: number;
  limit?: number;
  vehicleId?: string;
  driverId?: string;
  status?: string;
}

export const useTours = (params: ToursQueryParams = {}) => {
  const { page = 1, limit = 50, vehicleId, driverId, status } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["tours", page, limit, vehicleId, driverId, status],
    queryFn: async () => {
      let query = supabase
        .from("tours")
        .select("*, vehicles(registration, make, model), drivers(first_name, last_name)", { count: "exact" })
        .order("start_date", { ascending: false })
        .range(from, to);

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      if (driverId) {
        query = query.eq("driver_id", driverId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        tours: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tour: Omit<Tour, "id" | "created_at" | "updated_at" | "vehicles" | "drivers">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("tours")
        .insert({ ...tour, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tournée ajoutée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });
};

export const useUpdateTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...tour }: Partial<Tour> & { id: string }) => {
      const { data, error } = await supabase
        .from("tours")
        .update(tour)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tournée mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tournée supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

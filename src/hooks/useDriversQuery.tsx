import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string;
  phone?: string;
  email?: string;
  status: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface DriversQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const useDrivers = (params: DriversQueryParams = {}) => {
  const { page = 1, limit = 50, search, status } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["drivers", page, limit, search, status],
    queryFn: async () => {
      let query = supabase
        .from("drivers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,license_number.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        drivers: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driver: Omit<Driver, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("drivers")
        .insert({ ...driver, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Conducteur ajouté avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du conducteur");
      console.error(error);
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...driver }: Partial<Driver> & { id: string }) => {
      const { data, error } = await supabase
        .from("drivers")
        .update(driver)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Conducteur mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Conducteur supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

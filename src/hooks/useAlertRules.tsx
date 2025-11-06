import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  type: 'fuel_consumption' | 'maintenance_prediction';
  condition: {
    threshold?: number;
    vehicle_id?: string;
    days_before?: number;
  };
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useAlertRules = () => {
  return useQuery({
    queryKey: ["alert_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AlertRule[];
    },
  });
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<AlertRule, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("alert_rules")
        .insert({ ...rule, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert_rules"] });
      toast.success("Règle d'alerte créée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création");
      console.error(error);
    },
  });
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...rule }: Partial<AlertRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("alert_rules")
        .update(rule)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert_rules"] });
      toast.success("Règle d'alerte mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alert_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert_rules"] });
      toast.success("Règle d'alerte supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

export const useTriggerAlertCheck = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-alerts');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Vérification des alertes lancée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la vérification");
      console.error(error);
    },
  });
};

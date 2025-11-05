import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Document {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: string;
  title: string;
  issue_date?: string;
  expiry_date?: string;
  file_url?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface DocumentsQueryParams {
  page?: number;
  limit?: number;
  entityType?: string;
  documentType?: string;
}

export const useDocuments = (params: DocumentsQueryParams = {}) => {
  const { page = 1, limit = 50, entityType, documentType } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return useQuery({
    queryKey: ["documents", page, limit, entityType, documentType],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*", { count: "exact" })
        .order("expiry_date", { ascending: true })
        .range(from, to);

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      if (documentType) {
        query = query.eq("document_type", documentType);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        documents: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Omit<Document, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("documents")
        .insert({ ...document, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document ajouté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...document }: Partial<Document> & { id: string }) => {
      const { data, error } = await supabase
        .from("documents")
        .update(document)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
};

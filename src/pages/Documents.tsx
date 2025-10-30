import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const documentSchema = z.object({
  entity_type: z.string().min(1, "Type d'entité requis"),
  entity_id: z.string().min(1, "Entité requise"),
  document_type: z.string().min(1, "Type de document requis"),
  title: z.string().min(1, "Titre requis"),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  file_url: z.string().optional(),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface Document {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: string;
  title: string;
  issue_date?: string;
  expiry_date?: string;
  file_url?: string;
  notes?: string;
  vehicles?: {
    registration: string;
  };
  drivers?: {
    first_name: string;
    last_name: string;
  };
}

interface Entity {
  id: string;
  label: string;
  type: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      entity_type: "",
      entity_id: "",
      document_type: "",
      title: "",
    },
  });

  useEffect(() => {
    loadDocuments();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedEntityType) {
      loadEntities(selectedEntityType);
    }
  }, [selectedEntityType]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("expiry_date", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement");
      return;
    }

    setDocuments(data || []);
  };

  const loadEntities = async (entityType: string) => {
    if (entityType === "vehicle") {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, registration, make, model");

      if (!error && data) {
        setEntities(
          data.map((v) => ({
            id: v.id,
            label: `${v.registration} - ${v.make} ${v.model}`,
            type: "vehicle",
          }))
        );
      }
    } else if (entityType === "driver") {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, first_name, last_name");

      if (!error && data) {
        setEntities(
          data.map((d) => ({
            id: d.id,
            label: `${d.first_name} ${d.last_name}`,
            type: "driver",
          }))
        );
      }
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!userId) {
      toast.error("Utilisateur non connecté");
      return;
    }

    if (editingDocument) {
      const { error } = await supabase
        .from("documents")
        .update(data)
        .eq("id", editingDocument.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      toast.success("Document mis à jour");
    } else {
      const { error } = await supabase.from("documents").insert({
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        document_type: data.document_type,
        title: data.title,
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
        file_url: data.file_url,
        notes: data.notes,
        user_id: userId,
      });

      if (error) {
        toast.error("Erreur lors de l'ajout");
        return;
      }

      toast.success("Document ajouté");
    }

    loadDocuments();
    setIsDialogOpen(false);
    setEditingDocument(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Document supprimé");
    loadDocuments();
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { icon: FileText, color: "text-muted-foreground", label: "N/A" };

    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());

    if (daysUntilExpiry < 0) {
      return { icon: AlertTriangle, color: "text-destructive", label: "Expiré" };
    } else if (daysUntilExpiry <= 30) {
      return { icon: AlertTriangle, color: "text-warning", label: `${daysUntilExpiry}j restants` };
    } else {
      return { icon: CheckCircle, color: "text-success", label: "Valide" };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Documents</h1>
          <p className="text-muted-foreground">
            Centralisez et suivez vos documents importants
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouveau document
            </Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? "Modifier le document" : "Nouveau document"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entity_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'entité</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedEntityType(value);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vehicle">Véhicule</SelectItem>
                            <SelectItem value="driver">Conducteur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entity_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {entities.map((entity) => (
                              <SelectItem key={entity.id} value={entity.id}>
                                {entity.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de document</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="insurance">Assurance</SelectItem>
                            <SelectItem value="registration">Carte grise</SelectItem>
                            <SelectItem value="inspection">Contrôle technique</SelectItem>
                            <SelectItem value="license">Permis de conduire</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Assurance 2024" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'émission</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'expiration</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="file_url"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>URL du fichier</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Informations complémentaires" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingDocument(null);
                      form.reset();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brand text-white">
                    {editingDocument ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, index) => {
          const expiryStatus = getExpiryStatus(doc.expiry_date);
          const Icon = expiryStatus.icon;

          return (
            <Card
              key={doc.id}
              className="glass-card border-0 hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${expiryStatus.color}`} />
                    <span className="text-sm truncate">{doc.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingDocument(doc);
                        form.reset(doc);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{doc.document_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Statut</span>
                  <span className={`font-medium ${expiryStatus.color}`}>
                    {expiryStatus.label}
                  </span>
                </div>
                {doc.expiry_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expire le</span>
                    <span className="font-medium">
                      {format(new Date(doc.expiry_date), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                {doc.file_url && (
                  <div className="mt-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Voir le document →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun document enregistré</p>
        </div>
      )}
    </div>
  );
};

export default Documents;
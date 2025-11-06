import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Bell, AlertTriangle, Wrench } from "lucide-react";
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule, useTriggerAlertCheck, AlertRule } from "@/hooks/useAlertRules";
import { useVehicles } from "@/hooks/useVehiclesQuery";
import SkeletonLoader from "@/components/ui/skeleton-loader";
import { Badge } from "@/components/ui/badge";

const alertSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.enum(["fuel_consumption", "maintenance_prediction"]),
  threshold: z.coerce.number().optional(),
  vehicle_id: z.string().optional(),
  days_before: z.coerce.number().optional(),
  active: z.boolean().default(true),
});

type AlertFormData = z.infer<typeof alertSchema>;

export default function Alerts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const { data: rules, isLoading } = useAlertRules();
  const { data: vehiclesData } = useVehicles({ page: 1, limit: 100 });
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();
  const triggerCheck = useTriggerAlertCheck();

  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      name: "",
      type: "fuel_consumption",
      active: true,
    },
  });

  const watchType = form.watch("type");

  const onSubmit = async (data: AlertFormData) => {
    const condition: any = {};
    
    if (data.type === "fuel_consumption") {
      condition.threshold = data.threshold || 15;
    } else {
      condition.days_before = data.days_before || 500;
    }
    
    if (data.vehicle_id) {
      condition.vehicle_id = data.vehicle_id;
    }

    const ruleData = {
      name: data.name,
      type: data.type,
      condition,
      active: data.active,
    };

    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, ...ruleData });
    } else {
      await createRule.mutateAsync(ruleData);
    }

    setIsDialogOpen(false);
    setEditingRule(null);
    form.reset();
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      type: rule.type,
      threshold: rule.condition.threshold,
      vehicle_id: rule.condition.vehicle_id,
      days_before: rule.condition.days_before,
      active: rule.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette règle ?")) {
      await deleteRule.mutateAsync(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    form.reset();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Alertes Automatiques</h1>
            <p className="text-muted-foreground">
              Configurez des alertes pour la consommation et la maintenance
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => triggerCheck.mutate()} variant="outline">
              <Bell className="mr-2 h-4 w-4" />
              Vérifier maintenant
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle alerte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "Modifier l'alerte" : "Créer une alerte"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez une règle d'alerte automatique
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'alerte</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Alerte consommation excessive" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type d'alerte</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fuel_consumption">Surconsommation carburant</SelectItem>
                              <SelectItem value="maintenance_prediction">Maintenance prédictive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchType === "fuel_consumption" && (
                      <FormField
                        control={form.control}
                        name="threshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seuil de consommation (L/100km)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="15" {...field} />
                            </FormControl>
                            <FormDescription>
                              Alerte si la consommation dépasse ce seuil
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchType === "maintenance_prediction" && (
                      <FormField
                        control={form.control}
                        name="days_before"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kilométrage depuis maintenance (km)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="500" {...field} />
                            </FormControl>
                            <FormDescription>
                              Alerte si le kilométrage dépasse ce seuil
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="vehicle_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Véhicule (optionnel)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tous les véhicules" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Tous les véhicules</SelectItem>
                              {vehiclesData?.vehicles?.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.make} {vehicle.model} - {vehicle.registration}
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
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active</FormLabel>
                            <FormDescription>
                              Activer cette règle d'alerte
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                        {editingRule ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <SkeletonLoader count={3} />
        ) : (
          <div className="grid gap-4">
            {rules?.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {rule.type === "fuel_consumption" ? (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      ) : (
                        <Wrench className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <CardTitle>{rule.name}</CardTitle>
                        <CardDescription>
                          {rule.type === "fuel_consumption"
                            ? "Alerte de surconsommation"
                            : "Alerte de maintenance prédictive"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.active ? "default" : "secondary"}>
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {rule.type === "fuel_consumption" && (
                      <p>
                        <span className="font-medium">Seuil:</span>{" "}
                        {rule.condition.threshold || 15} L/100km
                      </p>
                    )}
                    {rule.type === "maintenance_prediction" && (
                      <p>
                        <span className="font-medium">Kilométrage:</span>{" "}
                        {rule.condition.days_before || 500} km
                      </p>
                    )}
                    {rule.condition.vehicle_id && (
                      <p>
                        <span className="font-medium">Véhicule:</span> Spécifique
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && rules?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune alerte configurée</p>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre première règle d'alerte automatique
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

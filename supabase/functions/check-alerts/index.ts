import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRule {
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting alert checks...');

    // Récupérer toutes les règles d'alerte actives
    const { data: alertRules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('active', true);

    if (rulesError) throw rulesError;

    const notifications: any[] = [];

    // Vérifier chaque règle
    for (const rule of (alertRules as AlertRule[])) {
      if (rule.type === 'fuel_consumption') {
        const fuelAlerts = await checkFuelConsumption(supabase, rule);
        notifications.push(...fuelAlerts);
      } else if (rule.type === 'maintenance_prediction') {
        const maintenanceAlerts = await checkMaintenancePrediction(supabase, rule);
        notifications.push(...maintenanceAlerts);
      }
    }

    // Insérer les notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;
      console.log(`Created ${notifications.length} notifications`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsChecked: alertRules?.length || 0,
        notificationsCreated: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkFuelConsumption(supabase: any, rule: AlertRule) {
  const notifications: any[] = [];
  const threshold = rule.condition.threshold || 15; // L/100km par défaut
  const vehicleId = rule.condition.vehicle_id;

  // Calculer la consommation récente (30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let query = supabase
    .from('fuel')
    .select('*, vehicles(make, model, registration)')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  } else {
    query = query.eq('user_id', rule.user_id);
  }

  const { data: fuelRecords, error } = await query;
  if (error) throw error;

  // Grouper par véhicule et calculer la consommation
  const vehicleConsumption = new Map<string, { records: any[], vehicle: any }>();
  
  for (const record of fuelRecords || []) {
    if (!vehicleConsumption.has(record.vehicle_id)) {
      vehicleConsumption.set(record.vehicle_id, { records: [], vehicle: record.vehicles });
    }
    vehicleConsumption.get(record.vehicle_id)!.records.push(record);
  }

  // Analyser chaque véhicule
  for (const [vehicleId, data] of vehicleConsumption) {
    const sortedRecords = data.records.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedRecords.length < 2) continue;

    let totalVolume = 0;
    let totalDistance = 0;

    for (let i = 0; i < sortedRecords.length - 1; i++) {
      const current = sortedRecords[i];
      const previous = sortedRecords[i + 1];
      
      const distance = current.mileage - previous.mileage;
      if (distance > 0) {
        totalVolume += parseFloat(current.volume);
        totalDistance += distance;
      }
    }

    if (totalDistance > 0) {
      const consumption = (totalVolume / totalDistance) * 100;
      
      if (consumption > threshold) {
        const vehicle = data.vehicle;
        notifications.push({
          user_id: rule.user_id,
          type: 'fuel_alert',
          title: 'Surconsommation détectée',
          message: `Le véhicule ${vehicle.make} ${vehicle.model} (${vehicle.registration}) consomme ${consumption.toFixed(2)} L/100km, au-dessus du seuil de ${threshold} L/100km.`,
          entity_type: 'vehicle',
          entity_id: vehicleId,
          read: false
        });
      }
    }
  }

  return notifications;
}

async function checkMaintenancePrediction(supabase: any, rule: AlertRule) {
  const notifications: any[] = [];
  const daysThreshold = rule.condition.days_before || 500; // km avant maintenance par défaut
  const vehicleId = rule.condition.vehicle_id;

  // Récupérer les véhicules
  let vehiclesQuery = supabase
    .from('vehicles')
    .select('*');

  if (vehicleId) {
    vehiclesQuery = vehiclesQuery.eq('id', vehicleId);
  } else {
    vehiclesQuery = vehiclesQuery.eq('user_id', rule.user_id);
  }

  const { data: vehicles, error: vehiclesError } = await vehiclesQuery;
  if (vehiclesError) throw vehiclesError;

  for (const vehicle of vehicles || []) {
    // Récupérer la dernière maintenance
    const { data: lastMaintenance } = await supabase
      .from('maintenance')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'completed')
      .order('completed_date', { ascending: false })
      .limit(1)
      .single();

    const currentMileage = vehicle.mileage || 0;
    const lastMaintenanceMileage = lastMaintenance?.mileage || 0;
    const kmSinceLastMaintenance = currentMileage - lastMaintenanceMileage;

    // Vérifier si maintenance programmée existe
    const { data: scheduledMaintenance } = await supabase
      .from('maintenance')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .single();

    if (!scheduledMaintenance && kmSinceLastMaintenance > daysThreshold) {
      notifications.push({
        user_id: rule.user_id,
        type: 'maintenance_prediction',
        title: 'Maintenance recommandée',
        message: `Le véhicule ${vehicle.make} ${vehicle.model} (${vehicle.registration}) a parcouru ${kmSinceLastMaintenance} km depuis la dernière maintenance. Une révision est recommandée.`,
        entity_type: 'vehicle',
        entity_id: vehicle.id,
        read: false
      });
    }
  }

  return notifications;
}

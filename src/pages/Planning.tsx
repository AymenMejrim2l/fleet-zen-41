import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Car, Users, Wrench, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: "tour" | "maintenance" | "inspection";
  vehicleName?: string;
  driverName?: string;
  status?: string;
}

const Planning = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (date) {
      filterEventsByDate(date);
    }
  }, [date, events]);

  const loadEvents = async () => {
    const allEvents: Event[] = [];

    // Load tours
    const { data: tours } = await supabase
      .from("tours")
      .select(`
        id,
        title,
        start_date,
        status,
        vehicles(make, model),
        drivers(first_name, last_name)
      `)
      .gte("start_date", new Date().toISOString());

    tours?.forEach((tour: any) => {
      allEvents.push({
        id: tour.id,
        title: tour.title,
        date: new Date(tour.start_date),
        type: "tour",
        vehicleName: tour.vehicles ? `${tour.vehicles.make} ${tour.vehicles.model}` : undefined,
        driverName: tour.drivers ? `${tour.drivers.first_name} ${tour.drivers.last_name}` : undefined,
        status: tour.status,
      });
    });

    // Load maintenance
    const { data: maintenance } = await supabase
      .from("maintenance")
      .select(`
        id,
        type,
        scheduled_date,
        status,
        vehicles(make, model)
      `)
      .gte("scheduled_date", new Date().toISOString().split('T')[0]);

    maintenance?.forEach((m: any) => {
      allEvents.push({
        id: m.id,
        title: `Maintenance: ${m.type}`,
        date: new Date(m.scheduled_date),
        type: "maintenance",
        vehicleName: m.vehicles ? `${m.vehicles.make} ${m.vehicles.model}` : undefined,
        status: m.status,
      });
    });

    // Load inspections
    const { data: inspections } = await supabase
      .from("inspections")
      .select(`
        id,
        date,
        status,
        vehicles(make, model),
        drivers(first_name, last_name)
      `)
      .gte("date", new Date().toISOString().split('T')[0]);

    inspections?.forEach((i: any) => {
      allEvents.push({
        id: i.id,
        title: "Inspection véhicule",
        date: new Date(i.date),
        type: "inspection",
        vehicleName: i.vehicles ? `${i.vehicles.make} ${i.vehicles.model}` : undefined,
        driverName: i.drivers ? `${i.drivers.first_name} ${i.drivers.last_name}` : undefined,
        status: i.status,
      });
    });

    setEvents(allEvents);
  };

  const filterEventsByDate = (selectedDate: Date) => {
    const filtered = events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    setSelectedDateEvents(filtered);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "tour":
        return <MapPin className="h-4 w-4" />;
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "inspection":
        return <Car className="h-4 w-4" />;
      default:
        return <CalendarDays className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "tour":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "maintenance":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "inspection":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
      case "done":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "in_progress":
      case "ongoing":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "scheduled":
      case "planned":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const eventDates = events.map(e => e.date);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Planning</h1>
        <p className="text-muted-foreground mt-1">Calendrier des tournées, maintenances et inspections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={fr}
              className="rounded-md border border-white/10"
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  color: '#0088FE',
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Événements du {date ? format(date, "d MMMM yyyy", { locale: fr }) : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun événement prévu ce jour</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getEventIcon(event.type)}</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{event.title}</h3>
                            <Badge className={getEventColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          {event.vehicleName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Car className="h-3 w-3" />
                              {event.vehicleName}
                            </div>
                          )}
                          {event.driverName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {event.driverName}
                            </div>
                          )}
                        </div>
                      </div>
                      {event.status && (
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400" />
              Tournées à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter(e => e.type === "tour").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Prochainement planifiées
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-400" />
              Maintenances prévues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter(e => e.type === "maintenance").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              À programmer
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-400" />
              Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {events.filter(e => e.type === "inspection").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              À effectuer
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Planning;
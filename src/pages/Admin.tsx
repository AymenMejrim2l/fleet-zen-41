import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Settings, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppRole = "admin" | "commercial" | "conducteur" | "direction";
type Resource = "vehicles" | "drivers" | "maintenance" | "fuel" | "documents" | "tours" | "inspections" | "reports";

interface User {
  id: string;
  email: string;
  roles: AppRole[];
}

interface Permission {
  id: string;
  role: AppRole;
  resource: Resource;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("commercial");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "commercial" as AppRole
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadPermissions();
  }, []);

  const loadUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, email");
    
    if (profiles) {
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);
          
          return {
            id: profile.id,
            email: profile.email || "",
            roles: userRoles?.map(r => r.role) || []
          };
        })
      );
      setUsers(usersWithRoles);
    }
  };

  const loadPermissions = async () => {
    const { data } = await supabase.from("permissions").select("*");
    if (data) setPermissions(data as Permission[]);
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un utilisateur et un rôle", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUser,
      role: selectedRole,
      created_by: user?.id
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Rôle assigné avec succès" });
      loadUsers();
      setIsDialogOpen(false);
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Rôle retiré" });
      loadUsers();
    }
  };

  const updatePermission = async (id: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from("permissions")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Permission mise à jour" });
      loadPermissions();
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({ title: "Erreur", description: "Email et mot de passe requis", variant: "destructive" });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      toast({ title: "Succès", description: "Utilisateur créé avec succès" });
      setIsCreateUserDialogOpen(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", role: "commercial" });
      loadUsers();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    const colors = {
      admin: "bg-red-500/20 text-red-300 border-red-500/30",
      commercial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      conducteur: "bg-green-500/20 text-green-300 border-green-500/30",
      direction: "bg-purple-500/20 text-purple-300 border-purple-500/30"
    };
    return colors[role];
  };

  const resourceLabels: Record<Resource, string> = {
    vehicles: "Véhicules",
    drivers: "Conducteurs",
    maintenance: "Maintenance",
    fuel: "Carburant",
    documents: "Documents",
    tours: "Tournées",
    inspections: "Inspections",
    reports: "Rapports"
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground mt-1">Gestion des utilisateurs et permissions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Users className="h-4 w-4" />
                Créer un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  Créer un nouveau compte utilisateur avec email et mot de passe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mot de passe"
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Nom"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="conducteur">Conducteur</SelectItem>
                      <SelectItem value="direction">Direction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createUser} className="w-full">Créer l'utilisateur</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Assigner un rôle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un rôle</DialogTitle>
                <DialogDescription>
                  Sélectionner un utilisateur et assigner un rôle
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Utilisateur</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Rôle</label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="conducteur">Conducteur</SelectItem>
                      <SelectItem value="direction">Direction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={assignRole} className="w-full">Assigner</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Utilisateurs et Rôles
          </CardTitle>
          <CardDescription>Gérer les rôles des utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {user.roles.map((role) => (
                        <Badge key={role} className={getRoleBadgeColor(role)}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.roles.map((role) => (
                        <Button
                          key={role}
                          variant="destructive"
                          size="sm"
                          onClick={() => removeRole(user.id, role)}
                        >
                          Retirer {role}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissions par Rôle
          </CardTitle>
          <CardDescription>Configurer les permissions pour chaque rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rôle</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Voir</TableHead>
                <TableHead>Ajouter</TableHead>
                <TableHead>Modifier</TableHead>
                <TableHead>Supprimer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(perm.role)}>{perm.role}</Badge>
                  </TableCell>
                  <TableCell>{resourceLabels[perm.resource]}</TableCell>
                  <TableCell>
                    <Switch
                      checked={perm.can_view}
                      onCheckedChange={(v) => updatePermission(perm.id, "can_view", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={perm.can_create}
                      onCheckedChange={(v) => updatePermission(perm.id, "can_create", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={perm.can_update}
                      onCheckedChange={(v) => updatePermission(perm.id, "can_update", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={perm.can_delete}
                      onCheckedChange={(v) => updatePermission(perm.id, "can_delete", v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;

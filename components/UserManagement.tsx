import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  grantExtendedAccess,
  revokeExtendedAccess,
} from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { UserPlus, Trash2, Clock, Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface UserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  open,
  onOpenChange,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'user' | 'admin',
  });

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error('Kérjük, töltse ki az összes mezőt!');
      return;
    }

    if (!currentUser) {
      toast.error('Bejelentkezés szükséges!');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email === newUser.email)) {
      toast.error('Ez az e-mail cím már foglalt!');
      return;
    }

    createUser(newUser, currentUser.id);
    toast.success('Felhasználó sikeresen létrehozva!');
    loadUsers();
    setShowAddUser(false);
    setNewUser({ email: '', name: '', password: '', role: 'user' });
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteConfirm(userId);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      // Prevent deleting yourself
      if (deleteConfirm === currentUser?.id) {
        toast.error('Nem törölheti saját magát!');
        setDeleteConfirm(null);
        return;
      }

      deleteUser(deleteConfirm);
      toast.success('Felhasználó törölve!');
      loadUsers();
      setDeleteConfirm(null);
    }
  };

  const handleGrantExtendedAccess = (userId: string) => {
    const result = grantExtendedAccess(userId);
    if (result) {
      toast.success('Bővített hozzáférés megadva!');
      loadUsers();
    } else {
      toast.error('Hiba történt!');
    }
  };

  const handleRevokeExtendedAccess = (userId: string) => {
    const result = revokeExtendedAccess(userId);
    if (result) {
      toast.success('Bővített hozzáférés visszavonva!');
      loadUsers();
    } else {
      toast.error('Hiba történt!');
    }
  };

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    // Prevent changing your own role
    if (userId === currentUser?.id) {
      toast.error('Nem módosíthatja saját jogosultságát!');
      return;
    }

    updateUser(userId, { role: newRole });
    toast.success('Jogosultság módosítva!');
    loadUsers();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] sm:max-w-4xl p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Felhasználók kezelése
            </DialogTitle>
            <DialogDescription>
              Felhasználók hozzáadása, törlése és jogosultságok kezelése.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-end mb-4 flex-shrink-0">
              <Button onClick={() => setShowAddUser(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Új felhasználó
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Név</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Jogosultság</TableHead>
                    <TableHead>Bővített hozzáférés</TableHead>
                    <TableHead className="text-right">Műveletek</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="ml-2">Ön</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: 'user' | 'admin') => handleRoleChange(user.id, value)}
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Felhasználó</SelectItem>
                            <SelectItem value="admin">Adminisztrátor</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge className="bg-primary text-primary-foreground">Teljes</Badge>
                        ) : user.hasExtendedAccess ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-success text-success-foreground">
                              Aktív (366 nap)
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRevokeExtendedAccess(user.id)}
                              className="h-6 w-6"
                              title="Visszavonás"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGrantExtendedAccess(user.id)}
                            className="gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            366 nap
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Új felhasználó hozzáadása</DialogTitle>
            <DialogDescription>
              Adja meg az új felhasználó adatait.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Név *</Label>
              <Input
                id="new-name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Teljes név"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail *</Label>
              <Input
                id="new-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="pelda@email.hu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Jelszó *</Label>
              <Input
                id="new-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Jelszó"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Jogosultság</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: 'user' | 'admin') => setNewUser(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Felhasználó</SelectItem>
                  <SelectItem value="admin">Adminisztrátor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                Mégse
              </Button>
              <Button type="submit">Létrehozás</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="p-6">
          <AlertDialogHeader className="pb-2">
            <AlertDialogTitle>Biztosan törli ezt a felhasználót?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

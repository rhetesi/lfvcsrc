import React, { useState, useEffect } from 'react';
import { Location } from '@/types';
import { getLocations, saveLocation, deleteLocation, updateLocation } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
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

import { Plus, Trash2, Edit2, Check, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface LocationManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LocationManagement: React.FC<LocationManagementProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadLocations = () => {
    setLocations(getLocations());
  };

  useEffect(() => {
    if (open) {
      loadLocations();
    }
  }, [open]);

  const handleAdd = () => {
    if (!newLocationName.trim()) {
      toast.error('Adja meg a helyszín nevét!');
      return;
    }

    if (!user) {
      toast.error('Bejelentkezés szükséges!');
      return;
    }

    // Check for duplicates
    if (locations.some(l => l.name.toLowerCase() === newLocationName.toLowerCase().trim())) {
      toast.error('Ez a helyszín már létezik!');
      return;
    }

    saveLocation(newLocationName.trim(), user.id);
    setNewLocationName('');
    loadLocations();
    toast.success('Helyszín hozzáadva!');
  };

  const handleDelete = (id: string) => {
    deleteLocation(id);
    loadLocations();
    toast.success('Helyszín törölve!');
  };

  const startEdit = (location: Location) => {
    setEditingId(location.id);
    setEditingName(location.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = () => {
    if (!editingName.trim()) {
      toast.error('Adja meg a helyszín nevét!');
      return;
    }

    if (editingId) {
      updateLocation(editingId, editingName.trim());
      loadLocations();
      toast.success('Helyszín módosítva!');
    }
    cancelEdit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Helyszínek kezelése
          </DialogTitle>
          <DialogDescription>
            Adja hozzá vagy módosítsa a találási helyszíneket.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          {/* Add new location */}
          <div className="flex gap-2 flex-shrink-0 mb-4">
            <div className="flex-1">
              <Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Új helyszín neve..."
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Hozzáadás
            </Button>
          </div>

          {/* Location list */}
          <div className="rounded-md border flex-1 overflow-y-auto max-h-[300px]">
            {locations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nincs még helyszín rögzítve.
                </div>
              ) : (
                <div className="divide-y">
                  {locations.map(location => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between gap-2 p-3"
                    >
                      {editingId === location.id ? (
                        <>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={saveEdit}>
                              <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{location.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(location)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(location.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

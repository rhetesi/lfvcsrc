import React from 'react';
import { SearchFilters as SearchFiltersType, User } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers } from '@/lib/storage';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClear: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  const { isAdmin } = useAuth();
  const users = isAdmin ? getUsers() : [];

  const handleChange = (field: keyof SearchFiltersType, value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined });
  };

  const hasFilters = Object.values(filters).some(v => v);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Keresés és szűrés</h3>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
              <X className="h-4 w-4" />
              Szűrők törlése
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">Helyszín</Label>
            <Input
              id="location"
              placeholder="pl. Főépület"
              value={filters.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-foreground">Dátumtól</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-foreground">Dátumig</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-foreground">Megnevezés</Label>
            <Input
              id="itemName"
              placeholder="pl. Kulcs"
              value={filters.itemName || ''}
              onChange={(e) => handleChange('itemName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Leírás/tulajdonság</Label>
            <Input
              id="description"
              placeholder="pl. fekete, bőr"
              value={filters.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Admin-only: Filter by user who registered the item */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="createdByUserId" className="text-foreground">Rögzítő</Label>
              <Select
                value={filters.createdByUserId || '__all__'}
                onValueChange={(value) => handleChange('createdByUserId', value === '__all__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mind" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="max-h-48">
                    <SelectItem value="__all__">Mind</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

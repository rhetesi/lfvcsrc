import React, { useState, useEffect, useMemo } from 'react';
import { HandedOverItem } from '@/types';
import { getHandedOverItems } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ItemDetailsDialog } from './ItemDetailsDialog';
import { Package, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface HandedOverItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HandedOverItemsDialog: React.FC<HandedOverItemsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [items, setItems] = useState<HandedOverItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsItem, setDetailsItem] = useState<HandedOverItem | null>(null);

  useEffect(() => {
    if (open) {
      // Load handed over items when dialog opens
      setItems(getHandedOverItems());
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.itemName.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.recipientName.toLowerCase().includes(query) ||
      item.foundLocation.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Sort by handover date, newest first
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => new Date(b.handedOverAt).getTime() - new Date(a.handedOverAt).getTime()
    );
  }, [filteredItems]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Kiadott tárgyak ({items.length} db)
            </DialogTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Keresés név, azonosító, átvevő, helyszín alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
              {sortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Nincs találat a keresési feltételeknek megfelelően.' : 'Még nincs kiadott tárgy.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Kiadva
                          </Badge>
                        </div>
                        <h4 className="font-semibold truncate mt-1">{item.itemName}</h4>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>Átvevő: {item.recipientName}</span>
                          <span className="mx-2">•</span>
                          <span>{format(new Date(item.handedOverAt), 'yyyy. MM. dd. HH:mm', { locale: hu })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailsItem(item)}
                        className="gap-1 flex-shrink-0"
                      >
                        <Eye className="h-3 w-3" />
                        Részletek
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      <ItemDetailsDialog
        open={!!detailsItem}
        onOpenChange={(open) => !open && setDetailsItem(null)}
        item={detailsItem}
      />
    </>
  );
};

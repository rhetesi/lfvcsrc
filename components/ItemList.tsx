import React, { useState, useEffect, useMemo } from 'react';
import { FoundItem, SearchFilters as SearchFiltersType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  getFoundItems,
  getItemsLast90Days,
  getItemsLast366Days,
  updateItemStatus,
  deleteItem,
  hasExtendedAccess,
  getStoredItems,
  restoreFromStorage,
  getDaysSinceFound,
} from '@/lib/storage';
import { ItemCard } from './ItemCard';
import { ItemListView } from './ItemListView';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { SearchFilters } from './SearchFilters';
import { HandoverDialog } from './HandoverDialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Warehouse, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
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

interface ItemListProps {
  onAddClick: () => void;
  refreshTrigger: number;
}

export const ItemList: React.FC<ItemListProps> = ({ onAddClick, refreshTrigger }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [storedItems, setStoredItems] = useState<FoundItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [handoverItem, setHandoverItem] = useState<FoundItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<FoundItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const userHasExtendedAccess = hasExtendedAccess(user);

  // Calculate counts for admin
  const itemCounts = useMemo(() => {
    const activeItems = items.filter(item => item.status === 'active');
    const storableItems = activeItems.filter(item => getDaysSinceFound(item.foundDate) >= 100);
    return {
      active: activeItems.length,
      storable: storableItems.length,
      stored: storedItems.length,
      total: activeItems.length + storedItems.length,
    };
  }, [items, storedItems]);

  const loadItems = () => {
    const allItems = getFoundItems();
    setItems(allItems);
    setStoredItems(getStoredItems());
  };

  useEffect(() => {
    loadItems();
  }, [refreshTrigger]);

  const displayedItems = useMemo(() => {
    let result = items.filter(item => item.status === 'active');

    // Apply visibility filter based on user role and permissions
    if (isAdmin && showAll) {
      // Admin can see all items
      result = items.filter(item => item.status === 'active');
    } else if (userHasExtendedAccess && showAll) {
      // User with extended access can see 366 days
      result = getItemsLast366Days(items);
    } else {
      // Default: 90 days
      result = getItemsLast90Days(items);
    }

    // Apply search filters
    if (filters.location) {
      result = result.filter(item =>
        item.foundLocation.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      result = result.filter(item => item.foundDate >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      result = result.filter(item => item.foundDate <= filters.dateTo!);
    }

    if (filters.itemName) {
      result = result.filter(item =>
        item.itemName.toLowerCase().includes(filters.itemName!.toLowerCase())
      );
    }

    if (filters.description) {
      const searchTerms = filters.description.toLowerCase().split(' ');
      result = result.filter(item => {
        const searchableText = [
          item.description,
          item.material,
          item.color,
          item.shape,
          item.size,
          item.brand,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Filter by user who registered the item (admin only)
    if (filters.createdByUserId) {
      result = result.filter(item => item.createdByUserId === filters.createdByUserId);
    }

    // Sort by found date, newest first
    return result.sort(
      (a, b) => new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime()
    );
  }, [items, isAdmin, showAll, filters, userHasExtendedAccess]);

  const displayedStoredItems = useMemo(() => {
    let result = storedItems;

    // Apply search filters to stored items as well
    if (filters.location) {
      result = result.filter(item =>
        item.foundLocation.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.itemName) {
      result = result.filter(item =>
        item.itemName.toLowerCase().includes(filters.itemName!.toLowerCase())
      );
    }

    return result.sort(
      (a, b) => new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime()
    );
  }, [storedItems, filters]);

  const handleStore = (id: string) => {
    updateItemStatus(id, 'stored');
    loadItems();
    toast.success('Tárgy raktárba helyezve!');
  };

  const handleRestore = (id: string) => {
    const result = restoreFromStorage(id);
    if (result) {
      loadItems();
      toast.success('Tárgy visszavételezve a raktárból!');
    } else {
      toast.error('Visszavételezés sikertelen!');
    }
  };

  const handleSell = (id: string) => {
    updateItemStatus(id, 'sold');
    loadItems();
    toast.success('Tárgy értékesítettnek jelölve!');
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteItem(deleteConfirm);
      loadItems();
      toast.success('Tárgy törölve a nyilvántartásból!');
      setDeleteConfirm(null);
    }
  };

  const handleHandover = (item: FoundItem) => {
    setHandoverItem(item);
  };

  const handleHandoverComplete = () => {
    loadItems();
    setHandoverItem(null);
  };

  const handleViewDetails = (item: FoundItem) => {
    setDetailsItem(item);
  };

  const renderViewToggle = () => (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        size="icon"
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        onClick={() => setViewMode('grid')}
        className="h-8 w-8"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        onClick={() => setViewMode('list')}
        className="h-8 w-8"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderAdminStats = () => (
    <div className="flex flex-wrap gap-2 text-sm">
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
        Aktív: {itemCounts.active} db
      </Badge>
      <Badge variant="outline" className="bg-storable/15 text-storable-foreground border-storable/40">
        Raktározható: {itemCounts.storable} db
      </Badge>
      <Badge variant="outline" className="bg-secondary text-secondary-foreground border-secondary">
        Raktárban: {itemCounts.stored} db
      </Badge>
      <Badge className="bg-primary text-primary-foreground">
        Összes: {itemCounts.total} db
      </Badge>
    </div>
  );

  const renderItemGrid = (itemsList: FoundItem[], isStoredView: boolean = false) => (
    itemsList.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted py-16">
        <Package className="mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Nincs találat</h3>
        <p className="text-muted-foreground">
          {Object.values(filters).some(v => v)
            ? 'Próbáljon más keresési feltételeket!'
            : isStoredView ? 'Nincs raktárban tárgy.' : 'Még nincs rögzített tárgy.'}
        </p>
      </div>
    ) : viewMode === 'list' && isAdmin ? (
      <ItemListView
        items={itemsList}
        onStore={handleStore}
        onSell={handleSell}
        onDelete={handleDelete}
        onHandover={handleHandover}
        onRestore={isStoredView ? handleRestore : undefined}
        onViewDetails={handleViewDetails}
        isStoredView={isStoredView}
      />
    ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {itemsList.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onStore={handleStore}
            onSell={handleSell}
            onDelete={handleDelete}
            onHandover={handleHandover}
            onRestore={isStoredView ? handleRestore : undefined}
            onViewDetails={handleViewDetails}
            isStoredView={isStoredView}
          />
        ))}
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClear={() => setFilters({})}
      />

      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 mb-4">
            {/* Stats row for admin */}
            {renderAdminStats()}
            
            {/* Controls row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <TabsList>
                  <TabsTrigger value="active" className="gap-2">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Aktív</span> ({displayedItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="stored" className="gap-2">
                    <Warehouse className="h-4 w-4" />
                    <span className="hidden sm:inline">Raktár</span> ({displayedStoredItems.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {renderViewToggle()}
                
                {activeTab === 'active' && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-all"
                      checked={showAll}
                      onCheckedChange={setShowAll}
                    />
                    <Label htmlFor="show-all" className="text-sm text-muted-foreground whitespace-nowrap">
                      Összes megjelenítése
                    </Label>
                  </div>
                )}
                {isAuthenticated && (
                  <Button onClick={onAddClick} className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Új tárgy rögzítése</span>
                    <span className="sm:hidden">Új</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <TabsContent value="active" className="mt-0">
            {renderItemGrid(displayedItems)}
          </TabsContent>

          <TabsContent value="stored" className="mt-0">
            {renderItemGrid(displayedStoredItems, true)}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-semibold text-foreground">
                Talált tárgyak ({displayedItems.length})
              </h2>
              {userHasExtendedAccess && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-all"
                    checked={showAll}
                    onCheckedChange={setShowAll}
                  />
                  <Label htmlFor="show-all" className="text-sm text-muted-foreground whitespace-nowrap">
                    Bővített lista (366 nap)
                  </Label>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <Button onClick={onAddClick} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Új tárgy rögzítése</span>
                <span className="sm:hidden">Új</span>
              </Button>
            )}
          </div>

          {renderItemGrid(displayedItems)}
        </>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törli ezt a tárgyat?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem vonható vissza. A tárgy véglegesen törlődik a nyilvántartásból.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HandoverDialog
        open={!!handoverItem}
        onOpenChange={(open) => !open && setHandoverItem(null)}
        item={handoverItem}
        onHandoverComplete={handleHandoverComplete}
      />

      <ItemDetailsDialog
        open={!!detailsItem}
        onOpenChange={(open) => !open && setDetailsItem(null)}
        item={detailsItem}
      />
    </div>
  );
};

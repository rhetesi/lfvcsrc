import React, { useState, useMemo } from 'react';
import { FoundItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getDaysSinceFound } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Package, Warehouse, ShoppingCart, Trash2, HandHeart, Eye, Undo2, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface ItemListViewProps {
  items: FoundItem[];
  onStore?: (id: string) => void;
  onSell?: (id: string) => void;
  onDelete?: (id: string) => void;
  onHandover?: (item: FoundItem) => void;
  onRestore?: (id: string) => void;
  onViewDetails?: (item: FoundItem) => void;
  isStoredView?: boolean;
}

type SortField = 'id' | 'itemName' | 'foundDate' | 'foundLocation';
type SortDirection = 'asc' | 'desc';

export const ItemListView: React.FC<ItemListViewProps> = ({
  items,
  onStore,
  onSell,
  onDelete,
  onHandover,
  onRestore,
  onViewDetails,
  isStoredView = false,
}) => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [sortField, setSortField] = useState<SortField>('foundDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'itemName':
          comparison = a.itemName.localeCompare(b.itemName, 'hu');
          break;
        case 'foundDate':
          comparison = new Date(a.foundDate).getTime() - new Date(b.foundDate).getTime();
          break;
        case 'foundLocation':
          comparison = a.foundLocation.localeCompare(b.foundLocation, 'hu');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getStatusBadge = (status: FoundItem['status']) => {
    switch (status) {
      case 'stored':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Raktárban</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Értékesítve</Badge>;
      case 'handed_over':
        return <Badge variant="secondary" className="bg-primary text-primary-foreground">Kiadva</Badge>;
      default:
        return <Badge className="bg-primary text-primary-foreground">Aktív</Badge>;
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted py-16">
        <Package className="mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Nincs találat</h3>
        <p className="text-muted-foreground">
          {isStoredView ? 'Nincs raktárban tárgy.' : 'Még nincs rögzített tárgy.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-16">Kép</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('id')}
              >
                Azonosító <SortIcon field="id" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('itemName')}
              >
                Megnevezés <SortIcon field="itemName" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('foundDate')}
              >
                Találás ideje <SortIcon field="foundDate" />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('foundLocation')}
              >
                Helyszín <SortIcon field="foundLocation" />
              </TableHead>
              <TableHead>Státusz</TableHead>
              <TableHead className="text-right">Műveletek</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map(item => {
              const daysSinceFound = getDaysSinceFound(item.foundDate);
              const canStore = daysSinceFound >= 100 && item.status === 'active';
              const canSell = daysSinceFound >= 366 && (item.status === 'active' || item.status === 'stored');
              const canHandover = isStoredView ? isAdmin : isAuthenticated && item.status === 'active';
              const canRestore = isAdmin && item.status === 'stored';

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {item.itemName}
                    {item.brand && (
                      <span className="text-muted-foreground ml-1">({item.brand})</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(item.foundDate), 'yyyy. MM. dd.', { locale: hu })}
                    <span className="text-xs text-muted-foreground ml-1">({daysSinceFound} napja)</span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.foundLocation}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex justify-end gap-1 flex-wrap">
                        {onViewDetails && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onViewDetails(item)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Részletek</TooltipContent>
                          </Tooltip>
                        )}
                        
                        {canHandover && onHandover && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="default"
                                onClick={() => onHandover(item)}
                                className="h-8 w-8"
                              >
                                <HandHeart className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Kiadás</TooltipContent>
                          </Tooltip>
                        )}

                        {isAdmin && (
                          <>
                            {canRestore && onRestore && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onRestore(item.id)}
                                    className="h-8 w-8"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Visszavételezés</TooltipContent>
                              </Tooltip>
                            )}
                            
                            {canStore && onStore && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onStore(item.id)}
                                    className="h-8 w-8"
                                  >
                                    <Warehouse className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Raktárba</TooltipContent>
                              </Tooltip>
                            )}
                            
                            {canSell && onSell && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => onSell(item.id)}
                                    className="h-8 w-8"
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Értékesítés</TooltipContent>
                              </Tooltip>
                            )}
                            
                            {onDelete && !isStoredView && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => onDelete(item.id)}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Törlés</TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

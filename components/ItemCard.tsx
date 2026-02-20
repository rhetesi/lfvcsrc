import React from 'react';
import { FoundItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getDaysSinceFound } from '@/lib/storage';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Warehouse, ShoppingCart, Trash2, HandHeart, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface ItemCardProps {
  item: FoundItem;
  onStore?: (id: string) => void;
  onSell?: (id: string) => void;
  onDelete?: (id: string) => void;
  onHandover?: (item: FoundItem) => void;
  onRestore?: (id: string) => void;
  onViewDetails?: (item: FoundItem) => void;
  isStoredView?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onStore, 
  onSell, 
  onDelete, 
  onHandover,
  onRestore,
  onViewDetails,
  isStoredView = false 
}) => {
  const { isAdmin, isAuthenticated } = useAuth();
  const daysSinceFound = getDaysSinceFound(item.foundDate);

  const canStore = daysSinceFound >= 100 && item.status === 'active';
  const canSell = daysSinceFound >= 366 && (item.status === 'active' || item.status === 'stored');
  const canRestore = isAdmin && item.status === 'stored';
  const canHandover = isStoredView 
    ? isAdmin 
    : isAuthenticated && item.status === 'active';

  const getStatusBadge = () => {
    switch (item.status) {
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

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(item);
    }
  };

  // Property badges
  const propertyBadges = [item.material, item.color, item.size, item.shape, item.brand].filter(Boolean);

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-xl shadow-md hover:-translate-y-1 flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-40 bg-muted flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.itemName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          {getStatusBadge()}
        </div>
      </div>

      <CardContent className="p-4 flex-grow space-y-2">
        {/* ID */}
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block">
          {item.id}
        </span>
        
        {/* Item name */}
        <h3 className="text-lg font-semibold text-foreground line-clamp-1" title={item.itemName}>
          {item.itemName}
        </h3>
        
        {/* Found date */}
        <p className="text-sm text-muted-foreground">
          {format(new Date(item.foundDate), 'yyyy. MMMM d.', { locale: hu })}
        </p>

        {/* Property badges */}
        {propertyBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {propertyBadges.slice(0, 3).map((prop, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {prop}
              </Badge>
            ))}
            {propertyBadges.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{propertyBadges.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter 
        className="flex flex-wrap gap-2 border-t bg-muted/50 p-3 mt-auto flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handover button */}
        {canHandover && onHandover && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onHandover(item)}
            className="gap-1"
          >
            <HandHeart className="h-3 w-3" />
            Kiadás
          </Button>
        )}

        {/* Admin-only buttons */}
        {isAdmin && (
          <>
            {canRestore && onRestore && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore(item.id)}
                className="gap-1"
              >
                <Undo2 className="h-3 w-3" />
                Visszavétel
              </Button>
            )}
            {canStore && onStore && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStore(item.id)}
                className="gap-1"
              >
                <Warehouse className="h-3 w-3" />
                Raktárba
              </Button>
            )}
            {canSell && onSell && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSell(item.id)}
                className="gap-1"
              >
                <ShoppingCart className="h-3 w-3" />
                Értékesítés
              </Button>
            )}
            {onDelete && !isStoredView && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(item.id)}
                className="ml-auto gap-1"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

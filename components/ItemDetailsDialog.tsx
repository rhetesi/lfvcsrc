import React, { useState } from 'react';
import { FoundItem, HandedOverItem } from '@/types';
import { getDaysSinceFound, getUsers } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Calendar, User, Phone, Tag, Package, FileText, Clock, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoundItem | HandedOverItem | null;
}

export const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({
  open,
  onOpenChange,
  item,
}) => {
  const { isAdmin } = useAuth();
  const [showFullImage, setShowFullImage] = useState(false);
  
  if (!item) return null;

  const daysSinceFound = getDaysSinceFound(item.foundDate);
  const users = getUsers();
  const createdByUser = users.find(u => u.id === item.createdByUserId);
  
  // Check if this is a handed over item
  const isHandedOver = item.status === 'handed_over';
  const handedOverItem = isHandedOver ? (item as HandedOverItem) : null;
  const handedOverByUser = handedOverItem ? users.find(u => u.id === handedOverItem.handedOverByUserId) : null;

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <div className="flex items-start justify-between gap-4 pr-8">
              <DialogTitle className="text-xl">{item.itemName}</DialogTitle>
              {getStatusBadge()}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {item.id}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
              {/* Two column layout: Image on left, details on right */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Image */}
                <div className="md:w-1/2 flex-shrink-0">
                  <div 
                    className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => item.imageUrl && setShowFullImage(true)}
                  >
                    {item.imageUrl ? (
                      <>
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Details */}
                <div className="md:w-1/2 space-y-5">
                  {/* Brand */}
                  {item.brand && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">Márka:</span>
                      <span>{item.brand}</span>
                    </div>
                  )}

                  {/* Description */}
                  {item.description && (
                    <div>
                      <h4 className="font-semibold mb-2 text-foreground">Leírás</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  )}

                  {/* Properties */}
                  {(item.material || item.color || item.size || item.shape) && (
                    <div>
                      <h4 className="font-semibold mb-2 text-foreground">Tulajdonságok</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.material && <Badge variant="outline">{item.material}</Badge>}
                        {item.color && <Badge variant="outline">{item.color}</Badge>}
                        {item.size && <Badge variant="outline">{item.size}</Badge>}
                        {item.shape && <Badge variant="outline">{item.shape}</Badge>}
                      </div>
                    </div>
                  )}

                  {/* Finding details */}
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-2 text-foreground">Találás adatai</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{item.foundLocation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{format(new Date(item.foundDate), 'yyyy. MMMM d.', { locale: hu })}</span>
                      <span className="text-xs text-muted-foreground">({daysSinceFound} napja)</span>
                    </div>
                  </div>

                  {/* Finder details */}
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-2 text-foreground">Találó adatai</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{item.finderName}</span>
                    </div>
                    {item.finderContact && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{item.finderContact}</span>
                      </div>
                    )}
                  </div>

                  {/* Registration info - only for admin */}
                  {isAdmin && createdByUser && (
                    <div className="space-y-2">
                      <h4 className="font-semibold mb-2 text-foreground">Rögzítés</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Rögzítette: <span className="font-medium">{createdByUser.name}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{format(new Date(item.createdAt), 'yyyy. MMMM d. HH:mm', { locale: hu })}</span>
                      </div>
                    </div>
                  )}

                  {/* Handover details (if handed over) */}
                  {handedOverItem && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-semibold mb-2 text-primary">Kiadás adatai</h4>
                      <div className="grid gap-2 text-sm">
                        <div><span className="font-medium">Átvevő neve:</span> {handedOverItem.recipientName}</div>
                        <div><span className="font-medium">Átvevő lakcíme:</span> {handedOverItem.recipientAddress}</div>
                        {handedOverItem.recipientEmail && (
                          <div><span className="font-medium">E-mail:</span> {handedOverItem.recipientEmail}</div>
                        )}
                        {handedOverItem.recipientPhone && (
                          <div><span className="font-medium">Telefon:</span> {handedOverItem.recipientPhone}</div>
                        )}
                        {handedOverItem.recipientIdDocType && (
                          <div><span className="font-medium">Okmány típusa:</span> {handedOverItem.recipientIdDocType}</div>
                        )}
                        {handedOverItem.recipientIdDocNumber && (
                          <div><span className="font-medium">Okmány azonosító:</span> {handedOverItem.recipientIdDocNumber}</div>
                        )}
                        <div><span className="font-medium">Kiadás időpontja:</span> {format(new Date(handedOverItem.handedOverAt), 'yyyy. MMMM d. HH:mm', { locale: hu })}</div>
                        {handedOverByUser && (
                          <div><span className="font-medium">Kiadta:</span> {handedOverByUser.name}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full image modal */}
      {showFullImage && item.imageUrl && (
        <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
          <DialogContent className="max-w-4xl max-h-[95vh] p-6">
            <img
              src={item.imageUrl}
              alt={item.itemName}
              className="w-full h-full object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

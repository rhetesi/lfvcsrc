import React, { useState, useRef } from 'react';
import { saveFoundItem } from '@/lib/storage';
import { generateRegistrationSheetPDF } from '@/lib/pdfGenerator';
import { resizeAndConvertToJpg } from '@/lib/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { LocationAutocomplete } from './LocationAutocomplete';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
}

export const AddItemDialog: React.FC<AddItemDialogProps> = ({
  open,
  onOpenChange,
  onItemAdded,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    foundDate: new Date().toISOString().split('T')[0],
    foundLocation: '',
    finderName: '',
    finderContact: '',
    itemName: '',
    description: '',
    brand: '',
    material: '',
    shape: '',
    color: '',
    size: '',
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [generatePdf, setGeneratePdf] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, foundLocation: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingImage(true);
        // Convert to JPG format
        const jpgDataUrl = await resizeAndConvertToJpg(file);
        setImageUrl(jpgDataUrl);
        toast.success('Kép sikeresen feldolgozva (JPG formátum)');
      } catch (error) {
        console.error('Image processing failed:', error);
        toast.error('Kép feldolgozása sikertelen');
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.foundLocation.trim()) {
      toast.error('A találás helye kötelező!');
      return false;
    }
    if (!formData.finderName.trim()) {
      toast.error('A találó neve kötelező!');
      return false;
    }
    if (!formData.itemName.trim()) {
      toast.error('A tárgy megnevezése kötelező!');
      return false;
    }
    if (!formData.foundDate) {
      toast.error('A találás dátuma kötelező!');
      return false;
    }
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.foundDate)) {
      toast.error('Érvénytelen dátum formátum!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error('Bejelentkezés szükséges!');
      return;
    }

    const newItem = saveFoundItem({
      ...formData,
      imageUrl: imageUrl || undefined,
    }, user.id);

    toast.success('Tárgy sikeresen rögzítve!');

    // Generate PDF if requested
    if (generatePdf) {
      try {
        await generateRegistrationSheetPDF(newItem);
        toast.success('Nyilvántartó lap elkészült!');
      } catch (error) {
        console.error('PDF generation failed:', error);
        toast.error('Nyilvántartó lap generálása sikertelen');
      }
    }

    onItemAdded();
    onOpenChange(false);

    // Reset form
    setFormData({
      foundDate: new Date().toISOString().split('T')[0],
      foundLocation: '',
      finderName: '',
      finderContact: '',
      itemName: '',
      description: '',
      brand: '',
      material: '',
      shape: '',
      color: '',
      size: '',
    });
    setImageUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="flex-shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle>Új talált tárgy rögzítése</DialogTitle>
          <DialogDescription>
            Adja meg a talált tárgy adatait az alábbi űrlapon. A *-gal jelölt mezők kitöltése kötelező.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Finder Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Találó adatai</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="finderName">Találó neve *</Label>
                    <Input
                      id="finderName"
                      name="finderName"
                      value={formData.finderName}
                      onChange={handleChange}
                      placeholder="Kovács János"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finderContact">Elérhetőség</Label>
                    <Input
                      id="finderContact"
                      name="finderContact"
                      value={formData.finderContact}
                      onChange={handleChange}
                      placeholder="+36 30 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Finding Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Találás körülményei</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="foundDate">Találás dátuma *</Label>
                    <Input
                      id="foundDate"
                      name="foundDate"
                      type="date"
                      value={formData.foundDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foundLocation">Találás helye *</Label>
                    <LocationAutocomplete
                      value={formData.foundLocation}
                      onChange={handleLocationChange}
                      placeholder="Válasszon vagy gépeljen..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Item Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Tárgy adatai</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Tárgy megnevezése * (max. 50 karakter)</Label>
                    <Input
                      id="itemName"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleChange}
                      placeholder="Kulcscsomó"
                      maxLength={50}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.itemName.length}/50
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Márka</Label>
                    <Input
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Adidas, Nike, stb."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Részletes leírás</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="A tárgy részletes leírása..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Anyag</Label>
                    <Input
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      placeholder="Fém, bőr..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shape">Forma</Label>
                    <Input
                      id="shape"
                      name="shape"
                      value={formData.shape}
                      onChange={handleChange}
                      placeholder="Kerek, négyzet..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Szín</Label>
                    <Input
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="Fekete, piros..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Méret</Label>
                    <Input
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      placeholder="10x5 cm"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Fénykép</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {isProcessingImage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Kép feldolgozása...</span>
                  </div>
                ) : imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-40 w-auto rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={() => setImageUrl('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Fénykép készítése
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFileUpload}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Feltöltés
                    </Button>
                  </div>
                )}
              </div>

              {/* PDF Generation Option */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generatePdf"
                  checked={generatePdf}
                  onChange={(e) => setGeneratePdf(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="generatePdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Nyilvántartó lap készítése (PDF)
                </Label>
              </div>
            </form>
          </div>

        <div className="flex-shrink-0 border-t bg-background px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" onClick={handleSubmit}>Rögzítés</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

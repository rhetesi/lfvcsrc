import React, { useState, useRef, useEffect } from 'react';
import { FoundItem, User } from '@/types';
import { handOverItem, handOverStoredItem, getFoundItemById, verifyUserCredentials, getUsers } from '@/lib/storage';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QrCode, CheckCircle, AlertCircle, Lock, Keyboard, Package } from 'lucide-react';
import { toast } from 'sonner';

interface HandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoundItem | null;
  onHandoverComplete: () => void;
}

type Step = 'auth' | 'scan' | 'form';

export const HandoverDialog: React.FC<HandoverDialogProps> = ({
  open,
  onOpenChange,
  item,
  onHandoverComplete,
}) => {
  const { user, loginUser, isAdmin } = useAuth();
  const [step, setStep] = useState<Step>('auth');
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [handoverUserId, setHandoverUserId] = useState<string | null>(null);
  const [scannedId, setScannedId] = useState('');
  const [isScanned, setIsScanned] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientAddress: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientIdDocType: '',
    recipientIdDocNumber: '',
  });
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('auth');
      setAuthData({ email: '', password: '' });
      setIsAuthenticated(false);
      setHandoverUserId(null);
      setScannedId('');
      setIsScanned(false);
      setManualEntry(false);
      setFormData({
        recipientName: '',
        recipientAddress: '',
        recipientEmail: '',
        recipientPhone: '',
        recipientIdDocType: '',
        recipientIdDocNumber: '',
      });
    }
  }, [open]);

  // Focus scan input when moving to scan step
  useEffect(() => {
    if (step === 'scan') {
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify credentials against any valid user (not just current user)
    const users = getUsers();
    const matchedUser = users.find(u => u.email.toLowerCase() === authData.email.toLowerCase());
    
    if (!matchedUser) {
      toast.error('Hibás e-mail cím vagy jelszó!');
      return;
    }

    const verified = verifyUserCredentials(authData.email, authData.password, matchedUser.id);
    if (verified) {
      setIsAuthenticated(true);
      setHandoverUserId(matchedUser.id);
      
      // If different user, switch context
      if (user?.id !== matchedUser.id) {
        loginUser(authData.email, authData.password);
        toast.success(`Felhasználóváltás: ${matchedUser.name}`);
      } else {
        toast.success('Azonosítás sikeres!');
      }
      
      setStep('scan');
    } else {
      toast.error('Hibás e-mail cím vagy jelszó!');
    }
  };

  const handleScanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setScannedId(value);
    
    // Auto-verify when 16 characters are entered
    if (value.length === 16) {
      verifyScannedId(value);
    }
  };

  const verifyScannedId = (value: string) => {
    if (item && value === item.id) {
      setIsScanned(true);
      setStep('form');
      toast.success('Azonosító sikeresen leolvasva!');
    } else {
      toast.error('Az azonosító nem egyezik a tárggyal!');
      setScannedId('');
    }
  };

  const handleManualVerify = () => {
    if (scannedId.length === 16) {
      verifyScannedId(scannedId);
    } else {
      toast.error('Az azonosító 16 karakter hosszú kell legyen!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !handoverUserId) {
      toast.error('Kérjük, először azonosítsa magát!');
      return;
    }

    if (!isScanned) {
      toast.error('Kérjük, olvassa le a nyilvántartó címkén szereplő kódot!');
      return;
    }

    // Validate required fields
    if (!formData.recipientName.trim()) {
      toast.error('Az átvevő neve kötelező!');
      return;
    }

    if (!formData.recipientAddress.trim()) {
      toast.error('Az átvevő lakcíme kötelező!');
      return;
    }

    if (!formData.recipientIdDocType) {
      toast.error('Az okmány típusa kötelező!');
      return;
    }

    if (!formData.recipientIdDocNumber.trim()) {
      toast.error('Az okmány azonosítója kötelező!');
      return;
    }

    // Validate optional fields format
    if (!validateEmail(formData.recipientEmail)) {
      toast.error('Érvénytelen e-mail cím formátum!');
      return;
    }

    if (!validatePhone(formData.recipientPhone)) {
      toast.error('Érvénytelen telefonszám formátum!');
      return;
    }

    if (!item) {
      toast.error('Hiba történt!');
      return;
    }

    const recipientData = {
      recipientName: formData.recipientName.trim(),
      recipientAddress: formData.recipientAddress.trim(),
      recipientEmail: formData.recipientEmail.trim() || undefined,
      recipientPhone: formData.recipientPhone.trim() || undefined,
      recipientIdDocType: formData.recipientIdDocType,
      recipientIdDocNumber: formData.recipientIdDocNumber.trim(),
    };

    // Use appropriate function based on item status
    const result = item.status === 'stored' 
      ? handOverStoredItem(item.id, handoverUserId, recipientData)
      : handOverItem(item.id, handoverUserId, recipientData);

    if (result) {
      toast.success('Tárgy sikeresen kiadva!');
      onHandoverComplete();
      onOpenChange(false);
    } else {
      toast.error('Kiadás sikertelen!');
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle>Tárgy kiadása</DialogTitle>
          <DialogDescription>
            {step === 'auth' && 'Azonosítsa magát a kiadás megkezdéséhez'}
            {step === 'scan' && 'Olvassa le a nyilvántartó címkén szereplő kódot'}
            {step === 'form' && 'Töltse ki az átvevő adatait'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Step 1: Authentication */}
            {step === 'auth' && (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Kérjük, adja meg bejelentkezési adatait a kiadás megkezdéséhez
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-email">E-mail cím *</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="pelda@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-password">Jelszó *</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Mégse
                  </Button>
                  <Button type="submit">Tovább</Button>
                </div>
              </form>
            )}

            {/* Step 2: Barcode Scanning */}
            {step === 'scan' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold">{item.itemName}</p>
                  <p className="text-sm text-muted-foreground font-mono">{item.id}</p>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Azonosító beolvasása *
                  </Label>
                  <div className="relative">
                    <Input
                      ref={scanInputRef}
                      value={scannedId}
                      onChange={handleScanInput}
                      placeholder={manualEntry ? "Írja be az azonosítót..." : "Olvassa le a címkén lévő kódot..."}
                      maxLength={16}
                      className="font-mono uppercase"
                    />
                    {isScanned && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setManualEntry(!manualEntry)}
                      className="gap-2"
                    >
                      <Keyboard className="h-4 w-4" />
                      {manualEntry ? 'Vonalkód olvasó' : 'Kézi bevitel'}
                    </Button>
                    
                    {manualEntry && scannedId.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleManualVerify}
                      >
                        Ellenőrzés
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Kötelező a nyilvántartó címkén szereplő kód leolvasása
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('auth')}>
                    Vissza
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Mégse
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Recipient Form */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item info header */}
                <div className="rounded-lg bg-muted p-4 text-center border border-border">
                  <p className="font-bold text-lg text-foreground">{item.itemName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.foundLocation}, {new Date(item.foundDate).toLocaleDateString('hu-HU')}
                  </p>
                  <p className="text-xs font-mono mt-1 text-muted-foreground">{item.id}</p>
                </div>

                {/* Recipient Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Átvevő adatai</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Név *</Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleChange}
                      placeholder="Teljes név"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Lakcím *</Label>
                    <Input
                      id="recipientAddress"
                      name="recipientAddress"
                      value={formData.recipientAddress}
                      onChange={handleChange}
                      placeholder="1234 Budapest, Példa utca 1."
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recipientIdDocType">Okmány típusa *</Label>
                      <Select
                        value={formData.recipientIdDocType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, recipientIdDocType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Válasszon..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="személyi igazolvány">Személyi igazolvány</SelectItem>
                          <SelectItem value="útlevél">Útlevél</SelectItem>
                          <SelectItem value="jogosítvány">Jogosítvány</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recipientIdDocNumber">Okmány azonosító *</Label>
                      <Input
                        id="recipientIdDocNumber"
                        name="recipientIdDocNumber"
                        value={formData.recipientIdDocNumber}
                        onChange={handleChange}
                        placeholder="123456AB"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">E-mail</Label>
                    <Input
                      id="recipientEmail"
                      name="recipientEmail"
                      type="email"
                      value={formData.recipientEmail}
                      onChange={handleChange}
                      placeholder="pelda@email.hu"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Telefonszám</Label>
                    <Input
                      id="recipientPhone"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      placeholder="+36 30 123 4567"
                    />
                  </div>
                </div>
              </form>
          )}
        </div>

        {/* Fixed footer with buttons */}
        {step === 'form' && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setStep('scan')}>
              Vissza
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              Kiadás
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

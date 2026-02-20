export interface FoundItem {
  id: string; // 16-character alphanumeric ID (MongoDB-style short ID)
  foundDate: string;
  foundLocation: string;
  finderName: string;
  finderContact: string;
  itemName: string;
  description: string;
  brand?: string;
  material?: string;
  shape?: string;
  color?: string;
  size?: string;
  imageUrl?: string;
  createdAt: string;
  createdByUserId: string; // Who registered the item
  status: 'active' | 'stored' | 'sold' | 'handed_over';
}

export interface HandedOverItem extends FoundItem {
  handedOverAt: string;
  handedOverByUserId: string;
  recipientName: string;
  recipientAddress: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientIdDocType?: string; // személyi igazolvány, útlevél, jogosítvány
  recipientIdDocNumber?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // For mock auth - in production use proper hashing
  role: 'user' | 'admin';
  hasExtendedAccess?: boolean; // Can view items from last 366 days
  extendedAccessUntil?: string; // ISO date when extended access expires
  createdAt?: string;
  createdByUserId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface SearchFilters {
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  itemName?: string;
  description?: string;
  createdByUserId?: string; // For admin to filter by user who registered items
}

// For PDF generation
export interface RegistrationSheet {
  item: FoundItem;
  qrCodeDataUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  createdAt: string;
  createdByUserId: string;
}

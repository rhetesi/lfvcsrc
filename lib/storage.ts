import { FoundItem, HandedOverItem, User, Location } from '@/types';

const ITEMS_KEY = 'found_items';
const HANDED_OVER_KEY = 'handed_over_items';
const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'current_user';
const LOCATIONS_KEY = 'locations';

// Generate MongoDB-style short ID (16 alphanumeric characters)
// Format: 8 hex chars (timestamp) + 8 hex chars (random)
// This is machine-readable and fits in 16 characters
export const generateItemId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + random).toUpperCase();
};

// Initialize default admin user
const initializeDefaultUsers = () => {
  const data = localStorage.getItem(USERS_KEY);
  const users = data ? JSON.parse(data) : [];
  if (users.length === 0) {
    const now = new Date().toISOString();
    const defaultUsers: User[] = [
      { 
        id: '1', 
        email: 'admin@example.com', 
        name: 'Adminisztrátor', 
        password: 'admin123',
        role: 'admin',
        createdAt: now,
      },
      { 
        id: '2', 
        email: 'user@example.com', 
        name: 'Felhasználó', 
        password: 'user123',
        role: 'user',
        createdAt: now,
        createdByUserId: '1',
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return users;
};

// Users
export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    return initializeDefaultUsers();
  }
  return JSON.parse(data);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const loginUser = (email: string, password: string): User | null => {
  // Force initialize default users if none exist
  initializeDefaultUsers();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const verifyUserCredentials = (email: string, password: string, userId: string): boolean => {
  const users = getUsers();
  const user = users.find(u => u.id === userId && u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  return !!user;
};

export const logoutUser = () => {
  setCurrentUser(null);
};

// User management (admin only)
export const createUser = (userData: Omit<User, 'id' | 'createdAt'>, createdByUserId: string): User => {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    createdByUserId,
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users[index];
  }
  return null;
};

export const deleteUser = (userId: string): boolean => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length !== users.length) {
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
};

// Grant extended access (unlimited until revoked)
export const grantExtendedAccess = (userId: string): User | null => {
  return updateUser(userId, { 
    hasExtendedAccess: true, 
    extendedAccessUntil: undefined  // No expiry - unlimited until revoked
  });
};

// Revoke extended access
export const revokeExtendedAccess = (userId: string): User | null => {
  return updateUser(userId, { 
    hasExtendedAccess: false, 
    extendedAccessUntil: undefined 
  });
};

// Locations
export const getLocations = (): Location[] => {
  const data = localStorage.getItem(LOCATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocation = (name: string, createdByUserId: string): Location => {
  const locations = getLocations();
  const newLocation: Location = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    createdByUserId,
  };
  locations.push(newLocation);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return newLocation;
};

export const deleteLocation = (id: string): boolean => {
  const locations = getLocations();
  const filtered = locations.filter(l => l.id !== id);
  if (filtered.length !== locations.length) {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
};

export const updateLocation = (id: string, name: string): Location | null => {
  const locations = getLocations();
  const index = locations.findIndex(l => l.id === id);
  if (index !== -1) {
    locations[index].name = name;
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
    return locations[index];
  }
  return null;
};

// Found Items
export const getFoundItems = (): FoundItem[] => {
  const data = localStorage.getItem(ITEMS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getFoundItemById = (id: string): FoundItem | null => {
  const items = getFoundItems();
  return items.find(item => item.id === id) || null;
};

export const saveFoundItem = (
  item: Omit<FoundItem, 'id' | 'createdAt' | 'status' | 'createdByUserId'>,
  createdByUserId: string
): FoundItem => {
  const items = getFoundItems();
  const newItem: FoundItem = {
    ...item,
    id: generateItemId(),
    createdAt: new Date().toISOString(),
    createdByUserId,
    status: 'active',
  };
  items.push(newItem);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  return newItem;
};

export const updateItemStatus = (id: string, status: FoundItem['status']): void => {
  const items = getFoundItems();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index].status = status;
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }
};

export const deleteItem = (id: string): void => {
  const items = getFoundItems();
  const filtered = items.filter(item => item.id !== id);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
};

// Handed over items (archived - cannot be deleted)
export const getHandedOverItems = (): HandedOverItem[] => {
  const data = localStorage.getItem(HANDED_OVER_KEY);
  return data ? JSON.parse(data) : [];
};

export const handOverItem = (
  itemId: string,
  handedOverByUserId: string,
  recipientData: {
    recipientName: string;
    recipientAddress: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientIdDocType?: string;
    recipientIdDocNumber?: string;
  }
): HandedOverItem | null => {
  const items = getFoundItems();
  const itemIndex = items.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) return null;
  
  const item = items[itemIndex];
  const handedOverItem: HandedOverItem = {
    ...item,
    status: 'handed_over',
    handedOverAt: new Date().toISOString(),
    handedOverByUserId,
    ...recipientData,
  };
  
  // Remove from active items
  items.splice(itemIndex, 1);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  
  // Add to handed over items (archived)
  const handedOverItems = getHandedOverItems();
  handedOverItems.push(handedOverItem);
  localStorage.setItem(HANDED_OVER_KEY, JSON.stringify(handedOverItems));
  
  return handedOverItem;
};

// Hand over stored item (admin only)
export const handOverStoredItem = (
  itemId: string,
  handedOverByUserId: string,
  recipientData: {
    recipientName: string;
    recipientAddress: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientIdDocType?: string;
    recipientIdDocNumber?: string;
  }
): HandedOverItem | null => {
  const items = getFoundItems();
  const itemIndex = items.findIndex(item => item.id === itemId && item.status === 'stored');
  
  if (itemIndex === -1) return null;
  
  const item = items[itemIndex];
  const handedOverItem: HandedOverItem = {
    ...item,
    status: 'handed_over',
    handedOverAt: new Date().toISOString(),
    handedOverByUserId,
    ...recipientData,
  };
  
  // Remove from active items
  items.splice(itemIndex, 1);
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  
  // Add to handed over items (archived)
  const handedOverItems = getHandedOverItems();
  handedOverItems.push(handedOverItem);
  localStorage.setItem(HANDED_OVER_KEY, JSON.stringify(handedOverItems));
  
  return handedOverItem;
};

// Helper functions
export const getDaysSinceFound = (foundDate: string): number => {
  const found = new Date(foundDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - found.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getItemsLast90Days = (items: FoundItem[]): FoundItem[] => {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return items.filter(item => {
    const foundDate = new Date(item.foundDate);
    return foundDate >= ninetyDaysAgo && item.status === 'active';
  });
};

export const getItemsLast366Days = (items: FoundItem[]): FoundItem[] => {
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
  return items.filter(item => {
    const foundDate = new Date(item.foundDate);
    return foundDate >= yearAgo && item.status === 'active';
  });
};

// Get stored items (for admin)
export const getStoredItems = (): FoundItem[] => {
  const items = getFoundItems();
  return items.filter(item => item.status === 'stored');
};

// Check if user has extended access (366 days view - unlimited until revoked by admin)
export const hasExtendedAccess = (user: User | null): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return !!user.hasExtendedAccess;
};

// Restore item from stored status to active
export const restoreFromStorage = (id: string): boolean => {
  const items = getFoundItems();
  const index = items.findIndex(item => item.id === id && item.status === 'stored');
  if (index !== -1) {
    items[index].status = 'active';
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    return true;
  }
  return false;
};

// Initialize on load
initializeDefaultUsers();

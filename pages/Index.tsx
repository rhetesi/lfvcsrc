import React, { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { LoginDialog } from '@/components/LoginDialog';
import { AddItemDialog } from '@/components/AddItemDialog';
import { ItemList } from '@/components/ItemList';
import { UserManagement } from '@/components/UserManagement';
import { LocationManagement } from '@/components/LocationManagement';
import { HandedOverItemsDialog } from '@/components/HandedOverItemsDialog';

const IndexContent = () => {
  const { isAdmin } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [locationManagementOpen, setLocationManagementOpen] = useState(false);
  const [handedOverOpen, setHandedOverOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleItemAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onLoginClick={() => setLoginOpen(true)}
        onUserManagementClick={isAdmin ? () => setUserManagementOpen(true) : undefined}
        onLocationManagementClick={isAdmin ? () => setLocationManagementOpen(true) : undefined}
        onHandedOverClick={isAdmin ? () => setHandedOverOpen(true) : undefined}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <ItemList
          onAddClick={() => setAddItemOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      </main>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onItemAdded={handleItemAdded}
      />
      {isAdmin && (
        <>
          <UserManagement
            open={userManagementOpen}
            onOpenChange={setUserManagementOpen}
          />
          <LocationManagement
            open={locationManagementOpen}
            onOpenChange={setLocationManagementOpen}
          />
          <HandedOverItemsDialog
            open={handedOverOpen}
            onOpenChange={setHandedOverOpen}
          />
        </>
      )}

      <footer className="border-t bg-muted/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Talált Tárgyak Nyilvántartása © {new Date().getFullYear()}</p>
          <p className="mt-1">Lost & Found Management System</p>
        </div>
      </footer>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
};

export default Index;

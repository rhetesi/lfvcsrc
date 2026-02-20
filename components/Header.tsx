import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Package, User, Users, MapPin, Menu, Archive } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
  onUserManagementClick?: () => void;
  onLocationManagementClick?: () => void;
  onHandedOverClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLoginClick, 
  onUserManagementClick,
  onLocationManagementClick,
  onHandedOverClick,
}) => {
  const { user, isAuthenticated, isAdmin, logoutUser } = useAuth();

  // Check if user has admin functions available
  const hasAdminFunctions = isAdmin && (onUserManagementClick || onLocationManagementClick || onHandedOverClick);

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Talált Tárgyak Nyilvántartása</h1>
              <p className="text-xs sm:text-sm opacity-90 hidden sm:block">Lost & Found Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                {/* Desktop view - user info */}
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs mt-0.5 ${isAdmin ? 'bg-accent text-accent-foreground' : 'bg-primary-foreground/20 text-primary-foreground'}`}
                  >
                    {isAdmin ? 'Adminisztrátor' : 'Felhasználó'}
                  </Badge>
                </div>

                {/* Mobile view - user info */}
                <div className="sm:hidden flex flex-col items-end">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${isAdmin ? 'bg-accent text-accent-foreground' : 'bg-primary-foreground/20 text-primary-foreground'}`}
                  >
                    {isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>

                {/* Desktop buttons */}
                <div className="hidden lg:flex items-center gap-2">
                  {isAdmin && onHandedOverClick && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onHandedOverClick}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Kiadott
                    </Button>
                  )}
                  {isAdmin && onLocationManagementClick && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onLocationManagementClick}
                      className="gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Helyszínek
                    </Button>
                  )}
                  {isAdmin && onUserManagementClick && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onUserManagementClick}
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Felhasználók
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={logoutUser}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Kijelentkezés
                  </Button>
                </div>

                {/* Mobile/Tablet - Hamburger menu or just logout */}
                <div className="lg:hidden">
                  {hasAdminFunctions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon">
                          <Menu className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {onHandedOverClick && (
                          <DropdownMenuItem onClick={onHandedOverClick}>
                            <Archive className="h-4 w-4 mr-2" />
                            Kiadott tárgyak
                          </DropdownMenuItem>
                        )}
                        {onLocationManagementClick && (
                          <DropdownMenuItem onClick={onLocationManagementClick}>
                            <MapPin className="h-4 w-4 mr-2" />
                            Helyszínek
                          </DropdownMenuItem>
                        )}
                        {onUserManagementClick && (
                          <DropdownMenuItem onClick={onUserManagementClick}>
                            <Users className="h-4 w-4 mr-2" />
                            Felhasználók
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logoutUser}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Kijelentkezés
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={logoutUser}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={onLoginClick}>
                Bejelentkezés
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

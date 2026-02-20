import React, { useState, useEffect, useRef } from 'react';
import { Location } from '@/types';
import { getLocations } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Válasszon vagy gépeljen...",
  required = false,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocations(getLocations());
  }, []);

  useEffect(() => {
    if (value.trim()) {
      const filtered = locations.filter(loc => 
        loc.name.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [value, locations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: Location) => {
    onChange(location.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
      />
      
      {isOpen && filteredLocations.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ScrollArea className="max-h-60">
            <div className="p-1">
              {filteredLocations.map(location => (
                <button
                  key={location.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  )}
                  onClick={() => handleSelect(location)}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{location.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {isOpen && filteredLocations.length === 0 && value.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 shadow-lg text-sm text-muted-foreground">
          Nincs találat. Új helyszínt gépelhet be.
        </div>
      )}
    </div>
  );
};

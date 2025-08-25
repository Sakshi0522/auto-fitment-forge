import { useState, useEffect } from 'react';
import { ChevronDown, Car, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types';

interface VehicleSelectorProps {
  selectedVehicle?: Vehicle;
  onVehicleChange?: (vehicle: Vehicle | undefined) => void;
  compact?: boolean;
}

// Mock data - in real app, this would come from an API
const VEHICLE_DATA = {
  makes: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi'],
  models: {
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
    Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
    Ford: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'],
    Chevrolet: ['Silverado', 'Malibu', 'Equinox', 'Tahoe', 'Camaro'],
    Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Maxima'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5', 'i3'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
    Audi: ['A4', 'A6', 'Q5', 'Q7', 'A3'],
  },
  engines: {
    default: ['2.0L 4-Cylinder', '2.5L 4-Cylinder', '3.0L V6', '3.5L V6', '5.0L V8'],
  },
};

export function VehicleSelector({ 
  selectedVehicle, 
  onVehicleChange, 
  compact = false 
}: VehicleSelectorProps) {
  const [year, setYear] = useState(selectedVehicle?.year?.toString() || '');
  const [make, setMake] = useState(selectedVehicle?.make || '');
  const [model, setModel] = useState(selectedVehicle?.model || '');
  const [engine, setEngine] = useState(selectedVehicle?.engine || '');
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Generate years (current year down to 1990)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  // Get available models for selected make
  const availableModels = make ? VEHICLE_DATA.models[make as keyof typeof VEHICLE_DATA.models] || [] : [];

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (!make) {
      setModel('');
      setEngine('');
    }
  }, [make]);

  useEffect(() => {
    if (!model) {
      setEngine('');
    }
  }, [model]);

  // Save vehicle selection
  const handleSaveVehicle = () => {
    if (year && make && model) {
      const vehicle: Vehicle = {
        year: parseInt(year),
        make,
        model,
        engine: engine || undefined,
      };
      
      onVehicleChange?.(vehicle);
      
      // Save to localStorage for persistence
      localStorage.setItem('selected_vehicle', JSON.stringify(vehicle));
      
      if (compact) {
        setIsExpanded(false);
      }
    }
  };

  const handleClearVehicle = () => {
    setYear('');
    setMake('');
    setModel('');
    setEngine('');
    onVehicleChange?.(undefined);
    localStorage.removeItem('selected_vehicle');
  };

  // Load saved vehicle on mount
  useEffect(() => {
    const saved = localStorage.getItem('selected_vehicle');
    if (saved && !selectedVehicle) {
      try {
        const vehicle = JSON.parse(saved);
        setYear(vehicle.year?.toString() || '');
        setMake(vehicle.make || '');
        setModel(vehicle.model || '');
        setEngine(vehicle.engine || '');
        onVehicleChange?.(vehicle);
      } catch (error) {
        console.error('Error loading saved vehicle:', error);
      }
    }
  }, []);

  if (compact && selectedVehicle && !isExpanded) {
    return (
      <Badge 
        variant="secondary" 
        className="cursor-pointer flex items-center space-x-2 px-3 py-2 h-auto"
        onClick={() => setIsExpanded(true)}
      >
        <Car className="h-4 w-4" />
        <span>
          {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
          {selectedVehicle.engine && ` (${selectedVehicle.engine})`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            handleClearVehicle();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    );
  }

  return (
    <Card className={compact ? "w-full" : ""}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Select Your Vehicle</h3>
            </div>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Make</label>
              <Select value={make} onValueChange={setMake} disabled={!year}>
                <SelectTrigger>
                  <SelectValue placeholder="Make" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_DATA.makes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel} disabled={!make}>
                <SelectTrigger>
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Engine (Optional)</label>
              <Select value={engine} onValueChange={setEngine} disabled={!model}>
                <SelectTrigger>
                  <SelectValue placeholder="Engine" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_DATA.engines.default.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearVehicle}
              disabled={!year && !make && !model && !engine}
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              onClick={handleSaveVehicle}
              disabled={!year || !make || !model}
            >
              Save Vehicle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
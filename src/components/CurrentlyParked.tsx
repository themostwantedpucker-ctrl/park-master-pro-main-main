import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useParkingContext } from '@/contexts/ParkingContext';
import { calculateParkingFee, formatCurrency, formatTime } from '@/utils/calculations';
import { Search, Clock, DollarSign } from 'lucide-react';

const CurrentlyParked: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { getCurrentlyParked, settings } = useParkingContext();
  
  const currentlyParked = getCurrentlyParked();
  
  const filteredVehicles = currentlyParked.filter(vehicle =>
    vehicle.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentFee = (vehicle: any) => {
    const now = new Date();
    return calculateParkingFee(vehicle.entryTime, now, vehicle.type, settings.pricing);
  };

  const getTimeParked = (entryTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Currently Parked Vehicles ({filteredVehicles.length})
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search by vehicle number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {currentlyParked.length === 0 ? 'No vehicles currently parked' : 'No vehicles match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{vehicle.number}</span>
                          <Badge 
                            variant={vehicle.type === 'car' ? 'default' : vehicle.type === 'bike' ? 'secondary' : 'outline'}
                          >
                            {vehicle.type.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Entry: {formatTime(new Date(vehicle.entryTime))}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Duration: {getTimeParked(new Date(vehicle.entryTime))}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                          <DollarSign className="h-5 w-5" />
                          <span>{formatCurrency(getCurrentFee(vehicle))}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Current fee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Summary */}
      {filteredVehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {filteredVehicles.filter(v => v.type === 'car').length}
                </div>
                <p className="text-sm text-muted-foreground">Cars</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {filteredVehicles.filter(v => v.type === 'bike').length}
                </div>
                <p className="text-sm text-muted-foreground">Bikes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {filteredVehicles.filter(v => v.type === 'rickshaw').length}
                </div>
                <p className="text-sm text-muted-foreground">Rickshaws</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(filteredVehicles.reduce((sum, v) => sum + getCurrentFee(v), 0))}
                </div>
                <p className="text-sm text-muted-foreground">Total Expected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurrentlyParked;
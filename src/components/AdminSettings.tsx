import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParkingContext } from '@/contexts/ParkingContext';
import { useToast } from '@/hooks/use-toast';
import { Settings, DollarSign, User } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useParkingContext();
  const { toast } = useToast();
  
  const [siteName, setSiteName] = useState(settings.siteName);
  const [pricing, setPricing] = useState(settings.pricing);
  const [credentials, setCredentials] = useState(settings.credentials);
  const [viewMode, setViewMode] = useState(settings.viewMode);

  const handleSave = () => {
    updateSettings({
      siteName,
      pricing,
      credentials,
      viewMode
    });
    
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pricing" className="w-full">
        <TabsList>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="view">View Settings</TabsTrigger>
          <TabsTrigger value="login">Login Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Dynamic Pricing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(pricing).map(([vehicleType, rates]) => (
                <div key={vehicleType} className="space-y-3">
                  <h3 className="font-semibold capitalize">{vehicleType} Pricing</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Base Hours</Label>
                      <Input
                        type="number"
                        value={rates.baseHours}
                        onChange={(e) => setPricing({
                          ...pricing,
                          [vehicleType]: { ...rates, baseHours: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Base Fee (PKR)</Label>
                      <Input
                        type="number"
                        value={rates.baseFee}
                        onChange={(e) => setPricing({
                          ...pricing,
                          [vehicleType]: { ...rates, baseFee: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Extra Hour Fee (PKR)</Label>
                      <Input
                        type="number"
                        value={rates.extraHourFee}
                        onChange={(e) => setPricing({
                          ...pricing,
                          [vehicleType]: { ...rates, extraHourFee: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={handleSave} className="w-full">Save Pricing</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                View Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name</Label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Smart Parking System"
                />
              </div>
              <div>
                <Label>Default View Mode</Label>
                <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="grid">Grid View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Login Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={credentials.username}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    username: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    password: e.target.value
                  })}
                />
              </div>
              <Button onClick={handleSave} className="w-full">Update Credentials</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParkingContext } from '@/contexts/ParkingContext';
import { useToast } from '@/hooks/use-toast';
import { generateBarcode, formatTime, formatTimeOnly, calculateParkingFee, formatCurrency } from '@/utils/calculations';
import { QrCode, Printer, Search } from 'lucide-react';
import JsBarcode from 'jsbarcode';

const WalkInClients: React.FC = () => {
  const barcodeRef = useRef(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'rickshaw'>('car');
  const [exitNumber, setExitNumber] = useState('');
  const [exitBarcode, setExitBarcode] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [showExitReceipt, setShowExitReceipt] = useState(false);
  const [exitReceiptData, setExitReceiptData] = useState<any>(null);
  
  const { addVehicle, exitVehicle, vehicles, settings } = useParkingContext();
  const { toast } = useToast();

  const handleEntry = () => {
    if (!vehicleNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter vehicle number",
        variant: "destructive"
      });
      return;
    }

    const entryTime = new Date();
    const vehicleId = addVehicle({
      number: vehicleNumber,
      type: vehicleType,
      entryTime
    });

    const barcode = generateBarcode(vehicleNumber, entryTime);
    
    setCurrentReceipt({
      id: vehicleId,
      vehicleNumber,
      vehicleType,
      entryTime,
      barcode
    });
    
    setShowReceipt(true);
    setVehicleNumber('');
    
    toast({
      title: "Vehicle entered",
      description: `${vehicleType.toUpperCase()} ${vehicleNumber} has been registered`,
    });
  };

  const handleManualExit = () => {
    if (!exitNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter vehicle number",
        variant: "destructive"
      });
      return;
    }

    const vehicle = vehicles.find(v => 
      v.number.toLowerCase() === exitNumber.toLowerCase() && !v.exitTime
    );

    if (!vehicle) {
      toast({
        title: "Error",
        description: "Vehicle not found or already exited",
        variant: "destructive"
      });
      return;
    }

    // Show exit receipt with calculated fee before confirming exit
    showExitReceiptWithFee(vehicle);
  };

  const showExitReceiptWithFee = (vehicle: any) => {
    const exitTime = new Date();
    const calculatedFee = calculateParkingFee(
      vehicle.entryTime,
      exitTime,
      vehicle.type,
      settings.pricing
    );

    const exitData = {
      ...vehicle,
      exitTime,
      calculatedFee,
      barcode: generateBarcode(vehicle.number, vehicle.entryTime)
    };

    setExitReceiptData(exitData);
    setShowExitReceipt(true);
  };

  const confirmExit = () => {
    if (exitReceiptData) {
      exitVehicle(exitReceiptData.id);
      setExitNumber('');
      setExitBarcode('');
      setShowExitReceipt(false);
      setExitReceiptData(null);
      
      toast({
        title: "Vehicle exited",
        description: `${exitReceiptData.type.toUpperCase()} ${exitReceiptData.number} has exited`,
      });
    }
  };

  const handleBarcodeExit = () => {
    if (!exitBarcode.trim()) {
      toast({
        title: "Error",
        description: "Please enter barcode",
        variant: "destructive"
      });
      return;
    }

    const vehicle = vehicles.find(v => {
      const vehicleBarcode = generateBarcode(v.number, v.entryTime);
      return vehicleBarcode === exitBarcode && !v.exitTime;
    });

    if (!vehicle) {
      toast({
        title: "Error",
        description: "Invalid barcode or vehicle already exited",
        variant: "destructive"
      });
      return;
    }

    // Show exit receipt with calculated fee before confirming exit
    showExitReceiptWithFee(vehicle);
  };

  // Generate barcode when receipt is shown
  useEffect(() => {
    if (showReceipt && currentReceipt && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, currentReceipt.barcode, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [showReceipt, currentReceipt]);

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Parking Receipt</title>
              <style>
                body { font-family: 'Courier New', monospace; margin: 0; padding: 15px; font-weight: bold; }
                .receipt { max-width: 300px; margin: 0 auto; text-align: center; }
                .receipt h3 { margin: 0 0 20px 0; font-size: 18px; font-weight: bold; }
                .receipt div { font-size: 14px; line-height: 1.8; font-weight: bold; }
                .flex { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: bold; }
                .font-semibold { font-weight: bold; }
                .border-t { border-top: 2px dashed #000; padding-top: 12px; margin-bottom: 12px; }
                .barcode-container { margin: 15px 0; }
                .text-xs { font-size: 12px; margin-top: 15px; font-weight: bold; }
                @media print {
                  body { margin: 0; padding: 8px; font-weight: bold; }
                  .receipt { max-width: none; width: 100%; }
                  .border-2 { border: none !important; }
                  .bg-muted\/50 { background: none !important; }
                  * { font-weight: bold !important; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const printExitReceipt = () => {
    const printContent = document.getElementById('exit-receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Exit Receipt</title>
              <style>
                body { font-family: 'Courier New', monospace; margin: 0; padding: 15px; font-weight: bold; }
                .receipt { max-width: 300px; margin: 0 auto; text-align: center; }
                .receipt h3 { margin: 0 0 20px 0; font-size: 18px; font-weight: bold; }
                .receipt div { font-size: 14px; line-height: 1.8; font-weight: bold; }
                .flex { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: bold; }
                .font-semibold { font-weight: bold; }
                .border-t { border-top: 2px dashed #000; padding-top: 12px; margin-bottom: 12px; }
                .barcode-container { margin: 15px 0; }
                .text-xs { font-size: 12px; margin-top: 15px; font-weight: bold; }
                .text-lg { font-size: 16px; font-weight: bold; }
                @media print {
                  body { margin: 0; padding: 8px; font-weight: bold; }
                  .receipt { max-width: none; width: 100%; }
                  .border-2 { border: none !important; }
                  .bg-muted\/50 { background: none !important; }
                  * { font-weight: bold !important; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Vehicle Entry and Exit Interface */}
      <div className="grid gap-6">
        {/* Vehicle Entry Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Enter vehicle number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="flex-1"
              />
              <Select value={vehicleType} onValueChange={(value: 'car' | 'bike' | 'rickshaw') => setVehicleType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="rickshaw">Rickshaw</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleEntry}>Enter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Exit Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Manual Exit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter vehicle number"
                value={exitNumber}
                onChange={(e) => setExitNumber(e.target.value)}
              />
              <Button onClick={handleManualExit} className="w-full">Exit Vehicle</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Barcode Exit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Scan or enter barcode"
                value={exitBarcode}
                onChange={(e) => {
                  const value = e.target.value;
                  setExitBarcode(value);
                  // Auto-process when barcode is complete (typically 10+ characters)
                  if (value.length >= 10 && value !== exitBarcode) {
                    setTimeout(() => handleBarcodeExit(), 100);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeExit();
                  }
                }}
              />
              <Button onClick={handleBarcodeExit} className="w-full">Exit Vehicle</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && currentReceipt && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Entry Receipt
              <div className="flex gap-2">
                <Button onClick={printReceipt} size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => setShowReceipt(false)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div id="receipt-content" className="text-center border-2 border-dashed border-border p-4 bg-muted/50">
              <div className="receipt">
                <h3 className="font-bold text-lg mb-4">{settings.siteName || 'PARKING RECEIPT'}</h3>
                <div className="text-sm font-mono" style={{lineHeight: '1.8'}}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Date:</span>
                    <span>{new Date(currentReceipt.entryTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Entry Time:</span>
                    <span>{formatTimeOnly(currentReceipt.entryTime)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Vehicle Type:</span>
                    <span>{currentReceipt.vehicleType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold">Vehicle Number:</span>
                    <span>{currentReceipt.vehicleNumber}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-400 pt-3 mb-3"></div>
                  <div className="barcode-container mb-3">
                    <svg ref={barcodeRef}></svg>
                    <p className="text-xs mt-2 text-muted-foreground">Scan this code at exit</p>
                  </div>
                  <div className="border-t border-dashed border-gray-400 pt-3"></div>
                  <p className="text-xs mt-3 font-normal">Please keep this receipt for exit</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Receipt Modal */}
      {showExitReceipt && exitReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-white rounded-lg max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Exit Receipt - Confirm Payment
                <div className="flex gap-2">
                  <Button onClick={printExitReceipt} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={() => setShowExitReceipt(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div id="exit-receipt-content" className="text-center border-2 border-dashed border-border p-4 bg-muted/50">
                <div className="receipt">
                  <h3 className="font-bold text-lg mb-4">{settings.siteName || 'PARKING RECEIPT'}</h3>
                  <div className="text-sm font-mono" style={{lineHeight: '1.8'}}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Vehicle Number:</span>
                      <span>{exitReceiptData.number}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Vehicle Type:</span>
                      <span>{exitReceiptData.type.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Entry Date:</span>
                      <span>{new Date(exitReceiptData.entryTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Entry Time:</span>
                      <span>{formatTimeOnly(exitReceiptData.entryTime)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Exit Date:</span>
                      <span>{new Date(exitReceiptData.exitTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="font-semibold">Exit Time:</span>
                      <span>{formatTimeOnly(exitReceiptData.exitTime)}</span>
                    </div>
                    <div className="border-t border-dashed border-gray-400 pt-3 mb-3"></div>
                    <div className="flex justify-between mb-4 text-lg font-bold">
                      <span>Total Fee:</span>
                      <span>{formatCurrency(exitReceiptData.calculatedFee)}</span>
                    </div>
                    <div className="border-t border-dashed border-gray-400 pt-3 mb-3"></div>
                    <div className="barcode-container mb-3">
                      <svg ref={barcodeRef}></svg>
                      <p className="text-xs mt-2 text-muted-foreground">Vehicle Exit Code</p>
                    </div>
                    <div className="border-t border-dashed border-gray-400 pt-3"></div>
                    <p className="text-xs mt-3 font-normal">Thank you for using our parking service</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={() => setShowExitReceipt(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={confirmExit} className="flex-1">
                  Confirm Exit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WalkInClients;
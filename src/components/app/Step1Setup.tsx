
import React from 'react';
import ParticipantManager from './ParticipantManager';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FilePlus2, ReceiptText, Users, RefreshCw, Upload } from 'lucide-react';
import { addReceiptFromFile, setGlobalCurrency, resetSession } from '@/lib/redux/slices/sessionSlice';
import ReceiptCard from './ReceiptCard';
import ItemListEditor from './ItemListEditor';
import { useToast } from '@/hooks/use-toast';
import ImportButton from './ImportButton';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Step1Setup() {
  const { participants, receipts, items, error, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error,
      });
    }
  }, [error, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      dispatch(addReceiptFromFile(file));
    }
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleGlobalCurrencyChange = (currency: string) => {
    dispatch(setGlobalCurrency(currency));
  };

  const handleResetSession = () => {
    dispatch(resetSession());
    toast({
      title: 'New Session Started',
      description: 'Your previous session data has been cleared.',
    });
  };
  
  const isSessionActive = participants.length > 0 || receipts.length > 0 || items.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ImportButton variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import Session
        </ImportButton>
        {isSessionActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RefreshCw className="mr-2 h-4 w-4" /> Reset Session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all participants, receipts, and item assignments from the current session. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSession}>
                  Yes, Reset Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Participants</CardTitle>
              <CardDescription>Who is splitting the bill?</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ParticipantManager />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ReceiptText className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Receipts</CardTitle>
                <CardDescription>Upload and manage your receipts.</CardDescription>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
                <div className="flex flex-1 items-center justify-center gap-2 sm:flex-none sm:justify-start">
                    <Label htmlFor="global-currency" className="text-sm shrink-0">Settle in:</Label>
                    <Select value={globalCurrency} onValueChange={handleGlobalCurrencyChange}>
                    <SelectTrigger id="global-currency" className="w-[90px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <Button onClick={handleUploadClick} size="sm" className="flex-1 sm:flex-none">
                <FilePlus2 className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {receipts.length > 0 ? (
              <div className="space-y-4">
                {receipts.map(receipt => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No receipts uploaded yet.</p>
                <p className="text-sm text-muted-foreground">Click "Upload" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ItemListEditor />
    </div>
  );
}

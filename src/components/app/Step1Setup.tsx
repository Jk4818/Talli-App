import React from 'react';
import ParticipantManager from './ParticipantManager';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FilePlus2, ReceiptText, Users } from 'lucide-react';
import { processReceipt } from '@/lib/redux/slices/sessionSlice';
import ReceiptCard from './ReceiptCard';
import ItemListEditor from './ItemListEditor';
import { useToast } from '@/hooks/use-toast';
import ImportButton from './ImportButton';

export default function Step1Setup() {
  const { receipts, status, error } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (status === 'failed' && error) {
      toast({
        variant: 'destructive',
        title: 'AI Processing Failed',
        description: error,
      });
    }
  }, [status, error, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      dispatch(processReceipt(file));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <ReceiptText className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Receipts</CardTitle>
                <CardDescription>Upload one or more receipts.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ImportButton variant="outline" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                disabled={status === 'loading'}
              />
              <Button onClick={handleUploadClick} disabled={status === 'loading'}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                {status === 'loading' ? 'Processing...' : 'Upload Receipt'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {receipts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receipts.map(receipt => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No receipts uploaded yet.</p>
                <p className="text-sm text-muted-foreground">Click "Upload Receipt" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ItemListEditor />
    </div>
  );
}

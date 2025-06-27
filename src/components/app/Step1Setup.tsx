
import React from 'react';
import ParticipantManager from './ParticipantManager';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FilePlus2, ReceiptText, Users, RefreshCw, Upload, AlertTriangle, Sparkles, Plus } from 'lucide-react';
import { addReceiptFromFile, setGlobalCurrency, resetSession, addManualReceipt, restoreSession } from '@/lib/redux/slices/sessionSlice';
import ReceiptCard from './ReceiptCard';
import ItemListEditor from './ItemListEditor';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { useRouter } from 'next/navigation';
import type { SessionState } from '@/lib/types';

export default function Step1Setup() {
  const session = useSelector((state: RootState) => state.session);
  const { participants, receipts, items, error, globalCurrency, isDemoSession } = session;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { toast } = useToast();
  
  const receiptFileInputRef = React.useRef<HTMLInputElement>(null);
  const sessionImportInputRef = React.useRef<HTMLInputElement>(null);

  const hasOrphanedItems = React.useMemo(() => {
    const receiptIds = new Set(receipts.map(r => r.id));
    return items.some(item => !receiptIds.has(item.receiptId));
  }, [items, receipts]);

  const hasConflictingReceipts = React.useMemo(() => {
    return receipts.some(receipt => {
      const receiptItems = items.filter(i => i.receiptId === receipt.id);
      const subtotal = receiptItems.reduce((acc, item) => acc + item.cost, 0);
      const totalDiscounts = (receipt.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const subtotalAfterDiscounts = subtotal - totalDiscounts;
      const serviceCharge = receipt.serviceCharge || { type: 'fixed', value: 0 };
      const serviceChargeAmount = serviceCharge.type === 'fixed'
        ? serviceCharge.value
        : Math.round(subtotalAfterDiscounts * (serviceCharge.value / 100));
      const receiptTotal = subtotalAfterDiscounts + serviceChargeAmount;
      return receiptTotal < 0;
    });
  }, [receipts, items]);

  React.useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error,
      });
    }
  }, [error, toast]);

  const handleReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      dispatch(addReceiptFromFile({file, isDemo: isDemoSession}));
    }
    if (receiptFileInputRef.current) {
      receiptFileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    receiptFileInputRef.current?.click();
  };
  
  const handleGlobalCurrencyChange = (currency: string) => {
    dispatch(setGlobalCurrency(currency));
  };

  const handleResetSession = () => {
    dispatch(resetSession());
    toast({
      title: 'Session Cleared',
      description: 'All session data has been removed.',
    });
  };

  const handleAddManually = () => {
    dispatch(addManualReceipt());
    toast({
        title: 'Manual Receipt Added',
        description: 'A new blank receipt has been added. You can now add items to it below.',
    });
  };

  const handleImportClick = () => {
    sessionImportInputRef.current?.click();
  };

  const handleSessionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Failed to read file content.');
        }
        const data = JSON.parse(text) as Partial<SessionState>;

        if (data && typeof data === 'object' && 'participants' in data && 'items' in data && 'receipts' in data) {
          dispatch(restoreSession(data));
          toast({
            title: 'Session Imported',
            description: 'Your session has been successfully restored.',
          });
        } else {
          throw new Error('Invalid session file format.');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Could not import the session file.',
        });
      } finally {
        if (sessionImportInputRef.current) {
          sessionImportInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'There was an error reading the file.',
        });
    }
    reader.readAsText(file);
  };
  
  const isSessionActive = participants.length > 0 || receipts.length > 0 || items.length > 0;

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer(0.2, 0.1)}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <input
        type="file"
        ref={sessionImportInputRef}
        onChange={handleSessionFileChange}
        className="hidden"
        accept="application/json"
      />
      <input
        type="file"
        ref={receiptFileInputRef}
        onChange={handleReceiptFileChange}
        className="hidden"
        accept="image/*"
      />
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-end gap-2">
        <AccessibleTooltip content={<p>Import a previously exported session from a JSON file.</p>}>
           <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import Session
          </Button>
        </AccessibleTooltip>

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
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          <CardHeader>
            <div className="flex flex-row items-center gap-4">
                <ReceiptText className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <CardTitle>Receipts</CardTitle>
                  <CardDescription>Upload and manage your receipts.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 pb-4">
              <div className="flex items-center gap-2">
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
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                    <SelectItem value="NZD">NZD</SelectItem>
                  </SelectContent>
                  </Select>
              </div>

              {/* Responsive actions */}
              <div className="flex flex-1 justify-end">
                {/* Mobile Dropdown */}
                <div className="sm:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleAddManually}>
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                <span>Add Manually</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={handleUploadClick}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>Upload Receipt</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* Desktop Buttons */}
                <div className="hidden sm:flex flex-1 items-center gap-2">
                    <Button onClick={handleAddManually} size="sm" variant='outline' className="flex-1">
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Add Manually
                    </Button>
                    <Button onClick={handleUploadClick} size="sm" className="flex-1">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upload Receipt
                    </Button>
                </div>
              </div>
          </div>
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
      </motion.div>
      
      {(hasConflictingReceipts || hasOrphanedItems) && (
        <motion.div variants={fadeInUp}>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                    {hasOrphanedItems && <p>Some items are not linked to a valid receipt. Please edit these items in the list below and assign them to a receipt.</p>}
                    {hasConflictingReceipts && <p>At least one receipt has a negative total. Please resolve conflicts in the expanded receipt sections.</p>}
                    <p className='mt-2'>You cannot proceed until all issues are resolved.</p>
                </AlertDescription>
            </Alert>
        </motion.div>
      )}

      <motion.div variants={fadeInUp} className="space-y-4">
        <ItemListEditor />
      </motion.div>
    </motion.div>
  );
}


import React from 'react';
import ParticipantManager from './ParticipantManager';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FilePlus2, ReceiptText, Users, RefreshCw, Upload, AlertTriangle, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { setGlobalCurrency, resetSession, addManualReceipt, restoreSession, uploadAndProcessReceipt } from '@/lib/redux/slices/sessionSlice';
import ReceiptCard from './ReceiptCard';
import ItemListEditor from './ItemListEditor';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerTrigger,
  DropDrawerLabel,
} from '@/components/ui/dropdrawer';
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
import type { SessionState } from '@/lib/types';
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { useAuth } from '@/lib/firebase/auth';

const MAX_RECEIPTS = 3;

export default function Step1Setup() {
  const session = useSelector((state: RootState) => state.session);
  const { participants, receipts, items, error, globalCurrency, isDemoSession } = session;
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  
  const receiptFileInputRef = React.useRef<HTMLInputElement>(null);
  const sessionImportInputRef = React.useRef<HTMLInputElement>(null);

  const isReceiptLimitReached = receipts.length >= MAX_RECEIPTS;
  const receiptLimitMessage = `You can add a maximum of ${MAX_RECEIPTS} receipts per session.`;

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
    if (isReceiptLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Receipt Limit Reached',
        description: receiptLimitMessage,
      });
      return;
    }
    const file = event.target.files?.[0];
    if (file && user) {
      dispatch(uploadAndProcessReceipt({file, user: { email: user.email, email_verified: user.emailVerified }}));
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
    if (isReceiptLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Receipt Limit Reached',
        description: receiptLimitMessage,
      });
      return;
    }
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
  
  const isUploadDisabled = isReceiptLimitReached || isDemoSession || !user;
  const uploadTooltipMessage = isReceiptLimitReached 
    ? receiptLimitMessage 
    : isDemoSession 
      ? 'Receipt uploads are disabled in demo mode.' 
      : !user 
        ? 'You must be logged in to upload receipts.' 
        : 'Upload a receipt image';

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

      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1 flex flex-col h-full max-h-[600px]">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>
                {participants.length > 0 ? `${participants.length} Participant(s)` : 'Participants'}
              </CardTitle>
              <CardDescription>Add or remove people from the split.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
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
          <CardContent>
            <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="global-currency" className="text-sm shrink-0">Settle in:</Label>
                    <ResponsiveSelect value={globalCurrency} onValueChange={handleGlobalCurrencyChange}>
                      <ResponsiveSelectTrigger id="global-currency" className="w-[90px] h-9">
                        {globalCurrency}
                      </ResponsiveSelectTrigger>
                      <ResponsiveSelectContent>
                        <ResponsiveSelectLabel>Settle In</ResponsiveSelectLabel>
                        <ResponsiveSelectItem value="USD">USD</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="EUR">EUR</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="GBP">GBP</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="CAD">CAD</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="AUD">AUD</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="JPY">JPY</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="INR">INR</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="CNY">CNY</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="CHF">CHF</ResponsiveSelectItem>
                        <ResponsiveSelectItem value="NZD">NZD</ResponsiveSelectItem>
                      </ResponsiveSelectContent>
                    </ResponsiveSelect>
                </div>

                {/* Responsive actions */}
                <div className="flex flex-1 justify-end">
                  {/* Mobile Dropdown */}
                  <div className="sm:hidden">
                      <DropDrawer>
                          <DropDrawerTrigger asChild>
                              <Button size="sm" disabled={isReceiptLimitReached}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add
                              </Button>
                          </DropDrawerTrigger>
                          <DropDrawerContent drawerClassName="pb-0">
                              <DropDrawerLabel>Add Receipt</DropDrawerLabel>
                              <DropDrawerItem onClick={handleAddManually} disabled={isReceiptLimitReached} icon={<FilePlus2 className="h-4 w-4" />}>
                                Add Manually
                              </DropDrawerItem>
                              <DropDrawerItem onClick={handleUploadClick} disabled={isUploadDisabled} icon={<Sparkles className="h-4 w-4" />}>
                                  Upload & Scan
                              </DropDrawerItem>
                          </DropDrawerContent>
                      </DropDrawer>
                  </div>
                  {/* Desktop Buttons */}
                  <div className="hidden sm:flex flex-1 items-center gap-2">
                      <AccessibleTooltip content={<p>{receiptLimitMessage}</p>}>
                        <span tabIndex={0} className="flex-1">
                          <Button onClick={handleAddManually} size="sm" variant='outline' className="w-full" disabled={isReceiptLimitReached}>
                              <FilePlus2 className="mr-2 h-4 w-4" />
                              Add Manually
                          </Button>
                        </span>
                      </AccessibleTooltip>
                      <AccessibleTooltip content={<p>{uploadTooltipMessage}</p>}>
                        <span tabIndex={0} className="flex-1">
                          <Button onClick={handleUploadClick} size="sm" className="w-full" disabled={isUploadDisabled}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Upload & Scan
                          </Button>
                        </span>
                      </AccessibleTooltip>
                  </div>
                </div>
            </div>
            {isReceiptLimitReached && (
              <Alert variant="default" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Receipt Limit Reached</AlertTitle>
                  <AlertDescription>{receiptLimitMessage}</AlertDescription>
              </Alert>
            )}
            {receipts.length > 0 ? (
              <div className="space-y-4">
                {receipts.map(receipt => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No receipts uploaded yet.</p>
                <p className="text-sm text-muted-foreground">Click "Upload & Scan" to get started.</p>
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

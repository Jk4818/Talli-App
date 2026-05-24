
import React from 'react';
import ParticipantManager from './ParticipantManager';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Button } from '../ui/button';
import {
  FilePlus2,
  Sparkles,
  MoreHorizontal,
  Upload,
  RefreshCw,
  AlertTriangle,
  Camera,
  Download,
  ArrowRight,
} from 'lucide-react';
import {
  setGlobalCurrency,
  resetSession,
  addManualReceipt,
  restoreSession,
  uploadAndProcessReceipt,
} from '@/lib/redux/slices/sessionSlice';
import ReceiptCard from './ReceiptCard';
import ItemListEditor from './ItemListEditor';
import { useToast } from '@/hooks/use-toast';
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
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { SessionState } from '@/lib/types';
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectLabel,
  ResponsiveSelectTrigger,
} from '../ui/responsive-select';
import { useAuth } from '@/lib/firebase/auth';
import { cn, formatCurrency } from '@/lib/utils';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import ItemEditDialog from './ItemEditDialog';
import { updateItem, removeItem } from '@/lib/redux/slices/sessionSlice';
import type { Item, Discount } from '@/lib/types';

const MAX_RECEIPTS = 3;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CNY', 'CHF', 'NZD'];

export default function Step1Setup() {
  const session = useSelector((state: RootState) => state.session);
  const { participants, receipts, items, error, globalCurrency, isDemoSession } = session;
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const receiptFileInputRef = React.useRef<HTMLInputElement>(null);
  const sessionImportInputRef = React.useRef<HTMLInputElement>(null);

  const [isItemsExpanded, setIsItemsExpanded] = React.useState(false);
  const [latestManualReceiptId, setLatestManualReceiptId] = React.useState<string | null>(null);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const prevReceiptsRef = React.useRef(receipts);

  const isReceiptLimitReached = receipts.length >= MAX_RECEIPTS;
  const isSessionActive = participants.length > 0 || receipts.length > 0 || items.length > 0;

  const hasOrphanedItems = React.useMemo(() => {
    const receiptIds = new Set(receipts.map((r) => r.id));
    return items.some((item) => !receiptIds.has(item.receiptId));
  }, [items, receipts]);

  const hasConflictingReceipts = React.useMemo(() => {
    return receipts.some((receipt) => {
      const receiptItems = items.filter((i) => i.receiptId === receipt.id);
      const subtotal = receiptItems.reduce((acc, item) => acc + item.cost, 0);
      const totalDiscounts = (receipt.discounts || []).reduce((acc, d) => acc + d.amount, 0);
      const subtotalAfterDiscounts = subtotal - totalDiscounts;
      const sc = receipt.serviceCharge || { type: 'fixed', value: 0 };
      const scAmount =
        sc.type === 'fixed'
          ? sc.value
          : Math.round(subtotalAfterDiscounts * (sc.value / 100));
      return subtotalAfterDiscounts + scAmount < 0;
    });
  }, [receipts, items]);

  // Auto-expand items if low confidence detected
  const hasLowConfidenceReceipt = receipts.some(
    (r) => r.overallConfidence !== undefined && r.overallConfidence < 85
  );

  React.useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'An Error Occurred', description: error });
    }
  }, [error, toast]);

  // Detect newly added manual receipts to auto-focus their name input
  React.useEffect(() => {
    const prev = prevReceiptsRef.current;
    if (receipts.length > prev.length) {
      const newest = receipts[receipts.length - 1];
      if (!newest.imageDataUri && newest.status === 'processed') {
        setLatestManualReceiptId(newest.id);
      }
    }
    prevReceiptsRef.current = receipts;
  }, [receipts]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      dispatch(uploadAndProcessReceipt({ file, user: { email: user.email, email_verified: user.emailVerified } }));
    }
    if (receiptFileInputRef.current) receiptFileInputRef.current.value = '';
  };

  const handleUploadClick = () => receiptFileInputRef.current?.click();

  const handleAddManually = () => {
    if (isReceiptLimitReached) return;
    dispatch(addManualReceipt());
  };

  const handleResetSession = () => {
    dispatch(resetSession());
    toast({ title: 'Session cleared', description: 'All session data has been removed.' });
  };

  const handleImportClick = () => sessionImportInputRef.current?.click();

  const handleExportSession = () => {
    try {
      const sessionJson = JSON.stringify(session, null, 2);
      const blob = new Blob([sessionJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talli_session_${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Session saved', description: 'Downloaded as a JSON file.' });
    } catch {
      toast({ variant: 'destructive', title: 'Save failed', description: 'Could not export the session data.' });
    }
  };

  const handleSessionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Failed to read file content.');
        const data = JSON.parse(text) as Partial<SessionState>;
        if (data && 'participants' in data && 'items' in data && 'receipts' in data) {
          dispatch(restoreSession(data));
          toast({ title: 'Session imported', description: 'Your session has been restored.' });
        } else {
          throw new Error('Invalid session file format.');
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Import failed',
          description: err instanceof Error ? err.message : 'Could not import the session file.',
        });
      } finally {
        if (sessionImportInputRef.current) sessionImportInputRef.current.value = '';
      }
    };
    reader.onerror = () =>
      toast({ variant: 'destructive', title: 'Import failed', description: 'Error reading file.' });
    reader.readAsText(file);
  };

  const isUploadDisabled = isReceiptLimitReached || isDemoSession || !user;
  const uploadTooltip = isReceiptLimitReached
    ? '3 receipt maximum'
    : isDemoSession
    ? 'Uploads disabled in demo mode'
    : !user
    ? 'Sign in to upload receipts'
    : 'Upload a receipt image';

  // ── Item review state ──────────────────────────────────────────────────
  const itemCount = items.length;

  const handleToggleItems = () => setIsItemsExpanded((v) => !v);

  return (
    <motion.div
      className="space-y-8 max-w-2xl mx-auto lg:max-w-none"
      variants={staggerContainer(0.15, 0.05)}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* Hidden file inputs */}
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

      {/* ── Page header: title + overflow menu ──────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Set up your split</h2>
          <p className="text-sm text-muted-foreground">Add people, scan receipts, then assign.</p>
        </div>
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropDrawerTrigger>
          <DropDrawerContent>
            <DropDrawerLabel>Session</DropDrawerLabel>
            <DropDrawerItem onClick={handleImportClick} icon={<Upload className="h-4 w-4" />}>
              Resume previous session
            </DropDrawerItem>
            {isSessionActive && (
              <DropDrawerItem onClick={handleExportSession} icon={<Download className="h-4 w-4" />}>
                Save session data
              </DropDrawerItem>
            )}
            {isSessionActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropDrawerItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    Start over
                  </DropDrawerItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start over?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all participants, receipts, and assignments. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetSession}>Yes, start over</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropDrawerContent>
        </DropDrawer>
      </motion.div>

      {/* ═══ SECTION 1: Who's splitting ════════════════════════════════════ */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
          Who&apos;s splitting?
        </h3>
        <div className="rounded-2xl bg-card px-5 py-4">
          <ParticipantManager />
        </div>
      </motion.div>

      {/* ═══ SECTION 2: Receipts ═══════════════════════════════════════════ */}
      <motion.div variants={fadeInUp} className="space-y-2">
        {/* Section header */}
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            What are we splitting?
            {receipts.length > 0 && (
              <span className="ml-2 font-normal normal-case">
                ({receipts.length}/{MAX_RECEIPTS})
              </span>
            )}
          </h3>

          {/* Settlement currency chip */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Settling in</span>
            <ResponsiveSelect value={globalCurrency} onValueChange={(c) => dispatch(setGlobalCurrency(c))}>
              <ResponsiveSelectTrigger className="h-7 text-xs px-2 w-auto gap-1 bg-primary/15 text-primary rounded-full">
                {globalCurrency}
              </ResponsiveSelectTrigger>
              <ResponsiveSelectContent>
                <ResponsiveSelectLabel>Settlement currency</ResponsiveSelectLabel>
                {CURRENCIES.map((c) => (
                  <ResponsiveSelectItem key={c} value={c}>{c}</ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>
        </div>

        {/* Receipts list or empty state */}
        {receipts.length > 0 ? (
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                autoFocusName={receipt.id === latestManualReceiptId}
              />
            ))}

            {/* Add more button row (when receipts exist and limit not reached) */}
            {!isReceiptLimitReached && (
              <div className="flex gap-2 pt-1">
                <AccessibleTooltip content={<p>{uploadTooltip}</p>}>
                  <span className="flex-1" tabIndex={0}>
                    <Button
                      onClick={handleUploadClick}
                      size="sm"
                      className="w-full"
                      disabled={isUploadDisabled}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upload &amp; Scan
                    </Button>
                  </span>
                </AccessibleTooltip>
                <Button
                  onClick={handleAddManually}
                  size="sm"
                  variant="outline"
                  disabled={isReceiptLimitReached}
                >
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Add manually
                </Button>
              </div>
            )}

            {isReceiptLimitReached && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                3 receipt maximum reached
              </p>
            )}
          </div>
        ) : (
          /* ── Empty state CTA ─────────────────────────────────────────── */
          <div className="rounded-2xl bg-card">
            <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-base">Scan your receipt</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Let AI extract everything for you
                </p>
              </div>
              <AccessibleTooltip content={<p>{uploadTooltip}</p>}>
                <span tabIndex={0}>
                  <Button onClick={handleUploadClick} disabled={isUploadDisabled} size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upload &amp; Scan
                  </Button>
                </span>
              </AccessibleTooltip>
              <div className="flex items-center gap-3 w-full max-w-xs">
                <div className="flex-1 h-px bg-secondary/60" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-secondary/60" />
              </div>
              <button
                onClick={handleAddManually}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Enter manually →
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Conflict / orphan alerts */}
      <AnimatePresence>
        {(hasConflictingReceipts || hasOrphanedItems) && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex items-start gap-2 rounded-lg bg-destructive/15 px-4 py-3 text-sm text-destructive"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {hasOrphanedItems && (
                <p>Some items are not linked to a valid receipt. Edit them in the list below.</p>
              )}
              {hasConflictingReceipts && (
                <p>At least one receipt has a negative total. Adjust discounts or item costs.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION 3: Item review ════════════════════════════════════════ */}
      {itemCount > 0 && (
        <motion.div variants={fadeInUp} className="space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between px-0.5">
            <h3 className={cn(
              'text-sm font-semibold uppercase tracking-wide',
              hasLowConfidenceReceipt ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
            )}>
              {hasLowConfidenceReceipt ? `${itemCount} items — please review` : `${itemCount} item${itemCount !== 1 ? 's' : ''} extracted`}
              {hasLowConfidenceReceipt && <span className="ml-1.5">!</span>}
            </h3>
            <button
              onClick={handleToggleItems}
              className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 transition-colors"
            >
              {isItemsExpanded ? 'Collapse' : 'Review all'}
              <ArrowRight className={cn('h-3.5 w-3.5 transition-transform duration-200', isItemsExpanded && 'rotate-90')} />
            </button>
          </div>

          {/* ── Horizontal mini card strip ─────────────────────────────── */}
          <ScrollArea className="w-full">
            <div className="flex gap-2.5 pb-2">
              {items.map((item) => {
                const receipt = receipts.find((r) => r.id === item.receiptId);
                const assigneeName = item.assignees.length === 1
                  ? participants.find((p) => p.id === item.assignees[0])?.name
                  : item.assignees.length > 1
                  ? `${item.assignees.length} people`
                  : null;
                const totalDiscount = (item.discounts || []).reduce((s: number, d: Discount) => s + d.amount, 0);
                const effectiveCost = item.cost - totalDiscount;
                return (
                  <button
                    key={item.id}
                    onClick={() => setEditingItem(item)}
                    className="shrink-0 w-36 rounded-xl bg-card p-3 text-left hover:bg-secondary active:bg-secondary/80 active:scale-[0.98] transition-all space-y-1.5"
                  >
                    <p className="text-sm font-medium leading-tight truncate">{item.name || 'Unnamed item'}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(effectiveCost, receipt?.currency ?? 'GBP')}
                    </p>
                    <p className={cn(
                      'text-xs truncate',
                      assigneeName ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400 font-medium'
                    )}>
                      {assigneeName ?? 'Unassigned'}
                    </p>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* ── Full ItemListEditor (expanded) ─────────────────────────── */}
          <AnimatePresence>
            {isItemsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  <ItemListEditor />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Item edit dialog (from mini card tap) ───────────────────────── */}
      <ItemEditDialog
        item={editingItem}
        items={items}
        receipts={receipts}
        isOpen={editingItem !== null}
        onOpenChange={(open) => { if (!open) setEditingItem(null); }}
        onSave={(updates) => {
          if (editingItem) dispatch(updateItem({ id: editingItem.id, ...updates }));
        }}
        onDelete={(itemId) => {
          dispatch(removeItem(itemId));
          setEditingItem(null);
        }}
        pendingSuggestion={null}
      />
    </motion.div>
  );
}

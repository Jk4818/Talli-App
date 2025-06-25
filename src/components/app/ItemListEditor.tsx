
"use client";

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ListOrdered, Search, ListX, Scale, SlidersHorizontal, Share2, Sparkles, Check } from 'lucide-react';
import { updateItem, removeItem, addItem } from '@/lib/redux/slices/sessionSlice';
import ItemEditDialog from './ItemEditDialog';
import { Item, Discount } from '@/lib/types';
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
} from '@/components/ui/dropdrawer';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AccessibleTooltip } from '../ui/accessible-tooltip';
import { Badge } from '../ui/badge';
import { formatCurrency, cn } from '@/lib/utils';


export default function ItemListEditor() {
  const { items, receipts, globalCurrency, participants } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'default' | 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc'>('default');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<{ receiptId: string; discount: Discount } | null>(null);

  const participantMap = useMemo(() => new Map(participants.map(p => [p.id, p])), [participants]);

  const pendingSuggestionsMap = useMemo(() => {
    const suggestions = new Map<string, { receiptId: string; discount: Discount }>();
    receipts.forEach(receipt => {
      (receipt.discounts || []).forEach(discount => {
        if (discount.suggestedItemId) {
          suggestions.set(discount.suggestedItemId, { receiptId: receipt.id, discount });
        }
      });
    });
    return suggestions;
  }, [receipts]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    switch (sortKey) {
      case 'name-asc':
        sortableItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sortableItems.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'cost-asc':
        sortableItems.sort((a, b) => a.cost - b.cost);
        break;
      case 'cost-desc':
        sortableItems.sort((a, b) => b.cost - a.cost);
        break;
      default:
        // Keep original order
        break;
    }
    return sortableItems;
  }, [items, sortKey]);
  
  const filteredItems = sortedItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNewItem = () => {
    if (receipts.length > 0) {
      dispatch(addItem({ receiptId: receipts[0].id }));
    }
  };

  const handleSaveItem = (updates: Partial<Item>) => {
    if (editingItem) {
      dispatch(updateItem({ id: editingItem.id, ...updates }));
    }
  };
  
  const handleDeleteItem = (itemId: string) => {
    dispatch(removeItem(itemId));
  };
  
  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setPendingSuggestion(pendingSuggestionsMap.get(item.id) || null);
  };

  const getSplitModeIcon = (mode: Item['splitMode']) => {
    switch(mode) {
        case 'equal': return <Scale className="h-3 w-3" />;
        case 'percentage': return <SlidersHorizontal className="h-3 w-3" />;
        case 'exact': return <Share2 className="h-3 w-3" />;
        default: return null;
    }
  };

  const getCategoryEmoji = (category?: Item['category']): string | null => {
    switch (category) {
        case 'Food': return '🍕';
        case 'Drink': return '🍺';
        case 'Other': return '🛍️';
        default: return null;
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
            <div className='flex items-center gap-4'>
                <ListOrdered className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle>Item List</CardTitle>
                    <CardDescription>Review and edit all items from your receipts. Click a card to edit.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <DropDrawer>
                <DropDrawerTrigger asChild>
                  <Button variant="outline" className='flex-1 sm:flex-none'>
                    <ArrowUpDown className="h-4 w-4" />
                    Sort
                  </Button>
                </DropDrawerTrigger>
                <DropDrawerContent align="end">
                  <DropDrawerLabel>Sort by</DropDrawerLabel>
                  <DropDrawerSeparator />
                    <DropDrawerItem onClick={() => setSortKey('default')} icon={sortKey === 'default' ? <Check className="h-4 w-4" /> : <div className="w-4 h-4"/>}>Default</DropDrawerItem>
                    <DropDrawerItem onClick={() => setSortKey('name-asc')} icon={sortKey === 'name-asc' ? <Check className="h-4 w-4" /> : <div className="w-4 h-4"/>}>Name (A-Z)</DropDrawerItem>
                    <DropDrawerItem onClick={() => setSortKey('name-desc')} icon={sortKey === 'name-desc' ? <Check className="h-4 w-4" /> : <div className="w-4 h-4"/>}>Name (Z-A)</DropDrawerItem>
                    <DropDrawerItem onClick={() => setSortKey('cost-asc')} icon={sortKey === 'cost-asc' ? <Check className="h-4 w-4" /> : <div className="w-4 h-4"/>}>Cost (Low to High)</DropDrawerItem>
                    <DropDrawerItem onClick={() => setSortKey('cost-desc')} icon={sortKey === 'cost-desc' ? <Check className="h-4 w-4" /> : <div className="w-4 h-4"/>}>Cost (High to Low)</DropDrawerItem>
                </DropDrawerContent>
              </DropDrawer>
              <Button onClick={handleAddNewItem} disabled={receipts.length === 0} className='flex-1 sm:flex-none'>
                  Add Item
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const receipt = receipts.find(r => r.id === item.receiptId);
                const currency = receipt?.currency || globalCurrency;
                const assignedParticipants = item.assignees.map(pid => participantMap.get(pid)).filter(Boolean) as {id: string, name: string}[];
                const MAX_AVATARS = 5;
                const totalItemDiscount = (item.discounts || []).reduce((acc, d) => acc + d.amount, 0);
                const effectiveCost = item.cost - totalItemDiscount;
                const suggestion = pendingSuggestionsMap.get(item.id);
                const categoryEmoji = getCategoryEmoji(item.category);

                return (
                  <div
                    key={item.id}
                    className={cn(
                        "group rounded-lg border bg-card/50 p-4 flex flex-col gap-2 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
                        suggestion && "border-primary/50 ring-2 ring-primary/20 shadow-md"
                    )}
                    onClick={() => handleEditClick(item)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEditClick(item);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold leading-snug truncate">
                              {item.name}
                              {item.quantity > 1 && <span className="text-muted-foreground font-light ml-1.5">x{item.quantity}</span>}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate" title={receipt?.name || 'N/A'}>
                                From: {receipt?.name || 'N/A'}
                            </p>
                            <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap">
                                {item.confidence !== undefined && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                        <Sparkles className="h-3 w-3 text-primary" />
                                        <span>{item.confidence}%</span>
                                    </div>
                                )}
                                {suggestion && (
                                    <AccessibleTooltip content={<p>AI has a discount suggestion for this item. Click to review.</p>}>
                                        <Badge variant="outline" className="border-primary/50 text-primary font-medium">
                                            <Sparkles className="h-3 w-3 mr-1.5" />
                                            Suggestion
                                        </Badge>
                                    </AccessibleTooltip>
                                )}
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-mono text-xl font-bold text-foreground">
                                {formatCurrency(effectiveCost, currency)}
                            </p>
                            {(totalItemDiscount > 0 || (item.quantity > 1 && item.unitCost)) && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {item.quantity > 1 && item.unitCost ? `@ ${formatCurrency(item.unitCost, currency)} each` : `(was ${formatCurrency(item.cost, currency)})`}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center min-h-[32px] flex-grow">
                        {assignedParticipants.length > 0 ? (
                            <div className="flex items-center -space-x-2">
                                {assignedParticipants.slice(0, MAX_AVATARS).map(p => (
                                    <AccessibleTooltip key={p.id} content={<p>{p.name}</p>}>
                                        <Avatar className="h-8 w-8 border-2 border-background">
                                            <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                                        </Avatar>
                                    </AccessibleTooltip>
                                ))}
                                {assignedParticipants.length > MAX_AVATARS && (
                                    <Avatar className="h-8 w-8 border-2 border-background">
                                        <AvatarFallback>+{assignedParticipants.length - MAX_AVATARS}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                No one assigned yet
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                        <div className="flex items-center gap-1.5" title={`Category: ${item.category}`}>
                            {categoryEmoji ? <span>{categoryEmoji}</span> : <div className="w-4 h-4" />}
                            <span className="capitalize">{item.subCategory || item.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title={`Split mode: ${item.splitMode}`}>
                            {getSplitModeIcon(item.splitMode)}
                            <span className="capitalize">{item.splitMode}</span>
                        </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-32 text-center flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg md:col-span-2 space-y-2">
                <ListX className="h-8 w-8" />
                <div>
                  <p className='font-medium'>No items found</p>
                  <p className='text-sm'>{searchTerm ? `Try adjusting your search.` : `Add items to get started.`}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <ItemEditDialog 
        item={editingItem}
        items={items}
        receipts={receipts}
        isOpen={!!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setPendingSuggestion(null);
          }
        }}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        pendingSuggestion={pendingSuggestion}
      />
    </>
  );
}

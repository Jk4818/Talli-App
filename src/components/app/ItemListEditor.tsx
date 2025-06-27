
"use client";

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowUpDown, ListOrdered, Pencil, MoreHorizontal, Search } from 'lucide-react';
import { updateItem, removeItem, addItem } from '@/lib/redux/slices/sessionSlice';
import ItemEditDialog from './ItemEditDialog';
import { Item } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccessibleTooltip } from '../ui/accessible-tooltip';


export default function ItemListEditor() {
  const { items, receipts, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'default' | 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc'>('default');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

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

  const handleSaveItem = (updates: { name: string, cost: number, receiptId: string }) => {
    if (editingItem) {
      dispatch(updateItem({ id: editingItem.id, ...updates }));
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
                    <CardDescription>Review and edit all items from your receipts.</CardDescription>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className='flex-1 sm:flex-none'>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(value) => setSortKey(value as any)}>
                    <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="cost-asc">Cost (Low to High)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="cost-desc">Cost (High to Low)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddNewItem} disabled={receipts.length === 0} className='flex-1 sm:flex-none'>
                  Add Item
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const receipt = receipts.find(r => r.id === item.receiptId);
                const currency = receipt?.currency || globalCurrency;
                return (
                  <div key={item.id} className="rounded-lg border bg-card/50 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <AccessibleTooltip content={<p>{item.name}</p>}>
                          <p className="font-medium truncate cursor-default">{item.name}</p>
                        </AccessibleTooltip>
                        <p className="text-sm text-muted-foreground">
                            From: {receipt?.name || 'N/A'}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className="font-mono text-lg shrink-0">
                          {(item.cost / 100).toLocaleString(undefined, { style: 'currency', currency })}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className='h-8 w-8'>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => dispatch(removeItem(item.id))} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-24 text-center flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No items found.</p>
                <p className='text-sm'>{searchTerm ? `Try adjusting your search.` : `Add items to get started.`}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <ItemEditDialog 
        item={editingItem}
        receipts={receipts}
        isOpen={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleSaveItem}
      />
    </>
  );
}

"use client";

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Trash2, AlertTriangle, ArrowUpDown, ListOrdered, Pencil } from 'lucide-react';
import { updateItem, removeItem, addItem } from '@/lib/redux/slices/sessionSlice';
import ItemEditDialog from './ItemEditDialog';
import { Item } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export default function ItemListEditor() {
  const { items, receipts, globalCurrency } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'cost'; direction: 'asc' | 'desc' } | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);
  
  const filteredItems = sortedItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const requestSort = (key: 'name' | 'cost') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: 'name' | 'cost') => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4 ml-2" />;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleAddNewItem = () => {
    if (receipts.length > 0) {
      dispatch(addItem({ receiptId: receipts[0].id }));
    }
  };

  const handleSaveItem = (updates: { name: string, cost: number }) => {
    if (editingItem) {
      dispatch(updateItem({ id: editingItem.id, ...updates }));
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className='flex items-center gap-4'>
                  <ListOrdered className="w-8 h-8 text-primary" />
                  <div>
                      <CardTitle>Item List</CardTitle>
                      <CardDescription>Review and edit all items from your receipts.</CardDescription>
                  </div>
              </div>
              <div className='flex gap-2 items-center w-full sm:w-auto'>
                  <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-grow sm:max-w-sm"
                  />
                  <Button onClick={handleAddNewItem} disabled={receipts.length === 0}>
                      Add Item
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Ambiguous</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Item Name {getSortIndicator('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Button variant="ghost" onClick={() => requestSort('cost')}>
                      Cost {getSortIndicator('cost')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[200px]">Receipt</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const receipt = receipts.find(r => r.id === item.receiptId);
                    const currency = receipt?.currency || globalCurrency;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          <div className='flex justify-center'>
                              <Switch
                                  id={`ambiguous-${item.id}`}
                                  checked={item.isAmbiguous}
                                  onCheckedChange={(checked) => dispatch(updateItem({ id: item.id, isAmbiguous: checked }))}
                                  aria-label="Toggle ambiguous flag"
                              />
                              {item.isAmbiguous && <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />}
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="max-w-[250px] truncate">{item.name}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{item.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {(item.cost / 100).toLocaleString(undefined, { style: 'currency', currency })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{receipt?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => dispatch(removeItem(item.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ItemEditDialog 
        item={editingItem}
        isOpen={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleSaveItem}
      />
    </>
  );
}

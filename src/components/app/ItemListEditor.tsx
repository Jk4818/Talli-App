"use client";

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Trash2, AlertTriangle, ArrowUpDown, ListOrdered } from 'lucide-react';
import { updateItem, removeItem, addItem } from '@/lib/redux/slices/sessionSlice';

export default function ItemListEditor() {
  const { items, receipts } = useSelector((state: RootState) => state.session);
  const dispatch = useDispatch<AppDispatch>();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'cost'; direction: 'asc' | 'desc' } | null>(null);

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

  const handleCostChange = (itemId: string, newCost: string) => {
    const costInCents = Math.round(parseFloat(newCost) * 100);
    if (!isNaN(costInCents)) {
        dispatch(updateItem({ id: itemId, cost: costInCents }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div className='flex items-center gap-4'>
                <ListOrdered className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle>Item List</CardTitle>
                    <CardDescription>Review and edit all items from your receipts.</CardDescription>
                </div>
            </div>
            <div className='flex gap-2 items-center'>
                 <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
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
                      <TableCell>
                        <Input
                          value={item.name}
                          onChange={(e) => dispatch(updateItem({ id: item.id, name: e.target.value }))}
                          className="border-none bg-transparent focus-visible:ring-1"
                          aria-label={`Item name for ${item.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={(item.cost / 100).toFixed(2)}
                          onBlur={(e) => handleCostChange(item.id, e.target.value)}
                          onChange={(e) => dispatch(updateItem({ id: item.id, cost: Math.round(parseFloat(e.target.value)*100) || 0 }))}
                          className="border-none bg-transparent focus-visible:ring-1"
                          aria-label={`Cost for ${item.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{receipt?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
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
  );
}

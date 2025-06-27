
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Spline } from 'lucide-react';

interface Node {
  id: string;
  type: 'participant' | 'item';
  label: string;
  secondaryLabel?: string;
  ref: React.RefObject<HTMLDivElement>;
  connections: string[];
}

interface Position {
  x: number;
  y: number;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ItemSplitDiagram() {
  const { participants, items, globalCurrency } = useSelector((state: RootState) => state.session);
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => (amount / 100).toLocaleString(undefined, { style: 'currency', currency: globalCurrency });

  const nodes = useMemo(() => {
    const participantNodes: Node[] = participants.map(p => ({
      id: p.id,
      type: 'participant',
      label: p.name,
      ref: React.createRef<HTMLDivElement>(),
      connections: items.filter(item => item.assignees.includes(p.id)).map(item => item.id),
    }));

    const itemNodes: Node[] = items.filter(i => i.cost > 0).map(item => ({
      id: item.id,
      type: 'item',
      label: item.name,
      secondaryLabel: formatCurrency(item.cost),
      ref: React.createRef<HTMLDivElement>(),
      connections: item.assignees,
    }));

    return { participantNodes, itemNodes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, items, globalCurrency]);

  useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPositions: Record<string, Position> = {};

      [...nodes.participantNodes, ...nodes.itemNodes].forEach(node => {
        if (node.ref.current) {
          const nodeRect = node.ref.current.getBoundingClientRect();
          const x = nodeRect.left - containerRect.left + nodeRect.width / 2;
          const y = nodeRect.top - containerRect.top + nodeRect.height / 2;
          newPositions[node.id] = { x, y };
        }
      });
      setPositions(newPositions);
    };

    calculatePositions();

    const resizeObserver = new ResizeObserver(calculatePositions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [nodes]);

  const isHighlighted = (node: Node) => {
    if (!highlightedId) return false;
    if (node.id === highlightedId) return true;
    const highlightedNode = [...nodes.participantNodes, ...nodes.itemNodes].find(n => n.id === highlightedId);
    return highlightedNode?.connections.includes(node.id) ?? false;
  }
  
  const isLineHighlighted = (itemNodeId: string, participantNodeId: string) => {
    if (!highlightedId) return false;
    if (highlightedId === itemNodeId || highlightedId === participantNodeId) return true;
    return false;
  }

  const renderNode = (node: Node) => (
    <motion.div
      ref={node.ref}
      key={node.id}
      layout
      onMouseEnter={() => setHighlightedId(node.id)}
      onMouseLeave={() => setHighlightedId(null)}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border bg-card p-2 shadow-sm transition-all duration-300",
        isHighlighted(node) ? 'bg-primary/10 border-primary scale-105 shadow-lg' : 'opacity-80 hover:opacity-100',
        !highlightedId && 'opacity-100'
      )}
    >
      {node.type === 'participant' && (
        <Avatar className="h-8 w-8 text-xs">
          <AvatarFallback>{getInitials(node.label)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{node.label}</p>
          {node.secondaryLabel && <p className="text-xs text-muted-foreground">{node.secondaryLabel}</p>}
      </div>
    </motion.div>
  );

  return (
    <Card>
      <CardHeader className='flex-row items-center gap-4 space-y-0'>
        <Spline className="w-8 h-8 text-primary" />
        <div>
          <CardTitle>Item Split Diagram</CardTitle>
          <CardDescription>Visualize who shared which items. Hover to highlight connections.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full min-h-[300px]">
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <AnimatePresence>
              {nodes.itemNodes.map(itemNode =>
                itemNode.connections.map(participantId => {
                  const itemPos = positions[itemNode.id];
                  const participantPos = positions[participantId];

                  if (!itemPos || !participantPos) return null;
                  
                  const lineIsHighlighted = isLineHighlighted(itemNode.id, participantId);
                  
                  const pathData = `M ${participantPos.x} ${participantPos.y} C ${participantPos.x + 50} ${participantPos.y}, ${itemPos.x - 50} ${itemPos.y}, ${itemPos.x} ${itemPos.y}`;

                  return (
                    <motion.path
                      key={`${itemNode.id}-${participantId}`}
                      d={pathData}
                      fill="none"
                      strokeWidth={2}
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ 
                        opacity: lineIsHighlighted ? 1 : 0.3,
                        pathLength: 1,
                        stroke: lineIsHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                  );
                })
              )}
            </AnimatePresence>
          </svg>
           <div className="flex justify-between items-start gap-8">
            <div className="w-2/5 space-y-2 relative" style={{ zIndex: 1 }}>{nodes.participantNodes.map(renderNode)}</div>
            <div className="w-3/5 space-y-2 relative" style={{ zIndex: 1 }}>{nodes.itemNodes.map(renderNode)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

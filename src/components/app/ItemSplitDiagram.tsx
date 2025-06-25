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

interface NodePositions {
  left: Position;
  right: Position;
  top: Position;
  bottom: Position;
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
  const isMobile = useSelector((state: RootState) => state.ui.isMobile);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePositions>>({});
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
      const newPositions: Record<string, NodePositions> = {};

      [...nodes.participantNodes, ...nodes.itemNodes].forEach(node => {
        if (node.ref.current) {
          const nodeRect = node.ref.current.getBoundingClientRect();
          const y_mid = nodeRect.top - containerRect.top + nodeRect.height / 2;
          const x_mid = nodeRect.left - containerRect.left + nodeRect.width / 2;
          
          newPositions[node.id] = {
            left: { x: nodeRect.left - containerRect.left, y: y_mid },
            right: { x: nodeRect.right - containerRect.left, y: y_mid },
            top: { x: x_mid, y: nodeRect.top - containerRect.top },
            bottom: { x: x_mid, y: nodeRect.bottom - containerRect.top },
          };
        }
      });
      setNodePositions(newPositions);
    };

    calculatePositions();
    const timer = setTimeout(calculatePositions, 100);
    const resizeObserver = new ResizeObserver(calculatePositions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
        resizeObserver.disconnect();
        clearTimeout(timer);
    }
  }, [nodes, isMobile]);

  const handleNodeClick = (nodeId: string) => {
    setHighlightedId(currentId => (currentId === nodeId ? null : nodeId));
  };

  const isHighlighted = (node: Node) => {
    if (!highlightedId) return false;
    if (node.id === highlightedId) return true;
    const highlightedNode = [...nodes.participantNodes, ...nodes.itemNodes].find(n => n.id === highlightedId);
    return highlightedNode?.connections.includes(node.id) ?? false;
  }
  
  const isLineHighlighted = (itemNodeId: string, participantNodeId: string) => {
    if (!highlightedId) return false;
    return highlightedId === itemNodeId || highlightedId === participantNodeId;
  }

  const renderNode = (node: Node) => (
    <motion.div
      ref={node.ref}
      key={node.id}
      layout
      onClick={() => handleNodeClick(node.id)}
      className={cn(
        "relative z-10 flex items-center gap-3 rounded-lg border bg-card p-2 shadow-sm transition-all duration-300 cursor-pointer",
        highlightedId
          ? (isHighlighted(node)
            ? 'border-primary shadow-lg ring-2 ring-primary/50 bg-primary/10'
            : 'opacity-30')
          : 'hover:bg-accent hover:text-accent-foreground'
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
          <CardDescription>Visualize who shared which items. Tap to highlight connections.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full min-h-[400px] isolate md:pl-0 pl-10" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setHighlightedId(null);
          }
        }}>
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
            <AnimatePresence>
              {nodes.itemNodes.map(itemNode =>
                itemNode.connections.map(participantId => {
                  const itemPos = nodePositions[itemNode.id];
                  const participantPos = nodePositions[participantId];

                  if (!itemPos || !participantPos) return null;
                  
                  const lineIsHighlighted = isLineHighlighted(itemNode.id, participantId);
                  
                  // On desktop, connect from participant's right to item's left.
                  // On mobile, connect from participant's left to item's left.
                  const start = isMobile ? participantPos.left : participantPos.right;
                  const end = itemPos.left;
                  
                  let pathData: string;

                  if (isMobile) {
                    const curveOffset = 40; // How far out the C-curve bows for vertical layout
                    pathData = `M ${start.x} ${start.y} C ${start.x - curveOffset} ${start.y}, ${end.x - curveOffset} ${end.y}, ${end.x} ${end.y}`;
                  } else {
                    const curveOffset = 60; // How far out the S-curve bows for horizontal layout
                    pathData = `M ${start.x} ${start.y} C ${start.x + curveOffset} ${start.y}, ${end.x - curveOffset} ${end.y}, ${end.x} ${end.y}`;
                  }

                  return (
                    <motion.path
                      key={`${itemNode.id}-${participantId}`}
                      d={pathData}
                      fill="none"
                      strokeWidth={2}
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ 
                        opacity: lineIsHighlighted ? 1 : (highlightedId ? 0.1 : 0.3),
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
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24">
            <div className="space-y-2">{nodes.participantNodes.map(renderNode)}</div>
            <div className="space-y-2">{nodes.itemNodes.map(renderNode)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

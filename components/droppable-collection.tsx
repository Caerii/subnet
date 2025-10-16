'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import type { Collection } from '@/lib/types';

interface DroppableCollectionProps {
  collection: Collection;
  onAddAgents: (collection: Collection) => void;
  onViewCollection: (collectionId: string) => void;
  activeAgent?: any;
}

export function DroppableCollection({
  collection,
  onAddAgents,
  onViewCollection,
  activeAgent,
}: DroppableCollectionProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `collection-${collection.id}`,
    disabled: activeAgent && activeAgent.collectionId === collection.id,
  });

  const isAgentInCollection = activeAgent && activeAgent.collectionId === collection.id;
  const isDisabled = activeAgent && isAgentInCollection;

  return (
    <Card
      ref={setNodeRef}
      className={`group border-border/50 hover:border-border relative transition-all duration-200 hover:shadow-lg ${
        isOver && !isDisabled ? 'ring-primary bg-primary/5 scale-95 ring-2 ring-offset-2' : ''
      } ${isDisabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={() => !isDisabled && onViewCollection(collection.id)}
    >
      <div className="p-2">
        <div className="mb-1 flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full ring-1 ring-black/10 ring-offset-1"
            style={{ backgroundColor: collection.color }}
          />
          <CardTitle className="line-clamp-1 text-sm font-semibold">{collection.name}</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground mb-1 line-clamp-1 text-xs">
          {collection.description}
        </CardDescription>
        <div className="mb-1 flex items-center justify-between">
          <Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-normal">
            {collection.agentCount} agent{collection.agentCount !== 1 ? 's' : ''}
          </Badge>
          {isOver && !isDisabled && (
            <div className="text-primary text-xs font-medium">Drop here</div>
          )}
          {isDisabled && activeAgent && (
            <div className="text-muted-foreground text-xs font-medium">
              Agent already in collection
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddAgents(collection);
          }}
          className="text-muted-foreground hover:text-foreground h-7 w-full text-xs"
        >
          <Users className="mr-1.5 h-3 w-3" />
          Add Agents
        </Button>
      </div>
    </Card>
  );
}

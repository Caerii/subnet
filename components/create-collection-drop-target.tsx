'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface CreateCollectionDropTargetProps {
  onCreateCollection: () => void;
}

export function CreateCollectionDropTarget({
  onCreateCollection,
}: CreateCollectionDropTargetProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'create-collection',
  });

  return (
    <Card
      ref={setNodeRef}
      className={`group border-border/50 hover:border-border relative cursor-pointer border-dashed transition-all duration-200 hover:shadow-lg ${
        isOver ? 'ring-primary bg-primary/5 scale-95 ring-2 ring-offset-2' : ''
      }`}
      onClick={onCreateCollection}
    >
      <CardContent className="p-2">
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <Plus className="text-muted-foreground h-6 w-6" />
          <div className="text-center">
            <div className="text-muted-foreground text-sm font-medium">
              {isOver ? 'Drop to create collection' : 'Create Collection'}
            </div>
            <div className="text-muted-foreground text-xs">Drag agent here</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import type { Collection } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionCreated: (collection: Collection) => void;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCollectionCreated,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{
    message: string;
    existingCollection: any;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setIsCreating(true);
    setDuplicateError(null);

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color: selectedColor,
        }),
      });

      if (res.status === 409) {
        // Duplicate name error
        const errorData = await res.json();
        setDuplicateError({
          message: errorData.error,
          existingCollection: errorData.existingCollection,
        });
        return;
      }

      if (!res.ok) throw new Error('Failed to create collection');
      const newCollection = await res.json();
      onCollectionCreated(newCollection);
      setName('');
      setDescription('');
      setSelectedColor(COLORS[0]);
      setDuplicateError(null);
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReplace = async () => {
    if (!duplicateError) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color: selectedColor,
          replaceExisting: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to replace collection');
      const updatedCollection = await res.json();
      onCollectionCreated(updatedCollection);
      setName('');
      setDescription('');
      setSelectedColor(COLORS[0]);
      setDuplicateError(null);
    } catch (error) {
      console.error('Error replacing collection:', error);
      alert('Failed to replace collection. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setDuplicateError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Organize your agents into themed collections for better discovery.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Collection Name</div>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDuplicateError(null);
                }}
                placeholder="e.g., Research Tools, Creative Writing"
                required
              />
              {duplicateError && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                  <div className="text-sm text-yellow-800">
                    <strong>
                      A collection named "{duplicateError.existingCollection.name}" already exists.
                    </strong>
                    <div className="mt-1 text-xs">
                      Description: {duplicateError.existingCollection.description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this collection is for..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Color</div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'scale-110 border-gray-900'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setDuplicateError(null);
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            {duplicateError ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDuplicateError(null)}
                  disabled={isCreating}
                >
                  Change Name
                </Button>
                <Button
                  type="button"
                  onClick={handleReplace}
                  disabled={isCreating}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isCreating ? 'Replacing...' : 'Replace Collection'}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={isCreating || !name.trim() || !description.trim()}>
                {isCreating ? 'Creating...' : 'Create Collection'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

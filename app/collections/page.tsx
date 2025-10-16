'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Collection } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Trash2, Users } from 'lucide-react';
import { CreateCollectionDialog } from '@/components/create-collection-dialog';
import { AddAgentsDialog } from '@/components/add-agents-dialog';

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddAgentsDialog, setShowAddAgentsDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/collections');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollections();
  }, []);

  const handleDelete = async (collectionId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this collection? This will remove all agents from the collection.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      setCollections(collections.filter((c) => c.id !== collectionId));
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection. Please try again.');
    }
  };

  const handleCollectionCreated = (newCollection: Collection) => {
    setCollections([newCollection, ...collections]);
    setShowCreateDialog(false);
  };

  const handleAddAgents = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowAddAgentsDialog(true);
  };

  const handleAgentsAdded = () => {
    // Refresh collections to update agent counts
    fetchCollections();
    setShowAddAgentsDialog(false);
    setSelectedCollection(null);
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2 text-4xl font-bold">Collections</h1>
            <p className="text-muted-foreground">
              Organize agents into themed collections for better discovery
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <p className="text-muted-foreground mb-4 text-lg">
              No collections yet. Create your first collection to organize agents!
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="group border-border/50 hover:border-border relative transition-all duration-200 hover:shadow-lg"
              >
                <div className="p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full ring-1 ring-black/10 ring-offset-1"
                        style={{ backgroundColor: collection.color }}
                      />
                      <CardTitle className="line-clamp-1 text-sm font-semibold">
                        {collection.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-6 w-6 opacity-0 transition-colors group-hover:opacity-100"
                      onClick={() => handleDelete(collection.id)}
                      title="Delete collection"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="text-muted-foreground mb-1 line-clamp-1 text-xs">
                    {collection.description}
                  </CardDescription>
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-normal">
                      {collection.agentCount} agent{collection.agentCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/collections/${collection.id}`)}
                      className="group-hover:bg-primary group-hover:text-primary-foreground h-7 w-full text-xs transition-colors"
                    >
                      <span className="inline-block transition-transform group-hover:translate-x-0.5">
                        View Collection
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddAgents(collection)}
                      className="text-muted-foreground hover:text-foreground h-7 w-full text-xs"
                    >
                      <Users className="mr-1.5 h-3 w-3" />
                      Add Agents
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateCollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCollectionCreated={handleCollectionCreated}
      />

      {selectedCollection && (
        <AddAgentsDialog
          open={showAddAgentsDialog}
          onOpenChange={setShowAddAgentsDialog}
          collectionId={selectedCollection.id}
          collectionName={selectedCollection.name}
          onAgentsAdded={handleAgentsAdded}
        />
      )}
    </div>
  );
}

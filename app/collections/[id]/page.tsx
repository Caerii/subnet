'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Agent, Collection } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentCard } from '@/components/agent-card';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { AddAgentsDialog } from '@/components/add-agents-dialog';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAgentsDialog, setShowAddAgentsDialog] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [params.id, router]);

  const handleFork = (agent: Agent) => {
    const params = new URLSearchParams({
      fork: 'true',
      title: `${agent.title} (Fork)`,
      description: agent.description,
      prompt: agent.prompt,
      tools: agent.tools.join(','),
      collectionId: collection?.id || 'none',
    });
    router.push(`/create?${params.toString()}`);
  };

  const handleAgentsAdded = () => {
    // Refresh the collection to show updated agents
    fetchCollection();
    setShowAddAgentsDialog(false);
  };

  const fetchCollection = async () => {
    const id = params.id as string;

    try {
      const response = await fetch(`/api/collections/${id}`);

      if (!response.ok) {
        router.push('/collections');
        return;
      }

      const data = await response.json();
      setCollection(data);
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching collection:', error);
      router.push('/collections');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading collection...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/collections')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: collection.color }}
                />
                <h1 className="text-foreground text-4xl font-bold">{collection.name}</h1>
              </div>
              <p className="text-muted-foreground mb-4 text-lg">{collection.description}</p>
              <Badge variant="secondary">
                {agents.length} agent{agents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddAgentsDialog(true)}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <Users className="mr-2 h-4 w-4" />
                Add Existing Agents
              </Button>
              <Button
                onClick={() => {
                  const params = new URLSearchParams({
                    collectionId: collection.id,
                  });
                  router.push(`/create?${params.toString()}`);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Agent
              </Button>
            </div>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              This collection is empty. Add your first agent!
            </p>
            <Button
              onClick={() => {
                const params = new URLSearchParams({
                  collectionId: collection.id,
                });
                router.push(`/create?${params.toString()}`);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={(agentId) => {
                  setAgents(agents.filter((a) => a.id !== agentId));
                  // Refresh the collection to update agent count
                  fetchCollection();
                }}
                onFork={handleFork}
              />
            ))}
          </div>
        )}
      </main>

      {collection && (
        <AddAgentsDialog
          open={showAddAgentsDialog}
          onOpenChange={setShowAddAgentsDialog}
          collectionId={collection.id}
          collectionName={collection.name}
          onAgentsAdded={handleAgentsAdded}
        />
      )}
    </div>
  );
}

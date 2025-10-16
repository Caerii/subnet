'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent, Collection } from '@/lib/types';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import { DraggableAgentCard } from '@/components/draggable-agent-card';
import { AgentListView } from '@/components/agent-list-view';
import { AgentTableView } from '@/components/agent-table-view';
import { DroppableCollection } from '@/components/droppable-collection';
import { CreateCollectionDialog } from '@/components/create-collection-dialog';
import { CreateCollectionDropTarget } from '@/components/create-collection-drop-target';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderOpen, Plus, Search, Filter, Sparkles, Grid3X3, List, Table } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function HomePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] = useState(false);
  const [agentToAddToCollection, setAgentToAddToCollection] = useState<Agent | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'table'>('card');
  const [cardDensity, setCardDensity] = useState(4); // 2-6 columns

  // Load view preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('agentViewMode') as 'card' | 'list' | 'table' | null;
    const savedCardDensity = localStorage.getItem('agentCardDensity');

    if (savedViewMode) setViewMode(savedViewMode);
    if (savedCardDensity) setCardDensity(parseInt(savedCardDensity));
  }, []);

  // Save view preferences to localStorage
  useEffect(() => {
    localStorage.setItem('agentViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('agentCardDensity', cardDensity.toString());
  }, [cardDensity]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch agents
        const agentsResponse = await fetch('/api/agents');
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json();
          setAgents(agentsData);
        }

        // Fetch collections
        const collectionsResponse = await fetch('/api/collections');
        if (collectionsResponse.ok) {
          const collectionsData = await collectionsResponse.json();
          setCollections(collectionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter agents by collection
  useEffect(() => {
    async function fetchFilteredAgents() {
      try {
        const url = selectedCollection
          ? `/api/agents?collectionId=${selectedCollection}`
          : '/api/agents';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    }

    fetchFilteredAgents();
  }, [selectedCollection]);

  const handleFork = (agent: Agent) => {
    // Navigate to create page with pre-filled data
    const params = new URLSearchParams({
      fork: 'true',
      title: `${agent.title} (Fork)`,
      description: agent.description,
      prompt: agent.prompt,
      tools: agent.tools.join(','),
      collectionId: agent.collectionId || 'none',
    });
    router.push(`/create?${params.toString()}`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const agent = agents.find((a) => a.id === active.id);
    setActiveAgent(agent || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAgent(null);

    if (!over) return;

    const agentId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a collection
    if (overId.startsWith('collection-')) {
      const collectionId = overId.replace('collection-', '');

      // Check if agent is already in this collection
      const agent = agents.find((a) => a.id === agentId);
      if (agent && agent.collectionId === collectionId) {
        // Agent is already in this collection, don't do anything
        return;
      }

      try {
        const response = await fetch(`/api/agents/${agentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionId }),
        });

        if (response.ok) {
          // Update local state
          setAgents(
            agents.map((agent) => (agent.id === agentId ? { ...agent, collectionId } : agent)),
          );

          // Refresh collections to update counts
          fetchCollections();
        }
      } catch (error) {
        console.error('Error moving agent to collection:', error);
      }
    }
    // Check if dropping on create collection target
    else if (overId === 'create-collection') {
      // Store the agent to add to the new collection
      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        setAgentToAddToCollection(agent);
        setShowCreateCollectionDialog(true);
      }
    }
  };

  const handleAddAgents = (collection: Collection) => {
    // This will be handled by the collections page
    router.push(`/collections/${collection.id}`);
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleCollectionCreated = async (newCollection: Collection) => {
    setCollections([newCollection, ...collections]);
    setShowCreateCollectionDialog(false);

    // If there's an agent to add to the new collection, assign it
    if (agentToAddToCollection) {
      try {
        const response = await fetch(`/api/agents/${agentToAddToCollection.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionId: newCollection.id }),
        });

        if (response.ok) {
          // Update local state
          setAgents(
            agents.map((agent) =>
              agent.id === agentToAddToCollection.id
                ? { ...agent, collectionId: newCollection.id }
                : agent,
            ),
          );
          // Refresh collections to update counts
          fetchCollections();
        }
      } catch (error) {
        console.error('Error adding agent to new collection:', error);
      }

      // Clear the agent to add
      setAgentToAddToCollection(null);
    }
  };

  // Filter and sort agents
  const filteredAndSortedAgents = agents
    .filter((agent) => {
      const matchesSearch =
        searchTerm === '' ||
        agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.tools.some((tool) => tool.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'tools':
          return b.tools.length - a.tools.length;
        default:
          return 0;
      }
    });

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-6">
              <h1 className="text-foreground mb-4 text-5xl font-bold tracking-tight">
                Build with Subconscious TIM
              </h1>
              <p className="text-muted-foreground max-w-2xl text-xl leading-relaxed">
                Create, fork, share, and discover AI agents powered by Subconscious TIM models.
                Organize your agents into collections and manage them with intuitive controls.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={() => router.push('/create')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Create TIM Agent
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/collections')}
                className="h-12 px-8 text-lg"
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                Explore Collections
              </Button>
            </div>

            {/* Drag & Drop Hint */}
            {agents.length > 0 && (
              <div className="border-muted-foreground/25 bg-muted/10 mt-8 rounded-lg border border-dashed p-4">
                <p className="text-muted-foreground text-sm">
                  💡 <strong>Tip:</strong> Drag agents to collections, or use the buttons to fork,
                  share, and manage them
                </p>
              </div>
            )}
          </div>

          {/* Collections Section */}
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-foreground text-2xl font-semibold">
                {collections.length > 0 ? 'Featured Collections' : 'Collections'}
              </h2>
              <Button variant="outline" onClick={() => setShowCreateCollectionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Button>
            </div>

            {collections.length > 0 ? (
              <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex gap-3 overflow-x-auto pb-2">
                {collections.map((collection) => (
                  <div key={collection.id} className="w-32 flex-shrink-0">
                    <DroppableCollection
                      collection={collection}
                      onAddAgents={handleAddAgents}
                      onViewCollection={(collectionId) => setSelectedCollection(collectionId)}
                      activeAgent={activeAgent}
                    />
                  </div>
                ))}
                {activeAgent && (
                  <div className="w-32 flex-shrink-0">
                    <CreateCollectionDropTarget
                      onCreateCollection={() => setShowCreateCollectionDialog(true)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex gap-3 overflow-x-auto pb-2">
                {activeAgent ? (
                  <div className="w-32 flex-shrink-0">
                    <CreateCollectionDropTarget
                      onCreateCollection={() => setShowCreateCollectionDialog(true)}
                    />
                  </div>
                ) : (
                  <div className="border-muted-foreground/25 bg-muted/5 min-w-32 rounded-lg border border-dashed p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FolderOpen className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground text-sm">No collections yet</span>
                      <Button
                        onClick={() => setShowCreateCollectionDialog(true)}
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 h-6 px-2 text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Create
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agents Section */}
          <div className="mb-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-foreground text-2xl font-semibold">
                  {selectedCollection ? 'Agents in Collection' : 'All Agents'}
                </h2>
                {selectedCollection && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedCollection(null)}>
                    Clear Filter
                  </Button>
                )}
              </div>

              {/* Search and Sort Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:w-64"
                  />
                </div>

                {/* Density Slider (only for card view) */}
                <div
                  className={`flex min-w-0 items-center gap-2 overflow-hidden transition-all duration-300 ${
                    viewMode === 'card' ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  <span className="text-muted-foreground text-xs whitespace-nowrap">Density</span>
                  <Slider
                    value={[cardDensity]}
                    onValueChange={(value) => setCardDensity(value[0])}
                    min={2}
                    max={6}
                    step={1}
                    className="w-20"
                  />
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {cardDensity}
                  </span>
                </div>

                {/* View Mode Toggles */}
                <div className="flex items-center gap-1 rounded-lg border p-1">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="tools">Most Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            {!isLoading && (
              <div className="text-muted-foreground mb-4 text-sm">
                {filteredAndSortedAgents.length} agent
                {filteredAndSortedAgents.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-lg">Loading agents...</p>
            </div>
          ) : filteredAndSortedAgents.length === 0 ? (
            <div className="py-16 text-center">
              {searchTerm ? (
                <div>
                  <Search className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                  <h3 className="mb-2 text-lg font-semibold">No agents found</h3>
                  <p className="text-muted-foreground mb-6">
                    No agents match your search for "{searchTerm}". Try a different search term.
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </div>
              ) : agents.length === 0 ? (
                <div>
                  <Sparkles className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                  <h3 className="mb-2 text-lg font-semibold">No agents yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI agent to get started with SubNet!
                  </p>
                  <Button
                    onClick={() => router.push('/create')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Agent
                  </Button>
                </div>
              ) : (
                <div>
                  <Filter className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                  <h3 className="mb-2 text-lg font-semibold">No agents in this collection</h3>
                  <p className="text-muted-foreground mb-6">
                    This collection is empty. Add some agents to get started!
                  </p>
                  <Button variant="outline" onClick={() => setSelectedCollection(null)}>
                    View All Agents
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <SortableContext
                  items={filteredAndSortedAgents.map((agent) => agent.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: `repeat(${cardDensity}, minmax(0, 1fr))` }}
                  >
                    {filteredAndSortedAgents.map((agent) => (
                      <DraggableAgentCard
                        key={agent.id}
                        agent={agent}
                        onDelete={(agentId) => {
                          setAgents(agents.filter((a) => a.id !== agentId));
                          fetchCollections();
                        }}
                        onFork={handleFork}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredAndSortedAgents.map((agent) => (
                    <AgentListView
                      key={agent.id}
                      agent={agent}
                      onDelete={(agentId) => {
                        setAgents(agents.filter((a) => a.id !== agentId));
                        fetchCollections();
                      }}
                      onFork={handleFork}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                          Agent
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                          Tools
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                          Created
                        </th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedAgents.map((agent) => (
                        <AgentTableView
                          key={agent.id}
                          agent={agent}
                          onDelete={(agentId) => {
                            setAgents(agents.filter((a) => a.id !== agentId));
                            fetchCollections();
                          }}
                          onFork={handleFork}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>

        <DragOverlay>
          {activeAgent ? (
            <div className="opacity-50">
              <AgentCard agent={activeAgent} />
            </div>
          ) : null}
        </DragOverlay>

        <CreateCollectionDialog
          open={showCreateCollectionDialog}
          onOpenChange={(open) => {
            setShowCreateCollectionDialog(open);
            if (!open) {
              setAgentToAddToCollection(null);
            }
          }}
          onCollectionCreated={handleCollectionCreated}
        />
      </DndContext>
    </div>
  );
}

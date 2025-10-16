'use client';

import { useState, useEffect } from 'react';
import type { Agent } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AddAgentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionName: string;
  onAgentsAdded: () => void;
}

export function AddAgentsDialog({
  open,
  onOpenChange,
  collectionId,
  collectionName,
  onAgentsAdded,
}: AddAgentsDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open) fetchAgents();
  }, [open]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const allAgents = await res.json();
        // Show all agents, not just unassigned ones
        setAgents(allAgents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAgents = async () => {
    if (selectedAgentIds.length === 0) return;
    setIsAdding(true);
    try {
      await Promise.all(
        selectedAgentIds.map((agentId) =>
          fetch(`/api/agents/${agentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collectionId }),
          }),
        ),
      );
      onAgentsAdded();
      setSelectedAgentIds([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding agents:', error);
      alert('Failed to add agents. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Check if agent is already in the target collection
  const isAgentInTargetCollection = (agent: Agent) => agent.collectionId === collectionId;

  // Check if agent is in any collection
  const isAgentInAnyCollection = (agent: Agent) => agent.collectionId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Agents to "{collectionName}"</DialogTitle>
          <DialogDescription>Select existing agents to add to this collection.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 flex-1 space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="text-muted-foreground py-8 text-center">Loading agents...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {searchTerm ? 'No agents match your search.' : 'No agents available.'}
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const isInTargetCollection = isAgentInTargetCollection(agent);
                const isInAnyCollection = isAgentInAnyCollection(agent);
                const isDisabled = isInTargetCollection;

                return (
                  <div
                    key={agent.id}
                    className={`flex items-start space-x-3 rounded-lg border p-3 transition-colors ${
                      isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      id={agent.id}
                      checked={selectedAgentIds.includes(agent.id)}
                      disabled={isDisabled}
                      onCheckedChange={() =>
                        !isDisabled &&
                        setSelectedAgentIds((prev) =>
                          prev.includes(agent.id)
                            ? prev.filter((id) => id !== agent.id)
                            : [...prev, agent.id],
                        )
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={agent.id}
                        className={`block ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="line-clamp-1 text-sm font-medium">{agent.title}</span>
                          {isInTargetCollection && (
                            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                              Already in collection
                            </Badge>
                          )}
                          {isInAnyCollection && !isInTargetCollection && (
                            <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
                              In another collection
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                          {agent.description}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {agent.tools.slice(0, 3).map((tool) => (
                            <Badge key={tool} variant="secondary" className="px-1.5 py-0.5 text-xs">
                              {tool}
                            </Badge>
                          ))}
                          {agent.tools.length > 3 && (
                            <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
                              +{agent.tools.length - 3}
                            </Badge>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            onClick={handleAddAgents}
            disabled={selectedAgentIds.length === 0 || isAdding}
            className="bg-primary hover:bg-primary/90"
          >
            {isAdding
              ? 'Adding...'
              : `Add ${selectedAgentIds.length} Agent${selectedAgentIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

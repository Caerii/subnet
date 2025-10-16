'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Share2, Check, GitFork } from 'lucide-react';
import { AVAILABLE_TOOLS } from '@/lib/types';

interface AgentCardProps {
  agent: Agent;
  onDelete?: (agentId: string) => void;
  onFork?: (agent: Agent) => void;
}

export function AgentCard({ agent, onDelete, onFork }: AgentCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${agent.title}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete agent');
      onDelete?.(agent.id);
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveFromCollection = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!agent.collectionId) return;

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: null }),
      });

      if (res.ok) {
        // Update local state to remove from collection
        onDelete?.(agent.id);
      } else {
        throw new Error('Failed to remove from collection');
      }
    } catch (error) {
      console.error('Error removing from collection:', error);
      alert('Failed to remove from collection. Please try again.');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Create clean URL with minimal query parameters
    const baseUrl = `${window.location.origin}/run/${agent.id}`;
    const params = new URLSearchParams();

    // Only include essential sharing context
    params.set('shared', 'true');

    // Add collection context if available (for better UX)
    if (agent.collectionId) {
      params.set('c', agent.collectionId);
    }

    const shareUrl = `${baseUrl}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Card className="group border-border/50 hover:border-border relative flex h-full min-h-[200px] flex-col transition-all duration-200 hover:shadow-lg">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="mb-2 line-clamp-1 h-6 text-lg leading-tight font-semibold">
              {agent.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground h-10 overflow-hidden text-sm leading-relaxed">
              <div className="line-clamp-2">{agent.description}</div>
            </CardDescription>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-7 w-7 transition-colors hover:bg-green-50 hover:text-green-600"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFork?.(agent);
              }}
              title="Fork agent"
            >
              <GitFork className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-7 w-7 transition-colors hover:bg-blue-50 hover:text-blue-600"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleShare}
              title="Share agent"
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            </Button>
            {agent.collectionId ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground h-7 w-7 transition-colors hover:bg-orange-50 hover:text-orange-600"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleRemoveFromCollection}
                title="Remove from collection"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7 transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete agent"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-shrink-0 pb-3">
        <div className="flex h-12 items-start gap-2">
          <span className="text-muted-foreground mt-1 flex-shrink-0 text-xs font-medium">
            Tools
          </span>
          <div className="flex min-h-0 flex-wrap gap-1.5">
            {agent.tools.slice(0, 3).map((tool) => (
              <Badge
                key={tool}
                variant="secondary"
                className="flex-shrink-0 px-2 py-0.5 text-xs font-normal"
              >
                {AVAILABLE_TOOLS.find((t) => t.value === tool)?.label}
              </Badge>
            ))}
            {agent.tools.length > 3 && (
              <Badge variant="outline" className="flex-shrink-0 px-2 py-0.5 text-xs font-normal">
                +{agent.tools.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-shrink-0 pt-0">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 group h-9 w-full transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => router.push(`/run/${agent.id}`)}
        >
          <span className="inline-block transition-transform group-hover:translate-x-0.5">
            Run Agent
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}

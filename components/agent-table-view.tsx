'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Share2, Check, GitFork } from 'lucide-react';
import { AVAILABLE_TOOLS } from '@/lib/types';

interface AgentTableViewProps {
  agent: Agent;
  onDelete?: (agentId: string) => void;
  onFork?: (agent: Agent) => void;
}

export function AgentTableView({ agent, onDelete, onFork }: AgentTableViewProps) {
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
    const shareUrl = `${window.location.origin}/run/${agent.id}`;
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
    <tr className="group hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <div className="line-clamp-1 text-sm font-medium">{agent.title}</div>
          <div className="text-muted-foreground mt-1 line-clamp-1 text-xs">{agent.description}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {agent.tools.slice(0, 2).map((tool) => (
            <Badge key={tool} variant="secondary" className="px-1.5 py-0.5 text-xs">
              {AVAILABLE_TOOLS.find((t) => t.value === tool)?.label}
            </Badge>
          ))}
          {agent.tools.length > 2 && (
            <Badge variant="outline" className="px-1.5 py-0.5 text-xs">
              +{agent.tools.length - 2}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-muted-foreground text-xs">
          {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Unknown'}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-7 w-7 hover:bg-green-50 hover:text-green-600"
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
            className="text-muted-foreground h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
            onClick={handleShare}
            title="Share agent"
          >
            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </Button>
          {agent.collectionId ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-7 w-7 hover:bg-orange-50 hover:text-orange-600"
              onClick={handleRemoveFromCollection}
              title="Remove from collection"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete agent"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs" onClick={() => router.push(`/run/${agent.id}`)}>
            Run
          </Button>
        </div>
      </td>
    </tr>
  );
}

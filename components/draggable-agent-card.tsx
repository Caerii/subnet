'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AgentCard } from './agent-card';
import type { Agent } from '@/lib/types';

interface DraggableAgentCardProps {
  agent: Agent;
  onDelete?: (agentId: string) => void;
  onFork?: (agent: Agent) => void;
}

export function DraggableAgentCard({ agent, onDelete, onFork }: DraggableAgentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: agent.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <AgentCard agent={agent} onDelete={onDelete} onFork={onFork} />
    </div>
  );
}

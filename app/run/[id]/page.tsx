'use client';

import type React from 'react';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Agent } from '@/lib/types';
import { AVAILABLE_TOOLS } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { parse } from 'partial-json';
import { cn } from '@/lib/utils';
import { LoaderCircle, GitFork } from 'lucide-react';

export default function RunAgentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [shareInfo, setShareInfo] = useState<{
    isShared: boolean;
    collectionId: string | null;
  } | null>(null);
  const reasoningRef = useRef<HTMLPreElement>(null);

  const getToolLabel = (toolValue: string) => {
    const tool = AVAILABLE_TOOLS.find((t) => t.value === toolValue);
    return tool?.label || toolValue;
  };

  useEffect(() => {
    // Parse share information from query parameters
    const isShared = searchParams.get('shared') === 'true';
    const collectionId = searchParams.get('c');

    setShareInfo({
      isShared,
      collectionId,
    });

    async function fetchAgent() {
      const id = params.id as string;

      try {
        const response = await fetch(`/api/agents/${id}`);

        if (!response.ok) {
          router.push('/');
          return;
        }

        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
        router.push('/');
      }
    }

    fetchAgent();
  }, [params.id, router, searchParams]);

  // Scroll to bottom when result updates
  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [result]);

  const handleRun = async () => {
    if (isRunning || !agent) return;

    setIsRunning(true);
    setResult('');

    try {
      const response = await fetch(`/api/agents/${agent.id}/run`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start agent');
      }

      // Get the readable stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and accumulate it
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        console.log('Accumulated text', accumulatedText);
        setResult(parse(accumulatedText));
      }

      setIsRunning(false);
    } catch (error) {
      console.error('Error running agent:', error);
      setResult('Error: Failed to run agent. Please try again.');
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResult('');
  };

  const handleFork = () => {
    if (!agent) return;

    const params = new URLSearchParams({
      fork: 'true',
      title: `${agent.title} (Fork)`,
      description: agent.description,
      prompt: agent.prompt,
      tools: agent.tools.join(','),
      collectionId: agent.collectionId || 'none',
      // Preserve sharing context
      ...(shareInfo?.isShared && { sharedFrom: 'true' }),
    });
    router.push(`/create?${params.toString()}`);
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-6">
        <Card>
          <CardHeader className="pb-3">
            {shareInfo?.isShared && (
              <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-blue-800">Shared Agent</span>
                </div>
              </div>
            )}
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-1 text-xl">{agent.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{agent.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleFork} title="Fork this agent">
                  <GitFork className="mr-1 h-4 w-4" />
                  Fork
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  Back
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.tools.map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  {getToolLabel(tool)}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Collapsible open={showPrompt} onOpenChange={setShowPrompt}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  {showPrompt ? 'Hide' : 'Show'} Instruction Set
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="prose prose-sm text-foreground bg-muted/50 max-h-96 max-w-none overflow-y-auto rounded-md border p-3 text-xs">
                  <ReactMarkdown>{agent.prompt}</ReactMarkdown>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="border-t pt-4">
              <div className="mb-4 flex gap-2">
                <Button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  {isRunning ? 'Running...' : 'Run Agent'}
                </Button>
                {result && (
                  <Button variant="outline" onClick={handleReset} disabled={isRunning}>
                    Reset
                  </Button>
                )}
              </div>

              {result && (
                <div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          'mb-2 text-sm font-semibold',
                          isRunning && 'animate-pulse text-gray-400',
                        )}
                      >
                        Reasoning & Tool Usage{' '}
                      </h3>
                      {isRunning && (
                        <div className="mb-2 flex items-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="prose prose-sm text-foreground bg-muted/50 max-w-none rounded-md border p-3">
                      <pre
                        ref={reasoningRef}
                        className="bg-background max-h-[200px] overflow-y-auto rounded p-2 text-xs"
                      >
                        <code>{JSON.stringify(result?.reasoning, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                  {result?.answer && (
                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-semibold">Final Result</h3>
                      <div className="prose prose-sm text-foreground bg-muted/50 max-w-none rounded-md border p-3">
                        <ReactMarkdown>{result?.answer}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

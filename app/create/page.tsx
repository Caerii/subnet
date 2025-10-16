'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AVAILABLE_TOOLS, type Collection } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isFork, setIsFork] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  // Handle forking from URL parameters
  useEffect(() => {
    const fork = searchParams.get('fork');
    if (fork === 'true') {
      setIsFork(true);
      setTitle(searchParams.get('title') || '');
      setDescription(searchParams.get('description') || '');
      setPrompt(searchParams.get('prompt') || '');
      const toolsParam = searchParams.get('tools');
      if (toolsParam) {
        setSelectedTools(toolsParam.split(','));
      }
    }

    // Handle collection from URL parameters
    const collectionId = searchParams.get('collectionId');
    if (collectionId) {
      setSelectedCollectionId(collectionId);
    } else {
      setSelectedCollectionId('none');
    }
  }, [searchParams]);

  // Fetch collections
  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/collections');
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    }

    fetchCollections();
  }, []);

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agent = {
      title,
      description,
      prompt,
      tools: selectedTools,
      collectionId:
        selectedCollectionId && selectedCollectionId !== 'none' ? selectedCollectionId : undefined,
    };

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      router.push('/');
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-4xl font-bold">
            {isFork ? 'Fork Agent' : 'Create New Agent'}
          </h1>
          <p className="text-muted-foreground">
            {isFork
              ? 'Customize this agent configuration to create your own version'
              : 'Configure your Subconscious agent with instructions and search tools'}
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">Agent Instructions</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="You are a search assistant that can use tools to find information. I want you to..."
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Available Tools</Label>
                <div className="space-y-3">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <div key={tool.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={tool.value}
                        checked={selectedTools.includes(tool.value)}
                        onCheckedChange={() => handleToolToggle(tool.value)}
                      />
                      <label
                        htmlFor={tool.value}
                        className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tool.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="text-muted-foreground text-sm">
                This information is purely to make your agent discoverable.
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Collection (Optional)</Label>
                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a collection or leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Collection</SelectItem>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: collection.color }}
                          />
                          {collection.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Research Assistant"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this agent does so a human can understand why they would use it."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 cursor-pointer"
                >
                  {isFork ? 'Fork Agent' : 'Create Agent'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

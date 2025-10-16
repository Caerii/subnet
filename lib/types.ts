export interface Agent {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tools: string[];
  collectionId?: string;
  createdAt?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt?: string;
  agentCount?: number;
}

export const AVAILABLE_TOOLS = [
  { value: 'parallel_search', label: 'Parallel Search' },
  { value: 'exa_search', label: 'Exa Search' },
  { value: 'exa_crawl', label: 'Exa Crawl' },
  { value: 'exa_find_similar', label: 'Exa Find Similar' },
  { value: 'web_search', label: 'Google Web Search' },
  { value: 'webpage_understanding', label: 'Jina Webpage Understanding' },
] as const;

export interface Search {
  id: string;
  name: string;
  keywords: string[];
  startDate?: string;
  endDate?: string;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
  filters?: FilterPreset[];
  collection?: Collection;
  parents?: Search[];
  derivatives?: Search[];
  articles?: Article[];
}

export interface FilterPreset {
  id: string;
  name: string;
  type: 'SENTIMENT' | 'SOURCE_TIER' | 'REGION' | 'LANGUAGE' | 'DATE_RANGE';
  value: string;
  searches?: Search[];
}

export interface SentimentSummary {
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  searches?: Search[];
  totalArticles?: number;
  sentimentSummary?: SentimentSummary;
}

export interface Article {
  id: string;
  headline: string;
  body: string;
  url: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  source?: Source;
  author?: Author;
  topics?: Topic[];
}

export interface Source {
  id: string;
  name: string;
  domain: string;
  tier: number;
  region: string;
  language: string;
}

export interface Author {
  id: string;
  name: string;
  byline?: string;
}

export interface Topic {
  id: string;
  label: string;
  category: string;
}

export interface NarrativeTrends {
  searchId: string;
  searchName: string;
  interval: string;
  totalArticles: number;
  volumeOverTime: DailyVolume[];
  sentimentBreakdown: SentimentBreakdown;
  topSources: TopSourceCount[];
  topTopics: TopTopicCount[];
}

export interface DailyVolume {
  date: string;
  volume: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  periodShift?: number;
}

export interface TopSourceCount { source: Source; count: number; }
export interface TopTopicCount  { topic: Topic;  count: number; }

export interface VolumeProjection {
  estimatedVolume: number;
  topSources: TopSourceCount[];
  note: string;
}

export interface LineageNode {
  depth: number;
  isRoot: boolean;
  search: Search;
}

export interface SearchLineage {
  root?: Search;
  nodes: LineageNode[];
  totalNodes: number;
  maxDepth: number;
  orphanCount: number;
}

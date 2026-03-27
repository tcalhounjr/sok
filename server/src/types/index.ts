import { Driver } from 'neo4j-driver';
import { Request } from 'express';

export interface ApolloContext {
  driver: Driver;
  /** Express request object — used by audit-log plugin to read originating IP. */
  req?: Request;
  /**
   * Caller identity extracted from a validated JWT Bearer token.
   * Null when the request carries no token (unauthenticated).
   */
  callerId: string | null;
}

export interface SearchNode {
  id: string;
  name: string;
  keywords: string[];
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface FilterPresetNode {
  id: string;
  name: string;
  type: 'SENTIMENT' | 'SOURCE_TIER' | 'REGION' | 'LANGUAGE' | 'DATE_RANGE';
  value: string;
}

export interface CollectionNode {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ArticleNode {
  id: string;
  headline: string;
  body: string;
  url: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface SourceNode {
  id: string;
  name: string;
  domain: string;
  tier: number;
  region: string;
  language: string;
}

export interface AuthorNode {
  id: string;
  name: string;
  byline?: string;
}

export interface TopicNode {
  id: string;
  label: string;
  category: string;
}

export interface DeleteResult {
  id: string;
  success: boolean;
  message?: string;
}

export interface DailyVolume {
  date: string;
  volume: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface TopSourceCount {
  source: SourceNode;
  count: number;
}

export interface TopTopicCount {
  topic: TopicNode;
  count: number;
}

export interface LineageNode {
  search: SearchNode;
  depth: number;
  isRoot: boolean;
}

export interface SearchLineage {
  root: SearchNode | null;
  nodes: LineageNode[];
  totalNodes: number;
  maxDepth: number;
  orphanCount: number;
}

export interface NarrativeShift {
  type: string;
  title: string;
  body: string;
  timestamp: string;
  live: boolean;
}

export interface NarrativeTrends {
  searchId: string;
  searchName: string;
  interval: string;
  volumeOverTime: DailyVolume[];
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    periodShift: number | null;
  };
  topSources: TopSourceCount[];
  topTopics: TopTopicCount[];
  totalArticles: number;
  narrativeShifts: NarrativeShift[];
}

export interface VolumeProjection {
  estimatedVolume: number;
  topSources: TopSourceCount[];
  note: string;
}

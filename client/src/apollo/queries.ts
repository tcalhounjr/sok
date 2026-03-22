import { gql } from '@apollo/client';

// ---- Fragments ----

export const SEARCH_CORE = gql`
  fragment SearchCore on Search {
    id name keywords status createdAt updatedAt startDate endDate
    filters { id name type value }
    collection { id name }
    parents { id name }
    derivatives { id name }
  }
`;

export const FILTER_PRESET_CORE = gql`
  fragment FilterPresetCore on FilterPreset {
    id name type value
  }
`;

// ---- Searches ----

export const GET_SEARCHES = gql`
  ${SEARCH_CORE}
  query GetSearches($collectionId: ID, $keyword: String, $status: SearchStatus) {
    searches(collectionId: $collectionId, keyword: $keyword, status: $status) {
      ...SearchCore
    }
  }
`;

export const GET_SEARCH = gql`
  ${SEARCH_CORE}
  query GetSearch($id: ID!) {
    search(id: $id) {
      ...SearchCore
      articles {
        id headline publishedAt sentiment
        source { id name tier region }
        topics { id label }
      }
    }
  }
`;

export const GET_SEARCH_LINEAGE = gql`
  query GetSearchLineage($id: ID!) {
    searchLineage(id: $id) {
      totalNodes maxDepth orphanCount
      root { id name keywords }
      nodes {
        depth isRoot
        search { id name keywords status createdAt
          parents { id name }
          derivatives { id name }
        }
      }
    }
  }
`;

// ---- Volume Projection (DD-2) ----

export const GET_VOLUME_PROJECTION = gql`
  query GetVolumeProjection($keywords: [String!]!) {
    volumeProjection(keywords: $keywords) {
      estimatedVolume note
      topSources { source { id name tier } count }
    }
  }
`;

// ---- Filter Presets ----

export const GET_FILTER_PRESETS = gql`
  query GetFilterPresets {
    filterPresets {
      ...FilterPresetCore
      searches { id name }
    }
  }
  ${FILTER_PRESET_CORE}
`;

// ---- Collections ----

export const GET_COLLECTIONS = gql`
  query GetCollections {
    collections {
      id name description createdAt
      searches { id name status updatedAt
        filters { id name type }
      }
    }
  }
`;

// ---- Narrative Trends (DD-3) ----

export const GET_NARRATIVE_TRENDS = gql`
  query GetNarrativeTrends($searchId: ID!, $interval: String) {
    narrativeTrends(searchId: $searchId, interval: $interval) {
      searchId searchName interval totalArticles
      volumeOverTime { date volume positive neutral negative }
      sentimentBreakdown {
        positive neutral negative total
        positivePercent neutralPercent negativePercent periodShift
      }
      topSources { source { id name domain tier region } count }
      topTopics  { topic  { id label category }           count }
    }
  }
`;

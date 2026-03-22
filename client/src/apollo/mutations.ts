import { gql } from '@apollo/client';
import { SEARCH_CORE, FILTER_PRESET_CORE } from './queries';

// ---- Search ----

export const CREATE_SEARCH = gql`
  ${SEARCH_CORE}
  mutation CreateSearch($input: CreateSearchInput!) {
    createSearch(input: $input) { ...SearchCore }
  }
`;

export const UPDATE_SEARCH = gql`
  ${SEARCH_CORE}
  mutation UpdateSearch($id: ID!, $input: UpdateSearchInput!) {
    updateSearch(id: $id, input: $input) { ...SearchCore }
  }
`;

export const DELETE_SEARCH = gql`
  mutation DeleteSearch($id: ID!) {
    deleteSearch(id: $id) { id success message }
  }
`;

export const FORK_SEARCH = gql`
  ${SEARCH_CORE}
  mutation ForkSearch($input: ForkSearchInput!) {
    forkSearch(input: $input) { ...SearchCore }
  }
`;

// ---- Filter Presets ----

export const CREATE_FILTER_PRESET = gql`
  ${FILTER_PRESET_CORE}
  mutation CreateFilterPreset($input: CreateFilterPresetInput!) {
    createFilterPreset(input: $input) { ...FilterPresetCore }
  }
`;

export const UPDATE_FILTER_PRESET = gql`
  ${FILTER_PRESET_CORE}
  mutation UpdateFilterPreset($id: ID!, $input: UpdateFilterPresetInput!) {
    updateFilterPreset(id: $id, input: $input) { ...FilterPresetCore }
  }
`;

export const DELETE_FILTER_PRESET = gql`
  mutation DeleteFilterPreset($id: ID!) {
    deleteFilterPreset(id: $id) { id success message }
  }
`;

export const APPLY_FILTER_TO_SEARCH = gql`
  ${SEARCH_CORE}
  mutation ApplyFilterToSearch($filterId: ID!, $searchId: ID!) {
    applyFilterToSearch(filterId: $filterId, searchId: $searchId) { ...SearchCore }
  }
`;

export const REMOVE_FILTER_FROM_SEARCH = gql`
  ${SEARCH_CORE}
  mutation RemoveFilterFromSearch($filterId: ID!, $searchId: ID!) {
    removeFilterFromSearch(filterId: $filterId, searchId: $searchId) { ...SearchCore }
  }
`;

// ---- Collections ----

export const CREATE_COLLECTION = gql`
  mutation CreateCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) { id name description createdAt }
  }
`;

export const UPDATE_COLLECTION = gql`
  mutation UpdateCollection($id: ID!, $input: UpdateCollectionInput!) {
    updateCollection(id: $id, input: $input) { id name description createdAt }
  }
`;

export const DELETE_COLLECTION = gql`
  mutation DeleteCollection($id: ID!) {
    deleteCollection(id: $id) { id success message }
  }
`;

export const ADD_SEARCH_TO_COLLECTION = gql`
  mutation AddSearchToCollection($searchId: ID!, $collectionId: ID!) {
    addSearchToCollection(searchId: $searchId, collectionId: $collectionId) {
      id name searches { id name }
    }
  }
`;

export const REMOVE_SEARCH_FROM_COLLECTION = gql`
  mutation RemoveSearchFromCollection($searchId: ID!, $collectionId: ID!) {
    removeSearchFromCollection(searchId: $searchId, collectionId: $collectionId) {
      id name searches { id name }
    }
  }
`;

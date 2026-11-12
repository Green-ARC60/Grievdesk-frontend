import apiClient from './client';
import { UnifiedSearchResults } from '../types/search';

export const searchUnifiedApi = async (
  q: string,
  limit: number = 10
): Promise<UnifiedSearchResults> => {
  const response = await apiClient.get<UnifiedSearchResults>('/search', {
    params: { q, limit },
  });
  return response.data;
};


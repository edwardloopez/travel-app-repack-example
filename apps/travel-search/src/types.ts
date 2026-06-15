export interface SearchResult {
  id: string;
  title: string;
  type: 'flight' | 'hotel' | 'destination';
  description: string;
  price?: string;
}

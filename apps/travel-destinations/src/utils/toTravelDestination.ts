import type { Destination } from 'travel-core';

export interface MockDestination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  rating: number;
  price: number;
  category: string;
}

export function toTravelDestination(mock: MockDestination): Destination {
  return {
    id: mock.id,
    name: mock.name,
    country: mock.country,
    flag: '',
    capital: mock.name,
    region: mock.category,
    currencies: {},
    description: mock.description,
  };
}

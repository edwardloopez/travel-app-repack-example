export interface Destination {
  id: string;
  name: string;
  country: string;
  flag: string;
  capital: string;
  region: string;
  currencies: Record<string, { name: string }>;
  description?: string;
}

export interface Weather {
  city: string;
  temperature: number;
  condition: string;
  icon: string;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
}

export interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  origin: {
    city: string;
    code: string;
  };
  destination: {
    city: string;
    code: string;
  };
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
}

export interface HotelResult {
  id: string;
  name: string;
  rating: number;
  price: number;
  currency: string;
  image: string;
  amenities: string[];
  location: string;
}

export interface Photo {
  id: string;
  url: string;
  description?: string;
  photographer?: string;
}

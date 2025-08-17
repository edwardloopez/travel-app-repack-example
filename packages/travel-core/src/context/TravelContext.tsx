import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Destination } from '../types';

interface TravelContextType {
  selectedDestination: Destination | null;
  setSelectedDestination: (destination: Destination | null) => void;
  searchParams: {
    origin: string;
    destination: string;
    dates: {
      checkIn: Date | null;
      checkOut: Date | null;
    };
  };
  setSearchParams: (params: any) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    dates: {
      checkIn: null,
      checkOut: null,
    },
  });

  return (
    <TravelContext.Provider
      value={{
        selectedDestination,
        setSelectedDestination,
        searchParams,
        setSearchParams,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
};

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
};

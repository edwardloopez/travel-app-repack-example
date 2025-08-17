import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  HelperText,
} from 'react-native-paper';

interface FlightSearchData {
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  passengers: number;
  tripType: 'round-trip' | 'one-way';
}

const FlightSearch: React.FC = () => {
  const [searchData, setSearchData] = useState<FlightSearchData>({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'round-trip',
  });

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Searching flights with:', searchData);
      setIsSearching(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Flight Search
      </Text>

      <View style={styles.tripTypeContainer}>
        <Chip
          selected={searchData.tripType === 'round-trip'}
          onPress={() =>
            setSearchData(prev => ({ ...prev, tripType: 'round-trip' }))
          }
          style={styles.chip}
        >
          Round Trip
        </Chip>
        <Chip
          selected={searchData.tripType === 'one-way'}
          onPress={() =>
            setSearchData(prev => ({ ...prev, tripType: 'one-way' }))
          }
          style={styles.chip}
        >
          One Way
        </Chip>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          label="From"
          value={searchData.from}
          onChangeText={text =>
            setSearchData(prev => ({ ...prev, from: text }))
          }
          style={styles.halfInput}
          placeholder="Origin city"
          left={<TextInput.Icon icon="airplane-takeoff" />}
        />
        <TextInput
          label="To"
          value={searchData.to}
          onChangeText={text => setSearchData(prev => ({ ...prev, to: text }))}
          style={styles.halfInput}
          placeholder="Destination city"
          left={<TextInput.Icon icon="airplane-landing" />}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          label="Departure Date"
          value={searchData.departDate}
          onChangeText={text =>
            setSearchData(prev => ({ ...prev, departDate: text }))
          }
          style={styles.halfInput}
          placeholder="MM/DD/YYYY"
          left={<TextInput.Icon icon="calendar" />}
        />
        {searchData.tripType === 'round-trip' && (
          <TextInput
            label="Return Date"
            value={searchData.returnDate}
            onChangeText={text =>
              setSearchData(prev => ({ ...prev, returnDate: text }))
            }
            style={styles.halfInput}
            placeholder="MM/DD/YYYY"
            left={<TextInput.Icon icon="calendar" />}
          />
        )}
      </View>

      <TextInput
        label="Passengers"
        value={searchData.passengers.toString()}
        onChangeText={text =>
          setSearchData(prev => ({ ...prev, passengers: parseInt(text) || 1 }))
        }
        style={styles.fullInput}
        keyboardType="numeric"
        left={<TextInput.Icon icon="account-group" />}
      />

      <HelperText type="info">
        Find the best flights for your travel dates
      </HelperText>

      <Button
        mode="contained"
        onPress={handleSearch}
        loading={isSearching}
        disabled={!searchData.from || !searchData.to || !searchData.departDate}
        style={styles.searchButton}
        icon="magnify"
      >
        Search Flights
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  tripTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  fullInput: {
    marginBottom: 8,
  },
  searchButton: {
    marginTop: 16,
  },
});

export default FlightSearch;

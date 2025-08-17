import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Chip, HelperText } from 'react-native-paper';

interface HotelSearchData {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  priceRange: 'budget' | 'mid-range' | 'luxury';
}

const HotelSearch: React.FC = () => {
  const [searchData, setSearchData] = useState<HotelSearchData>({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    priceRange: 'mid-range',
  });

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Searching hotels with:', searchData);
      setIsSearching(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Hotel Search
      </Text>

      <TextInput
        label="Destination"
        value={searchData.destination}
        onChangeText={(text: string) =>
          setSearchData(prev => ({ ...prev, destination: text }))
        }
        style={styles.fullInput}
        placeholder="City, hotel, or landmark"
        left={<TextInput.Icon icon="map-marker" />}
      />

      <View style={styles.inputRow}>
        <TextInput
          label="Check-in Date"
          value={searchData.checkIn}
          onChangeText={(text: string) =>
            setSearchData(prev => ({ ...prev, checkIn: text }))
          }
          style={styles.halfInput}
          placeholder="MM/DD/YYYY"
          left={<TextInput.Icon icon="calendar-check" />}
        />
        <TextInput
          label="Check-out Date"
          value={searchData.checkOut}
          onChangeText={(text: string) =>
            setSearchData(prev => ({ ...prev, checkOut: text }))
          }
          style={styles.halfInput}
          placeholder="MM/DD/YYYY"
          left={<TextInput.Icon icon="calendar-remove" />}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          label="Guests"
          value={searchData.guests.toString()}
          onChangeText={(text: string) =>
            setSearchData(prev => ({ ...prev, guests: parseInt(text) || 1 }))
          }
          style={styles.halfInput}
          keyboardType="numeric"
          left={<TextInput.Icon icon="account-group" />}
        />
        <TextInput
          label="Rooms"
          value={searchData.rooms.toString()}
          onChangeText={(text: string) =>
            setSearchData(prev => ({ ...prev, rooms: parseInt(text) || 1 }))
          }
          style={styles.halfInput}
          keyboardType="numeric"
          left={<TextInput.Icon icon="bed" />}
        />
      </View>

      <Text variant="bodyMedium" style={styles.sectionTitle}>
        Price Range
      </Text>
      <View style={styles.priceRangeContainer}>
        <Chip
          selected={searchData.priceRange === 'budget'}
          onPress={() =>
            setSearchData(prev => ({ ...prev, priceRange: 'budget' }))
          }
          style={styles.chip}
        >
          Budget
        </Chip>
        <Chip
          selected={searchData.priceRange === 'mid-range'}
          onPress={() =>
            setSearchData(prev => ({ ...prev, priceRange: 'mid-range' }))
          }
          style={styles.chip}
        >
          Mid-range
        </Chip>
        <Chip
          selected={searchData.priceRange === 'luxury'}
          onPress={() =>
            setSearchData(prev => ({ ...prev, priceRange: 'luxury' }))
          }
          style={styles.chip}
        >
          Luxury
        </Chip>
      </View>

      <HelperText type="info">
        Compare prices from hundreds of hotel booking sites
      </HelperText>

      <Button
        mode="contained"
        onPress={handleSearch}
        loading={isSearching}
        disabled={
          !searchData.destination || !searchData.checkIn || !searchData.checkOut
        }
        style={styles.searchButton}
        icon="magnify"
      >
        Search Hotels
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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  fullInput: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  searchButton: {
    marginTop: 16,
  },
});

export default HotelSearch;

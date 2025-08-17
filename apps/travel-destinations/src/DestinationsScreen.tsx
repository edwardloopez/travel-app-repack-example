import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { LoadingSpinner, createAPIClient } from 'travel-core';

interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  rating: number;
  price: number;
  category: string;
}

const DestinationsScreen: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDestinations, setFilteredDestinations] = useState<
    Destination[]
  >([]);

  const apiClient = createAPIClient('https://api.travel.com', 'mock-key');

  const mockDestinations: Destination[] = [
    {
      id: '1',
      name: 'Paris',
      country: 'France',
      description:
        'The City of Light with iconic landmarks and romantic atmosphere',
      imageUrl: 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Paris',
      rating: 4.8,
      price: 1200,
      category: 'City',
    },
    {
      id: '2',
      name: 'Bali',
      country: 'Indonesia',
      description: 'Tropical paradise with beautiful beaches and rich culture',
      imageUrl: 'https://via.placeholder.com/300x200/50C878/FFFFFF?text=Bali',
      rating: 4.6,
      price: 800,
      category: 'Beach',
    },
    {
      id: '3',
      name: 'Tokyo',
      country: 'Japan',
      description: 'Modern metropolis blending tradition and innovation',
      imageUrl: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Tokyo',
      rating: 4.7,
      price: 1500,
      category: 'City',
    },
    {
      id: '4',
      name: 'Santorini',
      country: 'Greece',
      description: 'Stunning island with white buildings and blue domes',
      imageUrl:
        'https://via.placeholder.com/300x200/87CEEB/FFFFFF?text=Santorini',
      rating: 4.9,
      price: 1000,
      category: 'Island',
    },
    {
      id: '5',
      name: 'Swiss Alps',
      country: 'Switzerland',
      description: 'Majestic mountains perfect for skiing and hiking',
      imageUrl: 'https://via.placeholder.com/300x200/228B22/FFFFFF?text=Alps',
      rating: 4.5,
      price: 1800,
      category: 'Mountain',
    },
    {
      id: '6',
      name: 'Maldives',
      country: 'Maldives',
      description: 'Luxury overwater bungalows in crystal clear waters',
      imageUrl:
        'https://via.placeholder.com/300x200/00CED1/FFFFFF?text=Maldives',
      rating: 4.8,
      price: 2500,
      category: 'Beach',
    },
  ];

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
      setDestinations(mockDestinations);
      setFilteredDestinations(mockDestinations);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch destinations. Please try again.');
      console.error('Destinations API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDestinations(destinations);
    } else {
      const filtered = destinations.filter(
        destination =>
          destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          destination.country
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          destination.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDestinations(filtered);
    }
  }, [searchQuery, destinations]);

  const handleDestinationPress = (destination: Destination) => {
    Alert.alert(
      destination.name,
      `${destination.description}\n\nPrice: $${destination.price}\nRating: ${destination.rating}⭐`,
      [
        {
          text: 'Book Now',
          onPress: () =>
            Alert.alert('Booking', `Booking trip to ${destination.name}!`),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderDestinationItem = ({ item }: { item: Destination }) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => handleDestinationPress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.destinationImage} />
      <View style={styles.destinationInfo}>
        <View style={styles.destinationHeader}>
          <Text style={styles.destinationName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>{item.rating}⭐</Text>
          </View>
        </View>
        <Text style={styles.destinationCountry}>{item.country}</Text>
        <Text style={styles.destinationDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.destinationFooter}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.price}>${item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          Discovering amazing destinations...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Travel Destinations</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations, countries, or categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDestinations}
        keyExtractor={item => item.id}
        renderItem={renderDestinationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No destinations found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search criteria
            </Text>
          </View>
        }
      />

      <Text style={styles.footer}>
        Explore the world's most beautiful destinations
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#7f8c8d',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    backgroundColor: 'white',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  destinationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  destinationImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  destinationInfo: {
    padding: 16,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  destinationCountry: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  destinationDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  destinationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#3498db',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
  },
  footer: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
});

export default DestinationsScreen;

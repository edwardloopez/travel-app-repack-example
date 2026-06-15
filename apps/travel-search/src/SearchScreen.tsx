import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTravelContext } from 'travel-core';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SearchStackParamList } from './navigation/MainNavigator';
import type { SearchResult } from './types';

type SearchNavigation = NativeStackNavigationProp<
  SearchStackParamList,
  'SearchHome'
>;

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Flight to Paris',
    type: 'flight',
    description: 'Round trip from NYC to CDG',
    price: '$599',
  },
  {
    id: '2',
    title: 'Hotel Luxor',
    type: 'hotel',
    description: '4-star hotel in downtown Paris',
    price: '$120/night',
  },
  {
    id: '3',
    title: 'Eiffel Tower',
    type: 'destination',
    description: 'Iconic landmark in Paris',
  },
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchNavigation>();
  const { selectedDestination } = useTravelContext();
  const [searchQuery, setSearchQuery] = useState(
    selectedDestination?.name || ''
  );

  useEffect(() => {
    if (selectedDestination?.name) {
      setSearchQuery(selectedDestination.name);
    }
  }, [selectedDestination?.name]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<
    'all' | 'flights' | 'hotels' | 'destinations'
  >('all');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));

      let filteredResults = mockResults.filter(
        result =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (searchType !== 'all') {
        const typeMap = {
          flights: 'flight',
          hotels: 'hotel',
          destinations: 'destination',
        };
        filteredResults = filteredResults.filter(
          result => result.type === typeMap[searchType]
        );
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Search Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      case 'destination':
        return '📍';
      default:
        return '🔍';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔍 Travel Search</Text>
      <View style={styles.typeSelector}>
        {['all', 'flights', 'hotels', 'destinations'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              searchType === type && styles.typeButtonActive,
            ]}
            onPress={() => setSearchType(type as any)}
          >
            <Text
              style={[
                styles.typeButtonText,
                searchType === type && styles.typeButtonTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search flights, hotels, destinations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <Text style={styles.searchingText}>Searching travel options...</Text>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {results.length} result(s) found
          </Text>
          {results.map(result => (
            <TouchableOpacity
              key={result.id}
              style={styles.resultCard}
              onPress={() => navigation.navigate('SearchDetail', { result })}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>
                  {getTypeIcon(result.type)}
                </Text>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultDescription}>
                    {result.description}
                  </Text>
                </View>
                {result.price && (
                  <Text style={styles.resultPrice}>{result.price}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searchQuery && results.length === 0 && !loading && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            No results found for "{searchQuery}"
          </Text>
          <Text style={styles.noResultsSubtext}>
            Try adjusting your search terms
          </Text>
        </View>
      )}

      <Text style={styles.footer}>
        Find flights, hotels, and destinations for your next adventure
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007bff',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchingText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 16,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  footer: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default SearchScreen;

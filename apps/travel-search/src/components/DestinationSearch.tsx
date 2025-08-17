import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  HelperText,
} from 'react-native-paper';

interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  category: string;
}

const popularDestinations: Destination[] = [
  {
    id: '1',
    name: 'Paris',
    country: 'France',
    description: 'City of Light and Romance',
    category: 'romantic',
  },
  {
    id: '2',
    name: 'Tokyo',
    country: 'Japan',
    description: 'Modern metropolis meets tradition',
    category: 'culture',
  },
  {
    id: '3',
    name: 'Bali',
    country: 'Indonesia',
    description: 'Tropical paradise with stunning beaches',
    category: 'beach',
  },
  {
    id: '4',
    name: 'New York',
    country: 'USA',
    description: 'The city that never sleeps',
    category: 'urban',
  },
  {
    id: '5',
    name: 'Swiss Alps',
    country: 'Switzerland',
    description: 'Breathtaking mountain scenery',
    category: 'adventure',
  },
];

const DestinationSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredDestinations, setFilteredDestinations] =
    useState(popularDestinations);

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'beach', label: 'Beach' },
    { key: 'culture', label: 'Culture' },
    { key: 'adventure', label: 'Adventure' },
    { key: 'romantic', label: 'Romantic' },
    { key: 'urban', label: 'Urban' },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterDestinations(query, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterDestinations(searchQuery, category);
  };

  const filterDestinations = (query: string, category: string) => {
    let filtered = popularDestinations;

    if (category !== 'all') {
      filtered = filtered.filter(dest => dest.category === category);
    }

    if (query.trim()) {
      filtered = filtered.filter(
        dest =>
          dest.name.toLowerCase().includes(query.toLowerCase()) ||
          dest.country.toLowerCase().includes(query.toLowerCase()) ||
          dest.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredDestinations(filtered);
  };

  const renderDestination = ({ item }: { item: Destination }) => (
    <Card style={styles.destinationCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.destinationName}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={styles.destinationCountry}>
          {item.country}
        </Text>
        <Text variant="bodyMedium" style={styles.destinationDescription}>
          {item.description}
        </Text>
        <Chip style={styles.categoryChip} compact>
          {item.category}
        </Chip>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Destination Discovery
      </Text>

      <TextInput
        label="Search destinations"
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchInput}
        placeholder="Enter city, country, or interest"
        left={<TextInput.Icon icon="magnify" />}
        right={
          searchQuery ? (
            <TextInput.Icon icon="close" onPress={() => handleSearch('')} />
          ) : undefined
        }
      />

      <Text variant="bodyMedium" style={styles.sectionTitle}>
        Categories
      </Text>
      <View style={styles.categoryContainer}>
        {categories.map(category => (
          <Chip
            key={category.key}
            selected={selectedCategory === category.key}
            onPress={() => handleCategoryChange(category.key)}
            style={styles.categoryChip}
          >
            {category.label}
          </Chip>
        ))}
      </View>

      <HelperText type="info" style={styles.helperText}>
        Discover amazing destinations around the world
      </HelperText>

      <Text variant="titleSmall" style={styles.resultsTitle}>
        {filteredDestinations.length} destination(s) found
      </Text>

      <FlatList
        data={filteredDestinations}
        renderItem={renderDestination}
        keyExtractor={item => item.id}
        style={styles.destinationsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  searchInput: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  helperText: {
    marginBottom: 16,
  },
  resultsTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  destinationsList: {
    flex: 1,
  },
  destinationCard: {
    marginBottom: 12,
  },
  destinationName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  destinationCountry: {
    opacity: 0.7,
    marginBottom: 8,
  },
  destinationDescription: {
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default DestinationSearch;

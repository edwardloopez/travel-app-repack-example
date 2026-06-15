import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SearchStackParamList } from '../navigation/MainNavigator';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchDetail'>;

const SearchDetailScreen: React.FC<Props> = ({ route }) => {
  const { result } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.badge}>Lazy chunk loaded</Text>
      <Text style={styles.title}>{result.title}</Text>
      <Text style={styles.type}>{result.type}</Text>
      <Text style={styles.description}>{result.description}</Text>
      {result.price ? (
        <Text style={styles.price}>{result.price}</Text>
      ) : null}
      <Text style={styles.hint}>
        This detail view is in a separate async chunk. Check serve:remotes for
        __federation_expose_SearchDetailScreen.chunk.bundle on first visit.
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  type: {
    fontSize: 14,
    color: '#9C27B0',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#546e7a',
    lineHeight: 22,
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: '#78909c',
    lineHeight: 20,
  },
});

export default SearchDetailScreen;

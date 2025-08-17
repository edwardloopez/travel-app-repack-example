import { StyleSheet, Text, View } from 'react-native';

export const FederationErrorFallback: React.FC = () => (
  <View style={styles.fallback}>
    <Text style={styles.fallbackTitle}>🌤️ Weather Service</Text>
    <Text style={styles.fallbackText}>
      ⚠️ Module Federation Error{'\n'}
      The Weather micro-frontend failed to load.{'\n'}
      Check console for details.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B00020',
    marginBottom: 10,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

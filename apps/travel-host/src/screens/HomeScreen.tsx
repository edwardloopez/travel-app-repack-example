import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRemoteRegistry } from 'travel-core';
import type { RootStackParamList } from '../navigation/MainNavigator';
import BundleCacheDebugScreen from './BundleCacheDebugScreen';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { enabledFeatures } = useRemoteRegistry();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.featuresContainer}>
          {enabledFeatures.map(feature => (
            <TouchableOpacity
              key={feature.name}
              style={[
                styles.featureCard,
                { backgroundColor: feature.color || '#2196F3' },
              ]}
              onPress={() =>
                navigation.navigate(feature.screen as keyof RootStackParamList)
              }
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Module Federation POC</Text>
          <Text style={styles.infoText}>
            Features above are loaded from the active remote registry. Disable a
            remote in remote-registry.json to hide it without rebuilding the
            host.
          </Text>
        </View>

        <BundleCacheDebugScreen />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  featuresContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  infoCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HomeScreen;

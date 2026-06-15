import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WeatherStackParamList } from '../navigation/MainNavigator';

type Props = NativeStackScreenProps<WeatherStackParamList, 'WeatherForecast'>;

const MOCK_FORECAST = [
  { day: 'Mon', high: 22, low: 14, icon: '☀️' },
  { day: 'Tue', high: 20, low: 13, icon: '⛅' },
  { day: 'Wed', high: 18, low: 11, icon: '🌧️' },
  { day: 'Thu', high: 19, low: 12, icon: '⛅' },
  { day: 'Fri', high: 21, low: 14, icon: '☀️' },
];

const WeatherForecastScreen: React.FC<Props> = ({ route }) => {
  const { city } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.badge}>Lazy chunk loaded</Text>
      <Text style={styles.title}>Forecast for {city}</Text>
      <Text style={styles.hint}>
        This screen lives in a separate async chunk. Watch serve:remotes when you
        navigate here — you should see a new GET for
        __federation_expose_WeatherForecastScreen.chunk.bundle.
      </Text>

      {MOCK_FORECAST.map(day => (
        <View key={day.day} style={styles.row}>
          <Text style={styles.day}>{day.day}</Text>
          <Text style={styles.icon}>{day.icon}</Text>
          <Text style={styles.temps}>
            {day.high}° / {day.low}°
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  content: {
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#607d8b',
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  day: {
    width: 48,
    fontWeight: '600',
    color: '#37474f',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  temps: {
    flex: 1,
    textAlign: 'right',
    color: '#455a64',
    fontWeight: '500',
  },
});

export default WeatherForecastScreen;

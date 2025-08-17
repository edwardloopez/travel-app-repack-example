import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

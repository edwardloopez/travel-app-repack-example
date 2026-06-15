import React, { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LazyScreenProps {
  children: React.ReactNode;
}

export function LazyScreen({ children }: LazyScreenProps) {
  return (
    <Suspense
      fallback={
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#2196F3" />
        </View>
      }
    >
      {children}
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

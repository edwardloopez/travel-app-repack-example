import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRemoteBootstrap } from 'travel-core';
import { initDynamicRemotes } from '../federation/initRemotes';

interface RemoteBootstrapGateProps {
  children: React.ReactNode;
}

const RemoteBootstrapGate: React.FC<RemoteBootstrapGateProps> = ({
  children,
}) => {
  const bootstrapRemotes = useCallback(
    (platform: string) => initDynamicRemotes(platform),
    []
  );
  const status = useRemoteBootstrap(bootstrapRemotes);

  if (status.isBootstrapping) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.title}>Preparing micro-apps...</Text>
        <Text style={styles.subtitle}>
          Registering remotes and checking bundle cache
        </Text>
      </View>
    );
  }

  if (status.error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Bootstrap warning</Text>
        <Text style={styles.subtitle}>{status.error}</Text>
        {children}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B00020',
    marginBottom: 8,
  },
});

export default RemoteBootstrapGate;

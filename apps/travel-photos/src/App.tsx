import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import PhotosScreen from './PhotosScreen';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
      <PhotosScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
});

export default App;

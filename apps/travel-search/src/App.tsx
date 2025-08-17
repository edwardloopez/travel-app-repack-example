import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import SearchScreen from './SearchScreen';

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <SearchScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default App;

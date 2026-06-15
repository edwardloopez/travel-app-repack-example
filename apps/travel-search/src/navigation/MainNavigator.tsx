import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SearchScreen from '../SearchScreen';
import { LazyScreen } from '../components/LazyScreen';
import type { SearchResult } from '../types';

const SearchDetailScreen = React.lazy(
  () => import('../screens/SearchDetailScreen')
);

export type SearchStackParamList = {
  SearchHome: undefined;
  SearchDetail: { result: SearchResult };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

type DetailProps = NativeStackScreenProps<SearchStackParamList, 'SearchDetail'>;

const DetailScreen = (props: DetailProps) => (
  <LazyScreen>
    <SearchDetailScreen {...props} />
  </LazyScreen>
);

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchHome"
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Stack.Screen
        name="SearchDetail"
        component={DetailScreen}
        options={{ title: 'Result details' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

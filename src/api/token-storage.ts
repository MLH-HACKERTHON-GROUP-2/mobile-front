import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const KEY = 'healthcare-refresh-token';
export const tokenStorage = {
  read: () => Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(KEY),
  write: (value: string | null) => Platform.OS === 'web' ? Promise.resolve() : value ? SecureStore.setItemAsync(KEY, value) : SecureStore.deleteItemAsync(KEY),
};

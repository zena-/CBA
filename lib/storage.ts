import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getPantryItems(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem('pantry');
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.warn('Failed to load pantry:', e);
    return [];
  }
}

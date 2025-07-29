import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../services/chat';


const MESSAGE_KEY_PREFIX = 'messages-';

function getTodayKey() {
  const today = new Date().toISOString().split('T')[0]; 
  return `${MESSAGE_KEY_PREFIX}${today}`;
}

export async function saveMessagesForToday(messages: ChatMessage[]) {
  try {
    await AsyncStorage.setItem(getTodayKey(), JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save messages', e);
  }
}

export async function loadMessagesForToday(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(getTodayKey());
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load messages', e);
    return [];
  }
}

export async function clearOldMessages() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const messageKeys = keys.filter((k) => k.startsWith(MESSAGE_KEY_PREFIX));
    const todayKey = getTodayKey();
    const keysToRemove = messageKeys.filter((k) => k !== todayKey);
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (e) {
    console.error('Failed to clear old messages', e);
  }
}

export async function getPantryItems(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem('pantry');
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.warn('Failed to load pantry:', e);
    return [];
  }
}

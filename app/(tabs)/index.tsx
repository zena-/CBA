import {
  View,
  Text,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppData } from '../../hooks/useAppData';
import { useState, useEffect } from 'react';
import { detectUserIntent } from '../../lib/utils/detectUserIntent';
import { sendToChiliB, streamToChiliB } from '../../services/chat';
import type { ChatMessage } from '../../services/chat';
import type { DailyProtocol } from '../../types/protocol';
import {
  saveMessagesForToday,
  loadMessagesForToday,
  clearOldMessages,
  getPantryItems,
} from '../../lib/storage';
import * as Notifications from 'expo-notifications';

export default function Guidance() {
  const [protocol, setProtocol] = useState<DailyProtocol | null>(null);
  const [input, setInput] = useState('');
  const [pantry, setPantry] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { sleepHours, meetingsToday } = useAppData();

  const fetchProtocol = async () => {
    const context = {
      sleepHours: sleepHours ?? 8,
      meetingsToday: meetingsToday ?? 0,
      cyclePhase: false,
      pantry,
    };

    const res = await fetch('http://localhost:3000/api/protocol',{ //'https://cba-swart.vercel.app/api/protocol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });

    if (!res.ok) throw new Error('Failed to fetch protocol');
    return await res.json();
  };

  useEffect(() => {
    getPantryItems().then(setPantry);
  }, []);

  useEffect(() => {
    const loadProtocolAndMessages = async () => {
      try {
        const p = await fetchProtocol();
        setProtocol(p);

        const hour = new Date().getHours();
        let currentBlock = 'morning';
        if (hour >= 12 && hour < 17) currentBlock = 'afternoon';
        else if (hour >= 17 && hour < 24) currentBlock = 'evening';
        else if (hour >= 0 && hour < 6) currentBlock = 'other';

        const initialMsgs: ChatMessage[] = p.blocks
          .filter((block) => block.title === currentBlock)
          .map((block) => ({
            type: 'ai',
            text: `${block.title.toUpperCase()}:\n${block.items.map((i) => `• ${i}`).join('\n')}`,
          }));

        setMessages(initialMsgs);
      } catch (e) {
        console.error('Error generating protocol:', e);
      }
    };

    loadProtocolAndMessages();
  }, [sleepHours, meetingsToday, pantry]);

  const handleUserSubmit = async () => {
    if (!input.trim()) return;

    const { mode, aiText } = detectUserIntent(input);
    const userMsg: ChatMessage = { type: 'user', text: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await saveMessagesForToday(updatedMessages);
    setInput('');

    try {
      if (mode === 'custom' && aiText) {
        const newAi = { type: 'ai', text: aiText };
        const final = [...updatedMessages, newAi];
        setMessages(final);
        saveMessagesForToday(final);
        return;
      }

      setMessages((prev) => [...prev, { type: 'ai', text: '' }]);

      if (mode === 'protocol') {
        const contextPayload = {
          pantry,
          sleepHours: sleepHours ?? 8,
          meetingsToday: meetingsToday ?? 0,
          cyclePhase: false,
        };

        let streamed = '';
        await streamToChiliB(contextPayload, (chunk) => {
          streamed = chunk;
          setMessages((prev) => {
            const updated = prev.map((msg, i) =>
              i === prev.length - 1 && msg.type === 'ai'
                ? { ...msg, text: streamed }
                : msg
            );
            saveMessagesForToday(updated);
            return updated;
          });
        });
      } else {
        const aiResponse = await sendToChiliB([
          { role: 'system', content: 'You are Chili B., a helpful AI wellness assistant.' },
          ...updatedMessages.map((m) => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        ]);

        const newAi = { type: 'ai', text: aiResponse.content ?? '' };
        const final = [...updatedMessages, newAi];
        setMessages(final);
        saveMessagesForToday(final);
      }
    } catch (e) {
      console.error(e);
      const errMsg = { type: 'ai', text: "Hmm, I'm having trouble connecting right now." };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications to receive your Chili B. protocol.');
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Chili B.', body: 'Morning protocol is ready!' },
        trigger: { hour: 6, minute: 0, repeats: true },
      });

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Chili B.', body: 'Afternoon update.' },
        trigger: { hour: 12, minute: 0, repeats: true },
      });

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Chili B.', body: 'Evening time.' },
        trigger: { hour: 17, minute: 0, repeats: true },
      });
    };

    setupNotifications();
  }, []);

  if (!protocol) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F4EF', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/loading.jpg')}
          style={{ width: 280, height: 280, resizeMode: 'contain', marginBottom: 24 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="flex-1 justify-between bg-white px-6 pt-14 relative" style={{ height: '100vh', padding: 7 }}>
        <Image
          source={require('../../assets/images/palm-tree-wm.png')}
          resizeMode="contain"
          style={{
            position: 'absolute',
            top: '25%',
            left: 0,
            right: 0,
            opacity: 0.07,
            width: '100%',
            height: 300,
            alignSelf: 'center',
          }}
        />

        <Text className="text-center font-bold text-xl tracking-wide text-black mb-8" style={{ paddingTop: 10 }}>
          Chili B.
        </Text>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {messages.map((msg, i) => (
            <View key={i} style={{ alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <Text
                style={{
                  backgroundColor: msg.type === 'user' ? '#DCF8C6' : 'lightyellow',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  fontSize: 15,
                  maxWidth: '80%',
                  textAlign: msg.type === 'user' ? 'right' : 'left',
                  color: '#000',
                }}
              >
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: 'rgba(170, 170, 170, 0.4)',
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 20,
            marginBottom: 22,
          }}
        >
          <TextInput
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            multiline
            style={{
              flex: 1,
              fontSize: 14,
              paddingRight: 10,
              paddingVertical: 8,
              outlineStyle: 'none',
            }}
          />
          <TouchableOpacity onPress={handleUserSubmit}>
            <Image source={require('../../assets/images/ArrowSquareUp.png')} style={{ width: 28, height: 28 }} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

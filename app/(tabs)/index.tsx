import {
  View,
  Text,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAppData } from '../../hooks/useAppData';
import { generateProtocol, Context } from '../../lib/ai';
import { useState, useEffect } from 'react';
import { streamToChiliB } from '../../services/chat';
import type { ChatMessage } from '../../services/chat';
import type { DailyProtocol } from '../../types/protocol';
import {
  saveMessagesForToday,
  loadMessagesForToday,
  clearOldMessages,
  getPantryItems
} from '../../lib/storage';
import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
import { Alert } from 'react-native';


export default function Guidance() {
  const [protocol, setProtocol] = useState<DailyProtocol | null>(null);
  const [input, setInput] = useState('');
  const [pantry, setPantry] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { sleepHours, meetingsToday } = useAppData();

  const handleUserSubmit = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { type: 'user', text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    await saveMessagesForToday(newMessages);
    setInput('');

    try {
      const contextPayload = {
        sleepHours,
        meetingsToday,
        cyclePhase: false,
        pantry,
        weather: { summary: 'Clear', temperature: 78, humidity: 55 },
      };

      let streamed = '';
      setMessages((prev) => [...prev, { type: 'ai', text: '' }]); // placeholder

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

    } catch (e) {
      console.log(e);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: "Hmm, I'm having trouble connecting right now." },
      ]);
    }
  };

  // Load pantry once
  useEffect(() => {
    getPantryItems().then(setPantry);
  }, []);

  // Generate structured protocol once pantry is ready
  useEffect(() => {
    const loadProtocolAndMessages = async () => {
      try {
        const pantryItems = await getPantryItems();

        const context: Context = {
          sleepHours: sleepHours ?? 8,
          meetingsToday: meetingsToday ?? 0,
          cyclePhase: false,
          pantry: pantryItems,
        };

        const p = await generateProtocol(context);
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
  }, [sleepHours, meetingsToday]);

  useEffect(() => {
    const setupNotifications = async () => {
      // if (!Device.isDevice) return;

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications to receive your Chili B. protocol.');
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Chili B.',
          body: 'Morning protocol is ready!',
        },
        trigger: { hour: 6, minute: 0, repeats: true },
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Chili B.',
          body: 'Afternoon update.',
        },
        trigger: { hour: 12, minute: 0, repeats: true },
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Chili B.',
          body: 'Evening time.',
        },
        trigger: { hour: 17, minute: 0, repeats: true },
      });
    };

    setupNotifications();
  }, []);

  if (!protocol) {
    return (
      <View style={{ padding: 40 }}>
        <Text>Loading protocol...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <View
        className="flex-1 justify-between bg-white px-6 pt-14 relative"
        style={{ backgroundColor: 'white', height: '100vh', padding: '7px' }}
      >
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

        <Text
          className="text-center font-bold text-xl tracking-wide text-black mb-8"
          style={{ textAlign: 'center', fontWeight: '500', paddingTop: 10, marginBottom: 20 }}
        >
          Chili B.
        </Text>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={{
                alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
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
            backgroundColor: 'white',
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
            <Image
              source={require('../../assets/images/ArrowSquareUp.png')}
              style={{ width: 28, height: 28, marginLeft: 10 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

import { View, Text, TextInput, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAppData } from '../../hooks/useAppData';
import { generateProtocol, Context } from '../../lib/ai';
import { useState, useEffect } from 'react';
import { sendToChiliB } from '../../services/chat';
import type { ChatMessage } from '../../services/chat';
// import * as Location from 'expo-location';
import { getPantryItems } from '../../lib/storage';

export default function Guidance() {
  const { sleepHours, meetingsToday } = useAppData();
  const [input, setInput] = useState('');
  const [pantry, setPantry] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
  const context: Context = {
      sleepHours: sleepHours ?? 8,
      meetingsToday: meetingsToday ?? 0,
      cyclePhase: false,
      pantry: ['eggs', 'rice', 'Chili B. Apple'],
    };
    return generateProtocol(context).map((m) => ({ type: 'ai', text: m }));
  });

  const handleUserSubmit = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { type: 'user', text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    try {
      // Step 1: Get location
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status !== 'granted') {
      //   console.log('Location permission not granted');
      //   throw new Error('No location permission');
      // }
      // const location = await Location.getCurrentPositionAsync({});
      // const { latitude, longitude } = location.coords;

      // Step 2: Fetch weather
      const weather = {
        summary: 'Clear',
        temperature: 78,
        humidity: 55,
      };

      // Step 3: Add weather to context
      const contextPayload = {
        sleepHours,
        meetingsToday,
        cyclePhase: false,
        pantry,
        weather,
      };

      const aiText = await sendToChiliB(newMessages, contextPayload);
      setMessages((prev) => [...prev, { type: 'ai', text: aiText }]);
    } catch (e) {
      console.log(e);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: "Hmm, I'm having trouble connecting right now." },
      ]);
    }
  };

  useEffect(() => {
    getPantryItems().then(setPantry);
  }, []);

  useEffect(() => {
    if (pantry.length === 0) return;

    const context: Context = {
      sleepHours: sleepHours ?? 8,
      meetingsToday: meetingsToday ?? 0,
      cyclePhase: false,
      pantry,
    };
    const initialMessages = generateProtocol(context).map((m) => ({ type: 'ai', text: m }));
    setMessages(initialMessages);
  }, [pantry, sleepHours, meetingsToday]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <View
        className="flex-1 justify-between bg-white px-6 pt-14 relative"
        style={{
          backgroundColor: 'white',
          height: '100vh',
          padding: '7px',
        }}
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
          style={{
            textAlign: 'center',
            fontWeight: '500',
            paddingTop: 10,
            marginBottom: 20
          }}
        >
          Chili B.
        </Text>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
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
          <Text
            onPress={handleUserSubmit}
            style={{
              color: '#007AFF',
              fontSize: 16,
              fontWeight: '500',
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <TouchableOpacity onPress={handleUserSubmit}>
              <Image
                source={require('../../assets/images/ArrowSquareUp.png')}
                style={{
                  width: 28,
                  height: 28,
                  marginLeft: 10,
                }}
              />
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

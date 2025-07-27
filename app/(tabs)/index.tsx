import { View, Text, TextInput, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useAppData } from '../../hooks/useAppData';
import { generateProtocol, Context } from '../../lib/ai';
import { useState } from 'react';
import { sendToChiliB } from '../../services/chat';
import type { ChatMessage } from '../../services/chat';

export default function Guidance() {
  const { sleepHours, meetingsToday } = useAppData();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    const context: Context = {
      sleepHours: sleepHours ?? 8,
      meetingsToday: meetingsToday ?? 0,
      cyclePhase: false,
      pantry: ['eggs', 'rice', 'Chili B. Apple'],
    };
    return generateProtocol(context).map((m) => ({ type: 'ai', text: m }));
  });

  const handleUserSubmit = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'user', text: input };
    const aiReply = {
      type: 'ai',
      text:
        "If you're getting your favorite, sushi, then I'll recommend Nobu. " +
        "If you're trying to up your protein, try a steakhouse. Let me know what you're in the mood for and who you're going with " +
        "and I’ll send you a few places to choose from.",
    };
    setMessages((prev) => [...prev, userMsg, aiReply]);
    setInput('');
  };

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
          GUIDANCE
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
              textAlign: 'right',
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

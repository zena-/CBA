import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const seed = [
  "Take a walk for lunch",
  "Only one glass of wine at brunch",
  "Early flight tomorrow – pack the heating pad",
  "You left the park 7 mins ago — want veggies on your route?",
];

export default function Reminders() {
  const [done, setDone] = useState<number[]>([]);

  return (
    <View className="flex-1 bg-white px-5 pt-10" style={{
          backgroundColor: 'white',
          height: '100vh',
          padding: '7px',
        }}>
      <Text className="text-center font-bold text-lg mb-1" style={{
            textAlign: 'center',
            fontWeight: '500',
            paddingTop: 10,
            fontSize: 17
          }}>REMINDERS</Text>
      <Text className="text-center text-gray-500 mb-8" style={{
            textAlign: 'center',
            fontWeight: '500',
            paddingTop: 10,
            marginBottom: 20
          }}>Tap to confirm</Text>

      {seed.map((t, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => setDone((d) => d.includes(i) ? d : [...d, i])}
          className={`rounded-full px-4 py-3 mb-3 ${
            done.includes(i) ? 'bg-green-200' : 'bg-blue-100'
          }`}
        >
          <Text style={{
                  backgroundColor: 'lavender',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  fontSize: 15,
                  maxWidth: '80%',
                  color: '#000',
                  marginBottom: 7
                }}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

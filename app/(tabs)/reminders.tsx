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
    <View className="flex-1 bg-white px-5 pt-10">
      <Text className="text-center font-bold text-lg mb-1">REMINDERS</Text>
      <Text className="text-center text-gray-500 mb-8">Tap to confirm</Text>

      {seed.map((t, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => setDone((d) => d.includes(i) ? d : [...d, i])}
          className={`rounded-full px-4 py-3 mb-3 ${
            done.includes(i) ? 'bg-green-200' : 'bg-blue-100'
          }`}
        >
          <Text>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

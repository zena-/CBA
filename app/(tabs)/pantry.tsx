import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';

export default function Pantry() {
  const [input, setInput] = useState('');
  const [items, setItems] = useState<string[]>([]);

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [...prev, input.trim()]);
    setInput('');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <Text className="text-xl font-bold mb-6 text-center">My Pantry</Text>

      <View className="flex-row mb-4">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Add item (e.g. eggs)"
          className="flex-1 border border-gray-300 rounded-l-full px-4 py-2 text-sm"
        />
        <TouchableOpacity
          onPress={addItem}
          className="bg-black px-4 rounded-r-full justify-center"
        >
          <Text className="text-white text-sm font-medium">Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item}-${i}`}
        renderItem={({ item }) => (
          <View className="border-b border-gray-100 py-2">
            <Text className="text-base text-gray-800">• {item}</Text>
          </View>
        )}
      />
    </View>
  );
}

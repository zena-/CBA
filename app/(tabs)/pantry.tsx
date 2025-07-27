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
    <View className="flex-1 bg-white px-6 pt-20" style={{
          backgroundColor: 'white',
          height: '100vh',
          padding: '7px',
        }}>
      <Text className="text-xl font-bold mb-6 text-center" style={{
            textAlign: 'center',
            fontWeight: '500',
            paddingTop: 10,
            marginBottom: 20
          }}>The Pantry</Text>

      <View className="flex-row mb-4" style={{
            marginBottom: 20,
            display: 'flex',
            border: '1px solid lightgrey',
            borderRadius: 7,
            padding: 5,
            whiteSpace: 'nowrap',
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Item"
          style={{ outlineStyle: 'none' }}
          className="flex-1 border border-gray-300 rounded-l-full px-4 py-2 text-sm"
        />
        <TouchableOpacity
          onPress={addItem}
          className="bg-black px-4 rounded-r-full justify-center"
        >
          <Text className="text-white text-sm font-bold" style={{
            fontWeight: '700',
            color: 'darkblue'
          }}>Add</Text>
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

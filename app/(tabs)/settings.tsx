import { View, Text, Switch } from 'react-native';
import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);

  return (
    <View className="flex-1 bg-white px-5 pt-10">
      <Text className="text-center font-bold text-lg mb-8">Chili B. AI</Text>

      <Block title="Data Sources">
        <Text>• Apple Health (sleep, HR, cycle)</Text>
        <Text>• Calendar (events, meetings)</Text>
        <Text>• Screen Time (night wakeups)</Text>
        <Text>• Pantry (photos, manual)</Text>
      </Block>

      <Block title="Notifications">
        <Row label="Enable notifications" value={notifications} onChange={setNotifications} />
      </Block>

      <Block title="Export / Share">
        <Text>Export health insights for your doctor (coming soon)</Text>
      </Block>
    </View>
  );
}

function Block({ title, children }: any) {
  return (
    <View className="mb-6">
      <Text className="font-semibold mb-2">{title}</Text>
      <View className="space-y-1">{children}</View>
    </View>
  );
}

function Row({ label, value, onChange }: any) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

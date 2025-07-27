import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../assets/images/welcome-bg.jpg')}
      resizeMode="cover"
      className="flex-1 justify-center items-center"
    >
      <View className="bg-black/50 p-6 rounded-xl">
        <Text className="text-white text-2xl font-bold mb-4 text-center">
          Welcome to Chili B. AI
        </Text>
        <TouchableOpacity
          className="bg-white px-6 py-3 rounded-full"
          onPress={() => router.replace('/')} // Goes to main screen
        >
          <Text className="text-black font-semibold">Let’s Get In Sync</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

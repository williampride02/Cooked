import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { haptics } from '@/utils/haptics';
import { DevLogin } from '@/components/dev/DevLogin';

export default function AuthIndex() {
  const handleGetStarted = () => {
    haptics.light();
    router.push('/phone');
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-m">
      <Text className="text-primary text-display font-bold mb-s">
        Cooked
      </Text>
      <Text className="text-text-secondary text-body text-center mb-xl">
        Hold your friends accountable.{'\n'}Get roasted when you fold.
      </Text>

      <Pressable
        testID="get-started-button"
        accessibilityLabel="Get Started"
        accessibilityRole="button"
        className="bg-primary w-full rounded-md py-4 items-center"
        onPress={handleGetStarted}
      >
        <Text className="text-white font-semibold text-body">
          Get Started
        </Text>
      </Pressable>

      {/* Dev Login - only shows in __DEV__ mode */}
      <DevLogin />
    </View>
  );
}

import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { NotificationProvider, DeepLinkProvider, AchievementsProvider } from '@/providers';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider config={config} colorMode="dark">
        <DeepLinkProvider>
          <NotificationProvider>
            <AchievementsProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0D0D0D' },
                }}
              />
            </AchievementsProvider>
          </NotificationProvider>
        </DeepLinkProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { NotificationProvider } from '../services/contexts/NotificationContext';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <NotificationProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
       <Stack.Screen name="index" options={{ headerShown: false }} />
      
      <Stack.Screen name="driver-register" options={{ headerShown: false }} />
      <Stack.Screen name="driver-login" options={{ headerShown: false }} />
      <Stack.Screen name="DriverHome" options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" options={{ headerShown: false }} />
      <Stack.Screen name="DriverAccount" options={{ headerShown: false }} />
      <Stack.Screen name="updatejob" options={{ headerShown: false }} />
      <Stack.Screen name="DriverDashboard" options={{ headerShown: false }} />
      <Stack.Screen name="Chat" options={{ headerShown: false }} />
       <Stack.Screen name="DriverCalender" options={{ headerShown: false }} />
       
       <Stack.Screen name="InventoryList" options={{ headerShown: false }} />
         <Stack.Screen name="FullScreenImageView" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        </Stack>
     
    </ThemeProvider>
    </NotificationProvider>
  );
}

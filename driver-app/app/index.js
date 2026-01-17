import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo_main2.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>Welcome to JakMove-DriverPortal</Text>
      
      <Text style={styles.subtitle}>
        Login or Register to view your assigned jobs, track schedules, and more.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/driver-login')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ecc71', 
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  button: {
    backgroundColor: '#1f4172', 
    width: '80%',
    paddingVertical: 12,
    borderRadius: 4,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

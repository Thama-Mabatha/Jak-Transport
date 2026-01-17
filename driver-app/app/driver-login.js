import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';



export const options = {
  headerShown: false, //removing the header 
};

export default function DriverLogin() {
  
  const router= useRouter();
  const [formData,setFormData]= useState({email :'',password : ''});
  const [loading, setLoading] = useState(false);




   const handleChange = (field ,value )=>
   {
    setFormData((prev=>({
      ...prev,
      [field]:value,
    })));
   };

   const handleLogin = async () =>
   {


     setLoading(true);
    try{

      const datatoSend = new FormData();//Building aform obj to send to api
      datatoSend.append('email',formData.email);
      datatoSend.append('passwordHash' ,formData.password);


     const response = await fetch('https://jakmove.xyz/api/Users/login', {
      method:'POST',
      body :datatoSend,
     });


     if(response.ok)
     {


      const resultText = await response.text();
      console.log('Login resul' ,resultText);


        if(resultText ==='false')//return false if it fails 
      {
        Alert.alert('Login Failed','Inavlid email or password');
        return;
      }


      //then if it didnt fail lets  convert the text to javascript 
      const result = JSON.parse(resultText);

       //Check userType if not driver no access 
        if (result.userType?.toLowerCase() !== 'driver') {
          Alert.alert(
            'Login Denied',
            'Login is only for drivers'
          );
          setLoading(false);
          return;
        }

      // Make sure driverID exists
      if (!result.driverID) {
        Alert.alert('Login Failed', 'Unexpected response from server.');
        return;
      }

    await AsyncStorage.setItem('userID', result.userID?.toString() || '' );//Store user id to allow for use in edit-profile  page to update user info
    await AsyncStorage.setItem('driverID', result.driverID.toString());
    await AsyncStorage.setItem('userType', 'driver');
    await AsyncStorage.setItem('firstName', result.firstName || '');
    await AsyncStorage.setItem('lastName', result.lastName || '');
    await AsyncStorage.setItem('email', formData.email || '');
    await AsyncStorage.setItem('phoneNumber', result.phoneNumber || '');
    await AsyncStorage.setItem('imageID', result.imageID?.toString() || '0');
    await AsyncStorage.setItem('token', result.token || '');


     // Alert.alert('Login Success', `Welcome ${result.firstName}`);
      router.replace('DriverDashboard');
      return;
    } else {
      Alert.alert('Login Failed', 'Incorrect password or email');
    }

  } catch (error) {
    Alert.alert('LoginError', error.message);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.card}>
        <Text style={styles.title}>JAK Move – Driver Portal</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            secureTextEntry
            style={styles.input}
          />
         
       <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
           >
           <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  loginButton:
  {
  backgroundColor: '#1f4172',
  paddingVertical: 14,
  borderRadius: 6,
  alignItems: 'center',
  marginTop: 10,

  },
  loginButtonText:{

  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',

  },
  card: {
    padding: 20,
    marginTop: 0, 
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  registerPrompt: {
    marginTop: 16,
    textAlign: 'center',
    color: '#333',
  },
  registerLink: {
    color: '#007bff',
    fontWeight: '600',
  },
});

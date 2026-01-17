import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SignalR from '@microsoft/signalr';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons for phone icon
import { API_DOMAIN } from '../constants/api';

export const options = {
  headerShown: false,
};

export default function Chat() {
  const router = useRouter();
  const { jobID } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userIDs, setUserIDs] = useState({ driver: null, customer: null });
  const [customerName, setCustomerName] = useState('Customer');
  const [customerAvatar, setCustomerAvatar] = useState(null);
  const [token, setToken] = useState(null);
  const connectionRef = useRef(null);
  const flatListRef = useRef(null);

  // This effect runs when the component mounts and jobID changes.
  useEffect(() => {
    const initializeChat = async () => {
      // If there is no jobID, show an error and go back.
      if (!jobID) {
        Alert.alert("Error", "No job ID provided for chat.");
        router.back();
        return;
      }




      //Get driverID ,token and userID from AsyncStorage

      const storedDriverID = await AsyncStorage.getItem('driverID');
      const storedUserID = await AsyncStorage.getItem('userID');
      const storedToken = await AsyncStorage.getItem('token');

      
      //If any of the  items  are  above missing the show an error
      if (!storedDriverID || !storedToken || !storedUserID) {
        Alert.alert("Error", "Driver not logged in or token/userID missing.");
        router.back();
        return;
      }


      // Set the token and driver ID.
      setToken(storedToken);
      setUserIDs(prev => (
        { ...prev, driver: parseInt(storedUserID) 

        }
      ));


      //Fetch job details so we can get customer information 
      try {

        const response = await fetch(`${API_DOMAIN}/api/Job/getJob?jobID=${jobID}`);
        if (!response.ok) throw new Error("Failed to fetch job details.");
        const jobData = await response.json();

        
        //If customerid  is there then 
        if (jobData.customerID) {

          setUserIDs(prev => (
            { ...prev, customer: jobData.customerID 

            }));

          setCustomerName(jobData.customerName || `Customer ${jobData.customerID}`); //set the customer name 
          setCustomerAvatar(jobData.customerAvatar || null);
        } else {
          throw new Error("Could not find customer for the chat");
        }
      } catch (error) {
        console.error("Error initializing chat :", error);
        Alert.alert("Error Failed to initialize chat job details");
        router.back();
        return;
      }

      //Fetch previous messages for the job.

      try {

        const response = await fetch(`${API_DOMAIN}/api/Messages/getMessages?jobID=${jobID}&userID=${storedUserID}`);
        
        if (!response.ok) {
         
          console.error("API Error - getMessages:", response.status);
          throw new Error("Failed to fetch messages.");
        }

        //store response in data 
        const data = await response.json();
        setMessages(data);

      } catch (error) {
        console.error("Error fetching historical messages:", error);
        Alert.alert("Error", "Failed to load messages.");
      } finally {
        setLoading(false);
      }


      // Create a SignalR connection to the chat hub.
      const connection = new SignalR.HubConnectionBuilder()
        .withUrl(`${API_DOMAIN}/chatHub?jobID=${jobID}`)
        .configureLogging(SignalR.LogLevel.Information)
        .build();

      // Listen for new messages from the hub.
      connection.on("messageReceived", (message) => {
        setMessages((prevMessages) => {
          // Add the new message to the list if it doesn't already exist.
          if (!prevMessages.some(m => m.messageID === message.messageID && m.sentAt === message.sentAt)) {
            return [...prevMessages, message];
          }
          return prevMessages;
        });
        // Scroll to the end of the list to show the new message.
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      // Start the SignalR connection.
      try {
        await connection.start();
        console.log("SignalR Connected.");
        connectionRef.current = connection;
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
      }
    };

    initializeChat();

    // Clean up the connection when the component unmounts.
    return () => {
      connectionRef.current?.stop().then(() => console.log("SignalR Disconnected."));
    };
  }, [jobID]);



  //Function to handle sending of messages 
  const handleSendMessage = async () => {
    // If the message is empty or user/job info is missing, show an error.
    if (!newMessage.trim() || !userIDs.driver || !userIDs.customer || !jobID || !token) 
      {
      Alert.alert("Error", "Cannot send empty message or missing user/job info.");
      return;
    }


    // Create the message payload.
    const messagePayload = {
      senderID: userIDs.driver,
      receiverID: userIDs.customer,
      messageContent: newMessage,
      jobID: parseInt(jobID),
    };
    
    console.log("Actual message payload being sent:", messagePayload);

    //Create a temporary message for optimistic UI update.
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      messageID: tempMessageId,
      senderID: userIDs.driver,
      messageContent: newMessage,
      sentAt: new Date().toISOString(),
      isRead: false,
    };


    //add message and clear input 
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage('');
    flatListRef.current?.scrollToEnd({ animated: true });



    // Send the message to the server.
    try {

      const response = await fetch(`${API_DOMAIN}/api/Messages/sendPrimitiveMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messagePayload),
      });


      //If the request fails, show an error.
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error - sendMessage:", response.status, errorText);
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message.");
      // If sending fail 
      setMessages(prevMessages => prevMessages.filter(msg => msg.messageID !== tempMessageId));
    }
  };



  // This function handles the call button press.
  const handleCallPress = () => {
    Alert.alert("Call Customer", `Initiate call to ${customerName || 'customer'} for Job ID: ${jobID}`);
    
  };

  // Show a loading indicator while the chat is being initialized.
  if (loading) {

    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f4172" />
        <Text style={{ marginTop: 10, color: '#333' }}>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >


        {/* Consistent Header with other pages */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#1a202c" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            {customerAvatar ? (
              <Image source={{ uri: customerAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.icon}>
                <Feather name="user" size={20} color="#FFF" />
              </View>
            )}
            <View style={styles.headerTextContainer}> 
              <Text style={styles.headerTitle}>{customerName}</Text>
             {/*<Text style={styles.headerSubtitle}>Job ID: {jobID}</Text>*/}
            </View>
          </View>
          <TouchableOpacity onPress={handleCallPress} style={styles.callButton}>
            <MaterialCommunityIcons name="phone" size={24} color="#1f4172" />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.messageID?.toString() || index.toString()}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.senderID === userIDs.driver ? styles.myMessage : styles.otherMessage
            ]}>
              <Text style={[
                  styles.messageText,
                  item.senderID === userIDs.driver ? styles.myMessageText : styles.otherMessageText
              ]}>{item.messageContent}</Text>
              <View style={styles.messageMeta}>
                <Text style={[
                    styles.messageTime,
                    item.senderID === userIDs.driver ? styles.myMessageTime : styles.otherMessageTime
                ]}>{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.senderID === userIDs.driver && item.isRead && (
                  <MaterialCommunityIcons name="check-all" size={12} color="#888" style={{ marginLeft: 5 }} />
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Feather name="paperclip" size={20} color="#888" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            onContentSizeChange={(e) => {}} // Empty function for now, or implement auto-height logic
          />
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <Feather name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 20 : 0, 
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    alignSelf: 'center', 
    paddingTop: 10, 
    
  },
    backButton: {
     marginRight: 10,
    paddingTop: 17, 
    paddingVertical: 5, 
   
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10, 
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    
  },

  headerTextContainer: {
    paddingTop: 10, 
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a202c',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  callButton: {
    paddingVertical: 5, 
    marginLeft: 10,
     paddingTop: 20, 
   
  },

  messagesContainer: { 
    
    paddingVertical: 10, 
    paddingHorizontal: 10
   }
   
   ,
  messageBubble: {
    padding: 10,
     maxWidth: '80%',
    borderRadius: 15,
    marginBottom: 8,
   
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#1f4172',
    borderBottomRightRadius: 5,
  },


  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: 15,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333333',
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: '#888',
  },

  // Input Container Styles 
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  sendButton: {
    backgroundColor: '#1f4172',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  attachButton: {
    padding: 8,
    marginRight: 5,
    marginBottom: 5,
  }
});

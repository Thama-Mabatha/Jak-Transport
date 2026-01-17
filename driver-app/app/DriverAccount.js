import { AntDesign, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../assets/styles/colors';
import { scale, verticalScale } from '../assets/styles/scaling';
import { API_DOMAIN } from '../constants/api';

export const options = {
  headerShown: false,
};

export default function DriverProfile() {
  const router = useRouter();

  //Get info stored in lcoacal storeg
  const[userID,setUserID] = useState("");
  const[userType,setUserType]=useState("");
  const[formData ,setFormData] =useState({firstName: ' ',lastName :' ' ,email:' ',imageID:0});


  const loadUser = async()=>
  {
    try{

      const userType = await AsyncStorage.getItem('userType')|| 'driver'
      const userid= await AsyncStorage.getItem('userID');


      if(!userid)
      {
        Alert.alert("User not logged in ");
        return;
      }


      const firstName = await AsyncStorage.getItem('firstName');
      const lastName = await AsyncStorage.getItem('lastName');
      const email = await AsyncStorage.getItem('email');
      const imageIDStr = await AsyncStorage.getItem('imageID');
      const imageID = parseInt(imageIDStr ?? '0');



      //set the stuff 
      setUserID(userid);
      setUserType(userType);
      setFormData(
        {
          firstName:firstName || '',
          lastName:lastName ||'',
          email : email || ' ',
          imageID: imageID
        }
      )
    }catch(error)
    {
    
    }


  }


 const menuItems = [
  { label: 'My Jobs', icon: 'briefcase',route :'/DriverHome' },              
  { label: 'Earnings', icon: 'dollar-sign', route: '/earnings' },          
  { label: 'Support', icon: 'headphones', route: '/support' },             
  { label: 'Settings', icon: 'settings', route: '/settings' },             
  { label: 'MyCalender', icon: 'file-text', route: '/DriverCalender' },        
   { label: 'Logout', icon: 'log-out', route:'/driver-login'},              
];


useEffect(()=>
{
  loadUser();
})


  return (
    <SafeAreaView style={{flex:1,backgroundColor: '#ffffff'}} >
    <StatusBar style="dark" />
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/DriverHome')}>
          <Feather name="arrow-left" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.myprofileText}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Section */}
      <View style={styles.cardRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{  uri: `${API_DOMAIN}/api/Images/getImage?id=${formData.imageID}`}}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => router.push('/EditProfile')}
          >
            <Feather name="camera" size={16} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfoContainer}>
           

          <View style={styles.nameRow}>
          <Text style={styles.usernameText}>{formData.firstName} {formData.lastName}</Text>
          </View>

          <Text style={styles.Number}>{formData.email}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/EditProfile')}
          >
            <Feather name="edit" size={16} color="#003366" />
            <Text style={styles.labels}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.menuLeft}>
              <Feather name={item.icon} size={20} color="#003366" />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    {/*Navigation bar */}
             <View style={styles.bottomNavigation}>
              <TouchableOpacity 
              onPress={()=>router.push('/DriverDashboard')}style={styles.navItem}>
                 <AntDesign size={24} name="home" color="black" />
               <Text style={styles.navName}>Home </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem}
              onPress={()=>router.push('/DriverHome')}>
                 <AntDesign size={24} name="bars" color="black" />
               <Text style={styles.navName}  >All Jobs </Text>
              </TouchableOpacity>
               <TouchableOpacity style={styles.navItem}
               onPress={()=>router.push('/DriverAccount')}>
                 <AntDesign size={24} name="user" color="black" />
               <Text style={styles.navName}>Profile</Text>
              </TouchableOpacity>
                           </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop:scale(10)
  },
  myprofileText: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: colors.black,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(8),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#ccc',
    borderWidth: 2,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: scale(16),
    justifyContent: 'center',
    paddingVertical: scale(10),
  },
  usernameText: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.black,
    marginTop: verticalScale(4),
  },
  Number: {
    fontSize: scale(14),
    color: colors.black,
    marginTop: 4,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    borderRadius: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#10c695;',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  labels: {
   
    fontSize: scale(13),
    marginLeft: 6,
     fontWeight: '500',
    color: '#003366',
  },
  menuSection: {
    marginTop: verticalScale(10),
    borderTopColor: '#eee',
     borderTopWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: scale(14),
    color: colors.black,
    marginLeft: 12,
  },
  nameRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
 bottomNavigation:
  {
    display:'flex',
    flexDirection:'row',
    justifyContent:'space-around',
    padding:10,
    backgroundColor: '#fafafa',
    borderColor: '#ddd',
    marginBottom:-20,
    paddingTop:scale(10)
  },
   navItem: {
   alignItems: 'center',  
  justifyContent: 'center',
  paddingBottom: 13,
  },
  navName: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    marginTop: 4,
  },

});

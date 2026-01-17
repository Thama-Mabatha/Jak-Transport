import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../assets/styles/colors';
import { scale, verticalScale } from '../assets/styles/scaling';
import { API_DOMAIN } from '../constants/api';

export default function EditProfile() {
  const router = useRouter();
  //State to store input form values 
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    jobsCompleted: '',
    imageID:0,
  });

  //Get what is stored in loacl storage 
  const [userID, setUserID] = useState('');
  const [userType, setUserType] = useState('');

const handleImagePicking = async () =>
{

  //Ask permission to access the media library 
   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

   if(status !=='granted')
   {
      Alert.alert('Permission denied', 'You need to allow access to your media library.');
      return;
   }
   
   try
   {
    //Open device image library (call to lILA library)
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker?.MediaType?.IMAGE ?? ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,//alllow editing
        aspect: [1, 1],//then linmit the size of image
        quality: 1,
      });


      //Check if user cancelled and there is atleats one image 
      if (!result.canceled && result.assets?.length > 0) {
        let uri = result.assets[0].uri; //get uri 
        if (Platform.OS === 'android' && !uri.startsWith('file://')) {
          uri = `file://${uri}`;
        }

      //Use expo to get metatdat about fille 
       const fileInformation = await FileSystem.getInfoAsync(uri);
        if (!fileInformation.exists) {
          throw new Error('File not found at path: ' + uri);
        }

      //call to imageUpload to upload image 
        const imageID = await  handleImageUploadToServer(uri);
        setFormData(prev => (
          { ...prev,  //copy prev state 
            imageID
           }
        
          ));
        await AsyncStorage.setItem('imageID', imageID.toString());

        Alert.alert("Successgul image upload ");
        console.log(" Image uploaded ");
       /* Alert.alert("Success", `Image uploaded.\nImageID: ${imageID}\n\nTap to copy:\n${API_DOMAIN}/api/Images/${imageID}`); */


      }
    } catch (err) {
      console.error("Image picking failed:", err);
      Alert.alert("Image picking failed", err.message);
    }
  };

  //File/image upload 
const handleImageUploadToServer = async (uri) =>
{

  const formData = new FormData();//Form data to send obj as multipartform-data
  formData.append('File',
    {
      uri,//local path of file being sent 
      name:'profile.jpeg', //Nmae to assign on server 
      type:'image/jpeg' //the MIME type of the image 
    }
  );


  try{

    const response = await fetch(`${API_DOMAIN}/api/Images/upload-image`,{
    method:'POST',
    body:formData,//attach form data 
    headers : {"Content-Type":'multipart/form-data'},
    });

    //Procces the response form the server 
    const text=(await response.text()).trim()
    console.log(`Response from server : " ,"${text}" `)

    const imageID = parseInt(text)
    if(isNaN(imageID))
    {
      throw Error(`Invalid image id was recieved from server : "${text}"`)
    
    }

    return imageID;
  }catch(error)
  {
     console.error("Could not upload")
  }

}


const loadUser = async () => {
      try {
          const userType = await AsyncStorage.getItem('userType') || 'driver';
          const driverID = await AsyncStorage.getItem('driverID');
          const userID = await AsyncStorage.getItem('userID');
    
    

      if (!userID) {
      Alert.alert("User not logged in");
      return;
    }


       const firstName = await AsyncStorage.getItem('firstName');
       const lastName = await AsyncStorage.getItem('lastName');
       const email = await AsyncStorage.getItem('email');
       const phoneNumber = await AsyncStorage.getItem('phoneNumber');
       const jobsCompleted = await AsyncStorage.getItem('jobsCompleted');
       const imageID = parseInt(await AsyncStorage.getItem('imageID')) || 0;
 
        //Set states 
       setUserID(userID);
       setUserType(userType);
       setFormData({
       firstName: firstName || '',
       lastName: lastName || '',
       email: email || '',
       phoneNumber: phoneNumber || '',
       jobsCompleted: jobsCompleted || '',
       imageID: imageID,
    });
  } catch (error) {
    Alert.alert("Failed to load profile", error.message);
  }
};

  //Load user from id reterived in locla stotage then get info from api
  useEffect(() => {
    loadUser();//Call function 
  },[] );//Run once component mounts 

    

  const handleChange = (name, value) =>  /*Keep track of whts being typed in the Input boxes */
    setFormData(prev => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    // Ensure required fields are filled
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
      Alert.alert('Error', 'Fill in all required fields');
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      jobsCompleted: parseInt(formData.jobsCompleted) || 0,
      imageID: parseInt(formData.imageID) || 0,
    };

    try {
      const response = await fetch(`${API_DOMAIN}/api/Users/updateUser/${userID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Success', 'User profile updated successfully');
        await AsyncStorage.setItem('firstName', formData.firstName);
        await AsyncStorage.setItem('lastName', formData.lastName);
        await AsyncStorage.setItem('email', formData.email);
        await AsyncStorage.setItem('phoneNumber', formData.phoneNumber);
        await AsyncStorage.setItem('jobsCompleted', formData.jobsCompleted.toString());
        await AsyncStorage.setItem('imageID', formData.imageID.toString());
      } else {
        const errorMsg = await response.text();
        console.log("API Error Response:", errorMsg);
        Alert.alert('Error', 'Failed to update profile:\n' + errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getImageSource = () => {
  console.log("Rendering image with ID:", formData.imageID);
  return formData.imageID > 0
    ? { uri: `https://jakmove.xyz/api/Images/getImage?id=${formData.imageID}` }
    : require('../assets/images/edit.png');
  
  
  };


   


  return (
    <SafeAreaView  style={styles.container} >
      <ScrollView contentContainerStyle={{padding:scale(1)}}> {/* ScrollView To allow user to scroll */}
         
          {/*Component that fades selightly when press*/}
          <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.push('/DriverAccount')}>
                  <Feather name="arrow-left" size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={styles.myprofileText}>Edit Profile</Text>
                <View style={{ width: 24 }} />
              </View>
        {/*Conditionally render profile image and the edit icon if usertype is driver */}
        {userType === 'driver' && (
          <View style={styles.profileImageContainer}>
             <Image
             source={ formData.imageID && !isNaN(formData.imageID) && Number(formData.imageID) > 0
             ? { uri: `https://jakmove.xyz/api/Images/getImage?id=${formData.imageID}` }
             : require('../assets/images/edit.png')
            }
           style={styles.profileImage}
          />


           <TouchableOpacity style={styles.editIcon} onPress={handleImagePicking}>
            <Text>📷</Text>
          </TouchableOpacity>
          </View>
           )
          }{/*end of render */}


      {/*Fields */}

       <View style={styles.profileFieldContainer}>
          <Text style={styles.fieldLabel}>First Name</Text>  
          <TextInput
            style={styles.fieldValue}
            value={formData.firstName}
            // When the text input changes, call handleChange with the field name 'firstName' and the new text value 
            onChangeText={(text) => handleChange('firstName', text)}
            placeholder="Enter First Name"
          />
          <View style={styles.underline} />
        </View>


        <View style={styles.profileFieldContainer}>
          <Text style={styles.fieldLabel}>Last Name</Text>
          <TextInput
            style={styles.fieldValue}
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
            placeholder="Enter Last Name"
          />
          <View style={styles.underline} />
        </View>

        <View style={styles.profileFieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.fieldValue}
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            placeholder="Enter Email"
            keyboardType="email-address"
          />
          <View style={styles.underline} />
        </View>

        <View style={styles.profileFieldContainer}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            style={styles.fieldValue}
            value={formData.phoneNumber}
            onChangeText={(text) => handleChange('phoneNumber', text)}
            placeholder="Enter Phone Number"
            keyboardType="phone-pad"
          />
          <View style={styles.underline} />
        </View>


         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Now</Text>
        </TouchableOpacity>
      
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding:20,
  
  },
    headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(12),
  },
  myprofileText: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: colors.black,
  },
  sideButton: {
    width: scale(30),
    alignItems: 'center',
  },
  imageArrowBackStyle: {
    width: scale(14),
    height: scale(14),
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
    position: 'relative',
  },
profileImage: {
  width: 120,
  height: 120,
  borderRadius: 60,
  borderWidth: 2,
  borderColor: '#ccc',
},

  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  profileFieldContainer: {
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(10),
  },
  fieldLabel: {
    fontSize: scale(12),
    color: '#888',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: scale(13),
    fontWeight: 'bold',
    color: '#003366',
  },
  underline: {
    height: 1,
    backgroundColor: '#ccc',
    marginTop: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(4),
    marginBottom: verticalScale(14),
  },
  topBarTitle: {
    fontSize: scale(13),
    lineHeight: scale(15),
    fontWeight: '500',
    color: '#003366',
    textAlign: 'center',
    flex: 1,
  },
  saveButton: {
  backgroundColor: '#007bff',
  paddingVertical: 14,
  borderRadius: 6,
  alignItems: 'center',
  marginTop: 10,
  },
  saveButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  },
});

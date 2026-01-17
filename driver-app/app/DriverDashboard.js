import { Linking, Alert } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { scale } from '../assets/styles/scaling';
import JobCard from './JobCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_DOMAIN } from '../constants/api';



export default function driverdashboard() {
  const router = useRouter();

  const [userId, setUserID] = useState('');
  const [driverID,setDriverID]=useState('');
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    imageID: 0,
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedJobs,setCompletedJobs]=useState([]);
  const [showCompletedJobs,setShowCompletedJobs]=useState(false);
 

  //For notitfications 
  const[showNotifications,setShowNotifications]=useState(false);
  //dummy data
const [notifications, setNotifications] = useState([
  { id: 1, message: 'New job assigned!', time: '2 min ago' },
  { id: 2, message: 'Customer sent a message.', time: '10 min ago' },
]);




  // Load user details from AsyncStorage
 const loadUser =async ()=>
 {

     try{
      const driverId = await AsyncStorage.getItem('driverID');
      const userid= await AsyncStorage.getItem('userID');
      const usertype = await AsyncStorage.getItem('userType') || 'driver';


      if(!userid)
      {
        Alert.alert("Please log in ")
        return;
      }

      const firstName= await AsyncStorage.getItem('firstName')  ||'';
      const lastName = await AsyncStorage.getItem('lastName') || '';
      const imageIDString= await AsyncStorage.getItem('imageID');
      const imageID=parseInt(imageIDString ?? '0');

      setUserID(userid);
      setUserType(usertype);
      setDriverID(driverId);
      setFormData(
        {
          firstName,
          lastName,
          imageID:imageID
        }
      );

      //Fetch jobs after loading user 
      await fetchJobs(driverId);
     }catch(error)
     {
      console.error("Failed to get user details" ,error)
     

 }
}

  
  // Fetch jobs assigned to this driver
  const fetchJobs =async(driverID)=>
  {
    setLoading(true);
    try{

      const response = await fetch(`${API_DOMAIN}/api/job/scheduled-driver-jobs?driverID=${driverID}`);
      const data=await response.json();
      console.log("Data for driver " ,data);


      //Get todays date  
      const today= new Date();

      const todaysJobs=data.filter((job)=>
      {
        //Convert jobs date string into date object 
        const jobDate = new Date(job.jobDate);
        //compare date part only 
        return jobDate.toDateString()=== today.toDateString();

      })

      .sort((a, b) => {
    const timeOrder = ['8:00', '12:00', '16:00']; // assumed fixed slots
    const timeA = timeOrder.indexOf(a.timeSlot?.trim());
    const timeB = timeOrder.indexOf(b.timeSlot?.trim());
    return timeA - timeB;
  });
      setJobs(todaysJobs);


      //Filter completed jobs 
      const completed = data.filter((job)=>
      
        job.jobStatus?.trim().toLowerCase() === "job completed"
      );

      setCompletedJobs(completed);


    }catch(error)
    {
      console.error("Failed to fetch job info")
    }finally
    {
      setLoading(false)
    }

  }


  //Ford ropdown under completed jobs 
  const toggleCompletedJobs =()=>
  {
    setShowCompletedJobs(!showCompletedJobs)
  }

  const toggleNotifications =()=>
  {
    setShowNotifications(!showNotifications)

  }



  const updateJobStatus = async (jobID, status, customerID) => {//Pass neccesary params

    try {
      //Send a new status now
       const response = await fetch(`${API_DOMAIN}/api/job/Update-JobStatus`, {
        method :'POST',
        headers:{ 'Content-type': 'application/json'},
        body:JSON.stringify({jobID,status}),

       });
 
      if (!response.ok) throw new Error('Failed to update status');

      //if i start a new job send notification to customer 
      if (status === 'Started') {
        await notifyCustomer(customerID, jobID); // Send update to customer
      }

         fetchJobs(driverID || driverId);//refresh job list 

    } catch (err) {
      console.error('Update failed:', err.message);
      Alert.alert('Error', 'Could not update job status.');
    }
  };

  const handleStartJobUpdate = async (jobID, jobStatus, customerID) => {
  try {
    if (jobStatus?.trim().toLowerCase() === 'upcoming') {
      await updateJobStatus(jobID, 'Started', customerID);
    }
    router.push(`/updatejob?jobID=${jobID}`);
  } catch (err) {
    console.error('Failed to start job:', err.message);
    Alert.alert('Error', 'Could not start job.');
  }
};




 const notifyCustomer = async (customerID, jobID) => {
  try {
    await fetch(`${API_DOMAIN}/api/notify-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerID,
        jobID,
        message: 'Your driver has started the job. They are on the way!',
      }),
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};



  useEffect(() => {
    loadUser();
  }, []);

  return (
    <SafeAreaView style={{flex:1}}>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: `${API_DOMAIN}/api/Images/getImage?id=${formData.imageID}`,
            }}
            style={styles.profileImage}
          />
          <Text style={styles.welcomeText}>
            Welcome back, {formData.firstName} {formData.lastName}!
          </Text>
        </View>

        {/*Notification button */}
        <TouchableOpacity onPress={toggleNotifications} style={styles.notificationIconContainer}>
          <Feather name="bell" size={24} color="#555555" />
          {notifications.length>0 &&
          (
            <View style={styles.newnotice}>
              <Text style={styles.newnoticeText}>
                {notifications.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>


      <Modal
      animationType='slide'
      transparent={true}
      visible={showNotifications}
      onRequestClose={toggleNotifications} //
      >

        <View style={styles.modelcontainer}>
          <View style={styles.notificationsection}>
            {/*Modal header */}
            <View style={styles.notificationsheader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <TouchableOpacity onPress={toggleNotifications}>
                <Feather name="x" size={24} color="#555555" />
              </TouchableOpacity>

            </View>

             {/* Notifications list */}
      <ScrollView style={styles.notificationList}>
        {notifications.length === 0 ? (
          <Text style={styles.noNotificationsText}>
            No new notifications.
          </Text>
        ) : (
          //map through and render ecah message
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>

              <Text style={styles.notificationTime}>
                {notification.time}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

          </View>

         </View>


      </Modal>
        
  

      <Text style={styles.TodaysJobTitle}>Today's Assigned Jobs</Text>

      {loading && (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      )}

      {!loading && jobs.length === 0 && (
        <Text style={styles.noJobsText}>No jobs assigned for today.</Text>
      )}

      {/*For ecah job in job array render a job card component */}
      {!loading && jobs.map((job) => (
        <JobCard
          key={job.jobID}
          job={job}
          showActions={true}
          onStartUpdate={() =>handleStartJobUpdate(job.jobID, job.jobStatus, job.customerID)}
          onDownloadProof={(jobID) => Linking.openURL(`${API_DOMAIN}/api/File/getJobFile?jobID=${jobID}`)}
        />
        
      ))}


      {/*Completed jobs section */}
      <TouchableOpacity 
       style={styles.compltedJobsheader}
       onPress={toggleCompletedJobs}
      >
        <Text style={styles.completedJobsTitle}>Completed Jobs</Text>
        <Feather name={showCompletedJobs ?'chevron-up' :'chevron-down' } size={24}  color='#777777'></Feather>
      </TouchableOpacity>
      {showCompletedJobs && (
        <View style={styles.compltedJobsContainer}>
         {
          completedJobs.length ===0 ?(
            <Text  style={styles.noJobsText}>No jobs completed</Text>
          ):(
            completedJobs.map((job) =>
            (
              <JobCard
              key={job.jobID}
              job={job}
             />
            ))
            
          )}
        </View>
      )}
      
    </ScrollView>

    {/*Navigation bar */}
      <View style={styles.bottomNavigation}>
       <TouchableOpacity 
       onPress={()=>('DriverDashboard')}style={styles.navItem}>
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

   bottomNavigation:
  {
    display:'flex',
    flexDirection:'row',
    justifyContent:'space-around',
    padding:10,
    backgroundColor: '#fafafa',
    borderColor: '#ddd',
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scale(30),
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  JobCard:
  {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding:20

  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 1.5,
    border :'none',
   
  },
  welcomeText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1f4172',
  },
  TodaysJobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f4172',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  noJobsText: {
    fontSize: 16,
    textAlign: 'center',
    padding:20,
    color: '#888',
  },
  completedJobsTitle:
  {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 6,
    marginTop: 12
 
  },
  compltedJobsheader:
  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding:scale(2),
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height:50
  },compltedJobsContainer :
  {
     marginTop: 10,
  },
  notificationIconContainer: {
  position: 'relative',
  padding: 8,
},
newnotice: {
  position: 'absolute',
  top: 2,
  right: 2,
  backgroundColor: '#E53935',
  borderRadius: 10,
  width: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
},
newnoticeText: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 'bold',
},
modelcontainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'flex-end',
},
notificationsection: {
  backgroundColor: '#FFFFFF',
  width: '100%',
  height: '70%',
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
  padding: 25,
}, 
notificationsheader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
notificationTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#333333',
},
notificationList: {
  flex: 1,
},
notificationItem: {
  backgroundColor: '#F5F5F5',
  padding: 16,
  borderRadius: 10,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#E0E0E0',
},
notificationMessage: {
  fontSize: 16,
  color: '#333333',
  marginBottom: 6,
},
notificationTime: {
  fontSize: 12,
  color: '#888888',
  textAlign: 'right',
},
noNotificationsText: {
  textAlign: 'center',
  color: '#666666',
  marginTop: 50,
  fontSize: 16,
},
proofModalContent: {
  backgroundColor: '#FFFFFF',
  width: '100%',
  height: '80%',
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
  padding: 25,
},
proofWebView: {
  width: '100%',
  height: '100%',
  marginTop: 20,
},
proofImage: {
  width: '100%',
  height: '80%',
  resizeMode: 'contain',
  marginTop: 20,
},


 
});

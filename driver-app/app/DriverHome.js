import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scale } from '../assets/styles/scaling';
import JobCard from './JobCard';
import { useNotification } from '../services/contexts/NotificationContext';
import { createNotificationConnection } from './services/NotificationHub';
import { API_DOMAIN } from '../constants/api';



export const options = {
  headerShown: false,
};


export default function DriverHome() {

  const router = useRouter();

  const [jobs,setJobs]= useState([]);
  const [driverID,setDriverID] = useState(null);
  const [error,setError] = useState(null);
  const [loading,setLoading] =useState(false);
 
  const {refreshJobs, setRefreshJobs, addNotification, message} = useNotification();


  // Fetch all scheduled jobs for a driver
  const fetchJobs = async (driverID) => {

    setLoading(true);
    try{

      console.log('DriverId is ',driverID);
      //fetch jobs assigned to driver
      const response =  await fetch (`${API_DOMAIN}/api/job/scheduled-driver-jobs?driverID=${driverID}`);

      console.log("Converting Jobs");
      const data = await response.json();

      //Sort the sobs
       const upcomingJobs = data
        .filter(job => job.jobStatus?.trim().toLowerCase() !== 'job completed')
        .sort((a, b) => new Date(a.jobDate) - new Date(b.jobDate));

      setJobs(upcomingJobs);
      console.log("Storing Jobs");
      console.log("All jobs fetched for driver:", data);
      console.log("Jobs found" ,data.length); //get total jobs fetched 
    }catch(err)
    {
      console.error('Failed to fetch',err.message)
      setError('Could not load jobs ');
    }finally
    {
      setLoading(false);
    }

  };


  //Upadet the job ststus in the backedn/api 
  const updateJobStatus = async (jobID, status, customerID) => {//Pass neccesary params

    try {


      //Send a new staus now
       const response = await fetch(`${API_DOMAIN}/api/job/Update-JobStatus`, {
        method :'POST',
        headers:{ 'Content-type': 'application/json'},
        body:JSON.stringify({jobID,status}),

       });
 
      if (!response.ok) throw new Error('Failed to update status');

      //if i start a new job sen notification to customer 
      if (status === 'Started') {
        await notifyCustomer(customerID, jobID); // Send update to customer
      }

      fetchJobs(driverID); // Refresh job list
    } catch (err) {
      console.error('Update failed:', err.message);
      Alert.alert('Error', 'Could not update job status.');
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



//Load driver id f loacl storage when component mounts 
  useEffect(() => {
    const loadDriver = async () => {
      const storedID = await AsyncStorage.getItem('driverID');//gET ID 
      if (storedID) {
        setDriverID(storedID);
        console.log('DriverHome mounted with ID:', storedID);
        fetchJobs(storedID);
      } else {
        setError('You are not logged in.');
        setLoading(false);
      }
    };
    loadDriver();
  }, []);

  useEffect(() => {
    if (!driverID) return;

    const connection = createNotificationConnection(driverID);

    connection.start()
      .then(() => {
        console.log("SignalR connected");
      })
      .catch(err => console.error("SignalR connection error", err));

    connection.on("ReceiveNotification", (data) => {
      console.log("Notification received:", data);
     addNotification(data); // internally triggers refreshJobs = true
    });

    return () => {
      connection.stop();
      console.log("SignalR disconnected");
    };
  }, [driverID]); // Run when driverID is ready

  // Listen for real-time notification trigger+F=F=F=ff+
  useEffect(() => {
    console.log("Got Here");
    if (refreshJobs) {
      //fetchJobs(driverID);
      fetchAndAddJob(message);
      setRefreshJobs(false); // reset
    }
  }, [refreshJobs]);


  //Function to get and add the new job to the list
  const fetchAndAddJob = async (jobID) => {

    setLoading(true);
    try {

      const response = await fetch(`${API_DOMAIN}/api/Job/getJob?jobID=${jobID}`);

      const newJob = await response.json();

      setJobs(prevJobs => [...prevJobs, newJob]);

    } catch (err) {
      console.error('Failed to fetch and add new Job', err.message);
    }finally
    {
      setLoading(false);
    }

  }


  return (
     
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="linear-gradient(125deg, rgba(31, 65, 114, 0.85), rgba(31, 65, 114, 0.75), rgba(31, 65, 114, 0.05))" />
      

    
      {/* Header with app title */}
      <View style={styles.header}>
        <Text style={styles.title}>JAK MOVE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Your Upcoming Jobs</Text>


        {/* Spinner while loading */}
        {loading && <ActivityIndicator size="large" color="#007bff" />}


        {error && <Text style={{ color: 'red' }}>{error}</Text>}

      {/*if job length 0 then show no jobs avaialabe  */}
        {!loading && jobs.length === 0 && <Text>No jobs assigned.</Text>}



      {/*Loop and render each job */}
        {jobs.map((job) => (
          <View key={job.jobID}>{/* Wrapper for r one jobs display*/}
            <JobCard job={job}
            showActions={false} /> {/*Render custom job card */}
   
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 }}>
             
             {/* Check ststus then if upcoming then render start button*/}

               {/* Check ststus then if upcoming then render start button*/}
              {/* Check if status is completed then render completed button */}
            </View>
          </View>
        ))}
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
    backgroundColor: '#F8F9FA',
   
  },
   header: {
   
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scale(20),
    paddingHorizontal: 10,
    lexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 18,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c', 
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 20, 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',

    marginBottom: 20,
  },
  
  noJobsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748b',
     borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 50,
    backgroundColor: '#ffffff',
   
  },

  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingBottom: 20, 
  },
  navItem: {
    alignItems: 'center',
  },
  navName: {
    fontSize: 12,
    color: '#334155', 
  },
  
});
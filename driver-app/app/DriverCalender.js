import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import colors from '../assets/styles/colors';
import { scale } from "../assets/styles/scaling";
import { API_DOMAIN } from '../constants/api';




export default function DriverCalender()
{


    const timeSlots=["8:00","12:00","16:00"]


   const router = useRouter();
   const [userId, setUserID] = useState('');
   const [driverID,setDriverID]=useState('');
   const [userType, setUserType] = useState('');
   const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    imageID: 0,
  });
  


   const [loading, setLoading] = useState(false);

    //store seleceted date 
    const [selectedDate,setSelectedDate] = useState('');
    const [slotStatus,setSlotStatus] = useState({});

    const onDayPress = (day)=>
    {
        setSelectedDate(day.dateString)
    }
    

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
 

 /*object to store date as key and timeslots as nested values inside */
   const bookedSlotsperDay = {};

  data.forEach((job)=>
{

    //Extract date 
    const date=job.jobDate.split('T')[0];
    let timeSlot=job.timeSlot?.trim();
    

    if (!timeSlot) return;

    //check if timeslot is in defined slotvalues 
    if (!timeSlots.includes(timeSlot)) {
    console.warn(`Skippin time slot: ${timeSlot}`);
    return;
    }


    /*if date hasnt been added yet then create a new object for it then have all 3 slots as available */
    if(!bookedSlotsperDay[date])
    {
        bookedSlotsperDay[date]={};
        timeSlots.forEach((slot)=>(bookedSlotsperDay[date][slot]=true));

    }
    bookedSlotsperDay[date][timeSlot]=false;//mark as booked 
  } 
);
 setSlotStatus(bookedSlotsperDay);//dates that have job data are stored/set here 


    }catch(error)
    {
      console.error("Failed to fetch job info")
    }finally
    {
      setLoading(false)
    }


  }

  useEffect(()=>
  {
    loadUser();

  },[]);

    const markedDates={};

//object to store marked daytes on calender 
//lopp through all array with jobs storing job info by date
Object.keys(slotStatus).forEach(date=>
{
    markedDates[date]={
        marked:true ,//Show dot below the date
        dotColor:'red',//use red for days with bokkings 
    };
}
);

    //Highlight slecetd date when user selects its 
    if(selectedDate)
    {
       markedDates[selectedDate] = {
       ...(markedDates[selectedDate] || {}),//keep exisiting dot 
       selected:true,
       selectedColor:colors.primary|| '#2070ff',
       selectedTextColor:'#ffffff'

    }
}



    return(
        <SafeAreaView style={{flex:1,backgroundColor: '#ffffff', justifyContent: 'center'}} >
             <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/DriverAccount')}>
                      <Feather name="arrow-left" size={24} color={colors.black} />
                    </TouchableOpacity>
                    <Text style={styles.myprofileText}>My Calender</Text>
                    <View style={{ width: 24 }} />
         
                </View>
        <View style={styles.instructionsContainer}>
           <Text style={styles.subtitle}>
             View your assigned jobs. Select a date to check availability.
           </Text>
        </View>

         {/*Calender display */} 
        <Calendar
        style={styles.calendarContainer}
        onDayPress={onDayPress}
        markedDates={markedDates}//highlight days with jobs

        />

        {/*Available dates display*/} 
        {selectedDate !== '' && (
        <View  style={styles.slotsContainer}>
           <Text style={styles.heading}> Schedule for {selectedDate}</Text> 
            {timeSlots.map((slot)=>(
            <View key={slot} style={styles.timeavailability}>
            <Text style={styles.time}>
                {slot}
            </Text>
            <Text style={styles.availability}>
             {slotStatus[selectedDate]?.[slot]===false?( 
                <>
                <Feather name="x-circle" size={20} color="red" /> booked
             </>
              ) :
              <>
              <Feather name="check-circle" size={20} color="green" /> available
              </>}
            </Text>
            </View>
            ))}
        </View>
        )}


        </SafeAreaView>
    );

}


const styles =StyleSheet.create ({
  calendarContainer:
        {
            padding:20,

        },
    myprofileText: 
    {
        fontSize: scale(14),
        fontWeight: 'bold',
        color: colors.black,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop:scale(10)
      },
      heading:
      {
        fontWeight:500,
        fontSize:16,
        textAlign:'center',
        paddingBottom:20

      },
      slotsContainer:
      {

        marginTop:20,
        padding:10,

      },
      availability:
      {

      },
      timeavailability:
      {
        flexDirection:'row',
        gap:'20',
        justifyContent:'space-between',
        padding:20,
        backgroundColor:'#f1f1f1'
      },
      instructionsContainer: {
  paddingHorizontal: 20,
  paddingBottom: 10,
  paddingTop:10,
  textAlign:'center',
  fontSize:12,
},

title: {
  fontSize: 18,
  fontWeight: '600',
  color: colors.black,
},

subtitle: {
  fontSize: 14,
  color: '#555',
  marginTop: 4,
},

}
    

);


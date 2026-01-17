import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Alert, Button, Keyboard, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking, Platform } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { scale } from '../assets/styles/scaling';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DOMAIN } from '../constants/api';
import * as Location from 'expo-location';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../tasks/locationTask';
import { useNotification } from '../services/contexts/NotificationContext';

export const options = {
  headerShown: false,
};

export default function UpdateJob() {
  const router = useRouter();
  const { jobID } = useLocalSearchParams();
  const { message } = useNotification();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [etaData, setEtaData] = useState(null);

  useEffect(() => {
    if (message && message.jobID == jobID && message.eta) {
      setEtaData({ eta: message.eta });
    }
  }, [message, jobID]);

  const fetchUnreadMessages = async (id) => {
    try {
      const response = await fetch(`${API_DOMAIN}/api/Messages/getMessages?jobID=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages.");
      }
      const data = await response.json();
      const driverId = await AsyncStorage.getItem('userID');
      const unread = data.filter(msg => !msg.isRead && msg.senderID !== parseInt(driverId)).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length > 2) {
      return parts.slice(0, 2).join(',');
    }
    return address;
  };

  const shortenTime = (time) => {
    if (!time) return '';
    return new Date(time).toLocaleString().split(',')[0];
  };

  const statuses = [
    { label: "En Route to Pickup", value: "En Route to Pickup" },
    { label: "Arrived at Pickup", value: "Arrived at Pickup" },
    { label: "Depart to Destination", value: "Depart to Destination" },
    { label: "Unloading and Setup", value: "Unloading and Setup" },
    { label: "Job Completed", value: "Job Completed" },
  ];

  const selectedIndex = statuses.findIndex(
    (option) => option.value === selectedStatus
  );

  const fetchJobDetails = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_DOMAIN}/api/Job/getJob?jobID=${id}`)

      if (!response.ok) {
        throw new Error("Failed to get job details")
      }

      const data = await response.json()
      setJob(data);
      setSelectedStatus(data.jobStatus || "")

    } catch (error) {
      console.error(error)
      Alert.alert("Error : ", error)
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (jobID) {
      fetchJobDetails(jobID);
    }
  }, [jobID]);

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (jobID) {
        fetchUnreadMessages(jobID);
      }
    }, [jobID])
  );

  const handleNavigate = () => {
    const destination = getNavigationDestinationAddress();
    if (!destination) {
      Alert.alert("No destination specified");
      return;
    }
    const url = Platform.select({
      ios: `maps:?daddr=${destination}`,
      android: `geo:?q=${destination}`
    });
    Linking.openURL(url);
  }

  const getNavigationTargetInfo = () => {
    if (!job) return { targetLabel: "N/A", targetAddress: null };

    const status = selectedStatus;
    let targetLabel = "N/A";
    let targetAddress = null;

    if (status === "En Route to Pickup" || status === "Arrived at Pickup") {
      targetLabel = "Pickup";
      targetAddress = job.pickUpPoint;
    } else if (status === "Depart to Destination" || status === "Unloading and Setup") {
      targetLabel = "Drop-off";
      targetAddress = job.dropOffPoint;
    }

    return { targetLabel, targetAddress };
  };

  const { targetLabel, targetAddress } = getNavigationTargetInfo();

  const getNavigationDestinationAddress = () => {
    if (!job) return null;
    const status = selectedStatus;
    if (status === "En Route to Pickup" || status === "Arrived at Pickup") {
      return job.pickUpPoint;
    } else if (status === "Depart to Destination" || status === "Unloading and Setup") {
      return job.dropOffPoint;
    }
    return null;
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      Alert.alert("Select Status", "Please select a job status.");
      return;
    }

    try {
      if (selectedStatus === "En Route to Pickup" || selectedStatus === "Depart to Destination") {
        await startBackgroundLocationUpdates();
      } else {
        await stopBackgroundLocationUpdates();
      }
    } catch (e) {
      console.log("Background location could not be started in Expo Go.", e);
      // Alert the user only if not in production, as this is expected in Expo Go
      if (__DEV__) {
        Alert.alert("Location Tracking", "Live location tracking is disabled in Expo Go. Please use a development build.");
      }
    }

    try {
      const response = await fetch(`${API_DOMAIN}/api/Job/Update-JobStatus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobID: parseInt(jobID),
            status: selectedStatus,
            message: extraNotes || "No reason provided"
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update job status.");
      }

      Alert.alert("Success", "Job status updated successfully!");
      fetchJobDetails(jobID);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  };

  const handleCancelJob = async () => {
    try {
      await stopBackgroundLocationUpdates();
    } catch (e) {
      console.log("Could not stop background location in Expo Go.", e);
    }
    try {
      const response = await fetch(`${API_DOMAIN}/api/Job/cancel-Job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobID: parseInt(jobID),
          message: extraNotes || "No reason provided",
        }),
      });

      if (!response.ok) throw new Error("Failed to cancel job.");

      Alert.alert("Job Cancelled", "The customer has been notified.");
      await fetchJobDetails(jobID);
      router.push("/DriverDashboard");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  };


  const confirmCancellation = () => {
    if (!extraNotes.trim()) {
      Alert.alert("Reason for Cancellation", "Please provide a reason for cancelling the job inside notes.");
      return;
    }

    Alert.alert(
      "Cancel Job",
      "Are you sure you want to cancel this job?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          onPress: () => handleCancelJob(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.overall}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.overall}>
        <Text style={{ textAlign: "center" }}>
          No job found. Please return and select a job.
        </Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.heading}>Update Job</Text>
        <TouchableOpacity onPress={() => {
          router.push('/Chat?jobID=' + jobID);
        }}>
          <View>
            <Feather name="message-circle" size={24} color="#1f4172" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>


      <ScrollView contentContainerStyle={styles.content}>

        {/* --- JOB DETAILS BLOCK --- */}
        <View style={styles.infoBlock}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Service Type:</Text>
            <Text style={styles.value}>{job.serviceType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Current Status:</Text>
            <Text style={styles.value}>{job.jobStatus}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>
              {shortenTime(job.jobDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Pick-Up:</Text>
            <Text style={styles.value}>{shortenAddress(job.pickUpPoint)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Drop-Off:</Text>
            <Text style={styles.value}>{shortenAddress(job.dropOffPoint)}</Text>
          </View>

          {/*Maps section redirection */}
          {targetAddress && (
            <View style={styles.targetNavigationSection}>
              <View>
                <Text style={styles.targetNavigationLabel}>Route To: {targetLabel}</Text>
              {/*<Text style={styles.targetNavigationETA}>ETA: {etaData ? etaData.eta : "N/A"}</Text> */}
              </View>
              <TouchableOpacity style={styles.openMapsButtonBlue} onPress={handleNavigate}>
                <Feather name="map" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.openMapsButtonTextBlue}>Open Maps</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Select New Status:</Text>

        <View style={styles.blockContainer}>
          {statuses.map((option, index) => {
            const isSelected = index <= selectedIndex && selectedIndex !== -1;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionBlock,
                  isSelected && styles.selectedOptionContainer,
                ]}
                onPress={() => setSelectedStatus(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Text style={styles.tick}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.optionBlockCancel}
          onPress={() => confirmCancellation()}
        >
          <Text
            style={[styles.optionText]}
          >
            Cancel Job
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Optional Note:</Text>
        <TextInput
          style={styles.noteInput}
          value={extraNotes}
          onChangeText={setExtraNotes}
          placeholder="Leave a note"
          multiline
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateStatus}
        >
          <Text style={styles.updateButtonText}>Update Job</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  overall: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: '#f4f7fa',
  },
  content: {
    padding: 20,
    paddingTop: 20,
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
  heading: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    textAlign: "center",
    marginTop: 0,

  },
  infoBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    width: 100,
    color: "#475569",
    fontSize: 14,
  },
  value: {
    flex: 1,
    color: "#1e293b",
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  blockContainer: {
    marginTop: 8,
  },
  optionBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  selectedOptionContainer: {
    borderColor: "#10c695",
    backgroundColor: "#e6f7f2",
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: '500',
  },
  optionTextSelected: {
    color: "#0e9e7a",
    fontWeight: "bold",
  },
  tick: {
    fontSize: 18,
    color: "#10c695",
  },
  optionBlockCancel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fee2e2",
    marginTop: 10,
    maxWidth: '200px',
    width: '150px',
  },
  cancelOptionText: {
    fontSize: 14,
    color: "#b91c1c",
    fontWeight: 'bold',
  },

  updateButton: {
    marginTop: 20,
    backgroundColor: '#1f4172',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',

    elevation: 5,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // NEW STYLES FOR TARGET NAVIGATION SECTION
  targetNavigationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5', // subtle separator
    paddingHorizontal: 5, // slight padding for inner content
  },
  targetNavigationLabel: {
    fontWeight: "bold",
    color: "#2C3E50",
    fontSize: 14,
    marginBottom: 4,
  },
  targetNavigationETA: {
    color: "#5A6A7D",
    fontSize: 13,
    fontWeight: '500',
  },
  openMapsButtonBlue: {
    backgroundColor: '#4A90E2', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  openMapsButtonTextBlue: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
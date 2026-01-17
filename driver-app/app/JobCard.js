import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function JobCard({ job, showActions = true, onStartUpdate, onDownloadProof }) {
  const router = useRouter();

  //Convert the jobdate to object
  const date = new Date(job.jobDate)
  const formattedDate = date.toLocaleString('en-ZA',
    {
       day :"2-digit",
       month:'long',
       year: 'numeric'
    }
  )
  return (
    <View style={styles.card}>
      <View style={styles.jobIdandTime}>
        <Text style={styles.jobId}>Job ID: #{job.jobID}</Text>
         <Text style={styles.scheduledTime}>
           {job.timeSlot}
        </Text>
      </View>
       
      <View style={styles.header}>


        <View style={styles.row}>
          <Feather name="user" size={14} color="#555" /> 
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.boldText}>{job.customerName}</Text>
        </View>
        
        <View style={styles.row}>
        <Feather name="calendar" size={14} color="#555" /> 
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.boldText}> {formattedDate}</Text>

      </View >
       <View style={styles.row}>
        <Feather name="map-pin" size={14} color="#555" /> 
        <Text style={styles.label}>Pickup:</Text>
        <Text style={styles.boldText}> {job.pickUpPoint}</Text>
      </View >
      <View  style={styles.row}>
        <Feather name="flag" size={14} color="#555" /> 
        <Text style={styles.label}>Drop-Off:</Text>
        <Text style={styles.boldText}> {job.dropOffPoint}</Text>
      </View >
       <View  style={styles.row}>
       <Feather name="box" size={14} color="#555" />
       <Text style={styles.label}>Service Type:</Text>
  <Text style={styles.boldText}> {job.serviceType}</Text>
  </View >

  {job.serviceType?.toLowerCase() === 'furniture delivery' && (
    <>
      <View style={styles.row}>
        <Feather name="box" size={14} color="#555" />
        <Text style={styles.label}>Shop Name:</Text>
        <Text style={styles.boldText}> {job.shopName}</Text>
      </View>
     <TouchableOpacity
  style={styles.proofLink} 
  onPress={() => onDownloadProof?.(job.jobID)}
>
        <Feather name="file-text" size={14} color="#007bff" />
        <Text style={styles.proofLinkText}>Download Proof of Purchase</Text>
      </TouchableOpacity>
    </>
  )}
  
</View>
      {/*Look through inventory list */}
      {Array.isArray(job.inventoryList) && job.inventoryList.length > 0 && (
        <View style={styles.inventorySection}>
          <TouchableOpacity
            style={styles.inventoryHeaderButton}
            onPress={() => router.push({ pathname: '/InventoryList', params: { inventory: JSON.stringify(job.inventoryList) } })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.label}>Inventory:</Text>
              {job.inventoryList.length > 5 && (
                <Feather name="chevron-down" size={16} color="#64748b" style={styles.dropdownIcon} />
              )}
            </View>
            {job.inventoryList.length > 5 && (
              <Text style={styles.showMoreButtonText}>View all {job.inventoryList.length} items</Text>
            )}
          </TouchableOpacity>
          {job.inventoryList.slice(0, 5).map((item, index) => (
            <Text key={index} style={styles.inventoryItem}>•  {item}</Text>
          ))}
        </View>
      )}

    <TouchableOpacity style={styles.statusBadge}>
        <Text style={styles.statusBadgeText}>
          Status: {job.jobStatus}
        </Text>
      </TouchableOpacity>

 {/* BUTTONS */}
 {showActions && (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
  style={[
    styles.actionButton,
    job.jobStatus?.toLowerCase() === 'job completed' && styles.completedButton,
  ]}
 onPress={() => {
    if (job.jobStatus?.trim().toLowerCase() === 'upcoming') {
      onStartUpdate?.(job.jobID, job.jobStatus, job.customerID);
    } else if (job.jobStatus?.trim().toLowerCase() !== 'job completed') {
      // Navigate directly if job is already started
      onStartUpdate?.(job.jobID, job.jobStatus, job.customerID);
    }
  }}
  disabled={job.jobStatus?.toLowerCase() === 'job completed'}
>
  <Text style={styles.actionButtonText}>
    {job.jobStatus?.trim().toLowerCase() === 'upcoming'
      ? 'Start Job'
      : job.jobStatus?.trim().toLowerCase() === 'job completed'
        ? 'Job Completed'
        : 'Continue Job'
    }
  </Text>
</TouchableOpacity>

      </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,

    elevation: 3,
    borderWidth: 1,
    borderColor: '#eef2f5',
  },
  jobIdandTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 15,
  },
  jobId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },

scheduledTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb', 
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#dbeafe', 
    
  },
  header: {
   
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 8,
    width: 80, // Align labels
  },
  boldText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  inventorySection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inventoryItem: {
     color: '#475569',
    lineHeight: 20,
    marginLeft: 10,
    fontSize: 14,
   
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    marginTop: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9', 
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBadgeText: {
    color: '#475569', 
    fontWeight: '600',
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    
  },
    actionButton: {
    backgroundColor: '#1f4172', 
    borderRadius: 8,
    alignItems: 'center', 
    paddingVertical: 16,
   
  },
  completedButton: {
    backgroundColor: '#94a3b8', // Gray for completed
  },
 proofLink: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  marginTop: 10,
},
  proofLinkText: {
  color: '#007bff', 
  fontWeight: '600',
  fontSize: 14,
  marginLeft: 8,
  textDecorationLine: 'underline',
},
inventoryHeaderButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 5,
  marginBottom: 10,
},
dropdownIcon: {
  marginLeft: 5,
},
showMoreButtonText: {
  color: '#007bff',
  fontWeight: 'bold',
  fontSize: 14,
},});
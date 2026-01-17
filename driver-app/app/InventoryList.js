import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function InventoryList() {
  const router = useRouter();
  const { inventory } = useLocalSearchParams();

  const inventoryList = inventory ? JSON.parse(inventory) : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Feather name="arrow-left" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Full Inventory List</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {inventoryList.length === 0 ? (
          <Text style={styles.noItemsText}>No inventory items found</Text>
        ) : (
          inventoryList.map((item, index) => (
            <View key={index} style={styles.inventoryItemContainer}>
              <Text style={styles.inventoryItemText}>• {item}</Text>
            </View>
          ))
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButtonHeader: {
    marginRight: 15,
  },
  headerTitle: {
        color: "#1a202c",
    textAlign: "center",
    marginTop: 10,
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",

  },
  content: {
    padding: 20,
  },
  inventoryItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    shadowColor: '#000',
 
  },
  inventoryItemText: {
    fontSize: 16,
    color: '#333333',
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666666',
  },
});

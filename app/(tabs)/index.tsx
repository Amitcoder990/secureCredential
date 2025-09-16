import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, CreditCard as Edit, Trash2, Eye } from 'lucide-react-native';
import { Credential, storageService } from '@/services/storage';
import { maskEmail, maskPhone, maskUsername } from '@/utils/maskUtils';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import PinVerificationModal from '@/components/PinVerificationModal';
import { useNetwork } from '@/hooks/useNetwork';

type PinData = {
  pin: string;
  isDisable: boolean;
} | null;

export default function HomeScreen() {
  const { isConnected } = useNetwork();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinData, setPinData] = useState<PinData>(null);

  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Load credentials when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCredentials();
      loadPin();
    }, [])
  );

  useEffect(() => {
    filterCredentials();
  }, [searchQuery, credentials]);

  const handlePinVerified = async (pin: string) => {
    if (isConnected === false) {
      Alert.alert('No Internet', 'You are offline. Please connect to the internet to verify PIN.');
      setShowPinModal(false);
      return;
    }
    try {
      const newPinId = await storageService.saveToPinFirebase(pin, true, true);
      setShowPinModal(false);
      console.log("Saved new pin with ID:", newPinId);
      // Alert.alert('Success', 'PIN created successfully!');
    } catch (error) {

    }



  };

  const loadPin = async () => {
    try {
      const data = await storageService.getPPin();
      setPinData(data);
      if (data == null) {
        setShowPinModal(true);
      }
      console.log(data, "<==21===");
    } catch (err) {
      console.error('Failed to load PIN', err);
      setPinData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await storageService.getAllCredentials();
      setCredentials(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load credentials');
    }
  };

  const filterCredentials = () => {
    if (!searchQuery.trim()) {
      setFilteredCredentials(credentials);
      return;
    }

    const filtered = credentials.filter(credential =>
      credential.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credential.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCredentials(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCredentials();
    setRefreshing(false);
  };

  const handleDelete = (credential: Credential) => {
    Alert.alert(
      'Delete Credential',
      `Are you sure you want to delete "${credential.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteCredential(credential?.id);
              await loadCredentials();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete credential');
            }
          },
        },
      ]
    );
  };

  const renderCredentialItem = ({ item }: { item: Credential }) => (
    <View style={styles.credentialCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.credentialTitle}>{item.title}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/credential-details?id=${item?.id}`)}
          >
            <Eye size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/edit-credential?id=${item?.id}`)}
          >
            <Edit size={20} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.credentialInfo}>
        <Text style={styles.infoLabel}>Username:</Text>
        <Text style={styles.infoValue}>{maskUsername(item?.username)}</Text>
      </View>

      {item?.email && <View style={styles.credentialInfo}>
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{maskEmail(item?.email)}</Text>
      </View>}

      {item?.phone && <View style={styles.credentialInfo}>
        <Text style={styles.infoLabel}>{"Phone:"}</Text>
        <Text style={styles.infoValue}>{maskPhone(item?.phone)}</Text>
      </View>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Credentials</Text>
        {/* <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-credential')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity> */}
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search credentials..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filteredCredentials}
        renderItem={renderCredentialItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => {
          // still waiting on initial load?
          if (loading || filteredCredentials == null) {
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            );
          }

          // loaded but empty
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No credentials found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first credential to get started'}
              </Text>
            </View>
          );
        }}
      />

      {pinData == null && <PinVerificationModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onPinVerified={handlePinVerified}
        isCreatePin={true}
      />}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  credentialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  credentialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  credentialInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
    fontFamily: 'Inter-Regular',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});
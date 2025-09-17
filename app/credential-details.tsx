import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, CreditCard as Edit, Copy } from 'lucide-react-native';
import { Credential, storageService } from '@/services/storage';
import { maskEmail, maskPhone, maskUsername, encryptPassword, maskDesc } from '@/utils/maskUtils';
import { useAuth } from '@/context/AuthContext';
import PinVerificationModal from '@/components/PinVerificationModal';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useNetwork } from "../hooks/useNetwork";


type PinData = {
  pin: string;
  isDisable: boolean;
} | null;

export default function CredentialDetailsScreen() {
  const { isConnected } = useNetwork();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinData, setPinData] = useState<PinData>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { pin: storedPin } = useAuth();
  const { authenticate } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadCredential();
      // Reset password visibility when screen comes into focus
      setShowPassword(false);
    }, [id])
  );

  useEffect(() => {
    const loadPin = async () => {
      try {
        const data = await storageService.getPPin();
        setPinData(data);
        console.log(data, "<==21===");
      } catch (err) {
        console.error('Failed to load PIN', err);
        setPinData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPin();
  }, []); // run once on mount

  const loadCredential = async () => {
    if (typeof id === 'string') {
      const data = await storageService.getCredentialById(id);
      setCredential(data);
    }
  };

  const handleShowPassword = () => {
    setShowPinModal(true);
  };

  const handlePinVerified = (pin: string) => {
    if (isConnected === false) {
      Alert.alert('No Internet', 'You are offline. Please connect to the internet to verify PIN.');
      setShowPinModal(false);
      return;
    }
    if (Number(pin) === Number(pinData?.pin)) {
      setShowPassword(true);
      setShowPinModal(false);
    } else {
      Alert.alert('Incorrect PIN', 'Please try again.');
      setShowPinModal(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  if (!credential) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credential Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Credential not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credential Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/edit-credential?id=${credential.id}`)}
        >
          <Edit size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.credentialTitle}>{credential.title}</Text>
          <Text style={styles.createdDate}>
            Created: {new Date(credential.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{maskUsername(credential.username)}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(credential.username, 'Username')}
              >
                <Copy size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {credential.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{maskEmail(credential.email)}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(credential.email, 'Email')}
                >
                  <Copy size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {credential.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{maskPhone(credential.phone)}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(credential.phone, 'Phone')}
                >
                  <Copy size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {credential.description && showPassword && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, {}]}>{maskDesc(credential?.description)}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(credential.description, 'description')}
                >
                  <Copy size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <Text style={styles.detailValue}>
                {showPassword ? credential.password : encryptPassword(credential.password)}
              </Text>
              <View style={styles.passwordActions}>
                {showPassword && <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(credential.password, 'Password')}
                >
                  <Copy size={16} color="#6B7280" />
                </TouchableOpacity>}
                {pinData != null && <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={showPassword ? () => setShowPassword(false) : handleShowPassword}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#3B82F6" />
                  ) : (
                    <Eye size={16} color="#3B82F6" />
                  )}
                </TouchableOpacity>}
              </View>
            </View>
          </View>


        </View>



        {credential.updatedAt !== credential.createdAt && (
          <Text style={styles.updatedText}>
            Last updated: {new Date(credential.updatedAt).toLocaleDateString()}
          </Text>
        )}
      </ScrollView>

      <PinVerificationModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onPinVerified={handlePinVerified}
      />
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
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  placeholder: {
    width: 44,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 20,
  },
  credentialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  createdDate: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  detailValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  eyeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#EBF5FF',
  },
  updatedText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
    fontFamily: 'Inter-Regular',
  },
});
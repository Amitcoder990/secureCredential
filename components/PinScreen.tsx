import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'; // 👈 ActivityIndicator import karein
import { useAuth } from '@/context/AuthContext';
import { Shield, Delete } from 'lucide-react-native';
import { storageService } from '@/services/storage';
import { useNetwork } from "../hooks/useNetwork";

type PinData = {
  pin: string;
  isDisable: boolean;
} | null;

export default function PinScreen() {
  const { isConnected } = useNetwork();
  const [pinData, setPinData] = useState<PinData>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // 👈 Nayi state loader ke liye

  const { authenticate } = useAuth();

  // 👈 useEffect ko yahan component ke top level par move kiya gaya hai
  useEffect(() => {
    const loadPin = async () => {
      try {
        const data = await storageService.getPin();
        setPinData(data);
        console.log(data, "<=====");
      } catch (err) {
        console.error('Failed to load PIN', err);
        setPinData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPin();
  }, []); // run once on mount

  const handleNumberPress = (number: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin(prev => prev + number);
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // 👈 Agar pehle se submit ho raha hai to kuch na karein

    setIsSubmitting(true); // 👈 Loader chalu karein
    try {
      if (isConnected === false) {
        Alert.alert('No Internet', 'You are offline. Please connect to the internet to verify PIN.');
        return;
      }

      if (pinData != null) {
        if (enteredPin.length >= 4) { // 👈 Min length check yahan bhi zaroori hai
          if (pinData?.isDisable && pinData.pin === enteredPin) {
            await authenticate(enteredPin);
          } else {
            Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
          }
        }
      } else {
        if (enteredPin.length >= 4) {
          // Save new PIN
          const newPinId = await storageService.saveToPinFirebase(enteredPin, true);
          console.log("Saved new pin with ID:", newPinId);
          await authenticate(enteredPin);
        } else {
          Alert.alert('PIN Too Short', 'Please enter a PIN with at least 4 digits.');
        }
      }
    } catch (err) {
      console.error('Failed to process PIN', err);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setEnteredPin(''); // 👈 PIN ko hamesha reset karein
      setIsSubmitting(false); // 👈 Loader band karein
    }
  }

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < enteredPin.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} style={styles.numberButton} />;
              }
              if (item === 'delete') {
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.numberButton}
                    onPress={handleDelete}
                  >
                    <Delete size={24} color="#6B7280" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(item)}
                >
                  <Text style={styles.numberText}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // 👈 Initial loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Shield size={60} color="#3B82F6" />
        <Text style={styles.title}>Secure Credentials</Text>
        <Text style={styles.subtitle}>
          {pinData != null ? 'Enter your PIN' : 'Create a 4 to 6 digit PIN'}
        </Text>
      </View>

      {renderPinDots()}
      {renderNumberPad()}

      {enteredPin.length >= 4 && (
        // 👇 Button ko update kiya gaya hai
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {pinData != null ? 'Unlock' : 'Create PIN'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 60,
    gap: 15,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  numberPad: {
    width: '100%',
    maxWidth: 300,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 40,
    minWidth: 150, // 👈 Thodi minimum width de di
    alignItems: 'center', // 👈 Loader ko center karne ke liye
  },
  submitButtonDisabled: { // 👈 Disabled state ke liye nayi style
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
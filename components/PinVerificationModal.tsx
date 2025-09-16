import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator, // 👈 Import ActivityIndicator
} from 'react-native';
import { Shield, Delete, X } from 'lucide-react-native';

interface PinVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onPinVerified: (pin: string) => void;
  isCreatePin?: boolean; // Optional prop to indicate if it's for creating a new PIN
}

export default function PinVerificationModal({
  visible,
  onClose,
  onPinVerified,
  isCreatePin = false,
}: PinVerificationModalProps) {
  const [enteredPin, setEnteredPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false); // 👈 Add new state for loading

  const handleNumberPress = (number: string) => {
    if (enteredPin?.length < 6) {
      const newPin = enteredPin + number;
      setEnteredPin(newPin);

      // Auto-submit when PIN reaches 6 digits
      if (newPin.length === 6) {
        setIsVerifying(true); // 👈 Set verifying to true
        onPinVerified(newPin);
        // We no longer clear the PIN here, it will be cleared on close
        // setIsVerifying(false);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleClose = () => {
    setEnteredPin('');
    setIsVerifying(false); // 👈 Reset verifying state on close
    onClose();
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < enteredPin.length && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>
    );
  };

  // 👈 New component to show loader
  const renderLoader = () => {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loaderText}>
          {isCreatePin ? 'Creating PIN...' : 'Verifying PIN...'}
        </Text>
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
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
                    disabled={isVerifying} // 👈 Disable while verifying
                  >
                    <Delete size={20} color="#6B7280" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(item)}
                  disabled={isVerifying} // 👈 Disable while verifying
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Shield size={40} color="#3B82F6" />
            <Text style={styles.title}>
              {isCreatePin ? 'Create your secure PIN' : 'Enter PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {isCreatePin
                ? 'Set PIN to view password'
                : 'Verify your PIN to view password'}
            </Text>
          </View>

          {/* 👈 Conditional rendering: show loader or pin dots */}
          {isVerifying ? renderLoader() : renderPinDots()}

          {renderNumberPad()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 12,
    height: 24, // 👈 Give fixed height to prevent layout jump
    alignItems: 'center',
  },
  // 👇 New styles for loader
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    height: 40, // 👈 Give same height to prevent layout jump
  },
  loaderText: {
    marginTop: 0,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  numberPad: {
    width: '100%',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  numberButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  numberText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
});
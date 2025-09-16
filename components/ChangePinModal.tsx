import { storageService } from '@/services/storage';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';

interface ChangePinModalProps {
    isVisible: boolean;
    oprationType: String; // 1 for change PIN 2 for change secure PIN
    onClose: () => void;
}

const ChangePinModal: React.FC<ChangePinModalProps> = ({ isVisible, oprationType, onClose }) => {
    const [oldPin, setOldPin] = useState<string>('');
    const [newPin, setNewPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [isFormValid, setIsFormValid] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);


    // Effect to validate the form whenever PINs change for 6 digits
    useEffect(() => {
        const isValid =
            oldPin.length === 6 &&
            newPin.length === 6 &&
            confirmPin.length === 6 &&
            newPin === confirmPin;
        setIsFormValid(isValid);
    }, [oldPin, newPin, confirmPin]);

    const handleUpdatePress = async () => {
        if (!isFormValid) {
            if (newPin !== confirmPin) {
                Alert.alert('PIN Mismatch', 'Your new PIN and confirmation PIN do not match.');
            } else {
                Alert.alert('Invalid Input', 'Please ensure all PIN fields are filled with 6 digits.');
            }
            return;
        }
        setIsLoading(true);

        try {
            // Update an existing pin
            const updated = await storageService.updateToPinByOldPin(oldPin, newPin, true, oprationType);
            debugger
            console.log("Update success:", updated);
            if (updated) {
                Alert.alert('Success', 'Your PIN has been updated successfully.');
            } else {
                Alert.alert('Error', 'Failed to update PIN. Please ensure your old PIN is correct.');
            }

        } catch (error) {
            console.error("PIN update error:", error);
            Alert.alert('Error', 'An unexpected error occurred while updating your PIN.');
        } finally {
            setIsLoading(false);
        }




        handleClose();
    };

    const handleClose = () => {
        // Reset state before closing
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalBackdrop}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{oprationType === "1" ? "Change Security PIN" : "Change Secure PIN"}</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        <Text style={styles.inputLabel}>Old PIN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter old 6-digit PIN"
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            value={oldPin}
                            onChangeText={setOldPin}
                            autoFocus={true}
                        />

                        <Text style={styles.inputLabel}>New PIN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new 6-digit PIN"
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            value={newPin}
                            onChangeText={setNewPin}
                        />

                        <Text style={styles.inputLabel}>Confirm New PIN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new 6-digit PIN"
                            keyboardType="number-pad"
                            maxLength={6}
                            secureTextEntry
                            value={confirmPin}
                            onChangeText={setConfirmPin}
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleClose}
                        >
                            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.updateButton, !isFormValid && styles.disabledButton]}
                            onPress={handleUpdatePress}
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Update PIN</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '90%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    closeButtonText: {
        fontSize: 24,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    modalBody: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginLeft: 10,
    },
    updateButton: {
        backgroundColor: '#3B82F6',
    },
    disabledButton: {
        backgroundColor: '#A5B4FC',
    },
    cancelButton: {
        backgroundColor: '#E5E7EB',
    },
    buttonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#4B5563',
    },
});

export default ChangePinModal;


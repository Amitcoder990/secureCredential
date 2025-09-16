import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Shield, Info, Key, FileText, Download, Eye } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services/storage';
import ChangePinModal from '@/components/ChangePinModal';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [isModalVisible, setModalVisible] = useState(false);
  const [oprationType, setOprationType] = useState<String>("0"); // 1 for change PIN 2 for change secure PIN


  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to enter your PIN again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleChangePin = () => {
    setOprationType("1");
    setModalVisible(true);
  };
  const handleUpdateSecurePin = () => {
    setOprationType("2");
    setModalVisible(true);
  };

  const handleAbout = () => {
    Alert.alert(
      'About Secure Credentials',
      'Version 1.0.0\n\nA secure credential manager app with PIN protection and encrypted storage.\n\nMade by AMit.',
      [{ text: 'OK' }]
    );
  };

  const settingsItems = [
    {
      icon: Key,
      title: 'Change PIN',
      subtitle: 'Update your security PIN',
      onPress: handleChangePin,
      color: '#3B82F6',
    },
    {
      icon: Eye,
      title: 'Change Secure PIN',
      subtitle: 'Update your secure PIN (To show/hide passwords)',
      onPress: handleUpdateSecurePin,
      color: '#10B981',
    },
    // {
    //   icon: FileText,
    //   title: 'Backup Data',
    //   subtitle: 'Export credentials to PDF file',
    //   onPress: handleBackup,
    //   color: '#10B981',
    //   loading: isExporting,
    // },
    {
      icon: Info,
      title: 'About',
      subtitle: 'App version and information',
      onPress: handleAbout,
      color: '#6B7280',
    },
    {
      icon: LogOut,
      title: 'Logout',
      subtitle: 'Exit the app securely',
      onPress: handleLogout,
      color: '#EF4444',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.securitySection}>
          <Shield size={40} color="#3B82F6" />
          <Text style={styles.securityTitle}>Your data is secure</Text>
          <Text style={styles.securitySubtitle}>
            All credentials are encrypted and stored locally on your device with PIN protection.
          </Text>
        </View>

        <View style={styles.settingsList}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={item.onPress}
              disabled={item.loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                {item.loading ? (
                  <ActivityIndicator size="small" color={item.color} />
                ) : (
                  <item.icon size={20} color={item.color} />
                )}
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
                <Text style={styles.settingsSubtitle}>
                  {item.loading ? 'Preparing export...' : item.subtitle}
                </Text>
              </View>
              {item.loading && (
                <View style={styles.loadingContainer}>
                  <Download size={16} color={item.color} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure Credentials v1.0.0
          </Text>
        </View>
      </View>
      <ChangePinModal isVisible={isModalVisible} oprationType={oprationType} onClose={() => setModalVisible(false)} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  securitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
});
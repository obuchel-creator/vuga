
import React, { useEffect, useState, useRef } from 'react';
import { Modal, TouchableOpacity, Appearance, Animated, useColorScheme, ScrollView, StyleSheet, View, Text, TextInput, Button, FlatList, Alert, Image } from 'react-native';
import { VUGA_COLORS } from './src/vugaColors';
import AppNavigator from './src/AppNavigator';
import ProfileScreen from './src/ProfileScreen';
import PaymentScreen from './src/PaymentScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Image as RNImage } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';


// ...existing code...
// Localization setup
i18n.translations = {
  en: {
    traffic: 'VugaSafe Pro',
    location: 'Location',
    description: 'Description',
    severity: 'Severity',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    latitude: 'Latitude',
    longitude: 'Longitude',
    addPhoto: 'Add Photo',
    changePhoto: 'Change Photo',
    submit: 'Submit',
    comments: 'Comments',
    send: 'Send',
    profile: 'Profile',
    logout: 'Logout',
    filter: 'Filter',
    all: 'All',
    recent: 'Recent',
    allTime: 'All Time',
    report: 'Report',
    editProfile: 'Edit Profile',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    myReports: 'My Reports',
    disableNotifications: 'Disable Notifications',
    enableNotifications: 'Enable Notifications',
    reported: 'Reported',
    warningJam: 'Warning: There is a reported traffic jam on your route!',
    bestRoute: 'Best Route',
    login: 'Login',
    register: 'Register',
    noAccount: 'No account? Register',
    haveAccount: 'Have an account? Login',
    email: 'Email (or leave blank if using phone)',
    phone: 'Phone (or leave blank if using email)',
    password: 'Password',
    addComment: 'Add a comment...'
  },
  sw: {
    traffic: 'Vuga',
    location: 'Mahali',
    description: 'Maelezo',
    severity: 'Ukali',
    low: 'Chini',
    medium: 'Wastani',
    high: 'Juu',
    latitude: 'Latitudo',
    longitude: 'Longitudo',
    addPhoto: 'Ongeza Picha',
    changePhoto: 'Badilisha Picha',
    submit: 'Tuma',
    comments: 'Maoni',
    send: 'Tuma',
    profile: 'Wasifu',
    logout: 'Ondoka',
    filter: 'Chuja',
    all: 'Yote',
    recent: 'Karibuni',
    allTime: 'Wakati Wote',
    report: 'Ripoti',
    editProfile: 'Hariri Wasifu',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    back: 'Nyuma',
    myReports: 'Ripoti Zangu',
    disableNotifications: 'Zima Arifa',
    enableNotifications: 'Washa Arifa',
    reported: 'Imearifiwa',
    warningJam: 'Onyo: Kuna foleni ya trafiki kwenye njia yako!',
    bestRoute: 'Njia Bora',
    login: 'Ingia',
    register: 'Jisajili',
    noAccount: 'Huna akaunti? Jisajili',
    haveAccount: 'Una akaunti? Ingia',
    email: 'Barua pepe (au acha wazi ukitumia simu)',
    phone: 'Simu (au acha wazi ukitumia barua pepe)',
    password: 'Nenosiri',
    addComment: 'Ongeza maoni...'
  }
};
i18n.locale = Localization.locale;
i18n.fallbacks = true;

const BASE_URL = 'http://192.168.1.111:5000'; // Update to match your backend port
const WS_URL = 'ws://192.168.1.111:5050'; // Update to match your backend IP
const API_URL = BASE_URL + '/api/reports';
const AUTH_URL = BASE_URL + '/api/auth';
const ROUTE_SUGGEST_URL = BASE_URL + '/api/route-suggestions';
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // <-- Insert your Google Maps API key here

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [paid, setPaid] = useState(false);
  const [rolloutEligible, setRolloutEligible] = useState(true); // default true for backward compatibility
  const [rollbackVersion, setRollbackVersion] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Register for push notifications
  useEffect(() => {
    async function registerForPush() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);
    }
    registerForPush();
  }, []);

  // Send push token to backend after login
  useEffect(() => {
    if (user && expoPushToken) {
      axios.post('http://192.168.1.111:5000/api/push/register', {
        userId: user.id,
        expoPushToken,
      }).catch(() => {});
    }
  }, [user, expoPushToken]);

  // Handler to update user after login/register/logout
  const handleAuthChange = async (newUser) => {
    setUser(newUser);
    if (!newUser) {
      AsyncStorage.removeItem('user');
      setPaid(false);
      setRolloutEligible(true);
      setRollbackVersion(null);
      return;
    }
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    // Check payment status after login
    try {
      const payRes = await axios.get(`http://192.168.1.111:5000/pay/status/${newUser.id}`);
      setPaid(payRes.data.paid);
    } catch {
      setPaid(false);
    }
    // Check rollout eligibility for current version
    let appVersion;
    try {
      appVersion = require('./app.json').runtimeVersion || require('./app.json').version;
      const rolloutRes = await axios.get(`http://192.168.1.111:5000/api/rollout-status?version=${appVersion}&userId=${newUser.id}`);
      setRolloutEligible(!!rolloutRes.data.rollout);
    } catch {
      setRolloutEligible(true); // fallback to true if error
    }
    // Check rollback status for current version
    try {
      const rollbackRes = await axios.get(`http://192.168.1.111:5000/api/rollback-status?version=${appVersion}`);
      setRollbackVersion(rollbackRes.data.rollback && rollbackRes.data.rollback !== false ? rollbackRes.data.rollback : null);
    } catch {
      setRollbackVersion(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VUGA_COLORS.light.background }}>
          <Text style={{ color: VUGA_COLORS.light.primary, fontSize: 20 }}>Loading... (OTA Test)</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {!user ? (
        <ProfileScreen onAuthChange={handleAuthChange} />
      ) : !paid ? (
        <PaymentScreen userId={user.id} onPaymentSuccess={() => setPaid(true)} />
      ) : rollbackVersion ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VUGA_COLORS.light.background }}>
          <Text style={{ color: VUGA_COLORS.light.primary, fontSize: 20, textAlign: 'center', margin: 24 }}>
            This version has been rolled back. Please update to version {rollbackVersion} to continue using the app.
          </Text>
        </View>
      ) : !rolloutEligible ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VUGA_COLORS.light.background }}>
          <Text style={{ color: VUGA_COLORS.light.primary, fontSize: 20, textAlign: 'center', margin: 24 }}>
            This update is not yet available for your account. Please check back soon!
          </Text>
        </View>
      ) : (
        <AppNavigator user={user} onAuthChange={handleAuthChange} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  form: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 10,
    zIndex: 2,
  },
  formTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  reportList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 2,
  },
  reportCard: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reportTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  reportDesc: { fontSize: 14, color: '#333', marginBottom: 4 },
  reportPhoto: { width: 120, height: 90, borderRadius: 8, marginVertical: 4, alignSelf: 'center' },
  voteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 2 },
  reportTime: { fontSize: 10, color: '#888', marginTop: 2, alignSelf: 'flex-end' },
  // Comments styles
  commentsSection: { marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8 },
  commentsTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  commentsList: { maxHeight: 60, marginBottom: 4 },
  commentItem: { marginBottom: 2, padding: 4, backgroundColor: '#fff', borderRadius: 4 },
  commentText: { fontSize: 13, color: '#333' },
  commentMeta: { fontSize: 10, color: '#888', alignSelf: 'flex-end' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 6, marginRight: 6 },
});
  
  function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // Basic analytics logger
  async function logAnalytics(event, data = {}) {
    const logs = await AsyncStorage.getItem('analyticsLogs');
    const newLog = { event, data, timestamp: Date.now() };
    const updatedLogs = logs ? JSON.parse(logs).concat([newLog]) : [newLog];
    await AsyncStorage.setItem('analyticsLogs', JSON.stringify(updatedLogs));
  }

// Ensure the main App component is exported as default


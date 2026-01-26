
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { VUGA_COLORS } from './vugaColors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';


const API_URL = 'http://192.168.1.111:5000/api/auth'; // Update as needed


export default function ProfileScreen({ onAuthChange }) {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [myReports, setMyReports] = useState([]);
  // console.log('ProfileScreen render', { loading, user, authMode });

  const handleAuth = async () => {
    setLoading(true);
    try {
      let res;
      if (authMode === 'login') {
        res = await axios.post(`${API_URL}/login`, { email, phone, password });
        setUser(res.data.user);
        if (onAuthChange) onAuthChange(res.data.user);
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        Alert.alert('Success', 'Logged in!');
      } else {
        res = await axios.post(`${API_URL}/register`, { email, phone, password });
        setUser(res.data.user);
        if (onAuthChange) onAuthChange(res.data.user);
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        Alert.alert('Success', 'Registered!');
      }
    } catch (err) {
      Alert.alert('Auth Error', err.response?.data?.error || 'Failed to authenticate');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setUser(null);
    if (onAuthChange) onAuthChange(null);
    await AsyncStorage.removeItem('user');
    setEmail('');
    setPhone('');
    setPassword('');
  };

  // Load user from storage on mount
  React.useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}><ActivityIndicator color={VUGA_COLORS.light.primary} size="large" /></View>
    );
  }

  // Fetch user's reports
  useEffect(() => {
    if (user && user.id) {
      axios.get(`http://192.168.1.111:5000/api/reports`).then(res => {
        setMyReports((res.data || []).filter(r => r.user_id === user.id));
      }).catch(() => setMyReports([]));
    }
  }, [user]);

  // Pick avatar
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.cancelled) {
      setAvatar(result.assets ? result.assets[0] : result);
    }
  };

  const handleSaveProfile = async () => {
    // Simulate avatar upload and profile update
    setEditMode(false);
    Alert.alert('Profile', 'Profile updated!');
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={editMode ? pickAvatar : undefined} accessibilityLabel="Edit avatar" accessibilityRole="imagebutton">
            <Image source={avatar && avatar.uri ? { uri: avatar.uri } : require('../assets/logo.png')} style={styles.avatar} />
            {editMode && <Text style={{ color: VUGA_COLORS.light.accent, marginTop: 4 }}>Change Avatar</Text>}
          </TouchableOpacity>
        </View>
        {editMode ? (
          <>
            <TextInput style={styles.input} value={user.email} editable={false} />
            <TextInput style={styles.input} value={user.phone} editable={false} />
            <Button title="Save" onPress={handleSaveProfile} color={VUGA_COLORS.light.primary} />
            <Button title="Cancel" onPress={() => setEditMode(false)} color={VUGA_COLORS.light.error} />
          </>
        ) : (
          <>
            <Text style={styles.profileItem}>Email: {user.email || '-'}</Text>
            <Text style={styles.profileItem}>Phone: {user.phone || '-'}</Text>
            <Button title="Edit Profile" onPress={() => setEditMode(true)} color={VUGA_COLORS.light.primary} />
            <Button title="Logout" onPress={handleLogout} color={VUGA_COLORS.light.error} />
          </>
        )}
        {/* Badge summary */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Badges</Text>
          <Text style={styles.settingsItem}>See your achievements and progress in the Badges tab!</Text>
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <Text style={styles.settingsItem}>Language: English</Text>
          <Text style={styles.settingsItem}>Theme: Light</Text>
          <Text style={styles.settingsItem}>Notifications: Enabled</Text>
        </View>
        {/* User's report history */}
        <View style={styles.historyCard}>
          <Text style={styles.settingsTitle}>My Reports</Text>
          {myReports.length === 0 ? (
            <Text style={styles.settingsItem}>No reports yet.</Text>
          ) : (
            myReports.map((r, i) => (
              <Text key={i} style={styles.settingsItem}>• {r.location} ({r.severity})</Text>
            ))
          )}
        </View>
      </View>
    );
  }

  // Render login/register form for unauthenticated state (for App-level auth)
  return (
    <View style={styles.container} testID="ProfileScreenRoot">
      <Text style={styles.title}>Vuga</Text>
      <TextInput
        style={styles.input}
        placeholder="email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="email-input"
      />
      <TextInput
        style={styles.input}
        placeholder="phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        testID="phone-input"
      />
      <TextInput
        style={styles.input}
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="password-input"
      />
      <Button
        title={authMode === 'login' ? 'Login' : 'Register'}
        onPress={handleAuth}
        color={VUGA_COLORS.light.primary}
        disabled={loading}
      />
      <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={styles.switchMode}>
        <Text style={{ color: VUGA_COLORS.light.accent, marginTop: 16 }}>
          {authMode === 'login' ? 'No account? Register' : 'Have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 16, alignSelf: 'center' },
  input: { borderWidth: 1, borderColor: VUGA_COLORS.light.border, borderRadius: 8, padding: 8, marginBottom: 12, backgroundColor: '#fff' },
  switchMode: { alignSelf: 'center' },
  settingsCard: { backgroundColor: VUGA_COLORS.light.surface, borderRadius: 12, padding: 16, marginTop: 32, elevation: 2 },
  historyCard: { backgroundColor: VUGA_COLORS.light.surface, borderRadius: 12, padding: 16, marginTop: 24, elevation: 2 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 8, backgroundColor: VUGA_COLORS.light.surface, borderWidth: 2, borderColor: VUGA_COLORS.light.primary },
  settingsTitle: { fontSize: 18, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 8 },
  settingsItem: { fontSize: 14, color: VUGA_COLORS.light.text, marginBottom: 4 },
  profileItem: { fontSize: 16, color: VUGA_COLORS.light.text, marginBottom: 8 },
});

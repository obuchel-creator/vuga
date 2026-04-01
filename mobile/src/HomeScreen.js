
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { VUGA_COLORS } from './vugaColors';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [betaEnabled, setBetaEnabled] = useState(false);
  const [checkingFlag, setCheckingFlag] = useState(true);

  useEffect(() => {
    (async () => {
      setCheckingFlag(true);
      try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const appVersion = require('../app.json').runtimeVersion || require('../app.json').version;
        const res = await axios.get(`http://192.168.1.111:5000/api/feature-flag-status?flag=betaFeature&userId=${user?.id || ''}&version=${appVersion}`);
        setBetaEnabled(!!res.data.enabled);
      } catch {
        setBetaEnabled(false);
      }
      setCheckingFlag(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome to Vuga</Text>
      <Text style={styles.text}>Your real-time jam reporting and route suggestion app.</Text>
      <View style={styles.quickActionsCard}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.quickActionText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Help')}>
            <Text style={styles.quickActionText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
      {checkingFlag ? (
        <ActivityIndicator size="small" color={VUGA_COLORS.light.primary} style={{ marginTop: 16 }} />
      ) : betaEnabled ? (
        <View style={{ marginTop: 24, padding: 12, backgroundColor: '#e0f7fa', borderRadius: 8 }}>
          <Text style={{ color: VUGA_COLORS.light.primary, fontWeight: 'bold' }}>
            🎉 Beta Feature Enabled! Try our new experimental feature.
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: VUGA_COLORS.light.background,
    paddingTop: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    borderRadius: 32,
    backgroundColor: VUGA_COLORS.light.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: VUGA_COLORS.light.primary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  text: {
    fontSize: 16,
    color: VUGA_COLORS.light.text,
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  quickActionsCard: {
    backgroundColor: VUGA_COLORS.light.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 14,
  },
  quickActionsTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: VUGA_COLORS.light.primary,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionBtn: {
    backgroundColor: VUGA_COLORS.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 26,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  quickActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.6,
  },
});

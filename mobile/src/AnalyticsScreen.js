// AnalyticsScreen.js - Shows traffic trends and report analytics
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { VUGA_COLORS } from './vugaColors';
import axios from 'axios';

const API_BASE = 'http://192.168.1.111:5000/admin/analytics';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [severityCounts, setSeverityCounts] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    ws.current = new WebSocket('ws://192.168.1.111:5050');
    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'analytics' && msg.data) {
          setUserCount(msg.data.userCount || 0);
          setSeverityCounts(msg.data.severity || []);
          setDailyCounts(msg.data.trends || []);
          setLoading(false);
        }
      } catch {}
    };
    ws.current.onerror = () => setError('WebSocket error');
    ws.current.onclose = () => {};
    return () => { if (ws.current) ws.current.close(); };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Analytics Dashboard</Text>
      {loading && <ActivityIndicator color={VUGA_COLORS.light.primary} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.sectionTitle}>Live User Count</Text>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: VUGA_COLORS.light.primary }}>{userCount}</Text>
        <Text style={{ color: VUGA_COLORS.light.text }}>users online</Text>
      </View>
      {/* Severity breakdown */}
      <Text style={styles.sectionTitle}>Reports by Severity</Text>
      <View style={styles.row}>
        {severityCounts.map((item, idx) => (
          <View key={idx} style={styles.severityBox}>
            <Text style={styles.severityLabel}>{item.severity}</Text>
            <Text style={styles.severityCount}>{item.count}</Text>
          </View>
        ))}
      </View>
      {/* Daily trend */}
      <Text style={styles.sectionTitle}>Reports (Last 7 Days)</Text>
      <View style={styles.trendBox}>
        {dailyCounts.map((item, idx) => (
          <View key={idx} style={styles.trendRow}>
            <Text style={styles.trendDate}>{item.date}</Text>
            <View style={[styles.trendBar, { width: Math.max(10, item.count * 16) }]} />
            <Text style={styles.trendCount}>{item.count}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 18, alignSelf: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: VUGA_COLORS.light.accent, marginTop: 18, marginBottom: 8 },
  error: { color: VUGA_COLORS.light.error, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  severityBox: { alignItems: 'center', backgroundColor: VUGA_COLORS.light.surface, borderRadius: 10, padding: 12, minWidth: 70, marginHorizontal: 4, elevation: 2 },
  severityLabel: { fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 4 },
  severityCount: { fontSize: 20, color: VUGA_COLORS.light.text },
  trendBox: { backgroundColor: VUGA_COLORS.light.surface, borderRadius: 10, padding: 10, marginTop: 4, elevation: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  trendDate: { width: 80, color: VUGA_COLORS.light.text },
  trendBar: { height: 12, backgroundColor: VUGA_COLORS.light.primary, borderRadius: 6, marginHorizontal: 8 },
  trendCount: { width: 30, textAlign: 'right', color: VUGA_COLORS.light.text },
});

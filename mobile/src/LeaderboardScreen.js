// LeaderboardScreen.js - Shows top users by report count
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { VUGA_COLORS } from './vugaColors';
import axios from 'axios';

const API_BASE = 'http://192.168.1.111:5000/admin/users';
const REPORTS_API = 'http://192.168.1.111:5000/api/reports';

export default function LeaderboardScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, reportsRes] = await Promise.all([
          axios.get(API_BASE),
          axios.get(REPORTS_API)
        ]);
        const reports = reportsRes.data || [];
        const userCounts = {};
        reports.forEach(r => {
          if (r.user_id) userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
        });
        const leaderboard = (usersRes.data || []).map(u => ({
          ...u,
          reportCount: userCounts[u.id] || 0
        })).sort((a, b) => b.reportCount - a.reportCount);
        setUsers(leaderboard);
      } catch (e) {
        setError('Failed to load leaderboard');
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {loading && <ActivityIndicator color={VUGA_COLORS.light.primary} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={users}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index < 3 && styles.topRow]}>
            <Text style={styles.rank}>{index + 1}</Text>
            <Text style={styles.name}>{item.email || item.phone || 'User'}</Text>
            <Text style={styles.count}>{item.reportCount} reports</Text>
            {index === 0 && <Text style={styles.badge}>🏆</Text>}
            {index === 1 && <Text style={styles.badge}>🥈</Text>}
            {index === 2 && <Text style={styles.badge}>🥉</Text>}
          </View>
        )}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 18, alignSelf: 'center' },
  error: { color: VUGA_COLORS.light.error, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: VUGA_COLORS.light.surface, borderRadius: 10, marginBottom: 8 },
  topRow: { backgroundColor: VUGA_COLORS.light.accent + '22' },
  rank: { width: 32, fontWeight: 'bold', fontSize: 18, color: VUGA_COLORS.light.primary },
  name: { flex: 1, fontSize: 16, color: VUGA_COLORS.light.text },
  count: { width: 90, textAlign: 'right', color: VUGA_COLORS.light.primary },
  badge: { marginLeft: 8, fontSize: 20 },
});

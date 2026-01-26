// BadgesScreen.js - Shows user achievements and badge progress
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { VUGA_COLORS } from './vugaColors';

import axios from 'axios';
const REPORTS_API = 'http://192.168.1.111:5000/api/reports';
const COMMENTS_API = 'http://192.168.1.111:5000/api/reports'; // /:id/comments

const BADGES = [
  { key: 'first_report', label: 'First Report', desc: 'Submit your first report', icon: '🌱', check: (count) => count >= 1 },
  { key: 'reporter_5', label: 'Reporter 5', desc: 'Submit 5 reports', icon: '📝', check: (count) => count >= 5 },
  { key: 'reporter_10', label: 'Reporter 10', desc: 'Submit 10 reports', icon: '🏅', check: (count) => count >= 10 },
  { key: 'commenter', label: 'Commenter', desc: 'Add a comment', icon: '💬', check: (comments) => comments >= 1 },
  { key: 'voter', label: 'Voter', desc: 'Vote on a report', icon: '👍', check: (votes) => votes >= 1 },
  { key: 'streak_3', label: '3-Day Streak', desc: 'Report 3 days in a row', icon: '🔥', check: (streak) => streak >= 3 },
];

export default function BadgesScreen({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ reports: 0, comments: 0, votes: 0, streak: 0 });

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(REPORTS_API);
        const reports = (res.data || []).filter(r => r.user_id === userId);
        // Count comments and votes for this user
        let commentCount = 0;
        let voteCount = 0;
        for (const r of reports) {
          // Fetch comments for each report
          try {
            const cres = await axios.get(`${COMMENTS_API}/${r.id}/comments`);
            commentCount += (cres.data || []).filter(c => c.user_id === userId).length;
          } catch {}
          voteCount += (r.upvotes || 0) + (r.downvotes || 0);
        }
        const reportDates = reports.map(r => r.created_at && r.created_at.substr(0, 10)).filter(Boolean);
        const uniqueDays = Array.from(new Set(reportDates));
        let streak = 0;
        if (uniqueDays.length) {
          uniqueDays.sort();
          let last = null;
          let currentStreak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const prev = new Date(uniqueDays[i - 1]);
            const curr = new Date(uniqueDays[i]);
            if ((curr - prev) / (1000 * 60 * 60 * 24) === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
            if (currentStreak > streak) streak = currentStreak;
          }
        }
        setProgress({ reports: reports.length, comments: commentCount, votes: voteCount, streak });
      } catch (e) {
        setError('Failed to load badge progress');
      }
      setLoading(false);
    }
    if (userId) fetchProgress();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Badges</Text>
      {loading && <ActivityIndicator color={VUGA_COLORS.light.primary} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={BADGES}
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          let achieved = false;
          if (item.key.startsWith('reporter')) achieved = item.check(progress.reports);
          else if (item.key === 'commenter') achieved = item.check(progress.comments);
          else if (item.key === 'voter') achieved = item.check(progress.votes);
          else if (item.key.startsWith('streak')) achieved = item.check(progress.streak);
          return (
            <View style={[styles.badgeRow, achieved && styles.achieved]}> 
              <Text style={styles.badgeIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeLabel}>{item.label}</Text>
                <Text style={styles.badgeDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.badgeStatus}>{achieved ? '✓' : ''}</Text>
            </View>
          );
        }}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 18, alignSelf: 'center' },
  error: { color: VUGA_COLORS.light.error, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: VUGA_COLORS.light.surface, borderRadius: 10, marginBottom: 8 },
  achieved: { backgroundColor: VUGA_COLORS.light.success + '22' },
  badgeIcon: { fontSize: 28, marginRight: 12 },
  badgeLabel: { fontWeight: 'bold', fontSize: 16, color: VUGA_COLORS.light.primary },
  badgeDesc: { color: VUGA_COLORS.light.text, fontSize: 13 },
  badgeStatus: { fontSize: 22, color: VUGA_COLORS.light.success, fontWeight: 'bold', marginLeft: 8 },
});

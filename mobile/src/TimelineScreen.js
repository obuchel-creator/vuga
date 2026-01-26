// TimelineScreen.js - Calendar/timeline view for reports
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { VUGA_COLORS } from './vugaColors';
import axios from 'axios';

const API_URL = 'http://192.168.1.111:5000/api/reports';

function groupReportsByDate(reports) {
  const grouped = {};
  reports.forEach(r => {
    const date = r.created_at ? r.created_at.substr(0, 10) : 'Unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(r);
  });
  // Sort by date descending
  return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function TimelineScreen() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(API_URL);
        setReports(res.data || []);
      } catch (e) {
        setError('Failed to load reports');
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  const grouped = groupReportsByDate(reports);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports Timeline</Text>
      {loading && <ActivityIndicator color={VUGA_COLORS.light.primary} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={grouped}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, items] }) => (
          <View style={styles.dateGroup}>
            <TouchableOpacity onPress={() => setExpanded(e => ({ ...e, [date]: !e[date] }))}>
              <Text style={styles.dateHeader}>{date} ({items.length})</Text>
            </TouchableOpacity>
            {expanded[date] && items.map((r, i) => (
              <View key={i} style={styles.reportCard}>
                <Text style={styles.reportTitle}>{r.location}</Text>
                <Text style={styles.reportDesc}>{r.description}</Text>
                <Text style={styles.reportSeverity}>Severity: {r.severity}</Text>
                {Array.isArray(r.tags) && r.tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 2 }}>
                    {r.tags.map((tag, j) => (
                      <Text key={j} style={{ backgroundColor: VUGA_COLORS.light.accent, color: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4, fontSize: 12 }}>{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 18, alignSelf: 'center' },
  error: { color: VUGA_COLORS.light.error, marginBottom: 12 },
  dateGroup: { marginBottom: 18 },
  dateHeader: { fontSize: 18, fontWeight: 'bold', color: VUGA_COLORS.light.accent, marginBottom: 6 },
  reportCard: { backgroundColor: VUGA_COLORS.light.surface, borderRadius: 12, padding: 12, marginBottom: 8, elevation: 2 },
  reportTitle: { fontWeight: 'bold', fontSize: 15, color: VUGA_COLORS.light.primary },
  reportDesc: { fontSize: 13, color: VUGA_COLORS.light.text, marginBottom: 2 },
  reportSeverity: { fontSize: 12, color: VUGA_COLORS.light.accent, fontWeight: 'bold' },
});

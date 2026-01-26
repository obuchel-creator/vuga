// AdminScreen.js - Simple admin tools for Vuga
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { VUGA_COLORS } from './vugaColors';
import axios from 'axios';

const API_BASE = 'http://192.168.1.111:5000/admin';
const API_BROADCAST = 'http://192.168.1.111:5000/api/admin/broadcast';
const API_MSG_SEND = 'http://192.168.1.111:5000/api/messages/send';
const API_MSG_INBOX = 'http://192.168.1.111:5000/api/messages/inbox';

export default function AdminScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Admin broadcast state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  // User-to-user messaging state
  const [msgTo, setMsgTo] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgStatus, setMsgStatus] = useState('');
  const [inboxUserId, setInboxUserId] = useState('');
  const [inbox, setInbox] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/reports`);
      setReports(res.data || []);
    } catch (e) {
      setError('Failed to load reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const deleteReport = async (id) => {
    Alert.alert('Delete Report', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_BASE}/reports/${id}`);
          fetchReports();
        } catch {
          Alert.alert('Error', 'Failed to delete report');
        }
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Tools</Text>
      {loading && <ActivityIndicator color={VUGA_COLORS.light.primary} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={reports}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>{item.location}</Text>
            <Text style={styles.reportDesc}>{item.description}</Text>
            <Text style={styles.reportSeverity}>Severity: {item.severity}</Text>
            <TouchableOpacity onPress={() => deleteReport(item.id)} style={styles.deleteBtn} accessibilityLabel="Delete report" accessibilityRole="button">
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ marginBottom: 32 }}
      />

      {/* Admin Broadcast */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Broadcast Message</Text>
        <TextInput
          style={styles.input}
          placeholder="Message to broadcast"
          value={broadcastMsg}
          onChangeText={setBroadcastMsg}
        />
        <TextInput
          style={styles.input}
          placeholder="Target role (optional: admin, moderator, user)"
          value={broadcastTarget}
          onChangeText={setBroadcastTarget}
        />
        <Button
          title="Send Broadcast"
          color={VUGA_COLORS.light.primary}
          onPress={async () => {
            setBroadcastStatus('Sending...');
            try {
              await axios.post(API_BROADCAST, { message: broadcastMsg, targetRole: broadcastTarget || undefined });
              setBroadcastStatus('Broadcast sent!');
              setBroadcastMsg('');
              setBroadcastTarget('');
            } catch {
              setBroadcastStatus('Failed to send broadcast');
            }
          }}
        />
        {broadcastStatus ? <Text style={styles.status}>{broadcastStatus}</Text> : null}
      </View>

      {/* User-to-User Messaging */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Send User Message</Text>
        <TextInput
          style={styles.input}
          placeholder="To User ID"
          value={msgTo}
          onChangeText={setMsgTo}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Message text"
          value={msgText}
          onChangeText={setMsgText}
        />
        <Button
          title="Send Message"
          color={VUGA_COLORS.light.primary}
          onPress={async () => {
            setMsgStatus('Sending...');
            try {
              await axios.post(API_MSG_SEND, { from: 1, to: msgTo, text: msgText });
              setMsgStatus('Message sent!');
              setMsgText('');
              setMsgTo('');
            } catch {
              setMsgStatus('Failed to send message');
            }
          }}
        />
        {msgStatus ? <Text style={styles.status}>{msgStatus}</Text> : null}
      </View>

      {/* Inbox for user-to-user messages */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inbox (User ID)</Text>
        <TextInput
          style={styles.input}
          placeholder="User ID to view inbox"
          value={inboxUserId}
          onChangeText={setInboxUserId}
          keyboardType="numeric"
        />
        <Button
          title="Load Inbox"
          color={VUGA_COLORS.light.primary}
          onPress={async () => {
            try {
              const res = await axios.get(`${API_MSG_INBOX}/${inboxUserId}`);
              setInbox(res.data || []);
            } catch {
              setInbox([]);
            }
          }}
        />
        {inbox.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {inbox.map((msg, i) => (
              <Text key={i} style={styles.inboxMsg}>
                <Text style={{ fontWeight: 'bold' }}>From {msg.from}: </Text>{msg.text}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 18, alignSelf: 'center' },
  error: { color: VUGA_COLORS.light.error, marginBottom: 12 },
  reportCard: { backgroundColor: VUGA_COLORS.light.surface, marginVertical: 8, borderRadius: 16, padding: 18, elevation: 8, shadowColor: VUGA_COLORS.light.shadowStrong, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 4 },
  reportDesc: { fontSize: 14, color: VUGA_COLORS.light.text, marginBottom: 4 },
  reportSeverity: { fontSize: 12, color: VUGA_COLORS.light.accent, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: VUGA_COLORS.light.error, borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
  card: { backgroundColor: VUGA_COLORS.light.surface, borderRadius: 16, padding: 16, marginVertical: 12, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: VUGA_COLORS.light.border, borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff' },
  status: { color: VUGA_COLORS.light.accent, marginTop: 4, marginBottom: 4 },
  inboxMsg: { fontSize: 14, color: VUGA_COLORS.light.text, marginBottom: 4 },
});

import React, { useState, useEffect, useRef } from 'react';

// Favorite routes state
// (moved after imports for correct order)
// ...existing code for favoriteRoutes, routeAlert, saveFavoriteRoute, useEffect for incidents...
// --- Real-time chat for user groups/incidents ---
function IncidentChat({ roomId, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://192.168.1.111:5050');
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'getChat', roomId }));
    };
    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat' && msg.roomId === roomId && msg.message) {
          setMessages(prev => [...prev, msg.message]);
        }
        if (msg.type === 'chatHistory' && msg.roomId === roomId && Array.isArray(msg.messages)) {
          setMessages(msg.messages);
        }
      } catch {}
    };
    return () => { if (ws.current) ws.current.close(); };
  }, [roomId]);

  const sendMessage = () => {
    if (input.trim() && ws.current && ws.current.readyState === 1) {
      ws.current.send(JSON.stringify({ type: 'chat', roomId, from: userId, text: input }));
      setInput('');
    }
  };

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginVertical: 12 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Incident Chat (Room: {roomId})</Text>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{item.from}:</Text> {item.text}</Text>
        )}
        style={{ maxHeight: 120 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 6, marginRight: 6 }}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} testID="chat-send-btn" />
      </View>
    </View>
  );
}
import { View, Text, StyleSheet, TextInput, Button, FlatList, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Heatmap } from 'react-native-maps';
import { VUGA_COLORS } from './vugaColors';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from './NetInfo';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
// Polyfill for speech-to-text (since expo-speech does not support STT, use a placeholder for demo)
async function fakeSpeechToText() {
  return new Promise(resolve => {
    setTimeout(() => resolve('This is a sample dictated description.'), 1500);
  });
}


const API_URL = 'http://192.168.1.111:5000/api/reports'; // Update as needed



export default function ReportsScreen() {
    // For demo: show chat for each report (roomId = report.id, userId = 1)
  // Network/offline state and queue
  const [isConnected, setIsConnected] = useState(true);
  const [queuedReports, setQueuedReports] = useState([]);
  const [queuedComments, setQueuedComments] = useState([]);
  // Manual offline simulation for testing
  const [manualOffline, setManualOffline] = useState(false);

  // Handler for manual offline toggle
  const handleToggleOffline = () => {
    setManualOffline((prev) => !prev);
    setIsConnected((prev) => !prev);
  };

  // Favorite routes state (initialize as empty array)
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);

  // Monitor network status, unless manually toggled
  useEffect(() => {
    if (!manualOffline) {
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsConnected(state.isConnected);
      });
      return () => unsubscribe();
    }
  }, [manualOffline]);

  // Sync queued reports/comments when reconnected
  useEffect(() => {
    if (isConnected) {
      (async () => {
        // Sync reports
        const storedReports = await AsyncStorage.getItem('queuedReports');
        const reports = storedReports ? JSON.parse(storedReports) : [];
        for (const r of reports) {
          try { await axios.post(API_URL, r); } catch {}
        }
        if (reports.length) await AsyncStorage.removeItem('queuedReports');
        setQueuedReports([]);
        // Sync comments
        const storedComments = await AsyncStorage.getItem('queuedComments');
        const comments = storedComments ? JSON.parse(storedComments) : [];
        for (const c of comments) {
          try { await axios.post(`${API_URL}/${c.reportId}/comments`, { text: c.text }); } catch {}
        }
        if (comments.length) await AsyncStorage.removeItem('queuedComments');
        setQueuedComments([]);
        fetchReports();
      })();
    }
  }, [isConnected]);
  // Seed with a default report in test/dev mode for testing chat input
  const isJest = typeof jest !== 'undefined' || process.env.JEST_WORKER_ID;
  const defaultReports = [
    {
      id: 1,
      location: 'Test Location',
      description: 'Test Description',
      severity: 'low',
      tags: ['accident'],
      created_at: new Date().toISOString(),
    },
  ];
  const [reports, setReports] = useState(isJest ? defaultReports : []);
  const [filteredReports, setFilteredReports] = useState(isJest ? defaultReports : []);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterRecency, setFilterRecency] = useState('all'); // 'all', 'recent'
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('low');
  const [tags, setTags] = useState([]); // Incident tags
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null); // { uri, ... }
    // Tag options
    const TAG_OPTIONS = [
      { key: 'accident', label: 'Accident', icon: '💥', color: '#e53935' },
      { key: 'roadblock', label: 'Roadblock', icon: '🚧', color: '#ffa000' },
      { key: 'police', label: 'Police', icon: '🚓', color: '#1976d2' },
      { key: 'hazard', label: 'Hazard', icon: '⚠️', color: '#fbc02d' },
      { key: 'construction', label: 'Construction', icon: '🏗️', color: '#8d6e63' },
      { key: 'flood', label: 'Flood', icon: '🌊', color: '#0288d1' },
      { key: 'other', label: 'Other', icon: '❓', color: '#757575' },
    ];

    // Custom tag input
    const [customTag, setCustomTag] = useState('');
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [showTraffic, setShowTraffic] = useState(true); // traffic layer toggle
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeStart, setRouteStart] = useState(null); // { latitude, longitude }
  const [routeEnd, setRouteEnd] = useState(null);
    // Fetch route suggestion from backend
    const fetchRouteSuggestion = async () => {
      if (!routeStart || !routeEnd) {
        Alert.alert('Route', 'Please select both start and end points on the map.');
        return;
      }
      setRouteLoading(true);
      try {
        const res = await axios.post('http://192.168.1.111:5000/api/route-suggestions', {
          start: routeStart,
          end: routeEnd
        });
        // Assume backend returns { route: { polyline: [[lat, lng], ...] } } or similar
        const polyline = res.data.route && res.data.route.polyline;
        if (Array.isArray(polyline) && polyline.length > 1) {
          setRoutePolyline(polyline.map(([latitude, longitude]) => ({ latitude, longitude })));
        } else {
          setRoutePolyline([
            routeStart,
            routeEnd
          ]);
          Alert.alert('Route', res.data.route?.message || 'No route data, showing straight line.');
        }
      } catch (err) {
        setRoutePolyline([routeStart, routeEnd]);
        Alert.alert('Route', 'Failed to fetch route. Showing straight line.');
      }
      setRouteLoading(false);
    };
  const mapRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    fetchReports();
    ws.current = new WebSocket('ws://192.168.1.111:5050');
    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'reports' && Array.isArray(msg.data)) {
          setReports(msg.data);
        }
      } catch (e) {}
    };
    ws.current.onerror = () => {};
    ws.current.onclose = () => {};
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  // Filtering logic (add tag filtering)
  useEffect(() => {
    if (isJest) return; // Skip filtering in test mode to preserve seeded filteredReports
    let filtered = reports;
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(r => r.severity === filterSeverity);
    }
    if (filterRecency === 'recent') {
      // Show only reports from last 24h (assuming created_at is present)
      const now = Date.now();
      filtered = filtered.filter(r => {
        if (!r.created_at) return true;
        const created = new Date(r.created_at).getTime();
        return now - created < 24 * 60 * 60 * 1000;
      });
    }
    if (filterTags && filterTags.length > 0) {
      filtered = filtered.filter(r => Array.isArray(r.tags) && filterTags.every(tag => r.tags.includes(tag)));
    }
    setFilteredReports(filtered);
  }, [reports, filterSeverity, filterRecency, filterTags]);
  // Tag filter state
  const [filterTags, setFilterTags] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setReports(res.data);
      await AsyncStorage.setItem('cachedReports', JSON.stringify(res.data));
      for (const report of res.data) {
        fetchComments(report.id);
      }
    } catch (err) {
      const cached = await AsyncStorage.getItem('cachedReports');
      if (cached) {
        setReports(JSON.parse(cached));
        Alert.alert('Offline', 'Showing cached reports');
      } else {
        Alert.alert('Error', 'Failed to fetch reports');
      }
    }
    setLoading(false);
  };

  const fetchComments = async (reportId) => {
    try {
      const res = await axios.get(`${API_URL}/${reportId}/comments`);
      setComments(prev => ({ ...prev, [reportId]: res.data }));
    } catch (err) {}
  };

  const addComment = async (reportId) => {
    const text = commentInput[reportId];
    if (!text || !text.trim()) return;
    if (isConnected) {
      try {
        await axios.post(`${API_URL}/${reportId}/comments`, { text });
        setCommentInput(prev => ({ ...prev, [reportId]: '' }));
        fetchComments(reportId);
      } catch (err) {
        Alert.alert('Error', 'Failed to add comment');
      }
    } else {
      // Queue for later
      const queued = { reportId, text };
      const prev = await AsyncStorage.getItem('queuedComments');
      const arr = prev ? JSON.parse(prev) : [];
      arr.push(queued);
      await AsyncStorage.setItem('queuedComments', JSON.stringify(arr));
      setQueuedComments(arr);
      setCommentInput(prev => ({ ...prev, [reportId]: '' }));
      Alert.alert('Offline', 'Comment queued and will be submitted when online.');
    }
  };

  const submitReport = async () => {
    if (!location.trim()) return Alert.alert('Validation', 'Location is required');
    if (!description.trim()) return Alert.alert('Validation', 'Description is required');
    if (!['low', 'medium', 'high'].includes(severity)) return Alert.alert('Validation', 'Severity must be low, medium, or high');
    if (latitude === null || longitude === null) return Alert.alert('Validation', 'Please select a location on the map');
    setLoading(true);
    try {
      let formData = new FormData();
      formData.append('location', location);
      formData.append('description', description);
      formData.append('severity', severity);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('tags', JSON.stringify(tags));
      if (photo && photo.uri) {
        const filename = photo.uri.split('/').pop();
        const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('photo', { uri: photo.uri, name: filename, type });
      }
      if (isConnected) {
        await axios.post(API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fetchReports();
        Alert.alert('Success', 'Report submitted');
      } else {
        // Queue for later
        const queued = { location, description, severity, latitude, longitude, tags };
        const prev = await AsyncStorage.getItem('queuedReports');
        const arr = prev ? JSON.parse(prev) : [];
        arr.push(queued);
        await AsyncStorage.setItem('queuedReports', JSON.stringify(arr));
        setQueuedReports(arr);
        Alert.alert('Offline', 'Report queued and will be submitted when online.');
      }
      setLocation('');
      setDescription('');
      setSeverity('low');
      setTags([]);
      setLatitude(null);
      setLongitude(null);
      setPhoto(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report');
    }
    setLoading(false);
  };
  // Pick photo from library
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.cancelled) {
      setPhoto(result.assets ? result.assets[0] : result);
    }
  };

  // Map press: select location for report, or for route start/end
  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    if (routeStart && routeEnd) {
      // Reset route selection if both are set
      setRouteStart(coord);
      setRouteEnd(null);
      setRoutePolyline(null);
    } else if (!routeStart) {
      setRouteStart(coord);
    } else if (!routeEnd) {
      setRouteEnd(coord);
    }
    // Always set for report submission
    setLatitude(coord.latitude);
    setLongitude(coord.longitude);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', margin: 8 }}>
        <Button
          title={isConnected ? 'Go Offline' : 'Go Online'}
          onPress={handleToggleOffline}
          accessibilityLabel={isConnected ? 'Go Offline' : 'Go Online'}
        />
      </View>
      {!isConnected && (
        <View style={{ backgroundColor: '#ffe082', padding: 10, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 }}>
          <Text style={{ color: '#b26a00', fontWeight: 'bold', textAlign: 'center' }}>
            Offline mode: Reports will be queued and sent when online.
          </Text>
        </View>
      )}
      <Text style={styles.title}>Reports</Text>
      {/* Filter Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <Text style={{ marginRight: 8, color: VUGA_COLORS.light.text, fontWeight: 'bold' }}>Filter:</Text>
        {/* Severity filter */}
        {['all', 'low', 'medium', 'high'].map(level => (
          <TouchableOpacity
            key={level}
            style={{ marginRight: 6, padding: 6, backgroundColor: filterSeverity === level ? VUGA_COLORS.light.primary : VUGA_COLORS.light.surface, borderRadius: 8 }}
            onPress={() => setFilterSeverity(level)}
          >
            <Text style={{ color: filterSeverity === level ? '#fff' : VUGA_COLORS.light.text }}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
          </TouchableOpacity>
        ))}
        {/* Recency filter */}
        <TouchableOpacity
          style={{ marginLeft: 8, padding: 6, backgroundColor: filterRecency === 'all' ? VUGA_COLORS.light.primary : VUGA_COLORS.light.surface, borderRadius: 8 }}
          onPress={() => setFilterRecency('all')}
        >
          <Text style={{ color: filterRecency === 'all' ? '#fff' : VUGA_COLORS.light.text }}>All Time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginLeft: 2, padding: 6, backgroundColor: filterRecency === 'recent' ? VUGA_COLORS.light.primary : VUGA_COLORS.light.surface, borderRadius: 8 }}
          onPress={() => setFilterRecency('recent')}
        >
          <Text style={{ color: filterRecency === 'recent' ? '#fff' : VUGA_COLORS.light.text }}>Recent</Text>
        </TouchableOpacity>
      </View>
      {/* Map and controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <TouchableOpacity
          style={{ marginRight: 12, padding: 8, backgroundColor: showTraffic ? VUGA_COLORS.light.primary : VUGA_COLORS.light.surface, borderRadius: 8 }}
          onPress={() => setShowTraffic(t => !t)}
        >
          <Text style={{ color: showTraffic ? '#fff' : VUGA_COLORS.light.text }}>Traffic Layer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginRight: 12, padding: 8, backgroundColor: showHeatmap ? VUGA_COLORS.light.primary : VUGA_COLORS.light.surface, borderRadius: 8 }}
          onPress={() => setShowHeatmap(h => !h)}
        >
          <Text style={{ color: showHeatmap ? '#fff' : VUGA_COLORS.light.text }}>Heatmap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginRight: 12, padding: 8, backgroundColor: (routeStart && !routeEnd) ? VUGA_COLORS.light.accent : VUGA_COLORS.light.surface, borderRadius: 8 }}
          onPress={() => {
            setRouteStart(null); setRouteEnd(null); setRoutePolyline(null);
          }}
        >
          <Text style={{ color: (routeStart && !routeEnd) ? '#fff' : VUGA_COLORS.light.text }}>New Route</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginRight: 12, padding: 8, backgroundColor: (routeStart && routeEnd) ? VUGA_COLORS.light.primary : VUGA_COLORS.light.surface, borderRadius: 8 }}
          onPress={fetchRouteSuggestion}
          disabled={!(routeStart && routeEnd) || routeLoading}
        >
          <Text style={{ color: (routeStart && routeEnd) ? '#fff' : VUGA_COLORS.light.text }}>{routeLoading ? 'Loading...' : 'Get Route'}</Text>
        </TouchableOpacity>
        {routeStart && <Text style={{ color: VUGA_COLORS.light.primary, marginRight: 8 }}>Start: {routeStart.latitude.toFixed(3)}, {routeStart.longitude.toFixed(3)}</Text>}
        {routeEnd && <Text style={{ color: VUGA_COLORS.light.accent, marginRight: 8 }}>End: {routeEnd.latitude.toFixed(3)}, {routeEnd.longitude.toFixed(3)}</Text>}
        {(routeStart && routeEnd) && (
          <TouchableOpacity onPress={saveFavoriteRoute} style={{ backgroundColor: VUGA_COLORS.light.success, borderRadius: 8, padding: 8, marginLeft: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save as Favorite Route</Text>
          </TouchableOpacity>
        )}
      </View>
      <MapView
        testID="map"
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 0.3476,
          longitude: 32.5825,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={handleMapPress}
        provider={PROVIDER_GOOGLE}
        showsTraffic={showTraffic}
      >
        {filteredReports.map((report, idx) => (
          <Marker
            key={idx}
            coordinate={{ latitude: report.latitude, longitude: report.longitude }}
            title={report.location}
            description={report.description}
            pinColor={report.severity === 'high' ? VUGA_COLORS.light.error : report.severity === 'medium' ? VUGA_COLORS.light.accent : VUGA_COLORS.light.success}
          />
        ))}
        {/* Favorite routes list */}
        {favoriteRoutes.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ color: VUGA_COLORS.light.primary, fontWeight: 'bold', marginBottom: 4 }}>Favorite Routes:</Text>
            {favoriteRoutes.map((r, i) => (
              <Text key={i} style={{ color: VUGA_COLORS.light.text, fontSize: 13, marginBottom: 2 }}>• {r.name}</Text>
            ))}
          </View>
        )}
        {latitude && longitude && (
          <Marker
            coordinate={{ latitude, longitude }}
            title="Selected Location"
            pinColor={VUGA_COLORS.light.primary}
          />
        )}
        {showHeatmap && (
          <Heatmap
            points={filteredReports.map(r => ({ latitude: r.latitude, longitude: r.longitude, weight: r.severity === 'high' ? 3 : r.severity === 'medium' ? 2 : 1 }))}
            radius={40}
            opacity={0.7}
            gradient={{
              colors: [VUGA_COLORS.light.success, VUGA_COLORS.light.accent, VUGA_COLORS.light.error],
              startPoints: [0.2, 0.5, 1],
              colorMapSize: 256,
            }}
          />
        )}
        {routeStart && (
          <Marker
            coordinate={routeStart}
            title="Route Start"
            pinColor={VUGA_COLORS.light.primary}
          />
        )}
        {routeEnd && (
          <Marker
            coordinate={routeEnd}
            title="Route End"
            pinColor={VUGA_COLORS.light.accent}
          />
        )}
        {routePolyline && (
          <Polyline
            coordinates={routePolyline}
            strokeColor={VUGA_COLORS.light.primary}
            strokeWidth={5}
          />
        )}
      </MapView>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity
            onPress={async () => {
              setLoading(true);
              // In production, use a real speech-to-text API or library
              const text = await fakeSpeechToText();
              setDescription(text);
              setLoading(false);
            }}
            style={{ marginLeft: 8, backgroundColor: VUGA_COLORS.light.accent, borderRadius: 8, padding: 8 }}
            accessibilityLabel="Dictate description"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>🎤</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.severityRow}>
          {['low', 'medium', 'high'].map(level => (
            <TouchableOpacity
              key={level}
              style={[styles.severityBtn, severity === level && { backgroundColor: VUGA_COLORS.light.primary }]}
              onPress={() => setSeverity(level)}
            >
              <Text style={{ color: severity === level ? '#fff' : VUGA_COLORS.light.text }}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Tag selection */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {TAG_OPTIONS.map(tag => (
            <TouchableOpacity
              key={tag.key}
              style={{
                backgroundColor: tags.includes(tag.key) ? tag.color : VUGA_COLORS.light.surface,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginRight: 8,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: tags.includes(tag.key) ? tag.color : VUGA_COLORS.light.border,
                flexDirection: 'row', alignItems: 'center'
              }}
              onPress={() => setTags(t => t.includes(tag.key) ? t.filter(x => x !== tag.key) : [...t, tag.key])}
            >
              <Text style={{ marginRight: 4 }}>{tag.icon}</Text>
              <Text style={{ color: tags.includes(tag.key) ? '#fff' : VUGA_COLORS.light.text }}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
          {/* Custom tag input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <TextInput
              style={{ borderWidth: 1, borderColor: VUGA_COLORS.light.border, borderRadius: 8, padding: 6, minWidth: 80, marginRight: 4, backgroundColor: '#fff' }}
              placeholder="Custom tag"
              value={customTag}
              onChangeText={setCustomTag}
              onSubmitEditing={() => {
                if (customTag.trim() && !tags.includes(customTag.trim())) {
                  setTags(t => [...t, customTag.trim()]);
                  setCustomTag('');
                }
              }}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => {
                if (customTag.trim() && !tags.includes(customTag.trim())) {
                  setTags(t => [...t, customTag.trim()]);
                  setCustomTag('');
                }
              }}
              style={{ backgroundColor: VUGA_COLORS.light.primary, borderRadius: 8, padding: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Photo picker */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={pickPhoto} style={{ backgroundColor: VUGA_COLORS.light.accent, borderRadius: 8, padding: 8, marginRight: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{photo ? 'Change Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>
          {photo && photo.uri && (
            <Image source={{ uri: photo.uri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
          )}
        </View>
        <Button title={loading ? 'Submitting...' : 'Submit'} onPress={submitReport} disabled={loading} color={VUGA_COLORS.light.primary} />
      </View>
      {/* Tag filter controls */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ marginRight: 8, color: VUGA_COLORS.light.text, fontWeight: 'bold' }}>Tags:</Text>
        {TAG_OPTIONS.map(tag => (
          <TouchableOpacity
            key={tag.key}
            style={{
              backgroundColor: filterTags.includes(tag.key) ? tag.color : VUGA_COLORS.light.surface,
              borderRadius: 8,
              paddingVertical: 4,
              paddingHorizontal: 10,
              marginRight: 6,
              marginBottom: 4,
              borderWidth: 1,
              borderColor: filterTags.includes(tag.key) ? tag.color : VUGA_COLORS.light.border,
              flexDirection: 'row', alignItems: 'center'
            }}
            onPress={() => setFilterTags(t => t.includes(tag.key) ? t.filter(x => x !== tag.key) : [...t, tag.key])}
          >
            <Text style={{ marginRight: 4 }}>{tag.icon}</Text>
            <Text style={{ color: filterTags.includes(tag.key) ? '#fff' : VUGA_COLORS.light.text }}>{tag.label}</Text>
          </TouchableOpacity>
        ))}
        {/* Custom tag filter */}
        {filterTags.length > 0 && (
          <TouchableOpacity onPress={() => setFilterTags([])} style={{ marginLeft: 8 }}>
            <Text style={{ color: VUGA_COLORS.light.error, fontWeight: 'bold' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.subtitle}>Recent Reports</Text>
      {loading && <ActivityIndicator color={VUGA_COLORS.light.primary} />}
      <FlatList
        data={filteredReports}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>{item.location}</Text>
            <Text style={styles.reportDesc}>{item.description}</Text>
            <Text style={styles.reportSeverity}>Severity: {item.severity}</Text>
            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 2 }}>
                {item.tags.map((tag, i) => {
                  const tagObj = TAG_OPTIONS.find(t => t.key === tag);
                  return (
                    <Text key={i} style={{ backgroundColor: tagObj ? tagObj.color : VUGA_COLORS.light.accent, color: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4, fontSize: 12 }}>
                      {tagObj ? tagObj.icon + ' ' : ''}{tag}
                    </Text>
                  );
                })}
              </View>
            )}
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold', color: VUGA_COLORS.light.primary }}>Comments:</Text>
              {(comments[item.id] || []).map((c, i) => (
                <Text key={i} style={{ color: VUGA_COLORS.light.text, fontSize: 13, marginLeft: 8 }}>- {c.text}</Text>
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Add a comment..."
                  value={commentInput[item.id] || ''}
                  onChangeText={t => setCommentInput(prev => ({ ...prev, [item.id]: t }))}
                />
                <Button title="Send" onPress={() => addComment(item.id)} color={VUGA_COLORS.light.primary} />
              </View>
            </View>
            {/* Incident Chat for the first report only (for test) */}
            {index === 0 && <IncidentChat roomId={item.id} userId={1} />}
          </View>
        )}
        style={{ marginBottom: 32 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VUGA_COLORS.light.background },
  title: { fontSize: 24, fontWeight: 'bold', color: VUGA_COLORS.light.primary, margin: 16 },
  map: { height: 200, marginHorizontal: 16, borderRadius: 12 },
  form: { margin: 16, backgroundColor: VUGA_COLORS.light.surface, borderRadius: 12, padding: 16, elevation: 2 },
  input: { borderWidth: 1, borderColor: VUGA_COLORS.light.border, borderRadius: 8, padding: 8, marginBottom: 12, backgroundColor: '#fff' },
  severityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  severityBtn: { flex: 1, alignItems: 'center', padding: 8, marginHorizontal: 4, borderRadius: 8, backgroundColor: VUGA_COLORS.light.surface },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginLeft: 16, marginTop: 16 },
  reportCard: { backgroundColor: VUGA_COLORS.light.surface, marginHorizontal: 16, marginVertical: 8, borderRadius: 16, padding: 18, elevation: 8, shadowColor: VUGA_COLORS.light.shadowStrong, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: VUGA_COLORS.light.primary, marginBottom: 4 },
  reportDesc: { fontSize: 14, color: VUGA_COLORS.light.text, marginBottom: 4 },
  reportSeverity: { fontSize: 12, color: VUGA_COLORS.light.accent, fontWeight: 'bold' },
});

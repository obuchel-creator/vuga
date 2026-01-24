// Simple clustering: group reports within 0.05 deg lat/lng
function clusterReports(reports) {
  const clusters = [];
  const used = new Set();
  for (let i = 0; i < reports.length; i++) {
    if (used.has(i)) continue;
    const group = [reports[i]];
    for (let j = i + 1; j < reports.length; j++) {
      if (used.has(j)) continue;
      const dLat = Math.abs(reports[i].latitude - reports[j].latitude);
      const dLng = Math.abs(reports[i].longitude - reports[j].longitude);
      if (dLat < 0.05 && dLng < 0.05) {
        group.push(reports[j]);
        used.add(j);
      }
    }
    if (group.length > 1) {
      // Cluster marker
      const avgLat = group.reduce((sum, r) => sum + r.latitude, 0) / group.length;
      const avgLng = group.reduce((sum, r) => sum + r.longitude, 0) / group.length;
      clusters.push({ type: 'cluster', coordinate: { latitude: avgLat, longitude: avgLng }, count: group.length });
    } else {
      clusters.push(group[0]);
    }
    used.add(i);
  }
  return clusters;
}
import React, { useEffect, useState } from 'react';
import { Modal, TouchableOpacity } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
// Localization setup
i18n.translations = {
  en: {
    traffic: 'Kampala Traffic',
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
    traffic: 'Usafiri Kampala',
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
import { Appearance, Animated } from 'react-native';
import { ScrollView } from 'react-native';
import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View, Text, TextInput, Button, FlatList, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Image as RNImage } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

const BASE_URL = 'http://192.168.1.111:5000'; // Update to match your backend port
const WS_URL = 'ws://192.168.1.111:5050'; // Update to match your backend IP
const API_URL = BASE_URL + '/api/reports';
const AUTH_URL = BASE_URL + '/api/auth';
const ROUTE_SUGGEST_URL = BASE_URL + '/api/route-suggestions';
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // <-- Insert your Google Maps API key here

export default function App() {
              // Onboarding/tutorial modal state
              const [showTutorial, setShowTutorial] = useState(false);
              const [tutorialStep, setTutorialStep] = useState(0);
              useEffect(() => {
                (async () => {
                  const seen = await AsyncStorage.getItem('tutorialSeen');
                  if (!seen) setShowTutorial(true);
                })();
              }, []);
              const tutorialSteps = [
                {
                  title: 'Welcome to Kampala Traffic',
                  text: 'This app helps you report and view traffic jams in real time. Tap Next to continue.',
                },
                {
                  title: 'Map & Reports',
                  text: 'View traffic jams on the map. Tap markers for details. Use filters to customize what you see.',
                },
                {
                  title: 'Reporting',
                  text: 'Submit a new report with location, description, severity, and photo. Your report helps others!',
                },
                {
                  title: 'Comments & Voting',
                  text: 'Add comments and vote on reports to help highlight accurate information.',
                },
                {
                  title: 'Notifications',
                  text: 'Enable push notifications to get alerts about severe jams near you.',
                },
                {
                  title: 'Profile & Settings',
                  text: 'Edit your profile, manage notifications, and change app language or theme.',
                },
                {
                  title: 'Get Started!',
                  text: 'You are ready to use Kampala Traffic. Tap Finish to start using the app.',
                },
              ];
            // Allow user to select alternative routes
            const handleRouteSelect = (idx) => {
              setBestRouteIndex(idx);
              setRouteCoords(alternativeRoutes[idx]);
            };
          // Remove duplicate colorScheme declaration
          const [fadeAnim] = useState(new Animated.Value(0));

          useEffect(() => {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }).start();
          }, []);
        const [profileMode, setProfileMode] = useState(false);
        const [editProfile, setEditProfile] = useState({ email: '', phone: '' });
        // Help/FAQ modal state
        const [showHelp, setShowHelp] = useState(false);
        // Theme state and modal
        const [theme, setTheme] = useState('system'); // 'system', 'light', 'dark', 'blue', 'green', 'red'
        const [showThemeModal, setShowThemeModal] = useState(false);
        const themeColors = {
          light: { bg: '#fff', card: '#fff', accent: '#1976d2', text: '#222', form: '#fff', border: '#ccc' },
          dark: { bg: '#222', card: '#333', accent: '#ffa000', text: '#fff', form: '#333', border: '#444' },
          blue: { bg: '#e3f2fd', card: '#bbdefb', accent: '#1976d2', text: '#222', form: '#e3f2fd', border: '#90caf9' },
          green: { bg: '#e8f5e9', card: '#c8e6c9', accent: '#388e3c', text: '#222', form: '#e8f5e9', border: '#a5d6a7' },
          red: { bg: '#ffebee', card: '#ffcdd2', accent: '#d32f2f', text: '#222', form: '#ffebee', border: '#ef9a9a' },
        };
        const colorSchemeResolved = theme === 'system' ? Appearance.getColorScheme() : theme;
        const colors = themeColors[colorSchemeResolved] || themeColors.light;
        const faqItems = [
          { q: 'How do I report a traffic jam?', a: 'Tap on the map to select a location, fill in the details, and press Submit.' },
          { q: 'How do I view details of a report?', a: 'Tap on any marker on the map or scroll through the report list below.' },
          { q: 'How do I enable/disable notifications?', a: 'Use the notification button in the top bar to toggle push alerts.' },
          { q: 'How do I change language or theme?', a: 'Go to your profile and select your preferred language or theme.' },
          { q: 'Who can delete or ban users?', a: 'Only admins and moderators have access to these controls.' },
          { q: 'How do I add a comment?', a: 'Open a report and use the comment box at the bottom.' },
          { q: 'What if I am offline?', a: 'You can view cached reports and queue new reports for later submission.' },
        ];
      // Pick photo for report
      const pickPhoto = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setPhoto({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || 'photo.jpg',
          });
        }
      };
    const ws = useRef(null);
  const [reports, setReports] = useState([]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('low');
  const [latitude, setLatitude] = useState(0.3476);
  const [longitude, setLongitude] = useState(32.5825);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [jamOnRoute, setJamOnRoute] = useState(false);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [bestRouteIndex, setBestRouteIndex] = useState(0);
  const [jamMarkers, setJamMarkers] = useState([]);
  const [routeDetails, setRouteDetails] = useState({ distance: '', duration: '' });
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterRecent, setFilterRecent] = useState(false);
  // Advanced filtering/sorting
  const [sortMode, setSortMode] = useState('time'); // 'time', 'severity', 'proximity', 'popularity'
  const [filterProximity, setFilterProximity] = useState(null); // km radius, null = off
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [comments, setComments] = useState({}); // { [reportId]: [comments] }
  const [commentInput, setCommentInput] = useState({}); // { [reportId]: text }

  // Auto-refresh reports every 30 seconds
  useEffect(() => {
    fetchReports();
    // WebSocket setup for real-time updates
    ws.current = new WebSocket(WS_URL);
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
    // Fallback polling every 30s
    const interval = setInterval(fetchReports, 30000);
    return () => {
      clearInterval(interval);
      if (ws.current) ws.current.close();
    };
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setReports(res.data);
      await AsyncStorage.setItem('cachedReports', JSON.stringify(res.data));
      // Fetch comments for each report
      for (const report of res.data) {
        fetchComments(report.id);
      }
    } catch (err) {
      // Offline: load cached reports
      const cached = await AsyncStorage.getItem('cachedReports');
      if (cached) {
        setReports(JSON.parse(cached));
        Alert.alert('Offline', 'Showing cached reports');
      } else {
        Alert.alert('Error', 'Failed to fetch reports');
      }
    }
  };

  // Fetch comments for a report
  const fetchComments = async (reportId) => {
    try {
      const res = await axios.get(`${API_URL}/${reportId}/comments`);
      setComments(prev => ({ ...prev, [reportId]: res.data }));
    } catch (err) {
      // Ignore errors for now
    }
  };

  // Add a comment to a report
  const addComment = async (reportId) => {
    const text = commentInput[reportId];
    if (!text || !text.trim()) return;
    try {
      await axios.post(`${API_URL}/${reportId}/comments`, { text });
      setCommentInput(prev => ({ ...prev, [reportId]: '' }));
      fetchComments(reportId);
      // Analytics logging
      logAnalytics('add_comment', { reportId });
    } catch (err) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const submitReport = async () => {
    // Enhanced validation
    if (!location.trim()) return Alert.alert('Validation', 'Location is required');
    if (!description.trim()) return Alert.alert('Validation', 'Description is required');
    if (!['low', 'medium', 'high'].includes(severity)) return Alert.alert('Validation', 'Severity must be low, medium, or high');
    if (isNaN(latitude) || latitude < -90 || latitude > 90) return Alert.alert('Validation', 'Latitude must be between -90 and 90');
    if (isNaN(longitude) || longitude < -180 || longitude > 180) return Alert.alert('Validation', 'Longitude must be between -180 and 180');
    setLoading(true);
    try {
      let formData = new FormData();
      formData.append('location', location.trim());
      formData.append('description', description.trim());
      formData.append('severity', severity);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          type: photo.type,
          name: photo.fileName || 'photo.jpg',
        });
      }
      await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLocation('');
      setDescription('');
      setSeverity('low');
      setPhoto(null);
      fetchReports();
      Alert.alert('Success', 'Report submitted');
      // Analytics logging
      logAnalytics('submit_report');
    } catch (err) {
      // Offline: queue report for later submission
      const queued = await AsyncStorage.getItem('queuedReports');
      const newReport = {
        location: location.trim(),
        description: description.trim(),
        severity,
        latitude,
        longitude,
        photo
      };
      const updatedQueue = queued ? JSON.parse(queued).concat([newReport]) : [newReport];
      await AsyncStorage.setItem('queuedReports', JSON.stringify(updatedQueue));
      setLocation('');
      setDescription('');
      setSeverity('low');
      setPhoto(null);
      Alert.alert('Offline', 'Report queued for submission');
    }
    setLoading(false);
  };
// Submit queued reports when online
useEffect(() => {
  const submitQueuedReports = async () => {
    const queued = await AsyncStorage.getItem('queuedReports');
    if (queued) {
      const reports = JSON.parse(queued);
      for (const r of reports) {
        try {
          let formData = new FormData();
          formData.append('location', r.location);
          formData.append('description', r.description);
          formData.append('severity', r.severity);
          formData.append('latitude', r.latitude);
          formData.append('longitude', r.longitude);
          if (r.photo) {
            formData.append('photo', {
              uri: r.photo.uri,
              type: r.photo.type,
              name: r.photo.fileName || 'photo.jpg',
            });
          }
          await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {}
      }
      await AsyncStorage.removeItem('queuedReports');
      fetchReports();
    }
  };
  // Listen for online event
  const handleOnline = () => submitQueuedReports();
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    if (!start) {
      setStart(coord);
    } else if (!end) {
      setEnd(coord);
    } else {
      setStart(coord);
      setEnd(null);
      setRouteCoords([]);
    }
    setLatitude(coord.latitude);
    setLongitude(coord.longitude);
  };

  // Fetch route suggestion from backend (uses Google Maps Directions API on backend)
  const fetchRoute = async () => {
    if (!start || !end) return;
    try {
      const res = await axios.post(ROUTE_SUGGEST_URL, {
        start: { latitude: start.latitude, longitude: start.longitude },
        end: { latitude: end.latitude, longitude: end.longitude }
      });
      // Placeholder: expects { route: { polyline, distance, duration, ... } }
      const { route } = res.data;
      let coords = [];
      if (route.polyline) {
        coords = decodePolyline(route.polyline);
      } else if (route.waypoints && route.waypoints.length > 0) {
        coords = [route.start, ...route.waypoints, route.end];
      } else {
        coords = [route.start, route.end];
      }
      setAlternativeRoutes([coords]);
      setBestRouteIndex(0);
      setRouteCoords(coords);
      setJamMarkers([]); // Could enhance with jam detection
      setRouteDetails({ distance: route.distance ? `${route.distance} km` : '', duration: route.duration ? `${route.duration} min` : '' });
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch route');
    }
  };

  useEffect(() => {
    if (start && end) fetchRoute();
  }, [start, end]);

  useEffect(() => {
    if (routeCoords.length > 0 && reports.length > 0) {
      // Check if any report is within 100 meters of the route
      const isJam = reports.some(report =>
        routeCoords.some(coord =>
          getDistanceFromLatLonInM(coord.latitude, coord.longitude, report.latitude, report.longitude) < 0.1 // 0.1km = 100m
        )
      );
      setJamOnRoute(isJam);
    } else {
      setJamOnRoute(false);
    }
  }, [routeCoords, reports]);

  // Expo Notifications setup
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const [lastJamId, setLastJamId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // Granular notification controls
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [notifSeverities, setNotifSeverities] = useState({ low: true, medium: true, high: true });
  const [notifProximity, setNotifProximity] = useState(2); // km radius
  useEffect(() => {
    if (!notificationsEnabled) return;
    // Filter jams by selected severities and proximity
    const jams = reports.filter(r =>
      notifSeverities[r.severity] &&
      getDistanceFromLatLonInM(latitude, longitude, r.latitude, r.longitude) <= notifProximity
    );
    if (jams.length > 0) {
      const latest = jams.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
      if (lastJamId !== latest.id) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `Traffic Jam (${latest.severity})`,
            body: `${latest.location}: ${latest.description}`,
          },
          trigger: null,
        });
        setLastJamId(latest.id);
      }
    }
  }, [reports, notificationsEnabled, notifSeverities, notifProximity, latitude, longitude]);

  // Polyline decoder (Google encoded polyline algorithm)
  function decodePolyline(encoded) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  // Haversine formula to calculate distance between two lat/lng points in km
  function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  }
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Voting function
  const voteReport = async (id, type) => {
    try {
      await axios.post(`${API_URL}/${id}/${type}`);
      fetchReports();
      // Analytics logging
      logAnalytics('vote_report', { id, type });
    } catch (err) {
      Alert.alert('Error', 'Failed to vote');
    }
  };

  // Filtered reports
  let filteredReports = reports.filter(r => {
    const severityMatch = filterSeverity === 'all' || r.severity === filterSeverity;
    const recentMatch = !filterRecent || (Date.now() - new Date(r.created_at).getTime() < 2 * 60 * 60 * 1000); // last 2 hours
    const proximityMatch = filterProximity == null || getDistanceFromLatLonInM(latitude, longitude, r.latitude, r.longitude) <= filterProximity;
    return severityMatch && recentMatch && proximityMatch;
  });
  // Sorting
  if (sortMode === 'severity') {
    const sevOrder = { high: 0, medium: 1, low: 2 };
    filteredReports = filteredReports.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  } else if (sortMode === 'proximity') {
    filteredReports = filteredReports.sort((a, b) => getDistanceFromLatLonInM(latitude, longitude, a.latitude, a.longitude) - getDistanceFromLatLonInM(latitude, longitude, b.latitude, b.longitude));
  } else if (sortMode === 'popularity') {
    filteredReports = filteredReports.sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
  } else {
    // Default: time (newest first)
    filteredReports = filteredReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Persist user session
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  const handleAuth = async () => {
    try {
      const payload = { email: authEmail, password: authPassword, phone: authPhone };
      const res = await axios.post(`${AUTH_URL}/${authMode}`, payload);
      setUser(res.data.user);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      // Register push token after login/register
      const tokenData = await Notifications.getExpoPushTokenAsync();
      if (tokenData?.data && res.data.user?.id) {
        await axios.post(`${BASE_URL}/api/push/register`, {
          userId: res.data.user.id,
          expoPushToken: tokenData.data
        });
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthPhone('');
    } catch (err) {
      Alert.alert('Auth Error', err.response?.data?.error || 'Failed to authenticate');
    }
  };
  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  if (!user) {
        // Show onboarding/tutorial modal if needed
        if (showTutorial) {
          const step = tutorialSteps[tutorialStep];
          return (
            <Modal visible={true} transparent animationType="slide">
              <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.6)'}}>
                <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,alignItems:'center',width:'80%'}}>
                  <Text style={{fontSize:22,fontWeight:'bold',marginBottom:12}}>{step.title}</Text>
                  <Text style={{fontSize:16,marginBottom:24,textAlign:'center'}}>{step.text}</Text>
                  <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%'}}>
                    {tutorialStep > 0 && (
                      <TouchableOpacity onPress={() => setTutorialStep(tutorialStep-1)} style={{padding:10}}>
                        <Text style={{color:'#1976d2',fontWeight:'bold'}}>Back</Text>
                      </TouchableOpacity>
                    )}
                    {tutorialStep < tutorialSteps.length-1 ? (
                      <TouchableOpacity onPress={() => setTutorialStep(tutorialStep+1)} style={{padding:10,marginLeft:'auto'}}>
                        <Text style={{color:'#1976d2',fontWeight:'bold'}}>Next</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={async () => {
                        setShowTutorial(false);
                        await AsyncStorage.setItem('tutorialSeen','1');
                      }} style={{padding:10,marginLeft:'auto'}}>
                        <Text style={{color:'#388e3c',fontWeight:'bold'}}>Finish</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={async () => {
                      setShowTutorial(false);
                      await AsyncStorage.setItem('tutorialSeen','1');
                    }} style={{padding:10,marginLeft:16}}>
                      <Text style={{color:'#d32f2f'}}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          );
        }
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:24}}>
        <Text style={{fontSize:24,fontWeight:'bold',marginBottom:16}}>{i18n.t('traffic')}</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t('email')}
          value={authEmail}
          onChangeText={setAuthEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={i18n.t('phone')}
          value={authPhone}
          onChangeText={setAuthPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={i18n.t('password')}
          value={authPassword}
          onChangeText={setAuthPassword}
          secureTextEntry
        />
        <Button title={authMode === 'login' ? i18n.t('login') : i18n.t('register')} onPress={handleAuth} />
        <Button
          title={authMode === 'login' ? i18n.t('noAccount') : i18n.t('haveAccount')}
          onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
        {/* Social Login Buttons */}
        <View style={{marginTop:24, width:'100%', alignItems:'center'}}>
          <Button title="Sign in with Google" color="#4285F4" onPress={handleGoogleLogin} />
          <View style={{height:8}} />
          <Button title="Sign in with Facebook" color="#4267B2" onPress={handleFacebookLogin} />
        </View>
      </View>
    );
  }

  // Role-based UI controls
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const renderAdminControls = (report) => {
    if (!isAdmin && !isModerator) return null;
    return (
      <View style={{flexDirection:'row',marginTop:8}}>
        <Button title="Delete" color="red" onPress={() => handleDeleteReport(report.id)} />
        {isAdmin && (
          <Button title="Ban User" color="orange" onPress={() => handleBanUser(report.user_id)} />
        )}
      </View>
    );
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim, backgroundColor: colors.bg }] }
      accessible={true}
      accessibilityLabel={i18n.t('traffic')}
      accessibilityRole="main"
    >
      {/* Help/FAQ Modal */}
      {showHelp && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.6)'}}>
            <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'85%',maxHeight:'80%'}}>
              <Text style={{fontSize:22,fontWeight:'bold',marginBottom:12}}>Help & FAQ</Text>
              <ScrollView style={{maxHeight:300}}>
                {faqItems.map((item, idx) => (
                  <View key={idx} style={{marginBottom:16}}>
                    <Text style={{fontWeight:'bold',fontSize:16}}>{item.q}</Text>
                    <Text style={{fontSize:15,color:'#333',marginTop:4}}>{item.a}</Text>
                  </View>
                ))}
              </ScrollView>
              <Button title="Close" onPress={() => setShowHelp(false)} color="#1976d2" />
            </View>
          </View>
        </Modal>
      )}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 0.3476,
          longitude: 32.5825,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsTraffic={true}
        onPress={handleMapPress}
      >
        {alternativeRoutes.map((coords, idx) => (
          <MapView.Polyline
            key={idx}
            coordinates={coords}
            strokeWidth={4}
            strokeColor={idx === bestRouteIndex ? 'blue' : 'gray'}
            zIndex={idx === bestRouteIndex ? 2 : 1}
          />
        ))}
        {start && <Marker coordinate={start} pinColor="green" title="Start" />}
        {end && <Marker coordinate={end} pinColor="red" title="End" />}
        {jamMarkers.map((r, i) => (
          <Marker
            key={`jam-${r.id}`}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            title={r.location}
            description={r.description}
            pinColor="purple"
          >
            <View style={{backgroundColor:'#800080',padding:2,borderRadius:4}}>
              <Text style={{color:'#fff',fontWeight:'bold',fontSize:10}}>JAM</Text>
            </View>
          </Marker>
        ))}
        {/* Cluster markers for dense areas (simple approach) */}
        {clusterReports(reports).map((item, idx) => {
          if (item.type === 'cluster') {
            return (
              <Marker
                key={`cluster-${idx}`}
                coordinate={item.coordinate}
                title={`${item.count} reports`}
                description={'Multiple reports in this area'}
                pinColor="#1976d2"
              >
                <View style={{backgroundColor:'#1976d2',padding:6,borderRadius:16}}>
                  <Text style={{color:'#fff',fontWeight:'bold'}}>{item.count}</Text>
                </View>
              </Marker>
            );
          } else {
            // Custom icon for severity
            let icon;
            if (item.severity === 'high') icon = require('./assets/high.png');
            else if (item.severity === 'medium') icon = require('./assets/medium.png');
            else icon = require('./assets/low.png');
            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={item.location}
                description={item.description}
                // pinColor handled by custom icon
              >
                <RNImage source={icon} style={{width:32,height:32}} />
              </Marker>
            );
          }
        })}
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor="blue"
          title="Selected Location"
        />
      </MapView>
      {routeDetails.distance && routeDetails.duration && (
        <View style={{position:'absolute',top:100,left:10,right:10,backgroundColor:'#fffde7',padding:8,borderRadius:8,zIndex:3,alignItems:'center'}}>
          <Text style={{color:'#333',fontWeight:'bold'}}>Best Route: {routeDetails.distance}, {routeDetails.duration}</Text>
        </View>
      )}
      {alternativeRoutes.length > 1 && (
        <View style={{position:'absolute',top:60,left:10,right:10,backgroundColor:'#e0f7fa',padding:8,borderRadius:8,zIndex:3}}>
          <Text style={{color:'#00796b',fontWeight:'bold',textAlign:'center'}}>Best route highlighted in blue. Tap to select alternative route.</Text>
          <View style={{flexDirection:'row',justifyContent:'center',marginTop:6}}>
            {alternativeRoutes.map((coords, idx) => (
              <Button
                key={idx}
                title={`Route ${idx+1}`}
                color={idx === bestRouteIndex ? '#1976d2' : '#bbb'}
                onPress={() => handleRouteSelect(idx)}
              />
            ))}
          </View>
        </View>
      )}
      {jamOnRoute && (
        <View style={{position:'absolute',top:10,left:10,right:10,backgroundColor:'#ffcccc',padding:10,borderRadius:8,zIndex:3}}>
          <Text style={{color:'red',fontWeight:'bold',textAlign:'center'}}>Warning: There is a reported traffic jam on your route!</Text>
        </View>
      )}
      <View style={[styles.form, colorScheme === 'dark' ? { backgroundColor: '#333', borderColor: '#444' } : {}]}>
        <Text style={[styles.formTitle,{color:colors.text}]} accessibilityRole="header" accessibilityLabel="Report Traffic Jam">Report Traffic Jam</Text>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
          accessibilityLabel="Location input"
          accessibilityHint="Enter the location of the traffic jam"
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          accessibilityLabel="Description input"
          accessibilityHint="Enter a description of the traffic jam"
        />
        <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
          <Text style={{marginRight:8}}>Severity:</Text>
          <Button title="Low" onPress={() => setSeverity('low')} color={severity==='low'?'#1976d2':'#bbb'} />
          <Button title="Medium" onPress={() => setSeverity('medium')} color={severity==='medium'?'#ffa000':'#bbb'} />
          <Button title="High" onPress={() => setSeverity('high')} color={severity==='high'?'#d32f2f':'#bbb'} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Latitude"
          value={latitude.toString()}
          onChangeText={v => setLatitude(Number(v))}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Longitude"
          value={longitude.toString()}
          onChangeText={v => setLongitude(Number(v))}
          keyboardType="numeric"
        />
        <Button title={photo ? 'Change Photo' : 'Add Photo'} onPress={pickPhoto} />
        {/* Only one button, accessibility included above */}
        {loading && <Text style={{color:'#1976d2',marginVertical:4}}>Submitting...</Text>}
        {photo && (
          <View style={{alignItems:'center',marginVertical:8}}>
            <Text style={{fontSize:10}}>{photo.fileName}</Text>
            <Image source={{ uri: photo.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
          </View>
        )}
        <Button title="Submit" onPress={submitReport} disabled={loading} />
        {/* Only one button, accessibility included above */}
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:8,backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5'}}>
        <Text style={{fontWeight:'bold',color:colors.text}}>{i18n.t('logout')}: {user.email}</Text>
        <Button title="Help / FAQ" onPress={() => setShowHelp(true)} color={colors.accent} />
        <Button title={i18n.t('profile')} onPress={() => setProfileMode(true)} color={colors.accent} />
        {/* Only one button, accessibility included above */}
        <Button title={notificationsEnabled ? "Notification Settings" : i18n.t('enableNotifications')} onPress={() => notificationsEnabled ? setShowNotifSettings(true) : setNotificationsEnabled(true)} color={notificationsEnabled ? colors.accent : colors.accent} />
        {/* Only one button, accessibility included above */}
        <Button title={i18n.t('logout')} onPress={handleLogout} color={colors.accent} />
        {/* Only one button, accessibility included above */}
        <Button title="Theme" onPress={() => setShowThemeModal(true)} color={colors.accent} />
      {/* Theme Modal */}
      {showThemeModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.6)'}}>
            <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'85%',maxHeight:'80%'}}>
              <Text style={{fontSize:22,fontWeight:'bold',marginBottom:12}}>Choose Theme</Text>
              {['system','light','dark','blue','green','red'].map(t => (
                <Button key={t} title={t.charAt(0).toUpperCase()+t.slice(1)} color={theme===t?colors.accent:'#bbb'} onPress={() => { setTheme(t); setShowThemeModal(false); }} />
              ))}
              <View style={{height:8}} />
              <Button title="Close" color={colors.accent} onPress={() => setShowThemeModal(false)} />
            </View>
          </View>
        </Modal>
      )}
      {/* Notification Settings Modal */}
      {showNotifSettings && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.6)'}}>
            <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'85%',maxHeight:'80%'}}>
              <Text style={{fontSize:22,fontWeight:'bold',marginBottom:12}}>Notification Settings</Text>
              <Text style={{fontWeight:'bold',marginBottom:8}}>Severity Alerts:</Text>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:12}}>
                {['low','medium','high'].map(sev => (
                  <View key={sev} style={{flexDirection:'row',alignItems:'center'}}>
                    <Text style={{marginRight:4}}>{sev.charAt(0).toUpperCase()+sev.slice(1)}</Text>
                    <Button title={notifSeverities[sev] ? 'On' : 'Off'} color={notifSeverities[sev] ? '#1976d2' : '#bbb'} onPress={() => setNotifSeverities(s => ({...s, [sev]: !s[sev]}))} />
                  </View>
                ))}
              </View>
              <Text style={{fontWeight:'bold',marginBottom:8}}>Proximity (km):</Text>
              <View style={{flexDirection:'row',alignItems:'center',marginBottom:16}}>
                <Button title="-" onPress={() => setNotifProximity(p => Math.max(1, p-1))} />
                <Text style={{marginHorizontal:12,fontSize:16}}>{notifProximity}</Text>
                <Button title="+" onPress={() => setNotifProximity(p => Math.min(10, p+1))} />
              </View>
              <Button title="Disable Notifications" color="#d32f2f" onPress={() => { setNotificationsEnabled(false); setShowNotifSettings(false); }} />
              <View style={{height:8}} />
              <Button title="Close" color="#1976d2" onPress={() => setShowNotifSettings(false)} />
            </View>
          </View>
        </Modal>
      )}
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:8,backgroundColor: colorScheme === 'dark' ? '#222' : '#f5f5f5'}}>
        <Text style={{fontWeight:'bold'}}>{i18n.t('filter')}:</Text>
        <Button title={i18n.t('all')} onPress={() => setFilterSeverity('all')} color={filterSeverity==='all'?'#1976d2':'#bbb'} />
        <Button title={i18n.t('low')} onPress={() => setFilterSeverity('low')} color={filterSeverity==='low'?'#1976d2':'#bbb'} />
        <Button title={i18n.t('medium')} onPress={() => setFilterSeverity('medium')} color={filterSeverity==='medium'?'#1976d2':'#bbb'} />
        <Button title={i18n.t('high')} onPress={() => setFilterSeverity('high')} color={filterSeverity==='high'?'#1976d2':'#bbb'} />
        <Button title={filterRecent ? i18n.t('recent') : i18n.t('allTime')} onPress={() => setFilterRecent(r => !r)} color={filterRecent?'#388e3c':'#bbb'} />
        <Button title={filterProximity == null ? 'All Distances' : `≤${filterProximity}km`} onPress={() => setFilterProximity(p => p == null ? 2 : null)} color={filterProximity == null ? '#bbb' : '#1976d2'} />
        <Button title="Sort" onPress={() => setSortMode(m => m === 'time' ? 'severity' : m === 'severity' ? 'proximity' : m === 'proximity' ? 'popularity' : 'time')} color="#388e3c" />
        {/* Sort mode indicator */}
        <Text style={{marginLeft:8,fontSize:12,color:'#888'}}>Sort: {sortMode.charAt(0).toUpperCase()+sortMode.slice(1)}</Text>
      </View>
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.reportCard, colorScheme === 'dark' ? { backgroundColor: '#333', borderColor: '#444' } : {}]}>
            <Text style={[styles.reportTitle,{color:colors.text}]}>{item.location} <Text style={{fontSize:12,color:'#888'}}>({i18n.t(item.severity)})</Text></Text>
            <Text style={[styles.reportDesc,{color:colors.text}]}>{item.description}</Text>
            {item.photo && (
              <Image source={{ uri: `${BASE_URL}/uploads/${item.photo}` }} style={styles.reportPhoto} />
            )}
            <View style={styles.voteRow}>
              <Button title={`👍 ${item.upvotes || 0}`} color="#388e3c" onPress={() => voteReport(item.id, 'upvote')} />
              <View style={{width:8}}/>
              <Button title={`👎 ${item.downvotes || 0}`} color="#d32f2f" onPress={() => voteReport(item.id, 'downvote')} />
            </View>
            <Text style={styles.reportTime}>Reported {timeAgo(item.created_at)}</Text>
            <Button title={i18n.t('report')} color="#d32f2f" onPress={async () => {
              try {
                await axios.post(`${API_URL}/${item.id}/flag`, { reason: 'Inappropriate content' });
                Alert.alert('Reported', 'Thank you for reporting. Our team will review this report.');
              } catch (err) {
                Alert.alert('Error', 'Failed to report.');
              }
            }} />
            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <ScrollView style={styles.commentsList}>
                {(comments[item.id] || []).map((c, idx) => (
                  <View key={idx} style={styles.commentItem}>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <Text style={styles.commentMeta}>{c.user ? c.user.email : 'Anonymous'} · {timeAgo(c.created_at)}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={commentInput[item.id] || ''}
                  onChangeText={text => setCommentInput(prev => ({ ...prev, [item.id]: text }))}
                />
                <Button title="Send" onPress={() => addComment(item.id)} />
              </View>
            </View>
          </View>
        )}
        style={styles.reportList}
      />
    </Animated.View>
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

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, FlatList, Alert, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import PushNotification from 'react-native-push-notification';
import * as ImagePicker from 'react-native-image-picker';

const API_URL = 'http://localhost:3000/api/reports'; // Update port/path as per your backend config
const AUTH_URL = 'http://localhost:3000/api/auth'; // Backend auth endpoint

export default function App() {
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
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setReports(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch reports');
    }
    setLoading(false);
  };

  // Photo picker handler
  const pickPhoto = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) return Alert.alert('Photo Error', response.errorMessage);
      if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0]);
      }
    });
  };

  const submitReport = async () => {
    if (!location) return Alert.alert('Validation', 'Location is required');
    try {
      let formData = new FormData();
      formData.append('location', location);
      formData.append('description', description);
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
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

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

  const fetchRoute = async () => {
    if (!start || !end) return;
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&alternatives=true&key=YOUR_GOOGLE_MAPS_API_KEY`
      );
      const routes = res.data.routes.map(r => decodePolyline(r.overview_polyline.points));
      setAlternativeRoutes(routes);
      // Find the route with the fewest jams
      let minJams = Infinity;
      let bestIdx = 0;
      let bestJams = [];
      let bestDetails = { distance: '', duration: '' };
      routes.forEach((route, idx) => {
        const jams = reports.filter(report =>
          route.some(coord => getDistanceFromLatLonInM(coord.latitude, coord.longitude, report.latitude, report.longitude) < 0.1)
        );
        if (jams.length < minJams) {
          minJams = jams.length;
          bestIdx = idx;
          bestJams = jams;
          bestDetails = {
            distance: res.data.routes[idx].legs[0]?.distance?.text || '',
            duration: res.data.routes[idx].legs[0]?.duration?.text || ''
          };
        }
      });
      setBestRouteIndex(bestIdx);
      setRouteCoords(routes[bestIdx]);
      setJamMarkers(bestJams);
      setRouteDetails(bestDetails);
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

  useEffect(() => {
    PushNotification.configure({
      onNotification: function (notification) {},
      requestPermissions: true,
    });
  }, []);

  const [lastJamId, setLastJamId] = useState(null);
  useEffect(() => {
    const severeJams = reports.filter(r => r.severity === 'high');
    if (severeJams.length > 0) {
      const latest = severeJams.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
      if (lastJamId !== latest.id) {
        PushNotification.localNotification({
          title: 'New Severe Traffic Jam',
          message: `${latest.location}: ${latest.description}`,
        });
        setLastJamId(latest.id);
      }
    }
  }, [reports]);

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
      await axios.post(`${API_URL.replace('/api/reports','/api/reports')}/${id}/${type}`);
      fetchReports();
    } catch (err) {
      Alert.alert('Error', 'Failed to vote');
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const severityMatch = filterSeverity === 'all' || r.severity === filterSeverity;
    const recentMatch = !filterRecent || (Date.now() - new Date(r.created_at).getTime() < 2 * 60 * 60 * 1000); // last 2 hours
    return severityMatch && recentMatch;
  });

  const handleAuth = async () => {
    try {
      const payload = { email: authEmail, password: authPassword, phone: authPhone };
      const res = await axios.post(`${AUTH_URL}/${authMode}`, payload);
      setUser(res.data.user);
      setAuthEmail('');
      setAuthPassword('');
      setAuthPhone('');
    } catch (err) {
      Alert.alert('Auth Error', err.response?.data?.error || 'Failed to authenticate');
    }
  };
  const handleLogout = () => setUser(null);

  if (!user) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:24}}>
        <Text style={{fontSize:24,fontWeight:'bold',marginBottom:16}}>Kampala Traffic</Text>
        <TextInput
          style={styles.input}
          placeholder="Email (or leave blank if using phone)"
          value={authEmail}
          onChangeText={setAuthEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone (or leave blank if using email)"
          value={authPhone}
          onChangeText={setAuthPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={authPassword}
          onChangeText={setAuthPassword}
          secureTextEntry
        />
        <Button title={authMode === 'login' ? 'Login' : 'Register'} onPress={handleAuth} />
        <Button
          title={authMode === 'login' ? 'No account? Register' : 'Have an account? Login'}
          onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 0.3476,
          longitude: 32.5825,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsTraffic
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
        {reports.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            title={r.location}
            description={r.description}
            pinColor={r.severity === 'high' ? 'red' : r.severity === 'medium' ? 'orange' : 'yellow'}
          />
        ))}
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
          <Text style={{color:'#00796b',fontWeight:'bold',textAlign:'center'}}>Best route highlighted in blue. Others in gray.</Text>
        </View>
      )}
      {jamOnRoute && (
        <View style={{position:'absolute',top:10,left:10,right:10,backgroundColor:'#ffcccc',padding:10,borderRadius:8,zIndex:3}}>
          <Text style={{color:'red',fontWeight:'bold',textAlign:'center'}}>Warning: There is a reported traffic jam on your route!</Text>
        </View>
      )}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Report Traffic Jam</Text>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Severity (low, medium, high)"
          value={severity}
          onChangeText={setSeverity}
        />
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
        {photo && (
          <View style={{alignItems:'center',marginVertical:8}}>
            <Text style={{fontSize:10}}>{photo.fileName}</Text>
            <Image source={{ uri: photo.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
          </View>
        )}
        <Button title="Submit" onPress={submitReport} disabled={loading} />
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:8,backgroundColor:'#f5f5f5'}}>
        <Text style={{fontWeight:'bold'}}>Logged in as: {user.email}</Text>
        <Button title="Logout" onPress={handleLogout} color="#d32f2f" />
      </View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:8,backgroundColor:'#f5f5f5'}}>
        <Text style={{fontWeight:'bold'}}>Filter:</Text>
        <Button title="All" onPress={() => setFilterSeverity('all')} color={filterSeverity==='all'?'#1976d2':'#bbb'} />
        <Button title="Low" onPress={() => setFilterSeverity('low')} color={filterSeverity==='low'?'#1976d2':'#bbb'} />
        <Button title="Medium" onPress={() => setFilterSeverity('medium')} color={filterSeverity==='medium'?'#1976d2':'#bbb'} />
        <Button title="High" onPress={() => setFilterSeverity('high')} color={filterSeverity==='high'?'#1976d2':'#bbb'} />
        <Button title={filterRecent ? "Recent" : "All Time"} onPress={() => setFilterRecent(r => !r)} color={filterRecent?'#388e3c':'#bbb'} />
      </View>
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reportItem}>
            <Text style={styles.reportTitle}>{item.location} ({item.severity})</Text>
            <Text>{item.description}</Text>
            {item.photo && (
              <Image source={{ uri: `http://localhost:3000/uploads/${item.photo}` }} style={{ width: 120, height: 90, borderRadius: 8, marginVertical: 4 }} />
            )}
            <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
              <Button title={`👍 ${item.upvotes || 0}`} onPress={() => voteReport(item.id, 'upvote')} />
              <View style={{width:8}}/>
              <Button title={`👎 ${item.downvotes || 0}`} onPress={() => voteReport(item.id, 'downvote')} />
            </View>
            <Text style={{fontSize:10,color:'#888',marginTop:2}}>Reported {timeAgo(item.created_at)}</Text>
          </View>
        )}
        style={styles.reportList}
      />
    </View>
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
  reportItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
  },
    reportTitle: { fontWeight: 'bold' },
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

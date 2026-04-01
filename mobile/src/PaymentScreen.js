import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

export default function PaymentScreen({ userId, onPaymentSuccess }) {
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState('mtn'); // 'mtn' or 'airtel'
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState('day'); // 'day', 'month', '3months', '6months', 'year'

  const getAmount = () => {
    switch (duration) {
      case 'month': return 25000;
      case '3months': return 70000;
      case '6months': return 130000;
      case 'year': return 250000;
      default: return 1000;
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const url = provider === 'mtn' ? '/pay/mtn' : '/pay/airtel';
      const res = await axios.post(`http://192.168.1.111:5000${url}`, {
        phone,
        amount: getAmount(),
        userId,
        duration,
      });
      if (res.data.success) {
        Alert.alert('Payment Initiated', res.data.message);
        onPaymentSuccess && onPaymentSuccess();
      } else {
        Alert.alert('Payment Failed', 'Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay to use VugaSafe</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text style={{ marginBottom: 10 }}>Choose duration:</Text>
      <View style={styles.durationRow}>
        <Button title="1 Day (UGX 1000)" onPress={() => setDuration('day')} color={duration === 'day' ? 'green' : undefined} />
        <Button title="1 Month (UGX 25,000)" onPress={() => setDuration('month')} color={duration === 'month' ? 'green' : undefined} />
      </View>
      <View style={styles.durationRow}>
        <Button title="3 Months (UGX 70,000)" onPress={() => setDuration('3months')} color={duration === '3months' ? 'green' : undefined} />
        <Button title="6 Months (UGX 130,000)" onPress={() => setDuration('6months')} color={duration === '6months' ? 'green' : undefined} />
        <Button title="1 Year (UGX 250,000)" onPress={() => setDuration('year')} color={duration === 'year' ? 'green' : undefined} />
      </View>
      <Text style={{ marginVertical: 10 }}>Amount: UGX {getAmount()}</Text>
      <View style={styles.buttonRow}>
        <Button
          title="Pay with MTN MoMo"
          onPress={() => { setProvider('mtn'); handlePay(); }}
          disabled={loading}
        />
        <Button
          title="Pay with Airtel Money"
          onPress={() => { setProvider('airtel'); handlePay(); }}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, width: '100%', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
});

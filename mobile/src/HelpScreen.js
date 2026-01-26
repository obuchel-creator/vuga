import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VUGA_COLORS } from './vugaColors';

const FAQS = [
  { q: 'How do I report a traffic jam?', a: 'Go to the Reports tab and fill in the location, description, and severity, then submit.' },
  { q: 'How do I view the best route?', a: 'The app suggests the best route based on real-time reports.' },
  { q: 'How do I change language?', a: 'Go to Profile > Settings to change language.' },
];

export default function HelpScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', padding: 24 }}>
        <Text style={styles.title}>Help & FAQ</Text>
        {FAQS.map((item, idx) => (
          <View key={idx} style={styles.faqCard}>
            <Text style={styles.q}>{item.q}</Text>
            <Text style={styles.a}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VUGA_COLORS.light.background,
  },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: VUGA_COLORS.light.primary, 
        marginBottom: 16, 
        alignSelf: 'center' 
    },
    faqCard: { 
      backgroundColor: VUGA_COLORS.light.surface, 
      borderRadius: 18, 
      padding: 18, 
      marginBottom: 16, 
      width: '100%', 
      maxWidth: 400, 
      elevation: 8,
      shadowColor: VUGA_COLORS.light.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    q: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: VUGA_COLORS.light.primary, 
        marginBottom: 4 
    },
    a: { 
        fontSize: 15, 
        color: VUGA_COLORS.light.text 
    },
});

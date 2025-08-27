import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NightModeIndicator: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.icon}>🌙</Text>
        <Text style={styles.text}>Night Mode Active</Text>
      </View>
      <Text style={styles.description}>Panels automatically set to horizontal</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3F51B5',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#E8EAF6',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default NightModeIndicator;

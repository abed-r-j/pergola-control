import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatHorizontalAngle, formatVerticalAngle, formatLux } from '../utils';

const Dashboard: React.FC = () => {
  const state = useSelector((state: RootState) => state.pergola.state);
  const connectionStatus = useSelector((state: RootState) => state.pergola.connectionStatus);

  const metrics = [
    {
      label: '', // Remove "Vertical Angle" text  
      value: formatVerticalAngle(state.verticalAngle),
      color: '#4CAF50',
    },
    {
      label: '', // Remove "Horizontal Angle" text
      value: formatHorizontalAngle(state.horizontalAngle),
      color: '#2196F3',
    },
    {
      label: 'Light Sensor',
      value: connectionStatus === 'connected' ? formatLux(state.lightSensorReading) : 'N/A',
      color: '#FFC107',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Dashboard</Text>
      
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard} {...({} as any)}>
            {metric.label && <Text style={styles.metricLabel}>{metric.label}</Text>}
            <Text style={[styles.metricValue, { color: metric.color }]}>
              {metric.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.lastUpdated}>
        Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default Dashboard;

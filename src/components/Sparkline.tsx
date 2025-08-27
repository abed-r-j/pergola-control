import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SparklineDataPoint } from '../types';

interface SparklineProps {
  data: number[];
  color: string;
  label: string;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color, 
  label, 
  height = 50 
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 72; // Account for padding
  const chartWidth = screenWidth - 32; // Account for container padding
  
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = height - 20 - ((value - minValue) / valueRange) * (height - 40);
    return { x, y };
  });

  const pathData = points.reduce((acc, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${acc} ${command} ${point.x} ${point.y}`;
  }, '');

  return (
    <View style={[styles.container, { height }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <View style={styles.chart}>
        {/* This is a simplified sparkline - in a real app you'd use react-native-svg */}
        <View style={styles.chartBackground} />
        {points.map((point, index) => (
          <View
            key={index}
            {...({} as any)}
            style={[
              styles.dataPoint,
              {
                left: point.x,
                top: point.y,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.minValue}>{minValue.toFixed(1)}°</Text>
        <Text style={styles.maxValue}>{maxValue.toFixed(1)}°</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  chart: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 16,
  },
  chartBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  dataPoint: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  minValue: {
    fontSize: 10,
    color: '#999999',
  },
  maxValue: {
    fontSize: 10,
    color: '#999999',
  },
  noData: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
});

export default Sparkline;

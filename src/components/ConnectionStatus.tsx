import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getConnectionStatusColor } from '../utils';
import { webSocketService } from '../services/websocket';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const statusColor = getConnectionStatusColor(status);

  const handlePress = () => {
    console.log('Connection status pressed - manual refresh triggered');
    webSocketService.manualRefresh();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.indicator, { backgroundColor: statusColor }]} />
      <Text style={[styles.text, { color: statusColor }]}>
        {getStatusText()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConnectionStatus;

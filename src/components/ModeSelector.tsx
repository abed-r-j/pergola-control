import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PergolaMode } from '../types';

interface ModeSelectorProps {
  currentMode: PergolaMode;
  onModeChange: (mode: PergolaMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const connectionStatus = useSelector((state: RootState) => state.pergola.connectionStatus);
  
  const modes = [
    {
      key: 'auto' as PergolaMode,
      title: 'Automatic Tracker',
      description: 'AI-powered sun tracking',
      icon: '☀️',
      color: '#4CAF50',
    },
    {
      key: 'manual' as PergolaMode,
      title: 'Manual Control',
      description: 'Joystick control',
      icon: '🎮',
      color: '#2196F3',
    },
    {
      key: 'off' as PergolaMode,
      title: 'Off Mode',
      description: 'Panels flat & horizontal',
      icon: '⏸️',
      color: '#FF9800',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control Mode</Text>
      <View style={styles.modeGrid}>
        {modes.map((mode) => {
          // Show as active if it matches current mode (regardless of whether user toggled it)
          const isActive = currentMode === mode.key;
          
          return (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeCard,
                isActive && styles.modeCardActive,
                { borderColor: isActive ? mode.color : '#E0E0E0' },
                // Keep interactable but visual feedback when not connected
                (connectionStatus === 'connecting' || connectionStatus === 'disconnected') && styles.modeCardDisconnected
              ]}
              onPress={() => {
                // Only change mode when connected, but keep pressable for UX
                if (connectionStatus === 'connected') {
                  onModeChange(mode.key);
                } else {
                  console.log('Cannot change mode - not connected to Raspberry Pi');
                }
              }}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text style={[styles.modeTitle, { color: isActive ? mode.color : '#666666' }]}>
                {mode.title}
              </Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: mode.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
  modeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 3, // Always use active border width
    borderColor: '#E0E0E0',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeCardActive: {
    elevation: 4,
    shadowOpacity: 0.2,
    // Note: borderWidth stays the same to prevent layout shifts
  },
  modeCardDisconnected: {
    opacity: 0.7,
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default ModeSelector;

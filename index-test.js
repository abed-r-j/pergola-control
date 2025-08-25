/**
 * Simple test entry point
 */

import { AppRegistry, Text, View } from 'react-native';
import React from 'react';

const TestApp = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, color: '#000' }}>Pergola App Test</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}>Registration working!</Text>
    </View>
  );
};

AppRegistry.registerComponent('main', () => TestApp);

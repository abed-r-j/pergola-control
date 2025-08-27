import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { 
  PanGestureHandler, 
  PanGestureHandlerGestureEvent,
  State 
} from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setManualAngles } from '../store/slices/pergolaSlice';
import { webSocketService } from '../services/websocket';
import { 
  joystickToAngles, 
  anglesToJoystick,
  constrainToCircle, 
  formatHorizontalAngle,
  formatVerticalAngle
} from '../utils';

// Fallback for when react-native-gesture-handler is not available
const PanGestureHandlerFallback = ({ children }: any) => {
  return <View>{children}</View>;
};

const JOYSTICK_SIZE = 200;
const KNOB_SIZE = 40;
const MAX_DISTANCE = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2; // Allow knob center to reach outer edge

const ManualControl: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pergolaState = useSelector((state: RootState) => state.pergola.state);
  const currentMode = useSelector((state: RootState) => state.pergola.currentMode);
  const connectionStatus = useSelector((state: RootState) => state.pergola.connectionStatus);
  
  // Initialize joystick position based on current pergola angles
  const getKnobPositionFromAngles = useCallback((horizontal: number, vertical: number) => {
    const joystickPos = anglesToJoystick(horizontal, vertical);
    return {
      x: joystickPos.x * MAX_DISTANCE,
      y: -joystickPos.y * MAX_DISTANCE, // Invert Y for visual consistency
    };
  }, []);

  const [knobPosition, setKnobPosition] = useState(() => 
    getKnobPositionFromAngles(pergolaState.horizontalAngle, pergolaState.verticalAngle)
  );
  const [currentAngles, setCurrentAngles] = useState({
    horizontal: pergolaState.horizontalAngle,
    vertical: pergolaState.verticalAngle,
  });
  
  // Track gesture start position for accumulative movement
  const gestureStartPosition = useRef({ x: 0, y: 0 });
  const isUserDragging = useRef(false);
  const pendingAngles = useRef({ horizontal: 0, vertical: 0 });

  // Reset joystick to center when disconnected
  useEffect(() => {
    if (connectionStatus === 'disconnected' || connectionStatus === 'connecting') {
      console.log('Connection status changed to', connectionStatus, '- resetting joystick to center');
      const centerPosition = { x: 0, y: 0 };
      setKnobPosition(centerPosition);
      setCurrentAngles({ horizontal: 0, vertical: 0 });
    }
  }, [connectionStatus]);

  // Only update joystick position when entering manual mode
  // This prevents infinite loops while still showing current position
  useEffect(() => {
    if (currentMode === 'manual') {
      const newPosition = getKnobPositionFromAngles(
        pergolaState.horizontalAngle, 
        pergolaState.verticalAngle
      );
      setKnobPosition(newPosition);
      setCurrentAngles({
        horizontal: pergolaState.horizontalAngle,
        vertical: pergolaState.verticalAngle,
      });
    }
  }, [currentMode, getKnobPositionFromAngles]); // Only depend on mode changes

  const handlePanGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY, state } = event.nativeEvent;
    
    // Prevent processing if gesture is not active to avoid flickering
    if (state !== State.ACTIVE) {
      return;
    }
    
    // Calculate new position from gesture start + translation
    const newX = gestureStartPosition.current.x + translationX;
    const newY = gestureStartPosition.current.y + translationY;
    
    // Constrain to circular boundary
    const constrainedPosition = constrainToCircle(newX, newY, MAX_DISTANCE);
    
    // ZERO-LATENCY response - immediate position update without any animation frames or delays
    setKnobPosition(constrainedPosition);
    
    // Convert to normalized coordinates (-1 to 1)
    const normalizedX = constrainedPosition.x / MAX_DISTANCE;
    const normalizedY = -constrainedPosition.y / MAX_DISTANCE; // Invert Y for intuitive control
    
    // Convert to angles
    const angles = joystickToAngles(normalizedX, normalizedY);
    
    // ULTRA-SNAPPY response - immediate state update with no delays or animation frames
    setCurrentAngles({
      horizontal: angles.horizontal,
      vertical: angles.vertical,
    });
    
    // Store pending angles but don't send yet (pinnable behavior)
    pendingAngles.current = {
      horizontal: angles.horizontal,
      vertical: angles.vertical,
    };
    
    // DON'T update Redux store during gesture movement - only update local UI state
    // This prevents the Dashboard from updating until angles are actually sent
    
    // Pinnable behavior: Only send WebSocket on gesture end (handled in handleStateChange)
  };

  // NEW: Handle tap-to-pin functionality
  const handleJoystickPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    
    // Calculate position relative to joystick center
    const centerX = JOYSTICK_SIZE / 2;
    const centerY = JOYSTICK_SIZE / 2;
    const newX = locationX - centerX;
    const newY = locationY - centerY;
    
    // Check if tap is near the edge labels (N, S, E, W) - ignore these taps
    const tapDistanceFromCenter = Math.sqrt(newX * newX + newY * newY);
    const labelZoneRadius = JOYSTICK_SIZE / 2 - 10; // Slightly larger touchable area
    
    if (tapDistanceFromCenter > labelZoneRadius) {
      // Tap is in the label zone (N, S, E, W area) - ignore
      console.log('Tap in label zone - ignoring');
      return;
    }
    
    // Check if tap is very close to center (within 12 pixels) - snap to exact center
    if (tapDistanceFromCenter < 12) {
      console.log('Tap near center - snapping to exact center');
      setKnobPosition({ x: 0, y: 0 });
      setCurrentAngles({ horizontal: 0, vertical: 0 });
      dispatch(setManualAngles({ horizontal: 0, vertical: 0 }));
      webSocketService.setAngles(0, 0);
      return;
    }
    
    // For all other taps, use the exact position if within bounds, otherwise constrain minimally
    let finalPosition;
    if (tapDistanceFromCenter <= MAX_DISTANCE) {
      // Tap is within bounds - use exact position
      finalPosition = { x: newX, y: newY };
    } else {
      // Tap is outside bounds - constrain to boundary
      finalPosition = constrainToCircle(newX, newY, MAX_DISTANCE);
    }
    
    // INSTANT positioning - zero-latency tap-to-pin at EXACT location
    setKnobPosition(finalPosition);
    
    // Convert to angles immediately using the exact position
    const normalizedX = finalPosition.x / MAX_DISTANCE;
    const normalizedY = -finalPosition.y / MAX_DISTANCE;
    const angles = joystickToAngles(normalizedX, normalizedY);
    
    // Update everything instantly
    setCurrentAngles({
      horizontal: angles.horizontal,
      vertical: angles.vertical,
    });
    
    // Update Redux store
    dispatch(setManualAngles({
      horizontal: angles.horizontal,
      vertical: angles.vertical,
    }));
    
    // Send WebSocket command immediately for tap-to-pin
    webSocketService.setAngles(angles.horizontal, angles.vertical);
  };

  const handleStateChange = (event: any) => {
    const { state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      // Store the starting position when gesture begins and mark as dragging
      gestureStartPosition.current = { ...knobPosition };
      isUserDragging.current = true;
    } else if (state === State.END || state === State.CANCELLED) {
      // Gesture ended - knob stays at final position (pinnable behavior)
      isUserDragging.current = false;
      
      // NOW send the WebSocket message with final angles (pinnable behavior)
      console.log('Joystick released - sending angles:', pendingAngles.current);
      webSocketService.setAngles(pendingAngles.current.horizontal, pendingAngles.current.vertical);
      
      // Update Redux store ONLY when angles are actually sent to server
      dispatch(setManualAngles({
        horizontal: pendingAngles.current.horizontal,
        vertical: pendingAngles.current.vertical,
      }));
    }
  };

  // Create concentric circles for visual guidance - each circle represents 10° increments
  const renderGuideCircles = () => {
    const circles = [];
    // Create circles for 10°, 20°, 30°, 40° (max angle)
    for (let angle = 10; angle <= 40; angle += 10) {
      // Calculate radius based on angle: 40° = MAX_DISTANCE, so radius = (angle/40) * MAX_DISTANCE
      const radius = (angle / 40) * MAX_DISTANCE;
      const isOuterCircle = angle === 40;
      
      circles.push(
        <View
          key={angle}
          {...({} as any)}
          style={[
            styles.guideCircle,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderColor: isOuterCircle ? '#2196F3' : '#E0E0E0',
              borderWidth: isOuterCircle ? 2 : 1,
            },
          ]}
        />
      );
    }
    return circles;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Control</Text>
      
      <View style={styles.controlContainer}>
        <View style={styles.angleDisplay}>
          <View style={styles.angleItem}>
            <Text style={styles.angleItemValue}>
              {formatVerticalAngle(currentAngles.vertical)}
            </Text>
          </View>
          <View style={styles.angleItem}>
            <Text style={styles.angleItemValue}>
              {formatHorizontalAngle(currentAngles.horizontal)}
            </Text>
          </View>
        </View>
        
        <View style={styles.joystickContainer}>
          <TouchableWithoutFeedback onPress={handleJoystickPress}>
            <View style={styles.joystickBase}>
              {renderGuideCircles()}
              
              <PanGestureHandler
                onGestureEvent={handlePanGesture}
                onHandlerStateChange={handleStateChange}
                minDist={0}
                shouldCancelWhenOutside={false}
                avgTouches={false}
              >
                <View
                  style={[
                    styles.joystickKnob,
                    {
                      transform: [
                        { translateX: knobPosition.x },
                        { translateY: knobPosition.y },
                      ],
                    },
                  ]}
                >
                  <View style={styles.knobInner} />
                </View>
              </PanGestureHandler>
              
              {/* Center dot */}
              <View style={styles.centerDot} />
              
              {/* Angle labels */}
              <Text style={[styles.angleLabel, styles.angleTop]}>N</Text>
              <Text style={[styles.angleLabel, styles.angleBottom]}>S</Text>
              <Text style={[styles.angleLabel, styles.angleLeft]}>W</Text>
              <Text style={[styles.angleLabel, styles.angleRight]}>E</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
      
      <Text style={styles.instructions}>
        Tap anywhere to pin the knob instantly{'\n'}
        Drag the knob for precise control{'\n'}
        Each ring represents 10° increments
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
  controlContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  joystickContainer: {
    marginBottom: 20,
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  guideCircle: {
    position: 'absolute',
    borderStyle: 'dashed',
  },
  joystickKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    position: 'absolute',
  },
  knobInner: {
    width: KNOB_SIZE - 8,
    height: KNOB_SIZE - 8,
    borderRadius: (KNOB_SIZE - 8) / 2,
    backgroundColor: '#1976D2',
  },
  centerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666666',
    position: 'absolute',
  },
  angleLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
  },
  angleTop: {
    top: -20,
  },
  angleBottom: {
    bottom: -20,
  },
  angleLeft: {
    left: -30,
  },
  angleRight: {
    right: -30,
  },
  angleDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  angleItem: {
    alignItems: 'center',
  },
  angleItemLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  angleItemValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  instructions: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});

export default ManualControl;

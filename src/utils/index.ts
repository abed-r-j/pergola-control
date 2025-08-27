import { JoystickPosition } from '../types';

/**
 * Convert joystick position (x, y from -1 to 1) to pergola angles
 */
export const joystickToAngles = (x: number, y: number): JoystickPosition => {
  // Clamp inputs to valid range
  const clampedX = Math.max(-1, Math.min(1, x));
  const clampedY = Math.max(-1, Math.min(1, y));
  
  // Convert to angles (-40 to +40 degrees)
  const horizontal = clampedX * 40;
  const vertical = clampedY * 40;
  
  return {
    x: clampedX,
    y: clampedY,
    horizontal,
    vertical,
  };
};

/**
 * Convert angles to joystick position
 */
export const anglesToJoystick = (horizontal: number, vertical: number): JoystickPosition => {
  // Clamp angles to valid range
  const clampedH = Math.max(-40, Math.min(40, horizontal));
  const clampedV = Math.max(-40, Math.min(40, vertical));
  
  // Convert to joystick coordinates (-1 to 1)
  const x = clampedH / 40;
  const y = clampedV / 40;
  
  return {
    x,
    y,
    horizontal: clampedH,
    vertical: clampedV,
  };
};

/**
 * Calculate distance from center for joystick constraints
 */
export const getDistanceFromCenter = (x: number, y: number): number => {
  return Math.sqrt(x * x + y * y);
};

/**
 * Constrain joystick position to circular boundary
 */
export const constrainToCircle = (x: number, y: number, radius: number = 1): { x: number; y: number } => {
  const distance = getDistanceFromCenter(x, y);
  
  if (distance <= radius) {
    return { x, y };
  }
  
  // Normalize and scale to radius
  const scale = radius / distance;
  return {
    x: x * scale,
    y: y * scale,
  };
};

/**
 * Format angle for display
 */
export const formatAngle = (angle: number): string => {
  return `${angle.toFixed(1)}°`;
};

/**
 * Format horizontal angle with directional indicator (E/W)
 */
export const formatHorizontalAngle = (angle: number): string => {
  const absAngle = Math.abs(angle);
  const direction = angle >= 0 ? 'E' : 'W';
  return `${absAngle.toFixed(1)}°${direction}`;
};

/**
 * Format vertical angle with directional indicator (N/S)
 */
export const formatVerticalAngle = (angle: number): string => {
  const absAngle = Math.abs(angle);
  const direction = angle >= 0 ? 'N' : 'S';
  return `${absAngle.toFixed(1)}°${direction}`;
};

/**
 * Format light sensor reading
 */
export const formatLux = (lux: number): string => {
  if (lux >= 1000) {
    return `${(lux / 1000).toFixed(1)}k lux`;
  }
  return `${Math.round(lux)} lux`;
};

/**
 * Get connection status color
 */
export const getConnectionStatusColor = (status: 'connected' | 'connecting' | 'disconnected'): string => {
  switch (status) {
    case 'connected':
      return '#4CAF50'; // Green
    case 'connecting':
      return '#FF9800'; // Orange
    case 'disconnected':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray
  }
};

/**
 * Debounce function for limiting API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay) as any;
  };
};

/**
 * Generate mock data for testing
 */
export const generateMockData = () => {
  return {
    horizontalAngle: (Math.random() - 0.5) * 80, // -40 to +40
    verticalAngle: (Math.random() - 0.5) * 80, // -40 to +40
    lightSensorReading: Math.random() * 10000, // 0 to 10000 lux
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Validate IP address format
 */
export const isValidIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

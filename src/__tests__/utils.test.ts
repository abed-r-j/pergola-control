/// <reference types="jest" />

import { 
  joystickToAngles, 
  anglesToJoystick, 
  constrainToCircle,
  formatAngle,
  formatLux,
  isValidIP 
} from '../utils';

describe('Utility Functions', () => {
  describe('joystickToAngles', () => {
    it('should convert joystick center to zero angles', () => {
      const result = joystickToAngles(0, 0);
      expect(result.horizontal).toBe(0);
      expect(result.vertical).toBe(0);
    });

    it('should convert joystick extremes to angle limits', () => {
      const result1 = joystickToAngles(1, 1);
      expect(result1.horizontal).toBe(40);
      expect(result1.vertical).toBe(40);

      const result2 = joystickToAngles(-1, -1);
      expect(result2.horizontal).toBe(-40);
      expect(result2.vertical).toBe(-40);
    });

    it('should clamp values beyond range', () => {
      const result = joystickToAngles(2, -2);
      expect(result.horizontal).toBe(40);
      expect(result.vertical).toBe(-40);
    });
  });

  describe('anglesToJoystick', () => {
    it('should convert zero angles to joystick center', () => {
      const result = anglesToJoystick(0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should convert angle limits to joystick extremes', () => {
      const result1 = anglesToJoystick(40, 40);
      expect(result1.x).toBe(1);
      expect(result1.y).toBe(1);

      const result2 = anglesToJoystick(-40, -40);
      expect(result2.x).toBe(-1);
      expect(result2.y).toBe(-1);
    });
  });

  describe('constrainToCircle', () => {
    it('should not modify positions within circle', () => {
      const result = constrainToCircle(0.5, 0.5, 1);
      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
    });

    it('should constrain positions outside circle', () => {
      const result = constrainToCircle(2, 2, 1);
      const distance = Math.sqrt(result.x * result.x + result.y * result.y);
      expect(distance).toBeCloseTo(1, 5);
    });
  });

  describe('formatAngle', () => {
    it('should format angles with one decimal place', () => {
      expect(formatAngle(12.345)).toBe('12.3°');
      expect(formatAngle(-5.6789)).toBe('-5.7°');
    });
  });

  describe('formatLux', () => {
    it('should format small lux values as integers', () => {
      expect(formatLux(123)).toBe('123 lux');
      expect(formatLux(999)).toBe('999 lux');
    });

    it('should format large lux values with k suffix', () => {
      expect(formatLux(1000)).toBe('1.0k lux');
      expect(formatLux(12345)).toBe('12.3k lux');
    });
  });

  describe('isValidIP', () => {
    it('should validate correct IP addresses', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
      expect(isValidIP('10.0.0.1')).toBe(true);
      expect(isValidIP('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      expect(isValidIP('256.1.1.1')).toBe(false);
      expect(isValidIP('192.168.1')).toBe(false);
      expect(isValidIP('not.an.ip.address')).toBe(false);
      expect(isValidIP('')).toBe(false);
    });
  });
});

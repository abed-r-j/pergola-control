# 🧪 Final Testing Checklist - Universal Joint Pergola App

## 🏁 **Pre-Testing Requirements**

### Database Migration
- [ ] Run `database/remove-height-columns.sql` in Supabase SQL Editor
- [ ] Verify pergola_logs table no longer has height columns
- [ ] Check that existing user accounts still work

### Metro Server Status
- [ ] Confirm Metro bundler is running: `exp://192.168.1.10:8081`
- [ ] QR code scannable from Expo Go app

## 📱 **Mobile App Testing**

### 1. Authentication Flow
- [ ] Sign up with new email (should work without RLS errors)
- [ ] Log out and log back in
- [ ] Verify profile creation completes successfully
- [ ] Check no console errors related to authentication

### 2. Dashboard Display
- [ ] **3 Metrics Only**: Horizontal Angle, Vertical Angle, Light Sensor
- [ ] **No Height Display**: Confirm height metric card is completely removed
- [ ] Real-time updates (if Pi connected)
- [ ] Clean data formatting and units

### 3. Manual Control Testing
- [ ] **Joystick Reset Behavior**: 
  - Move joystick to any position
  - Release finger
  - Verify joystick returns to center (0, 0)
- [ ] **Command Sending**: Verify WebSocket messages sent without height parameter
- [ ] **UI Responsiveness**: Smooth joystick movement

### 4. Mode Switching
- [ ] **Auto Mode**: Switch successfully without errors
- [ ] **Manual Mode**: Joystick appears and functions correctly
- [ ] **Off Mode**: Switch successfully (no height commands sent)
- [ ] **Mode Persistence**: Mode selection survives app reload

### 5. WebSocket Communication
- [ ] **Connection Status**: Shows "Connected" when Pi available
- [ ] **Clean Messages**: No height parameters in WebSocket traffic
- [ ] **Error Handling**: Graceful fallback when Pi disconnected

## 🤖 **Raspberry Pi Integration**

### 1. Server Boot Test
- [ ] Copy updated `raspberry-pi-server.py` to Pi
- [ ] Start server: `python3 raspberry-pi-server.py`
- [ ] Verify no height-related error messages
- [ ] Check WebSocket server starts on port 8765

### 2. Universal Joint Operation
- [ ] **Two Angles Only**: Confirm server only tracks horizontal/vertical
- [ ] **No Height Commands**: Verify Modbus writes only H/V registers
- [ ] **Sensor Reading**: Light sensor data streams correctly
- [ ] **Night Mode Logic**: Flat position (0°, 0°) triggered at night

### 3. Auto-Tracking Mode
- [ ] **Sun Tracking**: Panels follow calculated sun position
- [ ] **Angle Scaling**: Proper conversion to -4000 to +4000 range
- [ ] **Night Transition**: Smooth move to flat position
- [ ] **Day Resume**: Proper tracking resume at sunrise

## 🔧 **Hardware Integration**

### 1. Arduino Communication
- [ ] **Modbus RTU**: Connection established on /dev/ttyUSB0
- [ ] **Register Writing**: Only registers 1 (H) and 2 (V) written
- [ ] **Angle Limits**: Respect -40° to +40° physical constraints
- [ ] **Error Handling**: Graceful recovery from communication failures

### 2. Universal Joint Mechanics
- [ ] **Fixed Height**: Confirm 1m center mount doesn't move vertically
- [ ] **Angular Freedom**: Full -40° to +40° range in both axes
- [ ] **Panel Movement**: All 8 panels move in unison
- [ ] **Smooth Operation**: No mechanical binding or jerky movement

## 🎯 **Performance Validation**

### 1. Mobile App Performance
- [ ] **Startup Time**: App loads quickly without blocking
- [ ] **Memory Usage**: No memory leaks during extended use
- [ ] **Battery Impact**: Reasonable power consumption
- [ ] **Responsiveness**: UI stays responsive during WebSocket traffic

### 2. Pi Server Performance
- [ ] **CPU Usage**: Reasonable load during auto-tracking
- [ ] **Memory Stability**: No memory leaks over extended operation
- [ ] **Response Time**: Quick response to manual commands
- [ ] **Uptime**: Stable operation over hours/days

## 🔒 **Security & Reliability**

### 1. Authentication Security
- [ ] **RLS Policies**: All database policies working correctly
- [ ] **Token Refresh**: Automatic token renewal
- [ ] **Session Management**: Proper logout and cleanup
- [ ] **Data Privacy**: User data properly isolated

### 2. Error Recovery
- [ ] **Network Interruption**: App handles WiFi drops gracefully
- [ ] **Pi Disconnection**: Mobile app shows appropriate status
- [ ] **Authentication Errors**: Clear error messages to user
- [ ] **Hardware Failures**: System degrades gracefully

## 📊 **Final Acceptance Criteria**

### Must Pass (Critical)
- [ ] No console errors during normal operation
- [ ] Authentication works 100% without RLS violations
- [ ] Joystick resets to center after every manual adjustment
- [ ] Only 3 metrics displayed (no height)
- [ ] Pi server runs without height-related errors

### Should Pass (Important)
- [ ] Smooth real-time updates when Pi connected
- [ ] Auto-tracking works in daylight hours
- [ ] Night mode transitions to flat position correctly
- [ ] Mode switching is instant and reliable
- [ ] Professional UI with no placeholder text

### Nice to Have (Polish)
- [ ] Animations are smooth and polished
- [ ] Icons and styling look professional
- [ ] Connection status updates are immediate
- [ ] Error messages are user-friendly
- [ ] Performance feels snappy throughout

## ✅ **Sign-Off Checklist**

Once all tests pass:
- [ ] Document any remaining issues or limitations
- [ ] Update README.md with final setup instructions
- [ ] Create deployment guide for new installations
- [ ] Archive old height-related code for reference
- [ ] Celebrate successful universal joint implementation! 🎉

---

**Testing Date**: ___________  
**Tester Name**: ___________  
**Overall Status**: [ ] PASS [ ] FAIL [ ] PARTIAL  
**Production Ready**: [ ] YES [ ] NO  

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________

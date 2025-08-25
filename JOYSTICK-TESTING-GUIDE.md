# 🧪 **Joystick Behavior Testing Guide**

## 📱 **QR Code Ready for Testing**

```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀▄█▀ ██ ▄█ ▄▄▄▄▄ █
█ █   █ █▄   ▄██▀ █ █   █ █
█ █▄▄▄█ █ ▀█▀██▀ ██ █▄▄▄█ █
█▄▄▄▄▄▄▄█ ▀▄█ █▄█▄█▄▄▄▄▄▄▄█
█ ▄▀ ▀█▄ ▀█ ▀█▄▀▄▄▀  ▄▀▄▄▀█
██  ▄▄ ▄█ ▄▄██  ▀▄▄▀ ▀▀█▄▄█
██  ██▀▄▀▄▀▀▀ ▄ █▀█ ▄█ ██▀█
█▄▀▀██▄▄█▄█ █ ▀██ ▄▄ ▀▀██▄█
█▄▄██▄▄▄▄ ▀█▄██▄  ▄▄▄ █ ▄ █
█ ▄▄▄▄▄ █▄ █▀██▄  █▄█  ▀▄ █
█ █   █ █▀█    ▀▀▄ ▄▄ █▀█▄█
█ █▄▄▄█ █▀██   ▄█  █▄  ▄█▄█
█▄▄▄▄▄▄▄█▄▄▄▄▄█▄█▄███▄▄█▄▄█
```

**Metro URL**: `exp://192.168.1.10:8081`

## 🎯 **Testing Objectives**

### **NEW BEHAVIOR TO VERIFY:**
✅ Joystick knob shows **current panel position** (not always centered)  
✅ Position updates **in real-time** from WebSocket data  
✅ **No reset to center** after user interaction  
✅ Natural drag behavior from current to new position  

## 📋 **Step-by-Step Testing Protocol**

### **1. App Launch & Authentication** 
- [ ] Scan QR code with Expo Go
- [ ] App loads without errors
- [ ] Sign in/sign up works properly
- [ ] Reach main dashboard

### **2. Initial Dashboard Check**
- [ ] **Dashboard shows 3 metrics** (Horizontal, Vertical, Light Sensor)
- [ ] **No height metric displayed** ✅
- [ ] Connection status shows "Disconnected" (expected without Pi)
- [ ] All UI elements render correctly

### **3. Mode Switching Tests**
- [ ] **Auto Mode**: Switch successfully, no errors
- [ ] **Manual Mode**: Switch successfully, joystick appears
- [ ] **Off Mode**: Switch successfully, no errors
- [ ] Mode buttons respond properly

### **4. Joystick Position Reflection Tests**

#### **Test 4A: Initial Position**
- [ ] Switch to **Manual Mode**
- [ ] **VERIFY**: Joystick knob position reflects current angles from dashboard
- [ ] If dashboard shows 0°, 0° → joystick should be at center
- [ ] If dashboard shows other angles → joystick should be positioned accordingly

#### **Test 4B: Position Persistence** 
- [ ] Switch to **Auto Mode** → back to **Manual Mode**
- [ ] **VERIFY**: Joystick returns to same position (no reset to center)
- [ ] Position should match dashboard angles consistently

#### **Test 4C: Visual Accuracy**
- [ ] Note dashboard angles (e.g., H: 15°, V: -10°)
- [ ] **VERIFY**: Joystick knob is visually positioned at corresponding spot
- [ ] Should be slightly right (15°) and slightly down (-10°) from center

### **5. Manual Control Interaction Tests**

#### **Test 5A: Drag From Current Position**
- [ ] Touch joystick knob at its current position
- [ ] **VERIFY**: Knob responds to touch (highlights or moves slightly)
- [ ] Drag to new position
- [ ] **VERIFY**: Smooth movement, stays within circular boundary
- [ ] Release finger
- [ ] **VERIFY**: Knob stays at new position (NO RESET TO CENTER) ✅

#### **Test 5B: Angle Display Updates**
- [ ] Drag joystick to different positions
- [ ] **VERIFY**: Horizontal/Vertical angle displays update in real-time
- [ ] Values should change smoothly as you drag
- [ ] Should show values between -40° and +40°

#### **Test 5C: Multiple Interactions**
- [ ] Perform several drag operations in sequence
- [ ] **VERIFY**: Each starts from the previous end position
- [ ] No unexpected jumps or resets
- [ ] Consistent behavior throughout

### **6. Boundary and Constraint Tests**

#### **Test 6A: Circular Boundary**
- [ ] Try to drag joystick outside the outer circle
- [ ] **VERIFY**: Knob is constrained to circular boundary
- [ ] Should not go beyond the outermost guide ring

#### **Test 6B: Angle Limits**
- [ ] Drag to extreme positions
- [ ] **VERIFY**: Angles are clamped to -40° to +40° range
- [ ] Display should not show values outside this range

### **7. WebSocket Integration Tests**

#### **Test 7A: Without Pi Connection**
- [ ] Manual control should work locally
- [ ] Angle displays update correctly
- [ ] No crashes or error messages about connectivity

#### **Test 7B: Mock Data Simulation**
*If you want to test real-time updates without Pi:*
- [ ] Could modify mock service to simulate angle changes
- [ ] Verify joystick position updates automatically

### **8. UI/UX Quality Tests**

#### **Test 8A: Visual Polish**
- [ ] **Guide rings**: Should show 4 concentric circles
- [ ] **Angle labels**: +40°/-40° labels positioned correctly
- [ ] **Knob appearance**: Blue knob with shadow, responsive
- [ ] **Instructions**: Text should say "shows current panel orientation"

#### **Test 8B: Performance**
- [ ] Smooth dragging without lag
- [ ] No frame drops during interaction
- [ ] Responsive touch handling

#### **Test 8C: Error Handling**
- [ ] Try rapid multiple touches
- [ ] Test gesture interruptions
- [ ] Verify app doesn't crash

## ✅ **Expected Results**

### **PASS Criteria:**
1. ✅ **Position Accuracy**: Joystick knob visually matches dashboard angles
2. ✅ **No Center Reset**: Knob stays where you leave it after each interaction
3. ✅ **Real-time Updates**: Angle displays change smoothly during dragging
4. ✅ **Natural Feel**: Intuitive drag behavior, starts from current position
5. ✅ **Boundary Respect**: Constrained to circular area, angles clamped to ±40°

### **FAIL Indicators:**
- ❌ Joystick resets to center after interaction
- ❌ Position doesn't match dashboard angles
- ❌ Unexpected jumps or glitches
- ❌ Touch response issues
- ❌ App crashes or errors

## 🐛 **Common Issues to Watch For**

### **Translation vs. Absolute Position**
- **Problem**: Joystick might jump when starting a new gesture
- **Cause**: Incorrect handling of gesture start position
- **Check**: First touch should be smooth, no sudden jumps

### **Coordinate System Mismatch**
- **Problem**: Joystick position inverted or rotated compared to angles
- **Cause**: Y-axis inversion or angle calculation errors
- **Check**: Moving joystick right should increase horizontal angle

### **State Synchronization**
- **Problem**: Joystick position doesn't match Redux state
- **Cause**: useEffect dependencies or timing issues
- **Check**: Dashboard angles should always match joystick position

## 📊 **Testing Results Template**

### **Date**: ________________
### **Tester**: ________________
### **Device**: ________________

| Test Category | Status | Notes |
|---------------|--------|-------|
| App Launch | ⭐ Pass ⭐ Fail | |
| Dashboard Display | ⭐ Pass ⭐ Fail | |
| Mode Switching | ⭐ Pass ⭐ Fail | |
| Position Reflection | ⭐ Pass ⭐ Fail | |
| Manual Interaction | ⭐ Pass ⭐ Fail | |
| No Center Reset | ⭐ Pass ⭐ Fail | |
| Boundary Constraints | ⭐ Pass ⭐ Fail | |
| UI/UX Quality | ⭐ Pass ⭐ Fail | |

### **Overall Assessment**: ⭐ PASS ⭐ FAIL

### **Critical Issues Found**:
_________________________________________________
_________________________________________________

### **Recommendations**:
_________________________________________________
_________________________________________________

---

## 🚀 **Ready to Test!**

**Your pergola control app is ready for comprehensive joystick testing.**

1. **Scan the QR code** with Expo Go
2. **Follow the testing protocol** above
3. **Focus on the new behavior**: No center reset, position reflection
4. **Report any issues** you discover

The joystick should now behave like a **real position indicator** rather than a **temporary input device**! 🎯📱

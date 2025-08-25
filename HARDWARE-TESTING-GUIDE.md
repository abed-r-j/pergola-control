# 🧪 Hardware Testing Guide - Light Sensors & Real System Integration

## 🎯 **Testing Overview**

Your pergola control system is now ready for comprehensive testing! We'll verify:
- ✅ **Light sensor readings** from your Arduino hardware
- ✅ **Real-time data streaming** from Raspberry Pi to mobile app
- ✅ **Mode switching** with actual hardware response
- ✅ **Connection management** with real WebSocket communication

---

## 📋 **Pre-Test Checklist**

### **Hardware Status:**
- ✅ Raspberry Pi 5 running with pergola server
- ✅ Arduino Mega connected via USB with light sensor code
- ✅ Two LDR sensors wired to A0 and A1 with voltage dividers
- ✅ Metro bundler running on development machine

### **Software Status:**
- ✅ WebSocket URL updated to `192.168.1.16:8080`
- ✅ Pergola server running with virtual environment activated
- ✅ Mobile app ready for testing

---

## 🧪 **Test Procedures**

### **Test 1: Verify Hardware Communication**

**On Raspberry Pi Terminal:**
```bash
# Make sure server is running and showing sensor data
./start_pergola.sh
```

**Expected Output:**
```
🚀 Starting Pergola Control System...
📁 Changed to pergola-control directory
🐍 Virtual environment activated
🌐 Starting server...
✅ Connected to Arduino on /dev/ttyACM0
📊 Light sensors: 512, 487 → 5120 lux
📊 Light sensors: 498, 503 → 5230 lux
🌐 WebSocket server starting on port 8080...
✅ Pergola server is running!
📱 Ready for mobile app connections
```

**If you see sensor readings changing:** ✅ **Hardware is working!**

### **Test 2: Mobile App Connection**

**On Your Development Machine:**

1. **Open Expo App** on your phone or use web browser
2. **Scan QR code** from Metro bundler terminal
3. **Watch connection status** in app

**Expected App Behavior:**
- 🟡 **Connecting...** (yellow indicator)
- 🟢 **Connected** (green indicator) 
- 📊 **Dashboard shows live lux readings**

### **Test 3: Light Sensor Verification**

**Physical Tests:**

1. **Bright Light Test:**
   - Shine phone flashlight on both LDR sensors
   - **Expected:** Lux reading increases significantly (5000+ lux)
   - **App Dashboard:** Shows higher numbers in real-time

2. **Dark Test:**
   - Cover both sensors with your hands
   - **Expected:** Lux reading drops dramatically (0-1000 lux)
   - **App Dashboard:** Shows lower numbers in real-time

3. **Individual Sensor Test:**
   - Cover only one sensor at a time
   - **Expected:** Readings still change (average of both sensors)

**On Raspberry Pi, you should see:**
```
📊 Light sensors: 823, 856 → 1670 lux  (dark)
📊 Light sensors: 123, 98 → 8905 lux   (bright)
```

### **Test 4: Real-Time Data Streaming**

**Verification:**
1. **Keep app open on Dashboard screen**
2. **Wave hand over sensors repeatedly**
3. **Observe sparkline graph updating**

**Expected Results:**
- ✅ **Graph updates every 2 seconds**
- ✅ **Values change in real-time as you move your hand**
- ✅ **No lag or disconnections**

### **Test 5: Mode Control Testing**

**Automatic Mode:**
1. **Tap "Automatic Tracker"** in app
2. **On Pi terminal, should see:** `📨 Received command: MODE`
3. **Arduino should receive:** `MODE:auto`

**Manual Mode:**
1. **Tap "Manual Tracker"** in app
2. **Use joystick** to send angle commands
3. **On Pi terminal, should see:** `📨 Received command: SET_ANGLES`
4. **Arduino should receive:** `ANGLES:15.0,25.0`

**Off Mode:**
1. **Tap "Off"** in app
2. **On Pi terminal, should see:** `📨 Received command: MODE`
3. **Arduino should receive:** `MODE:off`

---

## 🔍 **Expected Real-World Results**

### **Light Sensor Values:**
| Condition | Expected Lux Range | Description |
|-----------|-------------------|-------------|
| **Direct Sunlight** | 8000-10000+ lux | Bright outdoor conditions |
| **Indoor Bright** | 3000-6000 lux | Well-lit room |
| **Indoor Normal** | 1000-3000 lux | Typical room lighting |
| **Indoor Dim** | 200-1000 lux | Low lighting |
| **Covered/Dark** | 0-200 lux | Hand covering sensors |

### **Data Flow Verification:**
```
Arduino → Pi → WebSocket → Mobile App → Dashboard Display
[Sensors] → [Server] → [Real-time] → [Visual Graph]
```

---

## 🐛 **Troubleshooting**

### **Problem: App Shows "Disconnected"**
**Solution:**
```bash
# On Pi, check if server is running
ps aux | grep python
# Restart server if needed
./start_pergola.sh
```

### **Problem: No Light Sensor Data**
**Check:**
- Arduino USB connection: `lsusb` on Pi
- Breadboard wiring: LDR → 1.5kΩ → Ground
- Arduino code uploaded correctly

### **Problem: Light Values Stuck at 0**
**Fix:**
- Check if LDR sensors are connected properly
- Verify voltage divider circuit
- Upload fresh Arduino code

### **Problem: Connection Errors**
**Solutions:**
1. **Verify IP address:** `hostname -I` on Pi
2. **Check firewall:** Pi should allow port 8080
3. **Restart network:** `sudo systemctl restart networking`

---

## 📊 **Success Criteria**

Your system is working correctly if:

✅ **Light Sensors:** Real-time readings change when you cover/uncover sensors  
✅ **Connection:** App shows "Connected" with green indicator  
✅ **Data Flow:** Dashboard updates every 2 seconds with live data  
✅ **Mode Control:** Pi receives commands when you tap mode buttons  
✅ **Manual Control:** Joystick sends angle commands to Arduino  
✅ **Stability:** No disconnections during 5+ minutes of testing  

---

## 🎯 **Next Steps After Testing**

### **If Everything Works:**
1. **🎉 Celebrate!** Your complete IoT system is functional
2. **Document current lux values** in your environment for calibration
3. **Plan actuator integration** for actual pergola movement
4. **Consider weatherproofing** for outdoor deployment

### **If Issues Found:**
1. **Check each component individually** (Pi → Arduino → Sensors)
2. **Verify all connections** with multimeter if available
3. **Test with simplified Arduino code** first
4. **Contact for debugging support** with specific error messages

---

**🚀 Start testing and let me know your results!** 

**Report format:**
- ✅/❌ Hardware communication
- ✅/❌ App connection  
- ✅/❌ Light sensor readings
- ✅/❌ Real-time updates
- ✅/❌ Mode control

**Your pergola control system should now be fully operational with real hardware!** 🎯

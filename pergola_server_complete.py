#!/usr/bin/env python3
import asyncio
import websockets
import json
import serial
import time
import threading
import math
from datetime import datetime
from astral import LocationInfo
from astral.sun import sun

class PergolaServer:
    def __init__(self):
        self.arduino = None
        self.clients = set()
        self.current_mode = "auto"  # auto, manual, off
        
        # Servo positions (0-180 degrees, 90 = flat)
        self.servo_positions = [90, 90, 90, 90]  # [front, right, back, left]
        
        # Manual control angles (-40 to +40 degrees)
        self.horizontal_angle = 0.0
        self.vertical_angle = 0.0
        
        # LDR readings (4 sensors)
        self.ldr_readings = [0, 0, 0, 0]
        self.light_sensor_lux = 0
        
        # Night mode and auto-tracking
        self.night_mode_active = False
        self.night_threshold = 300  # Lux threshold for night mode
        self.previous_mode = "auto"  # Store mode before night mode
        self.previous_angles = [0.0, 0.0]  # Store manual angles before night mode
        
        # Location for sun tracking (Beirut, Lebanon)
        self.location = LocationInfo("Beirut", "Lebanon", "Asia/Beirut", 33.8938, 35.5018)
        
        # Sun tracking parameters
        self.ldr_threshold = 200  # Threshold for switching between LDR and astronomical tracking
        self.tracking_mode = "astronomical"  # "ldr" or "astronomical"
        
    def connect_arduino(self):
        """Connect to Arduino via serial"""
        try:
            ports = ['/dev/ttyACM0', '/dev/ttyACM1', '/dev/ttyUSB0', '/dev/ttyUSB1']
            
            for port in ports:
                try:
                    self.arduino = serial.Serial(port, 9600, timeout=1)
                    time.sleep(2)
                    print(f"✅ Connected to Arduino on {port}")
                    return True
                except:
                    continue
                    
            print("❌ Could not connect to Arduino")
            return False
        except Exception as e:
            print(f"❌ Arduino connection error: {e}")
            return False
    
    def read_sensors(self):
        """Read 4 LDR sensors from Arduino"""
        try:
            # Read all available data to ensure we get the latest
            while self.arduino and self.arduino.in_waiting:
                line = self.arduino.readline().decode('utf-8').strip()
                
                # Debug: print all received lines
                if line:
                    print(f"🔍 Arduino says: {line}")
                
                # Parse LDR data: "LDR:512,487,523,498"
                if line.startswith("LDR:"):
                    values = line[4:].split(',')
                    if len(values) == 4:
                        try:
                            new_readings = [int(v) for v in values]
                            # Only update if values actually changed
                            if new_readings != self.ldr_readings:
                                self.ldr_readings = new_readings
                                
                                # Calculate average lux
                                avg_reading = sum(self.ldr_readings) / 4
                                self.light_sensor_lux = int(avg_reading * 10)
                                
                                print(f"📊 LDRs: {self.ldr_readings} → {self.light_sensor_lux} lux")
                                
                                # Check for night mode activation/deactivation
                                self.check_night_mode()
                        except ValueError as e:
                            print(f"❌ Invalid LDR values: {values} - {e}")
                        
                # Parse servo positions: "SERVO_POS:90,45,135,90"
                elif line.startswith("SERVO_POS:"):
                    values = line[10:].split(',')
                    if len(values) == 4:
                        try:
                            new_positions = [int(v) for v in values]
                            if new_positions != self.servo_positions:
                                self.servo_positions = new_positions
                                print(f"🔧 Servos: {self.servo_positions}")
                        except ValueError as e:
                            print(f"❌ Invalid servo values: {values} - {e}")
                        
        except Exception as e:
            print(f"❌ Sensor reading error: {e}")
    
    def check_night_mode(self):
        """Check if night mode should be activated/deactivated"""
        # Night mode can activate regardless of current mode
        if self.light_sensor_lux < self.night_threshold and not self.night_mode_active:
            # Activate night mode
            print(f"🌙 Night mode activated (lux: {self.light_sensor_lux})")
            self.previous_mode = self.current_mode
            if self.current_mode == "manual":
                self.previous_angles = [self.horizontal_angle, self.vertical_angle]
            
            self.night_mode_active = True
            # Reset angles to 0 for dashboard display during night mode
            self.horizontal_angle = 0.0
            self.vertical_angle = 0.0
            self.send_to_arduino("SERVOS:90,90,90,90")  # Flatten panels
            
        elif self.light_sensor_lux >= self.night_threshold and self.night_mode_active:
            # Deactivate night mode
            print(f"☀️ Night mode deactivated (lux: {self.light_sensor_lux})")
            self.night_mode_active = False
            
            # Only restore previous mode behavior if not currently in off mode
            if self.current_mode != "off":
                if self.previous_mode == "manual":
                    self.horizontal_angle, self.vertical_angle = self.previous_angles
                    self.update_manual_control()
                elif self.previous_mode == "auto":
                    self.run_auto_tracking()
            # If currently in off mode, stay in off mode (panels remain flat)
    
    def send_to_arduino(self, command):
        """Send command to Arduino"""
        try:
            if self.arduino:
                self.arduino.write(f"{command}\n".encode())
                print(f"📤 Sent to Arduino: {command}")
        except Exception as e:
            print(f"❌ Arduino send error: {e}")
    
    def get_sun_position(self):
        """Get current sun position using astronomical calculations"""
        try:
            from astral.sun import elevation, azimuth
            import pytz
            
            # Get timezone-aware current time
            beirut_tz = pytz.timezone('Asia/Beirut')
            current_time = datetime.now(beirut_tz)
            
            # Calculate sun elevation and azimuth
            sun_elevation = elevation(self.location.observer, current_time)
            sun_azimuth = azimuth(self.location.observer, current_time)
            
            return sun_elevation, sun_azimuth
        except Exception as e:
            print(f"❌ Sun position calculation error: {e}")
            return None, None
    
    def calculate_ldr_sun_position(self):
        """Calculate sun position based on LDR readings"""
        try:
            # LDR layout: [front, right, back, left] = [A0, A1, A2, A3]
            ldr_front, ldr_right, ldr_back, ldr_left = self.ldr_readings
            
            # Calculate horizontal bias (left vs right)
            horizontal_bias = (ldr_right - ldr_left) / 1024.0  # -1 to 1
            
            # Calculate vertical bias (front vs back)
            vertical_bias = (ldr_front - ldr_back) / 1024.0  # -1 to 1
            
            return horizontal_bias * 40, vertical_bias * 40  # Convert to angles
        except Exception as e:
            print(f"❌ LDR sun position calculation error: {e}")
            return 0, 0
    
    def run_auto_tracking(self):
        """Run automatic sun tracking algorithm"""
        if self.night_mode_active or self.current_mode != "auto":
            return
        
        try:
            # Get sun position from both methods
            sun_elevation, sun_azimuth = self.get_sun_position()
            ldr_horizontal, ldr_vertical = self.calculate_ldr_sun_position()
            
            # Determine which method to use
            if sun_elevation is not None:
                # Convert astronomical coordinates to panel angles
                # Simplified conversion for maquette
                astro_horizontal = (sun_azimuth - 180) % 360
                if astro_horizontal > 180:
                    astro_horizontal -= 360
                astro_horizontal = max(-40, min(40, astro_horizontal / 4.5))  # Scale to ±40°
                
                astro_vertical = max(-40, min(40, sun_elevation - 45))  # Offset and scale
                
                # Check if LDR and astronomical readings are close
                h_diff = abs(ldr_horizontal - astro_horizontal)
                v_diff = abs(ldr_vertical - astro_vertical)
                
                if h_diff < 10 and v_diff < 10:  # Within threshold
                    # Use LDR readings
                    self.tracking_mode = "ldr"
                    target_h, target_v = ldr_horizontal, ldr_vertical
                    print(f"🔍 Using LDR tracking: H={target_h:.1f}°, V={target_v:.1f}°")
                else:
                    # Use astronomical calculations
                    self.tracking_mode = "astronomical"
                    target_h, target_v = astro_horizontal, astro_vertical
                    print(f"🌍 Using astronomical tracking: H={target_h:.1f}°, V={target_v:.1f}°")
            else:
                # Fallback to LDR only
                self.tracking_mode = "ldr"
                target_h, target_v = ldr_horizontal, ldr_vertical
                print(f"🔍 Using LDR fallback: H={target_h:.1f}°, V={target_v:.1f}°")
            
            # Convert angles to servo positions and send to Arduino
            self.horizontal_angle = target_h
            self.vertical_angle = target_v
            self.angles_to_servos(target_h, target_v)
            
        except Exception as e:
            print(f"❌ Auto tracking error: {e}")
    
    def angles_to_servos(self, horizontal, vertical):
        """Convert horizontal/vertical angles to servo positions"""
        try:
            # Panel center stays fixed, edges move to create tilt
            # horizontal: -40° (tilt left) to +40° (tilt right)
            # vertical: -40° (tilt back) to +40° (tilt front)
            
            # Base position (flat)
            base_pos = 90
            
            # Scale angles: 40° input angle = 90° servo movement from base
            # This gives full servo range utilization
            servo_scale = 90.0 / 40.0  # 2.25 degrees servo per degree input
            
            # Calculate servo positions for each side
            # Front servo controls front edge height
            servo_front = base_pos - (vertical * servo_scale)  # Front edge: lower for backward tilt, higher for forward tilt
            
            # Right servo controls right edge height  
            servo_right = base_pos + (horizontal * servo_scale)  # Right edge: higher for rightward tilt, lower for leftward tilt
            
            # Back servo controls back edge height
            servo_back = base_pos + (vertical * servo_scale)  # Back edge: higher for backward tilt, lower for forward tilt
            
            # Left servo controls left edge height
            servo_left = base_pos - (horizontal * servo_scale)  # Left edge: higher for leftward tilt, lower for rightward tilt
            
            # Constrain to servo limits
            servo_front = max(0, min(180, int(servo_front)))
            servo_right = max(0, min(180, int(servo_right)))
            servo_back = max(0, min(180, int(servo_back)))
            servo_left = max(0, min(180, int(servo_left)))
            
            # Send to Arduino
            command = f"SERVOS:{servo_front},{servo_right},{servo_back},{servo_left}"
            self.send_to_arduino(command)
            
            print(f"🎯 Angles H={horizontal:.1f}°, V={vertical:.1f}° → Servos: F{servo_front},R{servo_right},B{servo_back},L{servo_left}")
            
        except Exception as e:
            print(f"❌ Angle to servo conversion error: {e}")
    
    def update_manual_control(self):
        """Update servo positions based on manual control angles"""
        if self.current_mode == "manual" and not self.night_mode_active:
            self.angles_to_servos(self.horizontal_angle, self.vertical_angle)
    
    async def handle_client(self, websocket):
        """Handle WebSocket client connections"""
        self.clients.add(websocket)
        client_addr = getattr(websocket, 'remote_address', 'unknown')
        print(f"📱 Client connected from {client_addr}. Total clients: {len(self.clients)}")
        
        try:
            await self.send_status(websocket)
            
            async for message in websocket:
                await self.process_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            print(f"📱 Client {client_addr} disconnected normally")
        except Exception as e:
            print(f"❌ Client error: {e}")
        finally:
            self.clients.discard(websocket)
            print(f"📱 Client removed. Total clients: {len(self.clients)}")
    
    async def process_message(self, websocket, message):
        """Process incoming WebSocket messages"""
        try:
            data = json.loads(message)
            cmd = data.get('cmd')
            
            print(f"📨 Received command: {cmd} - {data}")
            
            if cmd == "MODE":
                mode = data.get('mode', 'auto')
                if mode != self.current_mode:
                    self.current_mode = mode
                    
                    if mode == "auto":
                        print("🤖 Switching to Automatic Tracker mode")
                        self.run_auto_tracking()
                    elif mode == "manual":
                        print("🕹️ Switching to Manual Control mode")
                        self.update_manual_control()
                    elif mode == "off":
                        print("⏹️ Switching to Off mode")
                        if self.night_mode_active:
                            print("🌙 Night mode remains active in Off mode")
                        # Reset angles to 0 for dashboard display
                        self.horizontal_angle = 0.0
                        self.vertical_angle = 0.0
                        self.send_to_arduino("SERVOS:90,90,90,90")  # Flatten panels
                    
                    await self.broadcast_status()
                
            elif cmd == "SET_ANGLES":
                if self.current_mode == "manual" and not self.night_mode_active:
                    self.horizontal_angle = max(-40, min(40, data.get('horiz', 0)))
                    self.vertical_angle = max(-40, min(40, data.get('vert', 0)))
                    self.update_manual_control()
                    await self.broadcast_status()
                
            elif cmd in ["GET_STATUS", "GET_STATE", "GET_MODE", "GET_DASHBOARD_DATA"]:
                await self.send_status(websocket)
                
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON received: {message}")
        except Exception as e:
            print(f"❌ Message processing error: {e}")
    
    async def send_status(self, websocket):
        """Send current status to a specific client"""
        # Use display angles (0,0 for off mode and night mode)
        display_horizontal = 0.0 if (self.current_mode == "off" or self.night_mode_active) else self.horizontal_angle
        display_vertical = 0.0 if (self.current_mode == "off" or self.night_mode_active) else self.vertical_angle
        
        status = {
            "status": "connected",
            "mode": self.current_mode,
            "data": {
                "horizontalAngle": display_horizontal,
                "verticalAngle": display_vertical,
                "lightSensorReading": self.light_sensor_lux,
                "servoPositions": self.servo_positions,
                "ldrReadings": self.ldr_readings,
                "trackingMode": self.tracking_mode
            },
            "night_mode": {"active": self.night_mode_active},
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            await websocket.send(json.dumps(status))
        except Exception as e:
            print(f"❌ Failed to send status: {e}")
    
    async def broadcast_status(self):
        """Broadcast status to all connected clients"""
        if self.clients:
            # Use display angles (0,0 for off mode and night mode)
            display_horizontal = 0.0 if (self.current_mode == "off" or self.night_mode_active) else self.horizontal_angle
            display_vertical = 0.0 if (self.current_mode == "off" or self.night_mode_active) else self.vertical_angle
            
            status = {
                "status": "connected",
                "mode": self.current_mode,
                "data": {
                    "horizontalAngle": display_horizontal,
                    "verticalAngle": display_vertical,
                    "lightSensorReading": self.light_sensor_lux,
                    "servoPositions": self.servo_positions,
                    "ldrReadings": self.ldr_readings,
                    "trackingMode": self.tracking_mode
                },
                "night_mode": {"active": self.night_mode_active},
                "timestamp": datetime.now().isoformat()
            }
            
            # Debug logging for night mode status
            if self.night_mode_active:
                print(f"📤 Broadcasting night mode active status in {self.current_mode} mode")
            
            message = json.dumps(status)
            disconnected = set()
            
            for client in self.clients.copy():
                try:
                    await client.send(message)
                except Exception as e:
                    disconnected.add(client)
            
            self.clients -= disconnected
    
    def sensor_monitor_thread(self):
        """Background thread to continuously read sensors"""
        while True:
            self.read_sensors()
            
            # Run auto tracking if in auto mode
            if self.current_mode == "auto" and not self.night_mode_active:
                self.run_auto_tracking()
            
            time.sleep(1)
    
    async def periodic_broadcast(self):
        """Periodically broadcast status to clients"""
        while True:
            if self.clients:
                await self.broadcast_status()
            await asyncio.sleep(2)
    
    async def start_server(self):
        """Start the WebSocket server"""
        print("🚀 Starting Advanced Pergola Control Server...")
        print(f"📍 Location: {self.location.name}, {self.location.region}")
        
        if self.connect_arduino():
            sensor_thread = threading.Thread(target=self.sensor_monitor_thread, daemon=True)
            sensor_thread.start()
            print("🔄 Sensor monitoring and auto-tracking started")
        
        asyncio.create_task(self.periodic_broadcast())
        print("📡 Periodic broadcast task started")
        
        print("🌐 WebSocket server starting on port 8080...")
        start_server = websockets.serve(self.handle_client, "0.0.0.0", 8080)
        
        await start_server
        print("✅ Advanced Pergola server is running!")
        print("📱 Ready for mobile app connections")
        print("🌞 Sun tracking algorithm active")
        
        await asyncio.Future()

if __name__ == "__main__":
    server = PergolaServer()
    try:
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

#!/usr/bin/env python3
import asyncio
import websockets
import json
import serial
import time
import threading
from datetime import datetime

class PergolaServer:
    def __init__(self):
        self.arduino = None
        self.clients = set()
        self.current_mode = "auto"
        self.horizontal_angle = 0.0
        self.vertical_angle = 0.0
        self.light_sensor_lux = 0
        self.night_mode_active = False
        
    def connect_arduino(self):
        """Connect to Arduino via serial"""
        try:
            # Try common Arduino serial ports
            ports = ['/dev/ttyACM0', '/dev/ttyACM1', '/dev/ttyUSB0', '/dev/ttyUSB1']
            
            for port in ports:
                try:
                    self.arduino = serial.Serial(port, 9600, timeout=1)
                    time.sleep(2)  # Give Arduino time to initialize
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
        """Read light sensors from Arduino"""
        try:
            if self.arduino and self.arduino.in_waiting:
                line = self.arduino.readline().decode('utf-8').strip()
                
                # Parse sensor data: "Sensor1: 512 | Sensor2: 487"
                if "Sensor1:" in line and "Sensor2:" in line:
                    parts = line.split("|")
                    sensor1 = int(parts[0].split(":")[1].strip())
                    sensor2 = int(parts[1].split(":")[1].strip())
                    
                    # Convert to lux (simplified conversion)
                    avg_sensor = (sensor1 + sensor2) / 2
                    self.light_sensor_lux = int(avg_sensor * 10)  # 0-10240 lux range (higher reading = more light)
                    
                    print(f"📊 Light sensors: {sensor1}, {sensor2} → {self.light_sensor_lux} lux")
                    
        except Exception as e:
            print(f"❌ Sensor reading error: {e}")
    
    def send_to_arduino(self, command):
        """Send command to Arduino"""
        try:
            if self.arduino:
                self.arduino.write(f"{command}\n".encode())
                print(f"📤 Sent to Arduino: {command}")
        except Exception as e:
            print(f"❌ Arduino send error: {e}")
    
    async def handle_client(self, websocket):
        """Handle WebSocket client connections - Compatible with newer websockets library"""
        self.clients.add(websocket)
        client_addr = getattr(websocket, 'remote_address', 'unknown')
        print(f"📱 Client connected from {client_addr}. Total clients: {len(self.clients)}")
        
        try:
            # Send initial state immediately
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
                self.current_mode = mode
                self.send_to_arduino(f"MODE:{mode}")
                await self.broadcast_status()
                
            elif cmd == "SET_ANGLES":
                self.horizontal_angle = data.get('horiz', 0)
                self.vertical_angle = data.get('vert', 0)
                arduino_cmd = f"ANGLES:{self.horizontal_angle},{self.vertical_angle}"
                self.send_to_arduino(arduino_cmd)
                await self.broadcast_status()
                
            elif cmd == "GET_STATUS" or cmd == "GET_STATE" or cmd == "GET_MODE" or cmd == "GET_DASHBOARD_DATA":
                # Send current status for any GET command
                await self.send_status(websocket)
                
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON received: {message}")
        except Exception as e:
            print(f"❌ Message processing error: {e}")
    
    async def send_status(self, websocket):
        """Send current status to a specific client"""
        status = {
            "status": "connected",
            "mode": self.current_mode,
            "data": {
                "horizontalAngle": self.horizontal_angle,
                "verticalAngle": self.vertical_angle,
                "lightSensorReading": self.light_sensor_lux
            },
            "night_mode": {"active": self.night_mode_active},
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            await websocket.send(json.dumps(status))
            print(f"📤 Sent status to client: mode={self.current_mode}, lux={self.light_sensor_lux}")
        except Exception as e:
            print(f"❌ Failed to send status: {e}")
    
    async def broadcast_status(self):
        """Broadcast status to all connected clients"""
        if self.clients:
            status = {
                "status": "connected",
                "mode": self.current_mode,
                "data": {
                    "horizontalAngle": self.horizontal_angle,
                    "verticalAngle": self.vertical_angle,
                    "lightSensorReading": self.light_sensor_lux
                },
                "night_mode": {"active": self.night_mode_active},
                "timestamp": datetime.now().isoformat()
            }
            
            message = json.dumps(status)
            disconnected = set()
            
            for client in self.clients.copy():
                try:
                    await client.send(message)
                except Exception as e:
                    print(f"❌ Failed to send to client: {e}")
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.clients -= disconnected
            if disconnected:
                print(f"🧹 Removed {len(disconnected)} disconnected clients")
    
    def sensor_monitor_thread(self):
        """Background thread to continuously read sensors"""
        while True:
            self.read_sensors()
            time.sleep(1)  # Read sensors every second
    
    async def periodic_broadcast(self):
        """Periodically broadcast status to clients"""
        while True:
            if self.clients:
                await self.broadcast_status()
            await asyncio.sleep(2)  # Broadcast every 2 seconds
    
    async def start_server(self):
        """Start the WebSocket server"""
        print("🚀 Starting Pergola Control Server...")
        
        # Connect to Arduino
        if self.connect_arduino():
            # Start sensor monitoring thread
            sensor_thread = threading.Thread(target=self.sensor_monitor_thread, daemon=True)
            sensor_thread.start()
            print("🔄 Sensor monitoring thread started")
        
        # Start periodic broadcast task
        asyncio.create_task(self.periodic_broadcast())
        print("📡 Periodic broadcast task started")
        
        # Start WebSocket server with proper handler
        print("🌐 WebSocket server starting on port 8080...")
        start_server = websockets.serve(
            self.handle_client,  # Only pass the handler function, no path parameter
            "0.0.0.0", 
            8080
        )
        
        await start_server
        print("✅ Pergola server is running!")
        print("📱 Ready for mobile app connections")
        print("💡 Light sensor data should appear above")
        
        # Keep server running
        await asyncio.Future()

if __name__ == "__main__":
    server = PergolaServer()
    try:
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

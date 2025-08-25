#!/usr/bin/env python3
"""
Pergola Control WebSocket Server for Raspberry Pi
Handles communication between mobile app and Arduino via Modbus-RTU
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, Optional

import websockets
from pymodbus.client.sync import ModbusSerialClient as ModbusClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PergolaController:
    def __init__(self, serial_port='/dev/ttyUSB0', baudrate=9600):
        self.serial_port = serial_port
        self.baudrate = baudrate
        self.modbus_client = None
        self.current_mode = 'off'
        self.current_state = {
            'horizontal_angle': 0.0,
            'vertical_angle': 0.0,
            'light_sensor': 0.0,
            'night_mode': False,
            'timestamp': datetime.now().isoformat()
        }
        self.connected_clients = set()
        
    async def initialize_modbus(self):
        """Initialize Modbus-RTU connection to Arduino"""
        try:
            self.modbus_client = ModbusClient(
                method='rtu',
                port=self.serial_port,
                baudrate=self.baudrate,
                timeout=1,
                parity='N',
                stopbits=1,
                bytesize=8
            )
            
            if self.modbus_client.connect():
                logger.info(f"Modbus connected on {self.serial_port}")
                return True
            else:
                logger.error("Failed to connect to Modbus")
                return False
        except Exception as e:
            logger.error(f"Modbus initialization error: {e}")
            return False
    
    def read_sensors(self) -> Dict:
        """Read sensor data from Arduino via Modbus"""
        if not self.modbus_client or not self.modbus_client.is_socket_open():
            return self.current_state
        
        try:
            # Read holding registers (adjust addresses based on your Arduino code)
            # Register 0: Horizontal angle (scaled by 100)
            # Register 1: Vertical angle (scaled by 100)  
            # Register 2: Light sensor reading
            result = self.modbus_client.read_holding_registers(0, 3, unit=1)
            
            if result.isError():
                logger.error("Modbus read error")
                return self.current_state
            
            # Update current state
            self.current_state.update({
                'horizontal_angle': result.registers[0] / 100.0,
                'vertical_angle': result.registers[1] / 100.0,
                'light_sensor': result.registers[2],
                'night_mode': result.registers[2] < 50,  # Night if light < 50
                'timestamp': datetime.now().isoformat()
            })
            
            return self.current_state
            
        except Exception as e:
            logger.error(f"Sensor read error: {e}")
            return self.current_state
    
    def write_actuator_commands(self, horizontal: float, vertical: float) -> bool:
        """Send actuator commands to Arduino via Modbus"""
        if not self.modbus_client or not self.modbus_client.is_socket_open():
            logger.error("Modbus not connected")
            return False
        
        try:
            # Convert to integer values (scaled by 100)
            h_scaled = int(horizontal * 100)
            v_scaled = int(vertical * 100)
            
            # Write to holding registers (adjust addresses based on your Arduino code)
            # Register 10: Horizontal command
            # Register 11: Vertical command
            result1 = self.modbus_client.write_register(10, h_scaled, unit=1)
            result2 = self.modbus_client.write_register(11, v_scaled, unit=1)
            
            if result1.isError() or result2.isError():
                logger.error("Modbus write error")
                return False
            
            logger.info(f"Commands sent: H={horizontal}°, V={vertical}°")
            return True
            
        except Exception as e:
            logger.error(f"Actuator command error: {e}")
            return False
    
    def set_mode(self, mode: str) -> bool:
        """Set pergola control mode"""
        if mode not in ['auto', 'manual', 'off']:
            logger.error(f"Invalid mode: {mode}")
            return False
        
        self.current_mode = mode
        logger.info(f"Mode changed to: {mode}")
        
        # Send mode to Arduino via Modbus
        mode_map = {'off': 0, 'manual': 1, 'auto': 2}
        if self.modbus_client and self.modbus_client.is_socket_open():
            try:
                result = self.modbus_client.write_register(20, mode_map[mode], unit=1)
                if result.isError():
                    logger.error("Failed to write mode to Arduino")
                    return False
            except Exception as e:
                logger.error(f"Mode write error: {e}")
                return False
        
        return True
    
    async def auto_tracking_loop(self):
        """Automatic sun tracking algorithm"""
        while self.current_mode == 'auto':
            try:
                # Read current sensor data
                state = self.read_sensors()
                light_reading = state['light_sensor']
                
                # Simple sun tracking algorithm (replace with your logic)
                current_hour = datetime.now().hour
                
                if 6 <= current_hour <= 18 and light_reading > 50:  # Daytime
                    # Calculate sun position (simplified)
                    # In real implementation, use solar position algorithms
                    hour_angle = (current_hour - 12) * 15  # 15° per hour
                    elevation = 45 + 20 * abs(hour_angle) / 90  # Simplified elevation
                    
                    # Set actuator positions
                    horizontal = max(-40, min(40, hour_angle / 3))  # Scale to -40/+40 range
                    vertical = max(-40, min(40, elevation / 3))  # Scale to -40/+40 range
                    
                    self.write_actuator_commands(horizontal, vertical)
                else:  # Night mode - flat horizontal position
                    self.write_actuator_commands(0, 0)
                
                # Broadcast state to connected clients
                await self.broadcast_state()
                
                # Wait before next update
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Auto tracking error: {e}")
                await asyncio.sleep(5)
    
    async def broadcast_state(self):
        """Broadcast current state to all connected WebSocket clients"""
        if not self.connected_clients:
            return
        
        state_message = {
            'type': 'STATE_UPDATE',
            'mode': self.current_mode,
            **self.current_state
        }
        
        message = json.dumps(state_message)
        disconnected = []
        
        for client in self.connected_clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.append(client)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                disconnected.append(client)
        
        # Remove disconnected clients
        for client in disconnected:
            self.connected_clients.discard(client)
    
    async def handle_websocket_message(self, websocket, message_str: str):
        """Handle incoming WebSocket messages from mobile app"""
        try:
            message = json.loads(message_str)
            cmd = message.get('cmd')
            
            if cmd == 'MODE':
                mode = message.get('mode')
                success = self.set_mode(mode)
                
                # Start/stop auto tracking
                if mode == 'auto' and success:
                    asyncio.create_task(self.auto_tracking_loop())
                
                response = {
                    'type': 'MODE_RESPONSE',
                    'success': success,
                    'mode': self.current_mode
                }
                
            elif cmd == 'SET_ANGLES' and self.current_mode == 'manual':
                horizontal = message.get('horiz', 0)
                vertical = message.get('vert', 0)
                
                success = self.write_actuator_commands(horizontal, vertical)
                response = {
                    'type': 'COMMAND_RESPONSE',
                    'success': success,
                    'horizontal': horizontal,
                    'vertical': vertical
                }
                
            elif cmd == 'SET_STATE':
                horizontal = message.get('horiz', 0)
                vertical = message.get('vert', 0)
                
                success = self.write_actuator_commands(horizontal, vertical)
                response = {
                    'type': 'STATE_RESPONSE',
                    'success': success
                }
                
            elif cmd == 'GET_STATE':
                state = self.read_sensors()
                response = {
                    'type': 'STATE_UPDATE',
                    'mode': self.current_mode,
                    **state
                }
                
            else:
                response = {
                    'type': 'ERROR',
                    'message': f'Unknown command: {cmd}'
                }
            
            await websocket.send(json.dumps(response))
            
        except json.JSONDecodeError:
            error_response = {
                'type': 'ERROR',
                'message': 'Invalid JSON message'
            }
            await websocket.send(json.dumps(error_response))
        except Exception as e:
            logger.error(f"Message handling error: {e}")
            error_response = {
                'type': 'ERROR',
                'message': str(e)
            }
            await websocket.send(json.dumps(error_response))

    async def websocket_handler(self, websocket, path):
        """Handle new WebSocket connections"""
        client_ip = websocket.remote_address[0]
        logger.info(f"New client connected: {client_ip}")
        
        self.connected_clients.add(websocket)
        
        try:
            # Send initial state
            initial_state = {
                'type': 'CONNECTED',
                'mode': self.current_mode,
                **self.read_sensors()
            }
            await websocket.send(json.dumps(initial_state))
            
            # Handle incoming messages
            async for message in websocket:
                await self.handle_websocket_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {client_ip}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            self.connected_clients.discard(websocket)

async def main():
    """Main server function"""
    controller = PergolaController()
    
    # Initialize Modbus connection
    if not await controller.initialize_modbus():
        logger.warning("Starting without Modbus connection (demo mode)")
    
    # Start WebSocket server
    server_ip = "0.0.0.0"  # Listen on all interfaces
    server_port = 8080
    
    logger.info(f"Starting WebSocket server on {server_ip}:{server_port}")
    
    server = await websockets.serve(
        controller.websocket_handler,
        server_ip,
        server_port
    )
    
    # Start periodic state broadcasting
    async def periodic_broadcast():
        while True:
            await controller.broadcast_state()
            await asyncio.sleep(1)  # Broadcast every second
    
    asyncio.create_task(periodic_broadcast())
    
    # Keep server running
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")

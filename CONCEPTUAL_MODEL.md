# 🌞 Pergola Control System - Conceptual Model

## 1. 🏗️ Architectural Conceptual Model

The system employs a **distributed multi-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                            │
│  ┌─────────────────┐                     ┌─────────────────┐   │
│  │   Mobile App    │                     │  Dashboard UI   │   │
│  │  (React Native) │                     │   (Real-time)   │   │
│  └─────────────────┘                     └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket/HTTP
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Raspberry Pi Server                           │ │
│  │  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐  │ │
│  │  │ Sun Tracking  │ │ User Command │ │ Safety Control  │  │ │
│  │  │ Algorithm     │ │ Processing   │ │ System          │  │ │
│  │  └───────────────┘ └──────────────┘ └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ Serial/USB
┌─────────────────────────────────────────────────────────────────┐
│                    HARDWARE CONTROL TIER                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Arduino Controller                            │ │
│  │  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐  │ │
│  │  │ Servo Control │ │ Sensor Data  │ │ Safety Limits   │  │ │
│  │  │ Interpolation │ │ Acquisition  │ │ Enforcement     │  │ │
│  │  └───────────────┘ └──────────────┘ └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ PWM/Analog
┌─────────────────────────────────────────────────────────────────┐
│                    PHYSICAL TIER                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Servo Motors    │ │ LDR Sensors     │ │ Pergola         │   │
│  │ (4x Corners)    │ │ (4x Quadrants)  │ │ Structure       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Information Flow Model

**Upward Information Flow** (Sensing → Decision Making):
```
Physical Environment → Sensors → Arduino → Raspberry Pi → Mobile App
```

**Downward Control Flow** (Decision Making → Actuation):
```
Mobile App → Raspberry Pi → Arduino → Servo Motors → Physical Movement
```

---

## 3. 🔗 Communication and Interaction Model

### Network Communication Architecture

**Protocol Stack**:
```
Application Layer    │ JSON Message Format
Transport Layer      │ WebSocket (TCP-based)
Network Layer        │ IPv4 (Local Network)
Data Link Layer      │ WiFi (IEEE 802.11)
Physical Layer       │ 2.4GHz Radio
```

**Message Flow Patterns**:

**Command Pattern** (Mobile → Pi):
```json
{
  "cmd": "SET_ANGLES",
  "horiz": -25.5,
  "vert": 15.0,
  "timestamp": "2025-08-27T14:30:45Z"
}
```

**Status Broadcast Pattern** (Pi → Mobile):
```json
{
  "mode": "auto",
  "horizontal_angle": -12.5,
  "vertical_angle": 8.2,
  "light_sensor_lux": 456,
  "night_mode": false,
  "timestamp": "2025-08-27T14:30:45Z"
}
```

---

Extensible architecture supporting future enhancements
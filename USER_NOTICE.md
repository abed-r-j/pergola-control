# 🌞 Pergola Control System - User Notice

## ⚠️ IMPORTANT SAFETY NOTICE

**READ THIS DOCUMENT CAREFULLY BEFORE INSTALLING, CONFIGURING, OR USING THE PERGOLA CONTROL SYSTEM**

---

## 🚨 Safety Warnings

### **ELECTRICAL SAFETY**
- ⚠️ **High Voltage Warning**: Ensure all electrical connections are made by qualified personnel
- ⚠️ **Power Supply**: Use only recommended power supplies for actuators and electronics
- ⚠️ **Weather Protection**: All electronic components should be properly weatherproofed for outdoor use
- ⚠️ **Grounding**: Ensure proper electrical grounding of all metal components

### **MECHANICAL SAFETY**
- ⚠️ **Moving Parts**: Keep hands, clothing, and objects away from moving actuators and mechanical assemblies
- ⚠️ **Weight Limits**: Do not exceed the recommended load capacity of the pergola structure
- ⚠️ **Wind Conditions**: System should be disabled during high wind conditions (>25 mph / 40 km/h)
- ⚠️ **Regular Inspection**: Inspect all mechanical connections, bolts, and supports regularly

---

## 📋 System Requirements & Limitations

### **Hardware Requirements**
- **Raspberry Pi 4/5** with minimum 2GB RAM
- **Arduino Mega 2560** or compatible
- **4x Actuators** rated for outdoor use (minimum 2940N.m torque recommended)
- **4x LDR Sensors** with weather protection
- **WiFi Router** with reliable coverage in pergola area
- **Power Supply** capable of handling actuator load

### **Environmental Limitations**
- **Operating Temperature**: -10°C to +60°C (14°F to 140°F)
- **Humidity**: Maximum 85% relative humidity

### **Current System Limitations**
- ⚠️ **Development Dependency**: Current version requires a development computer to run the mobile app
- ⚠️ **Network Range**: Limited to WiFi network coverage area (typically 10-50 meters)
- ⚠️ **Single System**: Designed for one pergola unit per Raspberry Pi

---

## 🔧 Installation Requirements

### **Technical Expertise Required**
- **Electrical**: Basic electrical wiring knowledge required
- **Mechanical**: Ability to mount and align actuators precisely
- **Network**: Understanding of WiFi configuration and IP addresses
- **Software**: Basic command line operation for Raspberry Pi setup

### **Tools Needed**
- Screwdrivers, wrenches, and basic hand tools
- Multimeter for electrical testing
- Level for mechanical alignment
- Computer for initial software setup

### **Pre-Installation Checklist**
- [ ] Pergola structure is mechanically sound and properly anchored
- [ ] WiFi coverage is adequate in pergola area

---

## 📱 Mobile Application Notice

### **Device Compatibility**
- **Android**: Version 8.0 (API level 26) or higher
- **iOS**: Version 12.0 or higher
- **Network**: Must be connected to same WiFi network as Raspberry Pi

### **Current Development Status**
- ⚠️ **Beta Software**: This is development-stage software, not production-ready
- ⚠️ **Computer Required**: Mobile app currently requires development computer to run

### **Data Collection Notice**
- **User Authentication**: Email addresses are stored securely via Supabase
- **System Data**: Pergola positions and sensor readings are logged locally
- **No Personal Data**: System does not collect personal information beyond email
- **Local Processing**: All control data is processed locally on your network

---

## 🛠️ Support & Maintenance

### **User Responsibilities**
- **Regular Inspection**: Monthly visual inspection of all components
- **Cleaning**: Keep LDR sensors clean for optimal performance
- **Software Updates**: Apply security updates to Raspberry Pi OS regularly

### **Maintenance Schedule**
**Daily:**
- Monitor system operation for unusual behavior
- Check mobile app connectivity

**Weekly:**
- Inspect mechanical connections for looseness
- Clean LDR sensors if necessary

**Monthly:**
- Check servo motor operation and alignment
- Inspect electrical connections
- Update system software

**Seasonally:**
- Deep clean all components
- Check weather protection integrity
- Lubricate mechanical parts if needed

### **Troubleshooting Resources**
- **Documentation**: Refer to TECHNICAL_DOCUMENTATION.md for detailed information
- **Community Support**: Check project repository for community discussions
- **Self-Service**: Most issues can be resolved through system restart

---

## 📞 Contact & Support

### **Technical Support**
- **Self-Service**: Consult TECHNICAL_DOCUMENTATION.md first
- **Community Forum**: Check project repository discussions
- **Issue Reporting**: Use GitHub issues for bug reports and feature requests

### **Emergency Contact**
- **Safety Issues**: Contact local emergency services for immediate safety concerns

### **Project Information**
- **Repository**: [https://github.com/abed-r-j/pergola-control.git]

---

**Document Version**: 1.0  
**Last Updated**: August 25, 2025  

---

*This notice is provided to ensure safe and proper use of the Pergola Control System.*
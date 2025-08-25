#include <Servo.h>

// Servo objects
Servo servoFront, servoRight, servoBack, servoLeft;

// Servo pins (PWM capable)
const int SERVO_PINS[] = {6, 9, 10, 11}; // Front, Right, Back, Left

// Current servo positions (90 = flat)
int servoPositions[] = {90, 90, 90, 90}; // Front, Right, Back, Left

// Target servo positions for smooth movement
int targetPositions[] = {90, 90, 90, 90}; // Front, Right, Back, Left

// Servo movement speed (degrees per step)
const int SERVO_SPEED = 8; // Balanced speed for smooth movement

// Last movement time for smooth servo control
unsigned long lastServoUpdate = 0;
const int SERVO_UPDATE_INTERVAL = 0; // Update servos every loop for maximum responsiveness

void setup() {
  Serial.begin(9600);
  
  // Attach servos to PWM pins
  servoFront.attach(6);   // Pin 6
  servoRight.attach(9);   // Pin 9
  servoBack.attach(10);   // Pin 10
  servoLeft.attach(11);   // Pin 11
  
  // Initialize to flat position (90 degrees)
  servoFront.write(90);
  servoRight.write(90);
  servoBack.write(90);
  servoLeft.write(90);
  
  // Store initial positions
  servoPositions[0] = 90;
  servoPositions[1] = 90;
  servoPositions[2] = 90;
  servoPositions[3] = 90;
  
  // Initialize target positions
  targetPositions[0] = 90;
  targetPositions[1] = 90;
  targetPositions[2] = 90;
  targetPositions[3] = 90;
  
  delay(1000); // Give servos time to move to initial position
  
  Serial.println("Pergola Maquette Ready - 4 LDRs + 4 Servos (Front/Right/Back/Left)");
  Serial.println("SERVO_POS:90,90,90,90"); // Confirm initial positions
}

void loop() {
  // Update servos smoothly
  updateServosSmooth();
  
  // Read all 4 LDR sensors every loop
  int ldrFront = analogRead(A0);  // Front LDR
  int ldrRight = analogRead(A1);  // Right LDR
  int ldrBack = analogRead(A2);   // Back LDR
  int ldrLeft = analogRead(A3);   // Left LDR
  
  // Always send sensor data (Pi will filter duplicates)
  Serial.print("LDR:");
  Serial.print(ldrFront); Serial.print(",");
  Serial.print(ldrRight); Serial.print(",");
  Serial.print(ldrBack); Serial.print(",");
  Serial.println(ldrLeft);
  
  // Process any incoming commands
  while (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.length() > 0) {
      processCommand(command);
    }
  }
  
  delay(500); // Send data every 500ms for more reliable communication
}

void processCommand(String cmd) {
  if (cmd.startsWith("SERVOS:")) {
    // Format: SERVOS:90,45,135,90 (Front,Right,Back,Left)
    parseServoCommand(cmd.substring(7));
  } else if (cmd.startsWith("MODE:")) {
    String mode = cmd.substring(5);
    if (mode == "off") {
      setAllServos(90, 90, 90, 90); // Flat position
    }
  }
}

void parseServoCommand(String angles) {
  int positions[4];
  int idx = 0;
  int lastComma = -1;
  
  for (int i = 0; i <= angles.length(); i++) {
    if (i == angles.length() || angles.charAt(i) == ',') {
      if (idx < 4) {
        positions[idx] = angles.substring(lastComma + 1, i).toInt();
        idx++;
      }
      lastComma = i;
    }
  }
  
  if (idx == 4) {
    setAllServos(positions[0], positions[1], positions[2], positions[3]);
  }
}

void setAllServos(int front, int right, int back, int left) {
  // Constrain to valid servo range
  front = constrain(front, 0, 180);
  right = constrain(right, 0, 180);
  back = constrain(back, 0, 180);
  left = constrain(left, 0, 180);
  
  // Set target positions for smooth movement
  targetPositions[0] = front;
  targetPositions[1] = right;
  targetPositions[2] = back;
  targetPositions[3] = left;
  
  // Always confirm target positions
  Serial.print("SERVO_TARGET:");
  Serial.print(targetPositions[0]); Serial.print(",");
  Serial.print(targetPositions[1]); Serial.print(",");
  Serial.print(targetPositions[2]); Serial.print(",");
  Serial.println(targetPositions[3]);
}

void updateServosSmooth() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastServoUpdate >= SERVO_UPDATE_INTERVAL) {
    lastServoUpdate = currentTime;
    
    bool anyMovement = false;
    
    // Update each servo gradually towards target
    for (int i = 0; i < 4; i++) {
      if (servoPositions[i] != targetPositions[i]) {
        anyMovement = true;
        
        // Move towards target at controlled speed
        if (servoPositions[i] < targetPositions[i]) {
          servoPositions[i] = min(servoPositions[i] + SERVO_SPEED, targetPositions[i]);
        } else {
          servoPositions[i] = max(servoPositions[i] - SERVO_SPEED, targetPositions[i]);
        }
      }
    }
    
    // Update physical servo positions if any movement occurred
    if (anyMovement) {
      servoFront.write(servoPositions[0]);
      servoRight.write(servoPositions[1]);
      servoBack.write(servoPositions[2]);
      servoLeft.write(servoPositions[3]);
      
      // Send current positions
      Serial.print("SERVO_POS:");
      Serial.print(servoPositions[0]); Serial.print(",");
      Serial.print(servoPositions[1]); Serial.print(",");
      Serial.print(servoPositions[2]); Serial.print(",");
      Serial.println(servoPositions[3]);
    }
  }
}

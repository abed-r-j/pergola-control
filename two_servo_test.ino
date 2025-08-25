#include <Servo.h>

Servo servo1, servo2;

void setup() {
  Serial.begin(9600);
  Serial.println("Two Servo Test Starting...");
  
  // Test only 2 servos to reduce power consumption
  servo1.attach(6);   // Pin 6
  servo2.attach(9);   // Pin 9
  
  servo1.write(90);
  servo2.write(90);
  delay(1000);
  
  Serial.println("Both servos at 90 degrees");
}

void loop() {
  // Test coordinated movement
  servo1.write(45);
  servo2.write(135);
  Serial.println("Servos: 45, 135");
  delay(2000);
  
  servo1.write(135);
  servo2.write(45);
  Serial.println("Servos: 135, 45");
  delay(2000);
  
  servo1.write(90);
  servo2.write(90);
  Serial.println("Servos: 90, 90");
  delay(2000);
}

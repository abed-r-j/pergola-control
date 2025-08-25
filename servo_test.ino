#include <Servo.h>

Servo testServo;

void setup() {
  Serial.begin(9600);
  Serial.println("Servo Test Starting...");
  
  // Test each servo pin one by one
  testServo.attach(6);  // Start with pin 6
  testServo.write(90);  // Center position
  delay(1000);
  
  Serial.println("Testing Pin 6 - Should be at 90 degrees");
  delay(2000);
  
  // Test movement
  testServo.write(0);   // Min position
  Serial.println("Moving to 0 degrees");
  delay(2000);
  
  testServo.write(180); // Max position
  Serial.println("Moving to 180 degrees");
  delay(2000);
  
  testServo.write(90);  // Back to center
  Serial.println("Back to 90 degrees");
  delay(2000);
  
  Serial.println("Test complete. Change pin number and retest if needed.");
}

void loop() {
  // Test continuous movement
  for(int pos = 0; pos <= 180; pos += 10) {
    testServo.write(pos);
    Serial.print("Position: ");
    Serial.println(pos);
    delay(500);
  }
  
  for(int pos = 180; pos >= 0; pos -= 10) {
    testServo.write(pos);
    Serial.print("Position: ");
    Serial.println(pos);
    delay(500);
  }
}

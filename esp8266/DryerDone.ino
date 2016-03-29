#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define RED_LED 15
#define GREEN_LED 12
#define BLUE_LED 13

//-------- Customise these values -----------
String SERVER_URI = "http://your-server.com";
String DEVICE_ID = "ABC123";
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PWD = "your-wifi-password";
const unsigned long STATUS_UPDATE_INTERVAL_MS = 20 * 1000;
const unsigned long NOTIFY_UPDATE_INTERVAL_MS = 20 * 1000;

String urlNotify = SERVER_URI + "/api/device/" + DEVICE_ID + "/notify";
String urlDevice = SERVER_URI + "/api/device/" + DEVICE_ID + "/status";

int LED_PIN = 05;
int VIBE_SENSOR_PIN = 14;
int TIMEOUT = 750000;
int MAX_TIMEOUT_COUNT = 20;  // 20 iterations at .75sec timeout = 15 seconds of idle timeout
int timeoutCount = 0;

boolean initialVibrationSensed = false;
unsigned long lastUpdateTime = 0;

void postJSON(String url, String payload) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  Serial.print("POST URL: "); Serial.println(url);
  Serial.print("POST payload: "); Serial.println(payload);
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    // HTTP header has been send and Server response header has been handled
    Serial.printf("[HTTP] POST... code: %d\n", httpCode);
    // Got response from server
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println(payload);
    }
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void sendVibeStatus(boolean status) {
  String enabled = status ? "true" : "false";
  String payload = "{ \"vibeStatus\":" + enabled + "}";
  postJSON(urlDevice, payload);
}

void sendNotifyStatus(boolean status) {
  String enabled = status ? "true" : "false";
  String payload = "{ \"vibeStatus\":" + enabled + "}";
  postJSON(urlNotify, payload);
}

void setupWifi() {
  Serial.begin(115200); Serial.println(); Serial.println(); Serial.println();

  for (uint8_t t = 4; t > 0; t--) {
    Serial.printf("[SETUP] WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  Serial.print("Dryer-Done URL: "); Serial.println(urlDevice);

  Serial.print("Connecting to: "); Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PWD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.print("nWiFi connected, IP address: "); Serial.println(WiFi.localIP());
}

void allLedOff() {
  // the sm leds
  digitalWrite(0, HIGH);
  digitalWrite(2, HIGH);
  digitalWrite(4, HIGH);
  digitalWrite(5, HIGH);
  digitalWrite(14, HIGH);
  digitalWrite(16, HIGH);
}

long readVibeSensor() {
  delay(50);
  long measurement = pulseIn (VIBE_SENSOR_PIN, LOW, TIMEOUT); //wait for the pin to go LOW and return the number of microseconds it stays low
  return measurement;
}

void updateVibeLed(boolean enabled) {
  if (enabled) {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);
    digitalWrite(BLUE_LED, LOW);
  } else {
    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(BLUE_LED, LOW);
  }
}

void showWaitingForVibeLed() {
    digitalWrite(BLUE_LED, HIGH);
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, LOW);
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(VIBE_SENSOR_PIN, INPUT); //set EP input for measurment

  // RGB LED
  pinMode(GREEN_LED, OUTPUT); //green
  pinMode(BLUE_LED, OUTPUT); //blue
  pinMode(RED_LED, OUTPUT); //red

  allLedOff();
  setupWifi();

  // Initially assume the device is not vibrating
  sendVibeStatus(false);
  showWaitingForVibeLed();

  Serial.println("--- Dryer Done Initialized ---");
}

void loop() {
  long measurement = readVibeSensor();
  delay(50);
  Serial.print("measurement = ");  Serial.println(measurement);

  if (measurement < TIMEOUT) {
    // A vibration was detected
    timeoutCount = 0;
    initialVibrationSensed = true;
  }
  else {
    // A vibration timeout occurred - increment the timeout count
    timeoutCount++;
  }

  if (!initialVibrationSensed) {
    // If we have not yet sensed a vibration don't report any changes in status
    return;
  }

  unsigned long elapsed = millis() - lastUpdateTime;
  if ( elapsed > STATUS_UPDATE_INTERVAL_MS) {
    
    // Update the status every x seconds
    Serial.print("millis() - lastUpdateTime = "); Serial.println(elapsed);

    // If we haven't reached the max number of timeout assume the device is still vibrating
    boolean currentlyVibrating = timeoutCount <= MAX_TIMEOUT_COUNT;
    sendVibeStatus(currentlyVibrating);
    updateVibeLed(currentlyVibrating);
    lastUpdateTime = millis();
  }

  // If the max timeout count has been reached send a push notification that the vibration stopped
  if (timeoutCount > MAX_TIMEOUT_COUNT &&
      elapsed > NOTIFY_UPDATE_INTERVAL_MS) {
    sendNotifyStatus(false);
    lastUpdateTime = millis();
  }

}




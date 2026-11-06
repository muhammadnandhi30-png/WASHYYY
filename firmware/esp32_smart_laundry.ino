/**
 * ============================================================================
 * FIRMWARE TIMBANGAN DIGITAL IOT - SMART LAUNDRY (ESP32 + LOADCELL HX711)
 * ============================================================================
 * Deskripsi:
 * Program mikrokontroler ESP32 membaca data berat cucian dari modul Loadcell HX711,
 * menghitung rata-rata pembacaan (smoothing), mendeteksi stabilitas timbangan,
 * dan mengirim paket JSON secara berkala (300 ms) via protokol UDP socket
 * ke server backend Smart Laundry Node.js.
 *
 * Komponen & Pinout:
 * - ESP32 Development Board (NodeMCU ESP32 / ESP-WROOM-32)
 * - Modul HX711 Load Cell Amplifier:
 *     * VCC  -> 5V / 3.3V
 *     * GND  -> GND
 *     * DT   -> GPIO 21 (Data Pin)
 *     * SCK  -> GPIO 22 (Clock Pin)
 * - Push Button Tare (Opsional):
 *     * Tombol -> GPIO 4 (Pull-up internal)
 * - LED Indikator Status:
 *     * LED Built-in / Eksternal -> GPIO 2
 *
 * Library yang dibutuhkan (Install via Arduino Library Manager):
 * 1. "HX711" by Bogdan Necula
 * 2. "ArduinoJson" by Benoit Blanchon (Versi 6.x / 7.x)
 * 3. WiFi & WiFiUDP (Bawaan ESP32 Core)
 * ============================================================================
 */

#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include "HX711.h"

// ----------------------------------------------------------------------------
// 1. KONFIGURASI JARINGAN WIFI & SERVER UDP
// ----------------------------------------------------------------------------
const char* WIFI_SSID     = "NAMA_WIFI_LAUNDRY";       // Ganti dengan SSID WiFi gerai
const char* WIFI_PASSWORD = "PASSWORD_WIFI";          // Ganti dengan kata sandi WiFi

// Alamat IP Server Node.js (Komputer Kasir / Server Lokal)
// Catatan: Jika menggunakan IP statis lokal, misal 192.168.1.100
IPAddress serverIP(192, 168, 1, 100); 
const uint16_t UDP_PORT   = 4210;                     // Port UDP backend

// Device Authentication Key (Harus sama dengan SCALE_DEVICE_KEY di backend .env)
const char* DEVICE_ID     = "scale-01";
const char* DEVICE_KEY    = "smart-laundry-secret-key-2026";

// ----------------------------------------------------------------------------
// 2. KONFIGURASI PIN & KALIBRASI HX711
// ----------------------------------------------------------------------------
const int LOADCELL_DOUT_PIN = 21;
const int LOADCELL_SCK_PIN  = 22;
const int BUTTON_TARE_PIN   = 4;                      // Tombol kalibrasi nol
const int LED_STATUS_PIN    = 2;                      // LED indikator transmisi

HX711 scale;
WiFiUDP udp;

// FAKTOR KALIBRASI:
// Ubah angka ini sesuai hasil kalibrasi beban referensi (misal anak timbang 1 kg)
// Rumus: (Nilai Raw dengan Beban - Nilai Raw Nol) / Berat Sebenarnya (kg)
float CALIBRATION_FACTOR = -22800.0; 

// Interval pengiriman UDP dalam milidetik (300 ms sesuai spesifikasi PRD)
const unsigned long SEND_INTERVAL_MS = 300;
unsigned long lastSendTime = 0;

// Variabel kestabilan berat
float previousWeight = 0.0;
unsigned long stableStartTime = 0;
bool isStableState = false;

// ----------------------------------------------------------------------------
// FUNGSI KONEKSI WIFI DENGAN RECONNECT OTOMATIS
// ----------------------------------------------------------------------------
void connectToWiFi() {
  Serial.println("\n[WiFi] Menghubungkan ke jaringan: " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_STATUS_PIN, !digitalRead(LED_STATUS_PIN)); // Kedip saat connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Berhasil terhubung!");
    Serial.print("[WiFi] Alamat IP ESP32: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_STATUS_PIN, HIGH);
  } else {
    Serial.println("\n[WiFi] Gagal terhubung! Akan mencoba di latar belakang.");
    digitalWrite(LED_STATUS_PIN, LOW);
  }
}

// ----------------------------------------------------------------------------
// FUNGSI TARE (MENGATUR ULANG TITIK NOL TIMBANGAN)
// ----------------------------------------------------------------------------
void doTare() {
  Serial.println("[HX711] Melakukan Tare (Reset ke 0 kg)...");
  scale.tare();
  previousWeight = 0.0;
  isStableState = false;
  Serial.println("[HX711] Titik nol berhasil disetel.");
}

// ----------------------------------------------------------------------------
// SETUP
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  SMART LAUNDRY IOT SCALE CONTROLLER (ESP32) ");
  Serial.println("=============================================");

  pinMode(LED_STATUS_PIN, OUTPUT);
  pinMode(BUTTON_TARE_PIN, INPUT_PULLUP);
  digitalWrite(LED_STATUS_PIN, LOW);

  // Inisialisasi HX711
  Serial.println("[HX711] Menginisialisasi modul load cell...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  delay(500);
  
  // Nol-kan pembacaan awal saat booting
  doTare();

  // Koneksi WiFi
  connectToWiFi();

  // Inisialisasi Socket UDP
  udp.begin(UDP_PORT);
  Serial.printf("[UDP] Listening & transmitting on port %d\n", UDP_PORT);
}

// ----------------------------------------------------------------------------
// LOOP UTAMA
// ----------------------------------------------------------------------------
void loop() {
  // 1. Cek tombol manual Tare (aktif LOW)
  if (digitalRead(BUTTON_TARE_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_TARE_PIN) == LOW) {
      doTare();
      while (digitalRead(BUTTON_TARE_PIN) == LOW) delay(10);
    }
  }

  // 2. Cek koneksi WiFi berkala (Auto Reconnect)
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_STATUS_PIN, LOW);
    Serial.println("[WiFi] Koneksi terputus! Mencoba menghubungkan kembali...");
    WiFi.reconnect();
    delay(1000);
    return;
  } else {
    digitalWrite(LED_STATUS_PIN, HIGH);
  }

  // 3. Baca berat dari HX711 dengan rata-rata 5 sampel
  if (scale.is_ready()) {
    // get_units(5) membaca rata-rata 5 kali untuk meredam noise getaran
    float currentWeight = scale.get_units(5);

    // Filter pembacaan negatif kecil / noise dekat nol
    if (currentWeight < 0.02 && currentWeight > -0.05) {
      currentWeight = 0.0;
    }

    // 4. Deteksi kestabilan (selisih < 0.02 kg selama 2 detik)
    float delta = abs(currentWeight - previousWeight);
    if (delta < 0.02 && currentWeight >= 0.08) {
      if (stableStartTime == 0) {
        stableStartTime = millis();
      } else if (millis() - stableStartTime >= 2000) {
        isStableState = true;
      }
    } else {
      stableStartTime = 0;
      isStableState = false;
      previousWeight = currentWeight;
    }

    // 5. Kirim paket UDP setiap interval 300 ms
    unsigned long now = millis();
    if (now - lastSendTime >= SEND_INTERVAL_MS) {
      lastSendTime = now;

      // Bentuk dokumen JSON
      StaticJsonDocument<200> doc;
      doc["device_id"] = DEVICE_ID;
      doc["key"]       = DEVICE_KEY;
      doc["weight"]    = round(currentWeight * 100.0) / 100.0; // Bulatkan 2 desimal
      doc["stable"]    = isStableState;
      doc["rssi"]      = WiFi.RSSI();                          // Kekuatan sinyal WiFi (dBm)

      // Serialisasi ke string JSON
      char jsonBuffer[256];
      serializeJson(doc, jsonBuffer);

      // Transmisi UDP ke server
      udp.beginPacket(serverIP, UDP_PORT);
      udp.write((const uint8_t*)jsonBuffer, strlen(jsonBuffer));
      udp.endPacket();

      #if defined(DEBUG_MODE)
      Serial.printf("[UDP TX] %s | Berat: %.2f kg | Stabil: %s\n", 
        jsonBuffer, currentWeight, isStableState ? "YA" : "TIDAK");
      #endif
    }
  }

  // Cek apakah ada paket UDP masuk (misalnya perintah TARE atau Kalibrasi dari server)
  int packetSize = udp.parsePacket();
  if (packetSize) {
    char incomingBuffer[128];
    int len = udp.read(incomingBuffer, sizeof(incomingBuffer) - 1);
    if (len > 0) {
      incomingBuffer[len] = '\0';
      Serial.printf("[UDP RX] Perintah diterima: %s\n", incomingBuffer);
      if (strstr(incomingBuffer, "TARE") != NULL) {
        doTare();
      }
    }
  }

  delay(20);
}

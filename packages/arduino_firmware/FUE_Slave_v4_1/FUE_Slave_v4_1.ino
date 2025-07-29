// ===================================================================
//   FUE_SLAVE Firmware v4.1 - Hibrit Kontrol Modeli (Tam Sürüm)
// ===================================================================
// Bu firmware, bir Arduino kartını FUE cihazı için özel olarak
// optimize edilmiş bir "slave" kontrolcüye dönüştürür.
//
// Özellikler:
// - UniCom v4.0 Hibrit Protokolünü tam olarak destekler.
// - Non-blocking (kilitlemesiz) yapıdadır.
// - Gerçek zamanlı görevler için özel DEV komutları içerir.
// - Gelecekteki genişletmeler için evrensel PIN komutları barındırır.
// ===================================================================

// --- Proje Bilgileri ---
#define FIRMWARE_NAME "FUE_SLAVE"
#define FIRMWARE_VERSION "4.1"

// --- Pin Tanımlamaları ---
const int MOTOR_PWM_PIN = 6;  // Motor Hız (L298N En1)
const int MOTOR_DIR1_PIN = 7; // Motor Yön 1 (L298N M11)
const int MOTOR_DIR2_PIN = 8; // Motor Yön 2 (L298N M12)
const int BUZZER_PIN = 2;
const int PEDAL_PIN = 9;      // Pedal Girişi (Pedal1)
const int FTSW_PIN = 12;      // Foot/Hand Switch Girişi (FootHand)

// --- Global Değişkenler ---
String inputString = "";      // Seri porttan gelen veriyi biriktirir
bool commandReady = false;    // Tam bir komut geldiğinde true olur

// Zamanlı motor çalıştırma için durum değişkenleri
bool timedRunActive = false;
unsigned long timedRunStartTime = 0;
unsigned long timedRunDuration = 0;

// Anlık olay raporlama için durum değişkenleri
int lastPedalState = HIGH; // PULLUP olduğu için başlangıç durumu HIGH (basılmıyor)
int lastFtswState = HIGH;


// ===================================================================
//   SETUP: Cihaz başladığında bir kez çalışır
// ===================================================================
void setup() {
  Serial.begin(115200);
  inputString.reserve(64); // Komutlar için hafızada 64 byte yer ayır

  // Çıkış Pinleri
  pinMode(MOTOR_PWM_PIN, OUTPUT);
  pinMode(MOTOR_DIR1_PIN, OUTPUT);
  pinMode(MOTOR_DIR2_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Giriş Pinleri (INPUT_PULLUP, harici dirence gerek kalmadan kararlı okuma sağlar)
  pinMode(PEDAL_PIN, INPUT_PULLUP);
  pinMode(FTSW_PIN, INPUT_PULLUP);
  
  // Başlangıçta motorun tamamen durduğundan emin ol
  digitalWrite(MOTOR_DIR1_PIN, LOW);
  digitalWrite(MOTOR_DIR2_PIN, LOW);
  analogWrite(MOTOR_PWM_PIN, 0);
}


// ===================================================================
//   LOOP: Sürekli olarak çalışır (ASLA KİLİTLENMEZ)
// ===================================================================
void loop() {
  // 1. Bekleyen bir komut varsa işle
  if (commandReady) {
    inputString.trim(); // Komutun başındaki/sonundaki boşlukları temizle
    processCommand(inputString);
    inputString = "";
    commandReady = false;
  }

  // 2. Sürekli çalışması gereken non-blocking görevleri yürüt
  handleTimedRun(); // Zamanlı motor çalıştırma görevini kontrol et
  handleInputEvents(); // Pedal gibi girişleri kontrol et ve olay gönder
}


// ===================================================================
//   Haberleşme ve Komut İşleme Fonksiyonları
// ===================================================================

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      commandReady = true;
    } else {
      inputString += inChar;
    }
  }
}

void processCommand(String& cmd) {
  int colonIndex = cmd.indexOf(':');
  String fullCommand;
  String params;

  if (colonIndex != -1) {
    fullCommand = cmd.substring(0, colonIndex);
    params = cmd.substring(colonIndex + 1);
  } else {
    fullCommand = cmd;
  }

  // --- SYS Grubu ---
  if (fullCommand == "SYS.PING") {
    Serial.println(F("PONG"));
  }
  else if (fullCommand == "SYS.INFO") {
    Serial.print(F("INFO:"));
    Serial.print(F(FIRMWARE_NAME));
    Serial.print(F(":"));
    Serial.println(F(FIRMWARE_VERSION));
  }
  else if (fullCommand == "SYS.RESET") {
    // Bu komut bir cevap döndürmez, doğrudan reset atar.
    void(* resetFunc) (void) = 0; // Adres 0'a zıpla
    resetFunc();
  }

  // --- DEV Grubu ---
  else if (fullCommand == "DEV.MOTOR.SET_PWM") {
    analogWrite(MOTOR_PWM_PIN, params.toInt());
    Serial.println(F("ACK:DEV.MOTOR.SET_PWM"));
  }
  else if (fullCommand == "DEV.MOTOR.SET_DIR") {
    if (params.toInt() == 0) {
      digitalWrite(MOTOR_DIR1_PIN, HIGH);
      digitalWrite(MOTOR_DIR2_PIN, LOW);
    } else {
      digitalWrite(MOTOR_DIR1_PIN, LOW);
      digitalWrite(MOTOR_DIR2_PIN, HIGH);
    }
    Serial.println(F("ACK:DEV.MOTOR.SET_DIR"));
  }
  else if (fullCommand == "DEV.MOTOR.STOP") {
    analogWrite(MOTOR_PWM_PIN, 0);
    Serial.println(F("ACK:DEV.MOTOR.STOP"));
  }
  else if (fullCommand == "DEV.MOTOR.EXEC_TIMED_RUN") {
    int separatorIndex = params.indexOf('|');
    int pwm = params.substring(0, separatorIndex).toInt();
    timedRunDuration = params.substring(separatorIndex + 1).toInt();
    timedRunStartTime = millis();
    timedRunActive = true;
    analogWrite(MOTOR_PWM_PIN, pwm);
    Serial.println(F("ACK:DEV.MOTOR.EXEC_TIMED_RUN"));
  }
  else if (fullCommand == "DEV.BUZZER.BEEP") {
    int separatorIndex = params.indexOf('|');
    int duration = params.substring(0, separatorIndex).toInt();
    int freq = params.substring(separatorIndex + 1).toInt();
    tone(BUZZER_PIN, freq, duration);
    Serial.println(F("ACK:DEV.BUZZER.BEEP"));
  }

  // --- PIN Grubu ---
   else if (fullCommand == "PIN.SET_MODE") {
    int separatorIndex = params.indexOf(':');
    int pin = params.substring(0, separatorIndex).toInt();
    int mode = params.substring(separatorIndex + 1).toInt();
    if(mode == 0) pinMode(pin, INPUT);
    else if(mode == 1) pinMode(pin, OUTPUT);
    else if(mode == 2) pinMode(pin, INPUT_PULLUP);
    Serial.println(F("ACK:PIN.SET_MODE"));
  }
  else if (fullCommand == "PIN.GET_D") {
    int pin = params.toInt();
    int val = digitalRead(pin);
    Serial.print(F("DATA:PIN_D:"));
    Serial.print(pin);
    Serial.print(F(":"));
    Serial.println(val);
  }
  else if (fullCommand == "PIN.SET_D") {
    int separatorIndex = params.indexOf(':');
    int pin = params.substring(0, separatorIndex).toInt();
    int val = params.substring(separatorIndex + 1).toInt();
    digitalWrite(pin, val);
    Serial.println(F("ACK:PIN.SET_D"));
  }
  else if (fullCommand == "PIN.GET_A") {
    int pin = params.toInt();
    int val = analogRead(pin);
    Serial.print(F("DATA:PIN_A:"));
    Serial.print(pin);
    Serial.print(F(":"));
    Serial.println(val);
  }
  else if (fullCommand == "PIN.SET_A") {
    int separatorIndex = params.indexOf(':');
    int pin = params.substring(0, separatorIndex).toInt();
    int val = params.substring(separatorIndex + 1).toInt();
    analogWrite(pin, val);
    Serial.println(F("ACK:PIN.SET_A"));
  }
  
  // --- Bilinmeyen Komut ---
  else {
    Serial.println(F("ERR:INVALID_CMD"));
  }
}


// ===================================================================
//   Non-Blocking Yardımcı Fonksiyonlar
// ===================================================================

void handleTimedRun() {
  if (timedRunActive && (millis() - timedRunStartTime >= timedRunDuration)) {
    analogWrite(MOTOR_PWM_PIN, 0); // Süre doldu, motoru durdur
    timedRunActive = false;
    Serial.println(F("DONE:DEV.MOTOR.EXEC_TIMED_RUN"));
  }
}

void handleInputEvents() {
  int currentPedalState = digitalRead(PEDAL_PIN);
  if (currentPedalState != lastPedalState) {
    delay(25); // Buton arkını önlemek için (debounce)
    if(digitalRead(PEDAL_PIN) == currentPedalState) {
      Serial.print(F("EVT:PEDAL:"));
      Serial.println(currentPedalState == LOW ? 1 : 0); // PULLUP: Basıldıysa LOW (1), bırakıldıysa HIGH (0)
      lastPedalState = currentPedalState;
    }
  }
  
  int currentFtswState = digitalRead(FTSW_PIN);
  if (currentFtswState != lastFtswState) {
    delay(25); // Debounce
    if(digitalRead(FTSW_PIN) == currentFtswState) {
       Serial.print(F("EVT:FTSW:"));
       Serial.println(currentFtswState == LOW ? 1 : 0);
       lastFtswState = currentFtswState;
    }
  }
}
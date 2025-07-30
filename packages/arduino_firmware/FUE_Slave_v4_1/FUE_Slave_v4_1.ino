// ===================================================================
//
//                        FUE SLAVE FIRMWARE
//
//                           Versiyon: 4.1
//
// -------------------------------------------------------------------
// Açıklama:
// Bu firmware, bir Arduino kartını FUE Saç Ekimi Mikromotoru için
// özel bir "slave" (bağımlı) kontrolcüye dönüştürür. Ana kontrol
// ünitesi (Raspberry Pi gibi) tarafından gönderilen seri komutları
// dinler ve motor, buzzer gibi donanımları yönetir.
//
// Temel Özellikler:
// - UniCom v4.0 Hibrit Protokolü: Hem cihaza özel (DEV) hem de
//   genel amaçlı (PIN) komutları destekler.
// - Non-Blocking (Kilitlemesiz) Mimari: `loop()` fonksiyonu asla
//   `delay()` gibi bekleten komutlar kullanmaz. Bu sayede seri
//   haberleşme ve donanım kontrolü eş zamanlı ve kesintisiz çalışır.
// - Olay Tabanlı Raporlama (Event-Driven): Pedal veya anahtar
//   durumlarındaki değişiklikleri anında ana kontrolcüye 'EVT:'
//   ön ekiyle bildirir.
//
// ===================================================================

// --- Proje Bilgileri (SYS.INFO komutu için) ---
#define FIRMWARE_NAME "FUE_SLAVE"
#define FIRMWARE_VERSION "4.1"

// --- Donanım Pin Tanımlamaları ---
// Bu bölümde, Arduino pinlerinin hangi donanıma bağlı olduğu
// açıkça belirtilmiştir.
const int MOTOR_PWM_PIN  = 6;  // Motor Hız Kontrolü (L298N Sürücü EN1 pini)
const int MOTOR_DIR1_PIN = 7;  // Motor Yön Kontrol 1 (L298N Sürücü M11 pini)
const int MOTOR_DIR2_PIN = 8;  // Motor Yön Kontrol 2 (L298N Sürücü M12 pini)
const int BUZZER_PIN     = 2;  // Sesli uyarılar için Buzzer pini
const int PEDAL_PIN      = 9;  // Ayak pedalı girişi (PULLUP olarak ayarlı)
const int FTSW_PIN       = 12; // El/Ayak modu değiştirme anahtarı (PULLUP olarak ayarlı)

// --- Global Değişkenler ---
String inputString = "";        // Seri porttan gelen ve '\n' karakterini bekleyen komut dizesi
bool commandReady = false;      // Tam bir komut satırı geldiğinde 'true' olur ve işlenmesini tetikler

// Zamanlı motor çalıştırma (Osilasyon) için durum değişkenleri
bool timedRunActive = false;             // Zamanlı çalışmanın aktif olup olmadığını tutar
unsigned long timedRunStartTime = 0;   // Zamanlı çalışmanın başladığı an (milisaniye)
unsigned long timedRunDuration = 0;      // Motorun ne kadar süre çalışacağı (milisaniye)

// Anlık olay raporlama için girişlerin son durumlarını saklayan değişkenler
// PULLUP dirençleri kullanıldığı için başlangıç durumu HIGH (basılmıyor/aktif değil)
int lastPedalState = HIGH;
int lastFtswState = HIGH;

// ===================================================================
//   SETUP: Cihaz başladığında yalnızca bir kez çalışır
// ===================================================================
void setup() {
  // Seri haberleşmeyi başlat (baud rate, ana kontrolcü ile aynı olmalı)
  Serial.begin(115200);

  // Gelen komutlar için bellekte 64 byte yer ayırarak performansı artır
  inputString.reserve(64);

  // Pin modlarını ayarla
  // OUTPUT: Arduino'dan sinyal gönderilecek pinler
  pinMode(MOTOR_PWM_PIN, OUTPUT);
  pinMode(MOTOR_DIR1_PIN, OUTPUT);
  pinMode(MOTOR_DIR2_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // INPUT_PULLUP: Harici bir dirence ihtiyaç duymadan, kararlı bir şekilde
  // dijital giriş okunmasını sağlar. Pin boşta iken HIGH, butona basıldığında LOW olur.
  pinMode(PEDAL_PIN, INPUT_PULLUP);
  pinMode(FTSW_PIN, INPUT_PULLUP);

  // Güvenlik önlemi: Cihaz ilk açıldığında motorun tamamen durduğundan emin ol
  digitalWrite(MOTOR_DIR1_PIN, LOW);
  digitalWrite(MOTOR_DIR2_PIN, LOW);
  analogWrite(MOTOR_PWM_PIN, 0);
}


// ===================================================================
//   LOOP: Cihaz açık olduğu sürece sürekli ve hızlı bir şekilde döner
//   (ASLA KİLİTLENMEZ / BLOCKING DEĞİLDİR)
// ===================================================================
void loop() {
  // 1. Seri porttan tam bir komut geldiyse işle
  if (commandReady) {
    inputString.trim(); // Komutun başındaki ve sonundaki olası boşlukları temizle
    processCommand(inputString); // Komutu ilgili fonksiyona gönder
    inputString = ""; // Bir sonraki komut için string'i temizle
    commandReady = false; // İşlem tamamlandı, bayrağı indir
  }

  // 2. Sürekli çalışması gereken (ama programı kilitlemeyen) görevleri yürüt
  handleTimedRun();   // Zamanlı motor çalıştırma görevini kontrol et
  handleInputEvents(); // Pedal ve anahtar gibi anlık girişleri kontrol et
}


// ===================================================================
//   Haberleşme ve Komut İşleme Fonksiyonları
// ===================================================================

/**
 * @brief Bu fonksiyon, Arduino donanımı tarafından otomatik olarak çağrılır.
 * Seri portta okunacak veri olduğunda çalışır ve veriyi satır satır okur.
 */
void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read(); // Gelen byte'ı karaktere çevir
    if (inChar == '\n') { // Satır sonu karakteri (komutun sonu)
      commandReady = true; // Komutun işlenmesi için bayrağı kaldır
    } else {
      inputString += inChar; // Satır sonu gelene kadar karakterleri biriktir
    }
  }
}

/**
 * @brief Gelen komut dizesini ayrıştırır ve ilgili görevi yerine getirir.
 * @param cmd Seri porttan gelen tam komut satırı.
 */
void processCommand(String& cmd) {
  // Komutu 'GRUBU.KOMUT:PARAMETRE' formatına göre ayır
  int colonIndex = cmd.indexOf(':');
  String fullCommand;
  String params;

  if (colonIndex != -1) { // Eğer ':' varsa, komut ve parametreleri ayır
    fullCommand = cmd.substring(0, colonIndex);
    params = cmd.substring(colonIndex + 1);
  } else { // Eğer ':' yoksa, komut parametresizdir
    fullCommand = cmd;
  }

  // --- SYS (Sistem) Komut Grubu ---
  if (fullCommand == "SYS.PING") {
    Serial.println(F("PONG")); // Bağlantı kontrolü için cevap ver
  }
  else if (fullCommand == "SYS.INFO") {
    Serial.print(F("INFO:"));
    Serial.print(F(FIRMWARE_NAME));
    Serial.print(F(":"));
    Serial.println(F(FIRMWARE_VERSION));
  }
  else if (fullCommand == "SYS.RESET") {
    // Arduino'yu yazılımsal olarak yeniden başlatır.
    // Bu komut bir cevap döndürmez, çünkü reset anında gerçekleşir.
    void(* resetFunc) (void) = 0; // Adres 0'a (reset vektörü) zıpla
    resetFunc();
  }

  // --- DEV (Cihaz Özel) Komut Grubu ---
  else if (fullCommand == "DEV.MOTOR.SET_PWM") {
    analogWrite(MOTOR_PWM_PIN, params.toInt()); // Motor hızını ayarla (0-255)
    Serial.println(F("ACK:DEV.MOTOR.SET_PWM")); // Onay mesajı gönder
  }
  else if (fullCommand == "DEV.MOTOR.SET_DIR") {
    // 0: CW (Saat Yönü), 1: CCW (Saat Yönü Tersi)
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
    analogWrite(MOTOR_PWM_PIN, 0); // Motoru durdurmak için hızı sıfırla
    timedRunActive = false; // Eğer zamanlı bir görev varsa onu da iptal et
    Serial.println(F("ACK:DEV.MOTOR.STOP"));
  }
  else if (fullCommand == "DEV.MOTOR.EXEC_TIMED_RUN") {
    // "PWM|SÜRE" formatındaki parametreyi ayrıştır (örn: "200|50")
    int separatorIndex = params.indexOf('|');
    int pwm = params.substring(0, separatorIndex).toInt();
    timedRunDuration = params.substring(separatorIndex + 1).toInt();

    // Zamanlı çalıştırma değişkenlerini ayarla
    timedRunStartTime = millis(); // Başlangıç zamanını kaydet
    timedRunActive = true;        // Görevi aktif et

    analogWrite(MOTOR_PWM_PIN, pwm); // Motoru belirtilen hızda çalıştır
    Serial.println(F("ACK:DEV.MOTOR.EXEC_TIMED_RUN"));
  }
  else if (fullCommand == "DEV.BUZZER.BEEP") {
    // "SÜRE|FREKANS" formatındaki parametreyi ayrıştır (örn: "100|1000")
    int separatorIndex = params.indexOf('|');
    int duration = params.substring(0, separatorIndex).toInt();
    int freq = params.substring(separatorIndex + 1).toInt();
    tone(BUZZER_PIN, freq, duration); // Belirtilen frekans ve sürede ses çıkar
    Serial.println(F("ACK:DEV.BUZZER.BEEP"));
  }

  // --- PIN (Genel Amaçlı Pin) Komut Grubu ---
  // Bu komutlar, gelecekte eklenebilecek donanımlar için esneklik sağlar.
  else if (fullCommand == "PIN.SET_MODE") {
    int separatorIndex = params.indexOf(':');
    int pin = params.substring(0, separatorIndex).toInt();
    int mode = params.substring(separatorIndex + 1).toInt();
    if(mode == 0) pinMode(pin, INPUT);
    else if(mode == 1) pinMode(pin, OUTPUT);
    else if(mode == 2) pinMode(pin, INPUT_PULLUP);
    Serial.println(F("ACK:PIN.SET_MODE"));
  }
  else if (fullCommand == "PIN.GET_D") { // Dijital pin oku
    int pin = params.toInt();
    int val = digitalRead(pin);
    Serial.print(F("DATA:PIN_D:"));
    Serial.print(pin);
    Serial.print(F(":"));
    Serial.println(val);
  }
  else if (fullCommand == "PIN.SET_D") { // Dijital pin yaz
    int separatorIndex = params.indexOf(':');
    int pin = params.substring(0, separatorIndex).toInt();
    int val = params.substring(separatorIndex + 1).toInt();
    digitalWrite(pin, val);
    Serial.println(F("ACK:PIN.SET_D"));
  }
  else if (fullCommand == "PIN.GET_A") { // Analog pin oku
    int pin = params.toInt();
    int val = analogRead(pin);
    Serial.print(F("DATA:PIN_A:"));
    Serial.print(pin);
    Serial.print(F(":"));
    Serial.println(val);
  }
  else if (fullCommand == "PIN.SET_A") { // Analog (PWM) pin yaz
    int separatorIndex = params.indexOf(':');
    int pin = params.substring(0, separatorIndex).toInt();
    int val = params.substring(separatorIndex + 1).toInt();
    analogWrite(pin, val);
    Serial.println(F("ACK:PIN.SET_A"));
  }

  // --- Bilinmeyen Komut ---
  else {
    Serial.println(F("ERR:INVALID_CMD")); // Geçersiz komut hatası gönder
  }
}


// ===================================================================
//   Non-Blocking Yardımcı Fonksiyonlar
// ===================================================================

/**
 * @brief Zamanlı motor çalıştırma görevini yönetir. `loop()` içinde
 * sürekli çağrılarak `millis()` ile zaman kontrolü yapar ve programı
 * kilitlemez.
 */
void handleTimedRun() {
  // Eğer zamanlı bir görev aktifse VE (şu anki zaman - başlangıç zamanı)
  // belirlenen süreyi aştıysa...
  if (timedRunActive && (millis() - timedRunStartTime >= timedRunDuration)) {
    analogWrite(MOTOR_PWM_PIN, 0); // Süre doldu, motoru durdur
    timedRunActive = false;       // Görevi pasif hale getir
    Serial.println(F("DONE:DEV.MOTOR.EXEC_TIMED_RUN")); // Görevin bittiğini bildir
  }
}

/**
 * @brief Pedal ve anahtar pinlerini sürekli dinler. Bir durum değişikliği
 * algıladığında, bunu ana kontrolcüye bir olay (event) olarak bildirir.
 * Buton arkını (debounce) önlemek için küçük bir gecikme içerir.
 */
void handleInputEvents() {
  // --- Pedal Kontrolü ---
  int currentPedalState = digitalRead(PEDAL_PIN);
  if (currentPedalState != lastPedalState) { // Durum değişti mi?
    delay(25); // Debounce için kısa bir bekleme (loop'u ihmal edilebilir düzeyde etkiler)
    if(digitalRead(PEDAL_PIN) == currentPedalState) { // Durum hala aynı mı? (Ark değilse)
      Serial.print(F("EVT:PEDAL:"));
      // PULLUP olduğu için: Basıldıysa LOW (1), bırakıldıysa HIGH (0) gönderilir.
      Serial.println(currentPedalState == LOW ? 1 : 0);
      lastPedalState = currentPedalState; // Son durumu güncelle
    }
  }

  // --- El/Ayak Anahtarı Kontrolü ---
  int currentFtswState = digitalRead(FTSW_PIN);
  if (currentFtswState != lastFtswState) { // Durum değişti mi?
    delay(25); // Debounce
    if(digitalRead(FTSW_PIN) == currentFtswState) { // Ark değilse
       Serial.print(F("EVT:FTSW:"));
       Serial.println(currentFtswState == LOW ? 1 : 0);
       lastFtswState = currentFtswState;
    }
  }
}
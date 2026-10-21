<div align="center">

```
 ███████╗███╗   ███╗██████╗ ██████╗     ██████╗ ███████╗ █████╗  ██████╗████████╗
 ██╔════╝████╗ ████║██╔══██╗██╔══██╗    ██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝
 █████╗  ██╔████╔██║██████╔╝██║  ██║    ██████╔╝█████╗  ███████║██║        ██║   
 ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║  ██║    ██╔══██╗██╔══╝  ██╔══██║██║        ██║   
 ██║     ██║ ╚═╝ ██║██║     ██████╔╝    ██║  ██║███████╗██║  ██║╚██████╗   ██║   
 ╚═╝     ╚═╝     ╚═╝╚═╝     ╚═════╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   
```

# 🌿 FMPD — Catppuccin Mocha × Studio Ghibli MPD Web Client

### *Safkan MPD Gücü, Sıfır Şişirme, Maksimum Ruh.*

**Eski püskü, 2010'lardan kalma web arayüzlerini ve kaynak sömüren hantal Electron canavarlarını çöpe atın.**
**FMPD**, Music Player Daemon (MPD) sunucunuz için **React 19**, **Vite**, **TypeScript** ve **Tailwind v4** ile baştan yaratılmış;
**Catppuccin Mocha** renk paleti ve sıcacık **Studio Ghibli** estetiğiyle donatılmış yüksek performanslı, modern bir web istemcisidir.

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=11111b)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=11111b)](https://tailwindcss.com/)
[![MPD Compatible](https://img.shields.io/badge/MPD-100%25_Compatible-fab387?style=for-the-badge&logo=musicbrainz&logoColor=11111b)](https://www.musicpd.org/)
[![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-89b4fa?style=for-the-badge&logo=socket.io&logoColor=11111b)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Theme: Catppuccin Mocha](https://img.shields.io/badge/Theme-Catppuccin_Mocha-cba6f7?style=for-the-badge&logo=catppuccin&logoColor=11111b)](https://github.com/catppuccin/catppuccin)

</div>

---

## ⚡ Neden FMPD? (Farkı Ne?)

Birçok MPD istemcisi ya 15 yıllık terkedilmiş PHP/Perl kodlarıyla doludur ya da 500 MB RAM yiyen Electron pencereleridir.
**FMPD**, arka plandaki doğrudan TCP soketi köprüsü ve hafif React ön yüzü sayesinde **milisaniyeler içinde tepki verir**:

- 🚀 **Doğrudan MPD TCP Soketi**: MPD soketiniz (`localhost:6600`) ile doğrudan konuşur. Sahte mock veriler yok, simülasyon yok, doğrudan donanım gücü.
- ⚡ **Gerçek Zamanlı Durum Akışı**: Arka plandaki köprü, MPD sunucusundaki durumu izleyip WebSocket üzerinden tarayıcıya akar. MPD yeniden başlasa bile bağlantı otomatik olarak geri gelir.
- 🎯 **MPD Tek Doğruluk Kaynağı**: Sıradaki her işlem (silme, taşıma, sıraya ekleme) doğrudan MPD'ye yazılır; arayüz sunucunun gerçek durumunu gösterir.
- 📁 **Tek Tıkla Klasör Kuyruklama**: Kütüphanede albüm veya sanatçı klasörünün yanındaki **`+ Sıraya Ekle`** butonuna basın; o klasör ve altındaki tüm hiyerarşi anında MPD çalma listenize eklensin.
- ⌨️ **ncmpcpp Kas Hafızası (Klavye Kısayolları)**: Terminal kurdu musunuz? Boşlukla durdurun, `n`/`b` ile şarkı atlayın, `z`/`r`/`y`/`x` ile MPD modlarını değiştirin, `/` ile anında arayın.
- 🎨 **Gözü Yormayan Catppuccin Mocha Paleti**: Gece kod yazarken veya chill müzik dinlerken gözünüzü kör etmeyen, pikselleriyle aşk yaşatan renk dengesi.
- 📱 **Tam Uyumlu Mobil Arayüz**: Telefonda veya tablette açtığınızda oynatıcı, dokunmatik dostu bir alt çubuğa dönüşür.

---

## 🏗️ Mimari

```
┌──────────────────────┐   REST (/api/mpd/*)    ┌──────────────────────┐   TCP 6600   ┌───────┐
│  Tarayıcı (React 19) │ ─────────────────────► │  Node / Express      │ ───────────► │  MPD  │
│                      │ ◄───────────────────── │  + WebSocket köprüsü │ ◄─────────── │ sunucu│
└──────────────────────┘   WS (/api/mpd-ws)     └──────────────────────┘              └───────┘
        ▲ durum akışı (1/sn)                            ▲ tek MPD bağlantısı
```

| Katman | Dosya | Görev |
|:---|:---|:---|
| MPD istemcisi | `src/server/mpdBridge.ts` | Ham TCP soketi, komut kuyruğu, yeniden bağlanma |
| Servis | `src/server/mpdService.ts` | Tek bağlantının sahibi, olay yayını |
| Taşıma | `src/server/mpdApi.ts` | REST uçları + WebSocket yayını (dev ve prod ortak) |
| Dev sunucu | `src/server/viteMpdPlugin.ts` | Vite eklentisi olarak aynı API'yi mount eder |
| Prod sunucu | `server.ts` | `dist/` sunar + aynı API'yi mount eder |

> Dev ve üretim sunucuları **aynı** API katmanını kullanır; davranışları arasında fark olamaz.

---

## 🛠️ Yetenekler & Özellikler

### 1. 🗂️ Güçlü Müzik Kütüphanesi & Klasör Yönetimi
- MPD'nizin `lsinfo` ve `listallinfo` komutları üzerinden gerçek dosya sistemi ağacını çeker.
- Her klasörün yanındaki **`+ Sıraya Ekle`** butonu ile tek tıkla onlarca parçayı kuyruğa yollar (tek komut, tek gidiş-dönüş).
- Hiyerarşik Breadcrumb navigasyonu (`Kütüphane > Sanatçı > Albüm`) ile dizinler arasında kaybolmadan gezinin.
- **Tüm veritabanı** üzerinde anlık arama — sadece gezdiğiniz klasörlerde değil, MPD'deki her parçada.

### 2. 📋 Profesyonel Kuyruk & Çalma Listesi Kontrolü
- **Çoklu Seçim (Multi-Select)**: İster tek tek ister `Tümünü Seç` ile parçaları işaretleyin.
- **Toplu İşlemler**: Seçili parçaları yukarı/aşağı taşıyın, tek tıkla silin veya `Shift + J/K` ile ncmpcpp tarzı sıralayın. Hepsi MPD'ye yazılır.
- **Sıradaki Yap**: İstediğiniz parçayı çalan parçanın hemen ardına taşır.
- **Çalma Listesi Kaydetme**: Dinlediğiniz sırayı MPD'ye kalıcı çalma listesi olarak yazar (`save` komutu).

### 3. 🎛️ MPD Donanım Modları
- 🔀 **Random (Rastgele)**: Şarkıları karıştırır.
- 🔁 **Repeat (Tekrar)**: Kuyruğu baştan sona döngüye sokar.
- 🔂 **Single (Tek Şarkı)**: Parça bittiğinde durur veya aynı parçayı yineler.
- ⚡ **Consume (Tüketim)**: Çalınan parça bittiğinde kuyruktan otomatik olarak silinir.
- 🔄 **Veritabanı Güncelleme (DB Update)**: Tek tıkla MPD'ye `update` sinyali yollar ve diske yeni eklenen albümleri taratır.

### 4. 🔌 Dayanıklı Bağlantı
- MPD sunucusu çökerse/kapansa istemci üstel geri çekilme (1s → 10s) ile kendini yeniden bağlar.
- Bağlantı koptuğunda arayüzdeki durum rozeti anında güncellenir; sahte bir "bağlı" görünümü yoktur.
- Komutlar zaman aşımına uğrar; donmuş bir soket sunucuyu kilitlemez.

---

## ⌨️ ncmpcpp Uyumlu Klavye Kısayolları

Müzik dinlerken farenin yüzüne bakmak istemeyenler için:

| Tuş | Eylem |
|:---|:---|
| `Space` | Oynat / Duraklat (Play/Pause) |
| `n` | Sonraki Parça (Next) |
| `b` | Önceki Parça (Previous) |
| `s` | Oynatmayı Tamamen Durdur (Stop) |
| `z` | Rastgele Çalma Aç / Kapat (Random) |
| `r` | Tekrar Modunu Aç / Kapat (Repeat) |
| `y` | Tek Şarkı Modu Aç / Kapat (Single) |
| `x` | Tüketim Modu Aç / Kapat (Consume) |
| `m` | Sesi Kapat / Aç (Mute) |
| `+` / `-` | Ses Seviyesini 5 artır / azalt |
| `←` / `→` | 5 saniye geri / ileri sar |
| `Shift + K` / `Shift + J` | Seçili parçaları toplu yukarı / aşağı kaydır |
| `d` veya `Delete` | Seçilen parçaları kuyruktan kaldır |
| `c` | Tüm kuyruğu sıfırla / temizle |
| `ö` veya `]` | Seçili parçayı "Sıradaki Parça" yap |
| `/` | Arama çubuğuna odaklan |
| `?` | Kısayollar yardım penceresini aç |
| `Escape` | Açık modal veya pencereleri kapat |

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- **Node.js**: v18 veya üstü
- **MPD**: Bilgisayarınızda veya yerel ağdaki bir MPD servisi (`mpd.conf`)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/FatihEsen/fmpd-react.git
cd fmpd-react
```

### 2. Bağımlılıkları Kurun
```bash
npm install
```

### 3. Geliştirme Modunda Başlatın
```bash
npm run dev
```
Uygulama anında **`http://localhost:3000`** üzerinde açılır. Vite'ın HMR'i, MPD köprüsü ve WebSocket akışı bu modda da tam çalışır.

### 4. Üretim İçin Derleyin
```bash
npm run build   # dist/ klasörünü üretir
npm start       # dist/ + MPD API'sini sunar (http://localhost:3000)
```

`npm start` derlenmiş çıktıyı servis eder; `dist/` yoksa otomatik olarak Vite middleware moduna düşer.

---

## ⚙️ Yapılandırma

### Ayarlar arayüzü
Uygulamanın sağ üst köşesindeki **⚙️ Ayarlar** ikonuna tıklayarak MPD bağlantısını değiştirebilirsiniz:

- **Host**: `localhost`, `127.0.0.1` veya yerel ağdaki Raspberry Pi / NAS cihazınızın IP'si (örn. `192.168.1.100`)
- **Port**: Varsayılan MPD portu `6600`
- **Parola**: MPD sunucunuzda şifre tanımlıysa şifrenizi girin.

Ayarlar tarayıcının `localStorage` alanında saklanır ve **yalnızca köprünün sunucusuna** gönderilir.

### Ortam değişkenleri

`.env` dosyasıyla da yapılandırabilirsiniz (bkz. `.env.example`):

| Değişken | Varsayılan | Açıklama |
|:---|:---|:---|
| `MPD_HOST` | `localhost` | MPD sunucu adresi |
| `MPD_PORT` | `6600` | MPD portu |
| `MPD_PASSWORD` | — | MPD parolası (varsa) |
| `PORT` | `3000` | FMPD'nin dinleyeceği port |
| `NODE_ENV` | — | `development` → Vite middleware, aksi halde `dist/` servis edilir |

---

## 🎨 Renk Paleti — Catppuccin Mocha

| İkon | Renk Adı | Hex | Kullanım Alanı |
|:---|:---|:---|:---|
| 🟣 | **Mauve** | `#cba6f7` | Aktif sekmeler, vurgular, birincil butonlar |
| 🟠 | **Peach** | `#fab387` | Klasör ikonları, marka başlığı, plak detayları |
| 🟢 | **Green** | `#a6e3a1` | Bağlantı durumu, başarı bildirimleri |
| 🔵 | **Blue** | `#89b4fa` | Bilgi kartları ve meta veriler |
| 🔴 | **Red** | `#f38ba8` | Bağlantı kopukluğu, silme uyarıları |
| ⬛ | **Base** | `#1e1e2e` | Ana arka plan kartları |
| ⬛ | **Mantle** | `#181825` | Başlık, alt oynatıcı ve kutular |
| ⬛ | **Crust** | `#11111b` | En derin taban kontrastı |

---

## 🧑‍💻 Geliştirici Komutları

| Komut | Açıklama |
|:---|:---|
| `npm run dev` | Vite dev sunucusu + MPD köprüsü (HMR açık) |
| `npm run build` | Üretim derlemesi (`dist/`) |
| `npm start` | Üretim sunucusu (`dist/` + MPD API'si) |
| `npm run preview` | Derle ve üretim sunucusunu başlat |
| `npm run lint` | TypeScript tip kontrolü (`tsc --noEmit`, strict mod) |
| `npm run clean` | `dist/` klasörünü siler |

---

## 🤝 Katkıda Bulunma

1. Projeyi fork'layın (`fork`)
2. Özellik dalınızı oluşturun (`git checkout -b feature/muazzam-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: süper özellik eklendi'`)
4. Dalınıza push yapın (`git push origin feature/muazzam-ozellik`)
5. **Pull Request** açın!

---

## 📜 Lisans

Bu proje **MIT** lisansı ile dağıtılmaktadır. Dilediğiniz gibi kullanın, forklayın, geliştirin ve keyfini çıkarın! 🌿

<div align="center">

**Geliştirici**: [Fatih Esen](https://github.com/FatihEsen)
*Müziğinizi özgür bırakın.* 🎵

</div>

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
- ⚡ **Sıfır Gecikmeli WebSocket Köprüsü**: Arka planda polling (sürekli istek atma) ile işlemciyi boğmaz; MPD sunucusundaki değişiklikler anında web tarayıcınıza WebSocket üzerinden akar.
- 📁 **Tek Tıkla Klasör Kuyruklama**: Kütüphanede albüm veya sanatçı klasörünün yanındaki **`+ Sıraya Ekle`** butonuna basın; o klasör ve altındaki tüm hiyerarşi anında MPD çalma listenize eklensin.
- 🎹 **ncmpcpp Kas Hafızası (Klavye Kısayolları)**: Terminal kurdu musunuz? Boşlukla durdurun, `n`/`b` ile şarkı atlayın, `z`/`r`/`y`/`x` ile MPD modlarını değiştirin, `/` ile anında arayın.
- 🎨 **Gözü Yormayan Catppuccin Mocha Paleti**: Gece kod yazarken veya chill müzik dinlerken gözünüzü kör etmeyen, pikselleriyle aşk yaşatan renk dengesi.
- 📱 **Tam Uyumlu Mobil Mini Player**: Telefonda veya tablette açtığınızda otomatik olarak parmak dostu bir mini oynatıcıya dönüşür.

---

## 📸 Ekran Görüntüsü / Arayüz Anatomisi

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌿 ympd  Ghibli  │  📻 Sıra  │  📁 Kütüphane  │  🌊 Akışlar    [ 🔍 Hızlı Arama... ]   🟢 6600 ⚙️ │
├──────────────────────────┬──────────────────────────────────────────────────────────────────┤
│                          │  📻 Çalma Listesi Sırası (24 Parça)                              │
│      ┌────────────┐      ├──────────────────────────────────────────────────────────────────┤
│      │  💽 PLAK   │      │ 1  ♫ One Summer's Day           Joe Hisaishi      3:07  [▶] [⋮]      │
│      │  ANIMASYONU│      │ 2  ♫ A Town with an Ocean View  Joe Hisaishi      2:24  [▶] [⋮]      │
│      └────────────┘      │ 3  ▶ Merry-Go-Round of Life (Çalıyor) ━━━━━━━━━━━━━━ 4:20  [⏸]   │
│                          │ 4  ♫ Path of the Wind           Joe Hisaishi      3:16  [▶] [⋮]      │
│   Merry-Go-Round of Life │ 5  ♫ Princess Mononoke Suite    Tokyo City Phil.  5:01  [▶] [⋮]      │
│   Joe Hisaishi • Ghibli  ├──────────────────────────────────────────────────────────────────┤
│                          │  [Tümünü Seç] [Seçilenleri Sil] [Sıradaki Yap] [Listeyi Kaydet]  │
│   02:15 ━━━━━━●━━━━ 04:20├──────────────────────────────────────────────────────────────────┤
│    ⏮   ▶ / ⏸   ⏹   ⏭    │  📁 Kütüphane Görünümü:                                          │
│   🔊 ━━━━━━━━━━━━ 85%    │  📁 Joe Hisaishi/                 [ + Sıraya Ekle ]  [›]         │
│   [🔀] [🔁] [🔂] [⚡]     │  📁 Studio Ghibli Lo-Fi/          [ + Sıraya Ekle ]  [›]         │
└──────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Yetenekler & Özellikler

### 1. 🗂️ Güçlü Müzik Kütüphanesi & Klasör Yönetimi
- MPD'nizin `lsinfo` ve `listfiles` komutları üzerinden gerçek dosya sistemi ağacını çeker.
- Her klasörün yanındaki **`+ Sıraya Ekle`** butonu ile tek tıkla onlarca parçayı kuyruğa yollar.
- Hiyerarşik Breadcrumb navigasyonu (`Kütüphane > Sanatçı > Albüm`) ile dizinler arasında kaybolmadan gezinin.
- Anlık kütüphane araması ile diskteki binlerce FLAC/MP3/Opus parçasını anında filtreleyin.

### 2. 📋 Profesyonel Kuyruk & Çalma Listesi Kontrolü
- **Çoklu Seçim (Multi-Select)**: İster tek tek ister `Tümünü Seç` ile parçaları işaretleyin.
- **Toplu İşlemler**: Seçili parçaları yukarı/aşağı taşıyın, tek tıkla silin veya `Shift + J/K` ile ncmpcpp tarzı sıralayın.
- **Sıradaki Yap**: İstediğiniz parçayı kuyruğun en tepesine veya mevcut çalanın hemen ardına yerleştirin.
- **M3U Çalma Listesi Kaydetme**: Dinlediğiniz enfes sırayı MPD sunucunuza kalıcı çalma listesi olarak yazın.

### 3. 📻 Canlı Radyo & İnternet Akışları (Streams)
- Zeno.fm Ghibli Piano, Lofi Girl, SomaFM Groove Salad, Nightwave Plaza gibi hazır stream istasyonları.
- Kendi özel radyo akışı (URL) bağlantınızı anında ekleyebilme ve MPD'ye canlı yayın olarak basabilme imkanı.

### 4. 🎛️ MPD Donanım Modları
- 🔀 **Random (Rastgele)**: Şarkıları karıştırır.
- 🔁 **Repeat (Tekrar)**: Kuyruğu baştan sona döngüye sokar.
- 🔂 **Single (Tek Şarkı)**: Parça bittiğinde durur veya aynı parçayı yineler.
- ⚡ **Consume (Tüketim)**: Çalınan parça bittiğinde kuyruktan otomatik olarak silinir.
- 🔄 **Veritabanı Güncelleme (DB Update)**: Tek tıkla MPD'ye `update` sinyali yollar ve diske yeni eklenen albümleri taratır.

---

## ⌨️ ncmpcpp Uyumlu Klavye Kısayolları

Müzik dinlerken farenin yüzüne bakmak istemeyenler için:

| Tuş | Eylem |
|:---|:---|
| `Space` | Oynat / Duraklat (Play/Pause) |
| `n` veya `>` | Sonraki Parça (Next) |
| `b` veya `<` | Önceki Parça (Previous) |
| `s` | Oynatmayı Tamamen Durdur (Stop) |
| `z` | Rastgele Çalma Aç / Kapat (Random) |
| `r` | Tekrar Modunu Aç / Kapat (Repeat) |
| `y` | Tek Şarkı Modu Aç / Kapat (Single) |
| `x` | Tüketim Modu Aç / Kapat (Consume) |
| `m` | Sesi Kapat / Aç (Mute) |
| `+` / `-` | Sesi Arttır / Azalt |
| `←` / `→` | 5 saniye geri / ileri sar |
| `↑` / `↓` | Parçayı yukarı / aşağı taşı |
| `Shift + K` / `Shift + J` | Seçili parçaları toplu yukarı / aşağı kaydır |
| `d` veya `Delete` | Seçilen parçaları kuyruktan kaldır |
| `c` | Tüm kuyruğu sıfırla / temizle |
| `ö` | Seçili parçayı "Sıradaki Parça" yap |
| `/` | Arama çubuğuna odaklan |
| `?` | Kısayollar yardım penceresini aç |
| `Escape` | Açık modal veya pencereleri kapat |

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- **Node.js**: v18 veya üstü
- **MPD**: Bilgisayarınızda veya yerel ağınızda çalışan bir MPD servisi (`mpd.conf`)

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
Uygulama anında **`http://localhost:3000`** üzerinde açılır!

### 4. Üretim İçin Derleyin (Production Build)
```bash
npm run build
npm run preview
```

---

## ⚙️ MPD Sunucu Ayarları

Uygulamanın sağ üst köşesindeki **⚙️ Ayarlar** ikonuna tıklayarak veya doğrudan `server.ts` üzerinden bağlantı ayarlarını yapılandırabilirsiniz:

- **Host**: `localhost`, `127.0.0.1` veya yerel ağdaki Raspberry Pi / NAS cihazınızın IP'si (örn. `192.168.1.100`)
- **Port**: Varsayılan MPD portu `6600`
- **Parola**: MPD sunucunuzda şifreleme tanımlıysa şifrenizi girin.

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

## 🤝 Katkıda Bulunma

1. Projeyi fork'layın (`fork`)
2. Özellik dalınızı oluşturun (`git checkout -b feature/muazzam-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: süper özellik eklendi'`)
4. Dalınıza push yapın (`git push origin feature/muazzam-ozellik`)
5. Bir **Pull Request** açın!

---

## 📜 Lisans

Bu proje **MIT** lisansı ile dağıtılmaktadır. Dilediğiniz gibi kullanın, forklayın, geliştirin ve keyfini çıkarın! 🌿

<div align="center">

**Geliştirici**: [Fatih Esen](https://github.com/FatihEsen)  
*Müziğinizi özgür bırakın.* 🎵

</div>

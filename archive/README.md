# 📋 Rapor Arşivi

Bu klasör, AFET-TEAM için haftalık rapor arşiv sistemini içerir.

## Özellikler

### ✅ Düzenlenebilir Raporlar
- **Bu hafta** oluşturulan raporlar düzenlenebilir
- **Geçen hafta** (1 hafta önceki) raporlar düzenlenebilir

### 🔒 Düzenlenemez Raporlar
- **2 hafta önceki** raporlar düzenlenemez
- **3 hafta önceki** raporlar düzenlenemez
- **1 ay veya daha eski** raporlar düzenlenemez

## Nasıl Kullanılır?

### Web Tarayıcısında Açma

1. `index.html` dosyasını herhangi bir modern web tarayıcısında açın
2. Raporlar otomatik olarak yüklenecektir
3. Düzenlenebilir raporlar yeşil kenarlıklı olarak gösterilir
4. Kilitli raporlar gri renkli olarak gösterilir

### Rapor Düzenleme

1. Düzenlemek istediğiniz raporun **"Düzenle"** butonuna tıklayın
2. Form alanlarını güncelleyin:
   - Başlık
   - İçerik
   - Yapılan İşler
3. **"Kaydet"** butonuna tıklayarak değişiklikleri kaydedin
4. **"İptal"** butonuna tıklayarak düzenlemeyi iptal edin

### Görsel Göstergeler

- 🟢 **Yeşil kenarlık**: Düzenlenebilir rapor
- ⚪ **Gri kenarlık**: Düzenlenemez rapor
- ✏️ **"Düzenlenebilir" rozeti**: Rapor düzenlenebilir
- 🔒 **"Kilitli" rozeti**: Rapor düzenlenemez
- 🟢 **"Bu Hafta" etiketi**: Mevcut hafta raporu
- 🟠 **"Geçen Hafta" etiketi**: Bir önceki hafta raporu

## Teknik Detaylar

### Hafta Hesaplama

Sistem, ISO 8601 standardına göre hafta numaraları hesaplar:
- Haftalar Pazartesi günü başlar
- Her yıl 52 veya 53 hafta içerir
- Hafta numarası yıl bazında hesaplanır

### Düzenlenebilirlik Kuralı

```javascript
// Mevcut hafta ile rapor haftası arasındaki fark hesaplanır
const weeksDiff = (currentWeek.year - reportWeek.year) * 52 + (currentWeek.week - reportWeek.week);

// 0 veya 1 hafta farkı varsa düzenlenebilir
return weeksDiff >= 0 && weeksDiff <= 1;
```

### Veri Depolama

- Raporlar tarayıcının `localStorage`'ında saklanır
- Demo amaçlı örnek raporlar otomatik oluşturulur
- Gerçek bir uygulamada backend API kullanılmalıdır

## Dosya Yapısı

```
archive/
├── index.html      # Ana HTML sayfası
├── archive.js      # JavaScript mantığı ve işlevsellik
└── README.md       # Bu dosya
```

## Geliştirme Notları

### Özelleştirme

Düzenlenebilir hafta sayısını değiştirmek için `archive.js` dosyasındaki `isEditable` fonksiyonunu güncelleyin:

```javascript
// Örnek: 2 hafta geriye düzenlemeye izin ver
return weeksDiff >= 0 && weeksDiff <= 2;
```

### Backend Entegrasyonu

Gerçek bir uygulamada, `loadReports()` ve `saveReports()` fonksiyonları bir REST API ile entegre edilmelidir:

```javascript
async loadReports() {
    const response = await fetch('/api/reports');
    this.reports = await response.json();
}

async saveReports() {
    await fetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(this.reports)
    });
}
```

## Tarayıcı Uyumluluğu

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Güvenlik Notları

- XSS saldırılarına karşı kullanıcı girişleri temizlenmelidir
- Gerçek uygulamada authentication/authorization eklenmelidir
- HTTPS kullanılmalıdır
- CSRF koruması eklenmelidir

## Lisans

Bu proje AFET-TEAM tarafından geliştirilmiştir.

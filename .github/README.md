# Aylık İstatistikler Özelliği

Bu özellik, AFET-TEAM organizasyonunda her ay en çok katkıda bulunan geliştiricileri otomatik olarak takip eder ve profil sayfasında gösterir.

## Nasıl Çalışır?

1. **GitHub Actions Workflow**: `.github/workflows/update-monthly-stats.yml` dosyası her ayın 1'inde otomatik olarak çalışır.

2. **İstatistik Toplama**: Node.js scripti (`.github/scripts/generate-stats.js`) şu verileri toplar:
   - Organizasyondaki tüm repolarda o ay açılan PR'lar
   - Organizasyondaki tüm repolarda o ay yapılan commit'ler

3. **README Güncelleme**: Script otomatik olarak `profile/README.md` dosyasını günceller ve şu bilgileri ekler:
   - En çok PR gönderen ilk 5 geliştirici
   - En fazla commit yapan ilk 5 geliştirici
   - Madalyalar (🥇 🥈 🥉) ile sıralama

## Manuel Çalıştırma

Workflow'u manuel olarak çalıştırmak için:
1. GitHub'da repository sayfasına gidin
2. "Actions" sekmesine tıklayın
3. "Update Monthly Developer Statistics" workflow'unu seçin
4. "Run workflow" butonuna tıklayın
5. İsteğe bağlı olarak rapor için yıl (YYYY) ve ay (1-12) değerlerini girebilirsiniz
   - Yıl ve ay belirtilmezse, mevcut ay için rapor oluşturulur
   - **Önemli**: Eski tarihler seçilemez. Yalnızca mevcut ay veya gelecek aylar için rapor oluşturulabilir

### Tarih Doğrulama

Rapor oluştururken aşağıdaki kurallar geçerlidir:
- ❌ Geçmiş aylar için rapor oluşturulamaz
- ✅ Mevcut ay için rapor oluşturulabilir
- ✅ Gelecek aylar için rapor oluşturulabilir
- Yıl, 4 haneli bir sayı olmalıdır (örn: 2026)
- Ay, 1 ile 12 arasında bir sayı olmalıdır

## Gereksinimler

- Node.js 20+
- `@octokit/rest` paketi (otomatik yüklenir)
- GitHub Token (GitHub Actions tarafından otomatik sağlanır)

## Yapılandırma

Workflow dosyasında aşağıdaki ayarlar yapılabilir:

- **Çalışma Zamanı**: `cron` ifadesini düzenleyerek farklı zamanlarda çalışması sağlanabilir
- **Organizasyon Adı**: `ORG_NAME` environment variable ile değiştirilebilir
- **Top N Listesi**: Script içinde `slice(0, 5)` değerini değiştirerek listelenecek kişi sayısı ayarlanabilir

## İzinler

Workflow'un çalışması için `contents: write` izni gereklidir. Bu izin, workflow'un README.md dosyasını güncelleyebilmesi için tanımlanmıştır.

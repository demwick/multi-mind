# Product Manager

**Agent:** product-manager
**Süre:** 147088ms
**Zaman:** 2026-04-02T02:21:21.825Z

---

```yaml
gereksinimler:
  - id: REQ-001
    baslik: "e-Fatura Oluşturma ve Gönderme"
    aciklama: "GİB standartlarına uygun UBL-TR formatında e-Fatura oluşturma, onaylama ve GİB üzerinden gönderme"
    oncelik: must-have
    kullanici_hikayesi: "Bir KOBİ muhasebe sorumlusu olarak, sistem üzerinden e-Fatura oluşturup doğrudan GİB'e göndermek istiyorum; böylece manuel süreçleri ortadan kaldırıp yasal yükümlülüklerimi zamanında yerine getirebilirim."

  - id: REQ-002
    baslik: "e-Arşiv Fatura Desteği"
    aciklama: "e-Fatura mükellefi olmayan alıcılara e-Arşiv fatura düzenleme ve GİB'e raporlama"
    oncelik: must-have
    kullanici_hikayesi: "Bir KOBİ sahibi olarak, e-Fatura mükellefi olmayan müşterilerime de dijital fatura kesmek istiyorum; böylece tüm faturalama sürecimi tek platformdan yönetebilirim."

  - id: REQ-003
    baslik: "GİB Entegrasyonu (Özel Entegratör API)"
    aciklama: "GİB web servislerine bağlanarak fatura gönderme, alma, durum sorgulama ve iptal/itiraz işlemleri"
    oncelik: must-have
    kullanici_hikayesi: "Bir işletme sahibi olarak, faturalarımın GİB'e otomatik iletilmesini ve durum takibinin anlık yapılmasını istiyorum; böylece yasal uyumsuzluk riskini sıfıra indirebilirim."

  - id: REQ-004
    baslik: "Multi-Tenant Mimari"
    aciklama: "Her müşteri firmanın verilerinin izole edildiği, tek bir uygulama üzerinden birden fazla kiracıya hizmet veren mimari"
    oncelik: must-have
    kullanici_hikayesi: "Bir platform yöneticisi olarak, yüzlerce KOBİ'ye tek bir altyapıdan hizmet vermek istiyorum; böylece operasyon maliyetlerini düşük tutup ölçeklenebilir bir iş modeli kurabilirim."

  - id: REQ-005
    baslik: "Kullanıcı ve Yetkilendirme Yönetimi"
    aciklama: "Firma bazlı kullanıcı rolleri (admin, muhasebeci, salt okunur), davet sistemi ve RBAC"
    oncelik: must-have
    kullanici_hikayesi: "Bir firma yöneticisi olarak, çalışanlarıma farklı yetkiler tanımlamak istiyorum; böylece hassas finansal verilere sadece yetkili kişiler erişebilsin."

  - id: REQ-006
    baslik: "e-İrsaliye Oluşturma ve Takibi"
    aciklama: "GİB'e uyumlu e-İrsaliye düzenleme, sevkiyat bilgisi girişi ve durum takibi"
    oncelik: must-have
    kullanici_hikayesi: "Bir depo sorumlusu olarak, sevkiyatlarım için e-İrsaliye oluşturup GİB'e bildirmek istiyorum; böylece yasal yükümlülüğümü karşılayıp sevkiyat sürecimi dijitalleştirebilirim."

  - id: REQ-007
    baslik: "Fatura Şablonları ve Müşteri Rehberi"
    aciklama: "Sık kullanılan müşteri/ürün bilgilerinin kaydedilmesi, tekrarlayan faturalar için şablon oluşturma"
    oncelik: should-have
    kullanici_hikayesi: "Bir muhasebeci olarak, düzenli kestiğim faturalar için şablon kaydetmek istiyorum; böylece her seferinde aynı bilgileri tekrar girmek zorunda kalmam."

  - id: REQ-008
    baslik: "Dashboard ve Raporlama"
    aciklama: "Aylık/yıllık fatura özetleri, gelir takibi, KDV hesaplamaları ve grafiksel dashboard"
    oncelik: should-have
    kullanici_hikayesi: "Bir işletme sahibi olarak, fatura verilerimi grafiksel olarak görmek istiyorum; böylece nakit akışımı ve vergi yükümlülüklerimi anlık takip edebileyim."

  - id: REQ-009
    baslik: "Gelen Fatura Yönetimi"
    aciklama: "Tedarikçilerden gelen e-Faturaların otomatik alınması, listelenmesi ve onay/red akışı"
    oncelik: should-have
    kullanici_hikayesi: "Bir satın alma sorumlusu olarak, gelen faturaları tek ekrandan görmek ve onaylamak istiyorum; böylece tedarikçi ödemelerini düzenli takip edebileyim."

  - id: REQ-010
    baslik: "Muhasebe Yazılımı Entegrasyonu"
    aciklama: "Luca, Logo, Mikro, Paraşüt gibi popüler muhasebe yazılımlarına API veya dosya bazlı veri aktarımı"
    oncelik: should-have
    kullanici_hikayesi: "Bir muhasebeci olarak, kesilen faturaların otomatik olarak muhasebe programıma aktarılmasını istiyorum; böylece çift veri girişinden kurtulup hata riskini azaltayım."

  - id: REQ-011
    baslik: "Toplu Fatura Oluşturma (Batch)"
    aciklama: "Excel/CSV yüklemesiyle veya API üzerinden çok sayıda faturanın tek seferde oluşturulması"
    oncelik: should-have
    kullanici_hikayesi: "Bir e-ticaret işletmesi olarak, günlük yüzlerce faturayı toplu şekilde oluşturmak istiyorum; böylece operasyonel yükümü ciddi ölçüde azaltayım."

  - id: REQ-012
    baslik: "Mobil Uyumlu Arayüz"
    aciklama: "Responsive tasarım ile mobil cihazlardan fatura görüntüleme ve temel işlemler"
    oncelik: could-have
    kullanici_hikayesi: "Bir saha satış temsilcisi olarak, telefonumdan fatura durumunu kontrol etmek istiyorum; böylece müşteri ziyaretlerinde anlık bilgi verebilirim."

  - id: REQ-013
    baslik: "E-posta ve SMS Bildirimler"
    aciklama: "Fatura durumu değişikliklerinde, vade yaklaştığında ve ödeme alındığında otomatik bildirim"
    oncelik: could-have
    kullanici_hikayesi: "Bir işletme sahibi olarak, vadesi yaklaşan veya reddedilen faturalardan anında haberdar olmak istiyorum; böylece geç kalmaları önleyebileyim."

  - id: REQ-014
    baslik: "Çoklu Dil ve Döviz Desteği"
    aciklama: "İngilizce arayüz seçeneği ve yabancı para birimli fatura kesebilme"
    oncelik: could-have
    kullanici_hikayesi: "Bir ihracatçı olarak, yurtdışı müşterilerime dövizli fatura kesmek istiyorum; böylece uluslararası ticaret sürecimi kolaylaştırayım."

  - id: REQ-015
    baslik: "Gelişmiş Analitik ve Yapay Zeka Tahminleri"
    aciklama: "Nakit akış tahmini, ödeme gecikmesi tahmini, anomali tespiti"
    oncelik: wont-have
    kullanici_hikayesi: "Bir CFO olarak, nakit akışımı AI destekli tahminlerle öngörmek istiyorum; böylece finansal planlamamı daha doğru yapabileyim."

  - id: REQ-016
    baslik: "Açık API ve Webhook Altyapısı"
    aciklama: "Üçüncü parti uygulamaların fatura oluşturma, sorgulama ve durum bildirimi alabilmesi için REST API ve webhook desteği"
    oncelik: should-have
    kullanici_hikayesi: "Bir yazılım geliştiricisi olarak, kendi ERP sistemimizi bu platforma entegre etmek istiyorum; böylece faturalama sürecini tamamen otomatize edebileyim."

  - id: REQ-017
    baslik: "Kurumsal Kaynak Planlama (ERP) Entegrasyonu"
    aciklama: "SAP, Oracle gibi büyük ERP sistemleriyle entegrasyon"
    oncelik: wont-have
    kullanici_hikayesi: "Bir kurumsal IT yöneticisi olarak, SAP sistemimizle doğrudan entegrasyon kurmak istiyorum; böylece faturalama sürecini merkezi ERP'den yöneteyim."

mvp_kapsami:
  - REQ-001  # e-Fatura
  - REQ-002  # e-Arşiv
  - REQ-003  # GİB Entegrasyonu
  - REQ-004  # Multi-Tenant
  - REQ-005  # Kullanıcı Yönetimi
  - REQ-006  # e-İrsaliye

rakip_analizi:
  - rakip: "Paraşüt (Mikro Yazılım)"
    guclu_yonler:
      - "Türkiye'nin en bilinen bulut muhasebe platformu; güçlü marka bilinirliği"
      - "Kapsamlı muhasebe modülü (faturanın ötesinde tam muhasebe çözümü)"
      - "Geniş entegrasyon ekosistemi (banka, e-ticaret, kargo)"
      - "Kullanıcı dostu arayüz ve mobil uygulama"
    zayif_yonler:
      - "KOBİ'ler için fiyatlandırma yükselebiliyor (kullanıcı başına ücretlendirme)"
      - "Özelleştirme imkanları sınırlı; şablon bazlı yaklaşım"
      - "API dokümantasyonu ve geliştirici deneyimi orta seviyede"

  - rakip: "Logo e-Fatura (İzibiz)"
    guclu_yonler:
      - "Türkiye'nin en büyük ERP sağlayıcısı Logo'nun altyapısı"
      - "Kurumsal müşterilerde güçlü referanslar"
      - "GİB ile doğrudan ve köklü entegrasyon deneyimi"
    zayif_yonler:
      - "Arayüz eski ve karmaşık; KOBİ kullanıcı deneyimi zayıf"
      - "Bulut-native değil; legacy mimari üzerine inşa edilmiş"
      - "Fiyatlandırma şeffaf değil; satış ekibi ile görüşme gerekli"

  - rakip: "Kolaybi"
    guclu_yonler:
      - "Uygun fiyat politikası ile KOBİ segmentine odaklı"
      - "Basit ve hızlı kurulum; dakikalar içinde fatura kesme"
      - "Temel e-Fatura/e-Arşiv ihtiyaçlarını karşılayan sade arayüz"
    zayif_yonler:
      - "Gelişmiş raporlama ve analitik eksik"
      - "API desteği sınırlı; entegrasyon imkanları dar"
      - "Toplu fatura ve otomasyon özellikleri zayıf"

  - rakip: "Uyumsoft e-Belge"
    guclu_yonler:
      - "GİB onaylı özel entegratör; doğrudan entegrasyon"
      - "e-Fatura, e-Arşiv, e-İrsaliye, e-Defter tam paket"
      - "On-premise ve bulut seçenekleri mevcut"
    zayif_yonler:
      - "Modern UX standartlarının gerisinde kalan arayüz"
      - "Self-servis onboarding zayıf; kurulum desteği gerekli"
      - "Developer-friendly API ve webhook altyapısı yetersiz"

  fark_firsatlari:
    - "Modern, React tabanlı SPA deneyimi ile rakiplerden belirgin UX farkı yaratma"
    - "Developer-first yaklaşım: açık API, webhook, SDK ile entegrasyon kolaylığı"
    - "Şeffaf ve ölçeklenebilir fiyatlandırma (fatura adedi bazlı, gizli maliyet yok)"
    - "Gerçek multi-tenant SaaS mimarisi ile hızlı onboarding (5 dakikada ilk fatura)"
    - "Toplu fatura ve otomasyon odaklı özelliklerle e-ticaret KOBİ'lerine özel değer önerisi"

kullanici_yolculugu:
  persona: "Ayşe — 35 yaşında, 12 çalışanlı bir e-ticaret firmasının sahibi. Muhasebe işlerini yarı zamanlı bir muhasebeci ile yürütüyor. Aylık 200-400 arası fatura kesiyor. Excel ve mevcut entegratörün eski arayüzünden bıkmış durumda."
  adimlar:
    - adim: "Farkındalık"
      aciklama: "Google araması veya sektör forumlarında platformu keşfeder"
      his: "Meraklı ama şüpheci — 'bir tane daha mı var?'"
      surtuşme: "Rakiplerden fark net anlaşılmazsa sayfa terk edilir"

    - adim: "Kayıt ve Onboarding"
      aciklama: "Ücretsiz deneme ile kayıt olur, firma bilgilerini girer, GİB mükellef bilgileri doğrulanır"
      his: "Heyecanlı ama sabırsız — hızlı sonuç görmek istiyor"
      surtuşme: "GİB mükellef doğrulaması uzun sürerse veya belge istenirse terk riski"

    - adim: "İlk Fatura Oluşturma"
      aciklama: "Müşteri bilgisi girerek veya şablondan ilk e-Faturasını oluşturur"
      his: "Kontrol hissi — 'gerçekten bu kadar kolay mı?'"
      surtuşme: "UBL-TR alanları karmaşık gelirse, zorunlu alan hataları moral bozar"

    - adim: "GİB'e Gönderim ve Durum Takibi"
      aciklama: "Faturayı GİB'e gönderir, anlık durum güncellemesini takip eder"
      his: "Tedirgin — 'GİB kabul edecek mi?'"
      surtuşme: "GİB red yanıtı gelirse net bir hata açıklaması ve düzeltme rehberi olmazsa panik"

    - adim: "Aha Anı (Değer Farkındalığı)"
      aciklama: "İlk 10 faturayı sorunsuz kesip, eski sistemle arasındaki zaman farkını fark eder"
      his: "Rahatlama ve memnuniyet — 'neden daha önce geçmedim?'"
      surtuşme: "İlk hafta içinde teknik bir sorun yaşanırsa güven kaybı"

    - adim: "Genişleme"
      aciklama: "Muhasebecisini davet eder, toplu fatura özelliğini keşfeder, ücretli plana geçer"
      his: "Güven — 'bu bizim ana aracımız olabilir'"
      surtuşme: "Fiyatlandırma sürprizi veya plan limitlerinin belirsizliği"

risk_degerlendirmesi:
  - risk: "GİB API değişiklikleri ve kesintileri"
    etki: yüksek
    olasilik: orta
    azaltma_stratejisi: "GİB API'sini soyutlayan bir adaptör katmanı oluştur. Değişiklikleri izleyen otomatik sağlık kontrolleri kur. GİB kesintilerinde fatura kuyruklama mekanizması ile veri kaybını önle."

  - risk: "Veri güvenliği ihlali ve KVKK uyumsuzluğu"
    etki: yüksek
    olasilik: düşük
    azaltma_stratejisi: "Tenant izolasyonunu Row-Level Security (RLS) ile PostgreSQL seviyesinde garanti altına al. Tüm hassas verileri AES-256 ile şifrele. Yıllık penetrasyon testi ve KVKK uyumluluk denetimi yaptır."

  - risk: "Düşük aktivasyon oranı (kayıt olup fatura kesmeyenler)"
    etki: orta
    olasilik: yüksek
    azaltma_stratejisi: "Onboarding wizard ile 5 adımda ilk faturaya ulaştır. Demo firma verisiyle sandbox ortamı sun. İlk 7 gün proaktif e-posta ve in-app rehberlik ile kullanıcıyı yönlendir."

  - risk: "Özel entegratör lisansı alma sürecinin uzaması"
    etki: yüksek
    olasilik: orta
    azaltma_stratejisi: "İlk fazda mevcut lisanslı bir özel entegratör ile anlaşarak hızla pazara gir. Paralelde kendi özel entegratör başvuru sürecini başlat. Entegratör bağımsız bir adaptör katmanı ile geçiş maliyetini minimize et."

  - risk: "KOBİ müşterilerde yüksek churn (özellikle ilk 3 ay)"
    etki: orta
    olasilik: orta
    azaltma_stratejisi: "Kullanım bazlı uyarı sistemi kur; 2 hafta aktif olmayan hesaplara otomatik ulaş. Yıllık ödeme indirimi ile müşteri bağlılığını artır. NPS anketi ve çıkış mülakatı ile churn nedenlerini sürekli analiz et."

  - risk: "Performans sorunları yüksek fatura hacminde"
    etki: orta
    olasilik: orta
    azaltma_stratejisi: "Toplu fatura işlemlerini kuyruk bazlı (Bull/BullMQ) asenkron mimariye al. PostgreSQL partitioning ile büyük tenant verilerini yönet. Yük testlerini CI/CD pipeline'ına entegre et."

basari_metrikleri:
  - kpi: "Aylık Yinelenen Gelir (MRR)"
    hedef: "İlk 12 ayda 150.000 TL MRR"
    olcum_yontemi: "Stripe/iyzico abonelik verileri üzerinden aylık takip"
    kategori: iş

  - kpi: "Aktif Müşteri Sayısı"
    hedef: "İlk 12 ayda 500 aktif firma"
    olcum_yontemi: "Son 30 günde en az 1 fatura oluşturan benzersiz tenant sayısı"
    kategori: iş

  - kpi: "Müşteri Edinme Maliyeti (CAC)"
    hedef: "< 800 TL / müşteri"
    olcum_yontemi: "Toplam pazarlama+satış harcaması / yeni müşteri sayısı (aylık)"
    kategori: iş

  - kpi: "Aktivasyon Oranı (Kayıt → İlk Fatura)"
    hedef: "%60 üzeri (ilk 7 gün içinde)"
    olcum_yontemi: "Kayıt olan kullanıcılardan 7 gün içinde en az 1 fatura oluşturanların oranı"
    kategori: ürün

  - kpi: "Aylık Churn Oranı"
    hedef: "< %5"
    olcum_yontemi: "İptal eden veya 30+ gün pasif kalan firma sayısı / toplam aktif firma"
    kategori: ürün

  - kpi: "Net Promoter Score (NPS)"
    hedef: "50+"
    olcum_yontemi: "Üç ayda bir uygulama içi NPS anketi, 0-10 ölçeğinde"
    kategori: ürün

yol_haritasi:
  - faz: "MVP"
    sure_tahmini: "10 hafta"
    gereksinimler:
      - REQ-001  # e-Fatura
      - REQ-002  # e-Arşiv
      - REQ-003  # GİB Entegrasyonu
      - REQ-004  # Multi-Tenant
      - REQ-005  # Kullanıcı Yönetimi
      - REQ-006  # e-İrsaliye
    kilometre_taslari:
      - "Hafta 2: Multi-tenant altyapı ve auth sistemi hazır"
      - "Hafta 4: GİB entegrasyon adaptörü tamamlanmış, sandbox testleri geçiyor"
      - "Hafta 6: e-Fatura ve e-Arşiv oluşturma/gönderme akışı çalışıyor"
      - "Hafta 8: e-İrsaliye modülü tamamlanmış, uçtan uca testler geçiyor"
      - "Hafta 9: Kapalı beta — 10-15 pilot KOBİ ile gerçek fatura kesimi"
      - "Hafta 10: Beta geri bildirimleri işlenmiş, public launch"

  - faz: "Faz 2 — Verimlilik ve Entegrasyon"
    sure_tahmini: "8 hafta"
    gereksinimler:
      - REQ-007  # Şablonlar
      - REQ-008  # Dashboard ve Raporlama
      - REQ-009  # Gelen Fatura Yönetimi
      - REQ-011  # Toplu Fatura
      - REQ-016  # Açık API ve Webhook
    kilometre_taslari:
      - "Hafta 2: Fatura şablonları ve müşteri rehberi kullanıma hazır"
      - "Hafta 4: Dashboard v1 ve temel raporlar canlıda"
      - "Hafta 6: Toplu fatura ve gelen fatura yönetimi tamamlanmış"
      - "Hafta 8: REST API ve webhook altyapısı dökümante edilmiş, developer portal açılmış"

  - faz: "Faz 3 — Büyüme ve Ekosistem"
    sure_tahmini: "8 hafta"
    gereksinimler:
      - REQ-010  # Muhasebe Yazılımı Entegrasyonu
      - REQ-012  # Mobil Uyumlu Arayüz
      - REQ-013  # Bildirimler
      - REQ-014  # Çoklu Dil ve Döviz
    kilometre_taslari:
      - "Hafta 3: Paraşüt ve Logo entegrasyonları tamamlanmış"
      - "Hafta 5: Responsive mobil arayüz canlıda"
      - "Hafta 7: E-posta/SMS bildirim sistemi aktif"
      - "Hafta 8: Çoklu döviz desteği ve İngilizce arayüz seçeneği yayında"

notlar: |
  1. **Özel Entegratör Stratejisi:** MVP'de mevcut lisanslı bir özel entegratör (örn. Foriba, Uyumsoft) üzerinden GİB'e bağlanmak pazara giriş süresini 3-4 ay kısaltır. Kendi özel entegratör lisansı başvurusu paralelde yürütülmelidir.
  
  2. **Fiyatlandırma Modeli:** KOBİ segmentine uygun fatura adedi bazlı kademeli fiyatlandırma önerilir (örn: 0-100 fatura/ay: 499 TL, 101-500: 999 TL, 500+: 1.999 TL). Yıllık ödemede %20 indirim ile churn azaltılabilir.
  
  3. **Rekabet Avantajı:** Türkiye'deki mevcut çözümlerin çoğu legacy mimarilere sahip. Modern bir React SPA + Node.js API stack'i ile hem geliştirici deneyiminde hem kullanıcı deneyiminde belirgin fark yaratılabilir.
  
  4. **KVKK ve Veri Lokasyonu:** Tüm veriler Türkiye'deki veri merkezlerinde barındırılmalıdır. Bu hem yasal gereklilik hem de KOBİ müşteriler için güven unsurudur.
  
  5. **Go-to-Market:** Mali müşavirler en güçlü kanal olabilir — bir mali müşavir ortalama 20-50 KOBİ'ye hizmet verir. Mali müşavir portalı ve komisyon modeli Faz 2'de değerlendirilmelidir.
  
  6. **Teknik Dikkat Noktası:** GİB'in UBL-TR XML şema versiyonları zaman zaman güncellenir. XML oluşturma katmanı şema versiyonundan bağımsız ve konfigüre edilebilir olmalıdır.
```

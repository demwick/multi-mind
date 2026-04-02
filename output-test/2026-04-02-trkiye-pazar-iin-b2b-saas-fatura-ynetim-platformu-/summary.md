# multi-mind Analiz Raporu

**Tarih:** 2026-04-02
**Brief:** Türkiye pazarı için B2B SaaS fatura yönetim platformu. KOBİ hedef kitle. e-Fatura, e-Arşiv, e-İrsaliye, GİB entegrasyonu. React, Node.js, PostgreSQL. Multi-tenant.
**Toplam Süre:** 650.05s

---

## Product Manager

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


---

## CTO / Tech Lead

```yaml
teknoloji_kararlari:
  - karar_id: ADR-001
    kategori: frontend
    karar: "React 18 + Next.js 14 (App Router) + TypeScript"
    bagiam: "KOBİ kullanıcılarına modern, hızlı ve responsive bir SPA deneyimi sunulması gerekiyor. SEO gereksinimleri sınırlı (B2B SaaS dashboard), ancak SSR ile login/landing sayfaları için performans avantajı sağlanmalı."
    alternatifler:
      - "Vue.js 3 + Nuxt — Daha düşük öğrenme eğrisi ancak Türkiye'de React ekosistemi ve yetenek havuzu çok daha geniş"
      - "Angular — Kurumsal projelerde güçlü ancak KOBİ odaklı hızlı iterasyon için aşırı yapısal yük getirir"
    gerekce: "React, Türkiye'deki en geniş geliştirici havuzuna sahip. Next.js ile SSR/SSG esnekliği, API routes ile BFF katmanı ve Vercel üzerinde kolay deployment sağlanır. TypeScript ile fatura gibi karmaşık domain modellerinde tip güvenliği kritik."
    odunlesimler: "Next.js App Router henüz bazı edge case'lerde olgunlaşmamış. Bundle size React ile Vue'ya kıyasla daha büyük olabilir ancak tree-shaking ve code splitting ile yönetilebilir."

  - karar_id: ADR-002
    kategori: backend
    karar: "Node.js 20 LTS + NestJS + TypeScript"
    bagiam: "GİB web servisleriyle SOAP/XML entegrasyonu, multi-tenant RBAC, kuyruk bazlı asenkron işlemler ve REST API sunulması gerekiyor."
    alternatifler:
      - "Express.js — Daha minimal ancak büyük projelerde yapı eksikliği teknik borç yaratır; DI, modülerlik ve test altyapısı manuel kurulmalı"
      - "Go (Gin/Fiber) — Performans avantajı var ancak XML/SOAP işleme ekosistemi zayıf; GİB UBL-TR entegrasyonu için olgun kütüphane yok"
    gerekce: "NestJS, modüler mimari, yerleşik DI container, guard/interceptor yapıları ile multi-tenant ve RBAC gereksinimlerine doğal uyum sağlar. TypeScript ile frontend arasında tip paylaşımı mümkün. Node.js XML işleme kütüphaneleri (fast-xml-parser, xmlbuilder2) GİB UBL-TR formatı için yeterli."
    odunlesimler: "Node.js tek thread'li event loop ile CPU-yoğun XML imzalama işlemlerinde darboğaz yaratabilir — worker threads veya ayrı microservice ile çözülür. NestJS öğrenme eğrisi Express'e kıyasla daha dik."

  - karar_id: ADR-003
    kategori: veritabani
    karar: "PostgreSQL 16 + Prisma ORM"
    bagiam: "Multi-tenant veri izolasyonu (RLS), karmaşık fatura ilişkileri, JSONB ile esnek metadata depolama ve KVKK uyumlu veri yönetimi gerekiyor."
    alternatifler:
      - "MySQL 8 — Yaygın ancak RLS desteği yok; tenant izolasyonu uygulama katmanında yapılmalı ki bu güvenlik riski"
      - "MongoDB — Esnek şema avantajı var ancak fatura verileri ilişkisel yapıda; ACID transaction gereksinimleri güçlü; GİB raporlama sorguları SQL ile çok daha verimli"
    gerekce: "PostgreSQL'in Row-Level Security (RLS) özelliği multi-tenant izolasyonu veritabanı seviyesinde garanti eder — uygulama katmanında tenant filtresi unutulsa bile veri sızıntısı olmaz. Partitioning ile büyük tenant'ların fatura tablolarını yönetmek mümkün. Prisma ile type-safe sorgular ve migration yönetimi sağlanır."
    odunlesimler: "Prisma, ham SQL performansının gerisinde kalabilir — karmaşık raporlama sorguları için raw SQL escape hatch kullanılması gerekebilir. PostgreSQL operasyonel karmaşıklığı MySQL'e kıyasla biraz daha yüksek."

  - karar_id: ADR-004
    kategori: altyapi
    karar: "AWS (İstanbul Bölgesi — eu-south-2) + ECS Fargate + RDS PostgreSQL"
    bagiam: "KVKK gereği veriler Türkiye'de barındırılmalı. Yönetilen servislerle operasyonel yük minimize edilmeli. Ölçeklenebilir konteyner altyapısı gerekli."
    alternatifler:
      - "Google Cloud (Doha bölgesi) — Türkiye'de bölgesi yok; en yakın Doha KVKK için yeterli değil"
      - "Hetzner/DigitalOcean Türkiye — Maliyet avantajı var ancak managed servis çeşitliliği çok sınırlı; SQS, SES, CloudWatch muadilleri yok"
    gerekce: "AWS İstanbul bölgesi (eu-south-2) KVKK uyumluluğunu doğrudan sağlar. ECS Fargate ile Kubernetes karmaşıklığı olmadan konteyner orkestrasyonu yapılır. RDS ile yönetilen PostgreSQL, otomatik yedekleme ve failover sunar. SQS, SES, CloudWatch gibi yönetilen servisler ile yap-satın al kararları kolaylaşır."
    odunlesimler: "AWS maliyetleri Hetzner gibi alternatiflere kıyasla 3-5x daha yüksek. Vendor lock-in riski var ancak konteyner bazlı mimari ile taşınabilirlik korunur. İstanbul bölgesi diğer AWS bölgelerine kıyasla servis çeşitliliği biraz daha sınırlı olabilir."

  - karar_id: ADR-005
    kategori: servis
    karar: "Redis (ElastiCache) — Oturum yönetimi, önbellek ve rate limiting"
    bagiam: "Multi-tenant ortamda oturum yönetimi, API rate limiting ve sık erişilen verilerin (müşteri listesi, ürün kataloğu) önbelleklenmesi gerekiyor."
    alternatifler:
      - "Memcached — Daha basit ancak persistence yok; rate limiting için veri yapısı desteği yetersiz"
      - "Uygulama içi bellek önbellek — Birden fazla container instance'ında tutarsızlık yaratır"
    gerekce: "Redis sorted set'leri ile sliding window rate limiting, pub/sub ile gerçek zamanlı bildirimler ve string/hash yapıları ile oturum yönetimi tek araçla çözülür. ElastiCache ile yönetilen Redis operasyonel yükü azaltır."
    odunlesimler: "Ek altyapı maliyeti (aylık ~$50-150). Redis tek bir failure point olabilir — ElastiCache Multi-AZ ile azaltılır."

  - karar_id: ADR-006
    kategori: servis
    karar: "BullMQ — Asenkron iş kuyruğu (fatura gönderimi, toplu işlemler, bildirimler)"
    bagiam: "GİB'e fatura gönderimi senkron yapılmamalı — GİB kesintilerinde kuyrukta bekletme, retry ve dead letter queue gerekiyor. Toplu fatura oluşturma (REQ-011) asenkron olmalı."
    alternatifler:
      - "AWS SQS — Yönetilen servis avantajı ancak Node.js ekosisteminde BullMQ kadar ergonomik değil; delayed jobs ve cron-like scheduling için ek yapılandırma gerekli"
      - "RabbitMQ — Güçlü ancak ayrı altyapı yönetimi ve operasyonel karmaşıklık getirir"
    gerekce: "BullMQ Redis üzerinde çalışır (zaten mevcut), Node.js native, TypeScript desteği mükemmel. Rate limiting, delayed jobs, repeatable jobs, priority queues ve dashboard (Bull Board) ile tam kontrol. PM'in belirttiği kuyruk bazlı asenkron mimari gereksinimini doğrudan karşılar."
    odunlesimler: "Redis'e bağımlılık yaratır (zaten var). AWS SQS'e kıyasla operasyonel sorumluluk uygulama tarafında. Çok yüksek hacimde (100K+ job/saat) Redis bellek yönetimi dikkat gerektirir."

yap_satin_al_acik_kaynak:
  - yetenek: "e-Fatura / e-Arşiv / e-İrsaliye GİB Entegrasyonu"
    karar: satın-al
    arac_veya_servis: "Foriba veya Uyumsoft Özel Entegratör API'si (MVP için)"
    gerekce: "Kendi özel entegratör lisansı alma süreci 6-12 ay sürebilir. MVP'de mevcut lisanslı bir entegratör üzerinden GİB'e bağlanmak pazara giriş süresini 3-4 ay kısaltır. Adaptör katmanı ile entegratör değişimi veya kendi lisansa geçiş maliyetsiz yapılır."

  - yetenek: "Kimlik Doğrulama ve Yetkilendirme"
    karar: açık-kaynak
    arac_veya_servis: "Passport.js + custom JWT + RBAC middleware (NestJS Guards)"
    gerekce: "Multi-tenant RBAC gereksinimleri projeye özgü (firma bazlı roller, davet sistemi). Auth0/Clerk gibi SaaS çözümler tenant bazlı role mapping için aşırı konfigürasyon gerektirir ve kullanıcı başına maliyet KOBİ fiyatlandırmasını olumsuz etkiler. Kendi auth katmanı tam kontrol sağlar."

  - yetenek: "E-posta Gönderimi"
    karar: satın-al
    arac_veya_servis: "AWS SES"
    gerekce: "Fatura bildirimleri, davet e-postaları ve vade hatırlatmaları için güvenilir e-posta altyapısı gerekli. SES $0.10/1000 e-posta ile maliyet etkin. Kendi SMTP sunucusu kurmak deliverability sorunları ve operasyonel yük getirir."

  - yetenek: "SMS Bildirimleri"
    karar: satın-al
    arac_veya_servis: "Netgsm veya İletimerkezi API"
    gerekce: "Türkiye'de SMS gönderimi için yerel sağlayıcılar gerekli (Twilio Türkiye'de pahalı ve numara temini zor). Netgsm uygun fiyatlı ve yaygın kullanılan bir çözüm."

  - yetenek: "Ödeme ve Abonelik Yönetimi"
    karar: satın-al
    arac_veya_servis: "iyzico (Türkiye) + Stripe (uluslararası genişleme için)"
    gerekce: "iyzico Türkiye'de en yaygın ödeme altyapısı; TL ile recurring billing desteği var. Kendi ödeme sistemi kurmak PCI-DSS uyumluluk yükü getirir."

  - yetenek: "PDF Oluşturma (Fatura çıktısı)"
    karar: açık-kaynak
    arac_veya_servis: "Puppeteer (headless Chrome) veya @react-pdf/renderer"
    gerekce: "Fatura PDF'leri GİB formatına uygun ve özelleştirilebilir olmalı. HTML şablon → PDF dönüşümü ile esnek tasarım sağlanır. Ticari PDF servisleri bu basit kullanım için gereksiz maliyet."

  - yetenek: "XML İmzalama (e-Fatura dijital imza)"
    karar: yap
    arac_veya_servis: "xml-crypto + node-forge kütüphaneleri ile custom implementasyon"
    gerekce: "GİB UBL-TR XML imzalama standartları Türkiye'ye özgü; hazır bir SaaS çözüm yok. xml-crypto kütüphanesi XAdES-BES imzalama için kullanılabilir. Özel entegratör kullanıldığında imzalama entegratör tarafında yapılır; kendi lisans alındığında bu modül devreye girer."

  - yetenek: "Monitoring ve Logging"
    karar: satın-al
    arac_veya_servis: "AWS CloudWatch + Sentry (hata takibi)"
    gerekce: "CloudWatch zaten AWS altyapısıyla entegre. Sentry frontend ve backend hata takibinde endüstri standardı; ücretsiz katmanı MVP için yeterli. ELK stack kurmak operasyonel yük getirir."

  - yetenek: "Dosya Depolama (Fatura PDF, XML arşiv)"
    karar: satın-al
    arac_veya_servis: "AWS S3 (İstanbul bölgesi)"
    gerekce: "Fatura XML ve PDF dosyaları yasal olarak 10 yıl saklanmalı. S3 Glacier ile arşivleme maliyeti çok düşük. Kendi dosya sistemi yönetmek ölçeklenebilirlik ve dayanıklılık riski taşır."

olceklenebilirlik:
  senaryo_1x:
    kullanici_sayisi: "500 firma / ~1.500 kullanıcı"
    aylik_fatura_hacmi: "~100.000 fatura/ay"
    mimari_notlari: "Tek bir ECS Fargate task (2 vCPU, 4GB RAM) + RDS db.t3.medium yeterli. Redis t3.small. Monolitik NestJS uygulaması, ayrı worker process ile kuyruk tüketimi. Tek AZ deployment kabul edilebilir, RDS Multi-AZ önerilir."
  senaryo_10x:
    kullanici_sayisi: "5.000 firma / ~15.000 kullanıcı"
    aylik_fatura_hacmi: "~1.000.000 fatura/ay"
    gerekli_degisiklikler:
      - "ECS Fargate auto-scaling (2-8 task) ile yatay ölçekleme"
      - "RDS db.r6g.large'a yükseltme + read replica ekleme (raporlama sorguları için)"
      - "PostgreSQL partitioning — fatura tablosunu tenant_id + ay bazlı partition'lama"
      - "CDN (CloudFront) ile statik asset ve PDF dağıtımı"
      - "Redis cluster mode ile önbellek kapasitesini artırma"
      - "GİB entegratör API rate limit yönetimi — tenant bazlı fair queuing"
      - "Ayrı raporlama microservice'i — ağır analitik sorguları ana DB'den izole etme"
  senaryo_100x:
    kullanici_sayisi: "50.000 firma / ~150.000 kullanıcı"
    aylik_fatura_hacmi: "~10.000.000 fatura/ay"
    gerekli_degisiklikler:
      - "Kubernetes (EKS) geçişi — Fargate'in ötesinde ince taneli kaynak yönetimi"
      - "CQRS pattern — yazma ve okuma modellerinin ayrıştırılması"
      - "Event-driven mimari — EventBridge veya Kafka ile servisler arası iletişim"
      - "Veritabanı sharding — büyük tenant'lar için ayrı DB instance'ları"
      - "Kendi özel entegratör lisansı zorunlu — entegratör API maliyeti bu ölçekte sürdürülemez"
      - "Dedicated DevOps/SRE ekibi — 7/24 on-call rotasyonu"
      - "Multi-region deployment düşünülmeli (DR amaçlı, ikinci bölge pasif)"
      - "Elasticsearch ile tam metin arama ve gelişmiş fatura sorgulama"

guvenlik:
  kimlik_dogrulama: "JWT (access token 15dk + refresh token 7 gün) + bcrypt ile parola hash. MFA (TOTP) opsiyonel — admin kullanıcılar için zorunlu hale getirilebilir. Firma davet sistemi ile e-posta doğrulamalı kayıt."
  veri_sifreleme: "TLS 1.3 ile aktarımda şifreleme (AWS ACM ile sertifika yönetimi). AES-256 ile durağan halde hassas veri şifreleme (vergi kimlik no, banka bilgileri). RDS encryption at rest varsayılan olarak aktif. S3 server-side encryption (SSE-S3)."
  api_guvenligi: "Rate limiting — tenant bazlı (100 req/dk) ve endpoint bazlı (fatura oluşturma 30 req/dk). API key + JWT ile çift katmanlı kimlik doğrulama (harici API tüketicileri için). CORS whitelist. Request body size limiti (5MB). Helmet.js ile HTTP güvenlik header'ları."
  uyumluluk:
    - "KVKK (6698 sayılı Kişisel Verilerin Korunması Kanunu) — Veri işleme envanteri, açık rıza yönetimi, veri silme/anonimleştirme mekanizması"
    - "GİB e-Belge Teknik Kılavuzları — UBL-TR 1.2 şema uyumluluğu"
    - "5070 sayılı Elektronik İmza Kanunu — Nitelikli elektronik sertifika ile imzalama"
    - "VUK (Vergi Usul Kanunu) — Elektronik belge saklama yükümlülüğü (10 yıl)"
  oncelikli_tehditler:
    - tehdit: "Tenant veri sızıntısı (IDOR/Broken Access Control)"
      onlem: "PostgreSQL RLS ile veritabanı seviyesinde tenant izolasyonu. Her sorgu otomatik olarak tenant_id filtresinden geçer. NestJS Guard'ları ile request seviyesinde tenant doğrulama. Penetrasyon testlerinde IDOR senaryoları öncelikli."
    - tehdit: "XML Injection / XXE saldırıları (GİB XML işleme)"
      onlem: "XML parser'da external entity resolution devre dışı. Gelen GİB yanıtlarında strict XML validation. libxmljs2 yerine fast-xml-parser (XXE'ye karşı varsayılan güvenli)."
    - tehdit: "Hesap ele geçirme (credential stuffing)"
      onlem: "Login rate limiting (5 başarısız deneme sonrası 15dk kilit). bcrypt cost factor 12. Breached password kontrolü (Have I Been Pwned API). Admin hesaplarında MFA zorunlu."
    - tehdit: "SQL Injection"
      onlem: "Prisma ORM parametrik sorgular kullanır — raw SQL kullanıldığında $queryRawUnsafe yerine $queryRaw ile parametre binding zorunlu. ESLint kuralı ile unsafe sorgu kullanımı engellenir."
    - tehdit: "Fatura verisinin manipülasyonu (integrity)"
      onlem: "Fatura oluşturulduktan sonra immutable — güncelleme yerine iptal + yeni fatura. Audit log ile tüm değişikliklerin kaydı. Dijital imza ile bütünlük doğrulaması."

devops_cicd:
  araclar:
    - "GitHub Actions — CI/CD pipeline (build, test, deploy)"
    - "Docker — Uygulama konteynerizasyonu"
    - "AWS ECS Fargate — Konteyner orkestrasyonu (Kubernetes karmaşıklığı olmadan)"
    - "Terraform — Infrastructure as Code"
    - "Sentry — Hata izleme ve alerting"
    - "AWS CloudWatch — Log aggregation ve metrik izleme"
    - "Dependabot — Bağımlılık güvenlik güncellemeleri"
  pipeline_adimlari:
    - "Kod push → GitHub Actions tetiklenir"
    - "Lint (ESLint + Prettier) ve type check (tsc --noEmit)"
    - "Unit testler (Vitest) ve integration testler (Testcontainers + PostgreSQL)"
    - "Docker image build ve ECR'ye push"
    - "Staging ortamına otomatik deploy"
    - "Smoke testler (staging üzerinde API health check + kritik akış testi)"
    - "Manuel onay gate (production deploy için)"
    - "Production deploy (blue-green)"
    - "Post-deploy health check ve otomatik rollback (hata oranı eşik aşarsa)"
  konteynerizasyon: "Docker multi-stage build — builder stage (npm ci + build) ve runner stage (node:20-slim). Her servis için ayrı Dockerfile. docker-compose ile local geliştirme ortamı (PostgreSQL, Redis, MinIO)."
  iac_yaklasimi: "Terraform ile AWS kaynakları yönetimi. Terraform state S3 + DynamoDB backend'de saklanır. Modüler yapı: networking, database, compute, monitoring ayrı modüller. Ortam bazlı tfvars dosyaları (dev, staging, prod)."
  surum_stratejisi: "blue-green"
  ortam_stratejisi:
    - "development — Yerel Docker Compose ortamı, mock GİB API"
    - "staging — AWS'de production benzeri ortam, GİB test (sandbox) ortamına bağlı"
    - "production — AWS İstanbul bölgesi, gerçek GİB entegrasyonu"

ekip_kompozisyonu:
  - rol: "Full-Stack Lead Developer"
    kisi_sayisi: 1
    kritik_beceriler:
      - "NestJS + TypeScript uzmanı"
      - "PostgreSQL ve multi-tenant mimari deneyimi"
      - "AWS altyapı deneyimi"
      - "e-Fatura / GİB entegrasyon bilgisi (tercih)"
    kaynak_tipi: iç

  - rol: "Frontend Developer"
    kisi_sayisi: 1
    kritik_beceriler:
      - "React + Next.js deneyimi"
      - "TypeScript"
      - "Responsive tasarım ve erişilebilirlik"
      - "Form-heavy uygulama deneyimi (fatura formları karmaşık)"
    kaynak_tipi: iç

  - rol: "Backend Developer"
    kisi_sayisi: 1
    kritik_beceriler:
      - "Node.js + NestJS"
      - "XML/SOAP web servisleri deneyimi (GİB entegrasyonu)"
      - "Kuyruk sistemleri (BullMQ/Redis)"
      - "PostgreSQL"
    kaynak_tipi: iç

  - rol: "DevOps / Altyapı (Yarı Zamanlı)"
    kisi_sayisi: 1
    kritik_beceriler:
      - "AWS (ECS, RDS, S3, SES)"
      - "Terraform"
      - "Docker ve CI/CD pipeline"
      - "Monitoring ve alerting kurulumu"
    kaynak_tipi: freelance

  - rol: "UI/UX Tasarımcı (İlk 4 Hafta)"
    kisi_sayisi: 1
    kritik_beceriler:
      - "B2B SaaS dashboard tasarımı"
      - "Figma"
      - "Form ve tablo ağırlıklı arayüz deneyimi"
    kaynak_tipi: freelance

  - rol: "QA / Test (Son 3 Hafta)"
    kisi_sayisi: 1
    kritik_beceriler:
      - "E2E test deneyimi (Playwright/Cypress)"
      - "GİB fatura senaryoları bilgisi"
      - "API test otomasyonu"
    kaynak_tipi: freelance

maliyet_dokumu:
  altyapi_aylik:
    dusuk_tahmin: "$800"
    yuksek_tahmin: "$1.500"
    detaylar:
      - "ECS Fargate (2 task, 2vCPU/4GB): $150-250/ay"
      - "RDS PostgreSQL (db.t3.medium, Multi-AZ): $150-200/ay"
      - "ElastiCache Redis (cache.t3.small): $50-80/ay"
      - "S3 (fatura arşivi, 100GB başlangıç): $5-10/ay"
      - "CloudFront CDN: $20-50/ay"
      - "ALB (Application Load Balancer): $30-50/ay"
      - "CloudWatch Logs + Metrics: $30-50/ay"
      - "NAT Gateway: $50-100/ay"
      - "Data transfer: $30-80/ay"
      - "Diğer (Route53, ACM, Secrets Manager): $20-30/ay"
      - "Staging ortamı (production'ın ~%40'ı): $250-500/ay"
  ucuncu_taraf_servisler:
    - servis: "Özel Entegratör (Foriba/Uyumsoft)"
      maliyet: "$300-800/ay (fatura hacmine bağlı)"
      amaci: "GİB'e e-Fatura, e-Arşiv, e-İrsaliye iletimi"
    - servis: "Sentry"
      maliyet: "$0-26/ay (Team plan)"
      amaci: "Frontend ve backend hata izleme"
    - servis: "GitHub (Team)"
      maliyet: "$4/kullanıcı/ay (~$16/ay)"
      amaci: "Kaynak kod yönetimi, CI/CD (Actions)"
    - servis: "iyzico"
      maliyet: "İşlem başına %3.49 + sabit ücret"
      amaci: "Müşteri abonelik ödemeleri"
    - servis: "AWS SES"
      maliyet: "$10-30/ay"
      amaci: "Transactional e-posta (fatura bildirimleri, davetler)"
    - servis: "Netgsm SMS"
      maliyet: "$20-50/ay (hacme bağlı)"
      amaci: "SMS bildirimleri (Faz 3'te aktif)"
    - servis: "Vercel (Frontend hosting alternatifi)"
      maliyet: "$20/ay (Pro plan)"
      amaci: "Next.js frontend deployment — ECS'ye alternatif olarak değerlendirilebilir"
  gelistirme_cabasi:
    kisi_hafta: "36-48 kişi-hafta (MVP, 10 hafta)"
    maliyet_aralik_usd: "45.000-75.000"
    varsayimlar:
      - "3 tam zamanlı geliştirici (lead + frontend + backend) — 10 hafta = 30 kişi-hafta"
      - "1 yarı zamanlı DevOps — 10 hafta x %50 = 5 kişi-hafta"
      - "1 UI/UX tasarımcı — 4 hafta = 4 kişi-hafta"
      - "1 QA — 3 hafta = 3 kişi-hafta"
      - "Türkiye merkezli geliştirici maliyeti: aylık $2.500-4.000 (kıdemli)"
      - "GİB sandbox ortamı entegrasyon testleri için ek 1-2 hafta buffer dahil"
      - "Özel entegratör anlaşma süreci paralelde yürütülür (geliştirme süresine eklenmez)"

teknik_riskler:
  - risk: "GİB API değişiklikleri ve kesintileri — UBL-TR şema versiyonu güncellemeleri, plansız bakım süreleri"
    severity: yüksek
    azaltma: "GİB entegrasyonunu soyut bir adaptör katmanı (port/adapter pattern) arkasına al. Entegratör değişikliği sadece adaptör implementasyonunu etkiler. GİB kesintilerinde faturalar BullMQ kuyruğunda bekletilir, otomatik retry ile gönderilir. GİB durum endpoint'ine health check cron job (5dk aralık) ile kesinti erken tespit edilir."

  - risk: "Multi-tenant veri sızıntısı — Uygulama hatası nedeniyle bir tenant'ın başka tenant verilerine erişmesi"
    severity: yüksek
    azaltma: "PostgreSQL RLS politikaları ile veritabanı seviyesinde zorunlu tenant izolasyonu. Her request'te tenant_id session variable olarak set edilir ve RLS politikaları bunu filtreler. Uygulama katmanında NestJS interceptor ile ikinci savunma katmanı. Otomatik integration testleri ile cross-tenant erişim senaryoları sürekli test edilir."

  - risk: "Özel entegratör bağımlılığı — Seçilen entegratörün fiyat artırması, hizmet kalitesi düşüşü veya kapanması"
    severity: orta
    azaltma: "Adaptör pattern sayesinde entegratör değişimi 1-2 haftalık efor ile yapılabilir. İkinci bir entegratör ile yedek anlaşma hazır tutulur. Paralelde kendi özel entegratör lisansı başvurusu yapılır (6-12 ay süreç)."

  - risk: "XML imzalama ve UBL-TR format uyumsuzlukları — GİB'in red yanıtları, format hataları"
    severity: orta
    azaltma: "GİB sandbox ortamında kapsamlı test senaryoları (farklı fatura tipleri, KDV oranları, istisna kodları). XML şema validasyonu fatura oluşturma aşamasında yapılır — GİB'e göndermeden önce hata yakalanır. GİB'in yayınladığı örnek XML'ler ile regression test suite oluşturulur."

  - risk: "10 haftalık MVP takviminin kayması — GİB entegrasyonu beklenenden karmaşık çıkabilir"
    severity: orta
    azaltma: "İlk 4 haftada GİB entegrasyonu önceliklendirilir — en riskli bileşen en erken başlar. Hafta 4 sonunda GİB sandbox'ta başarılı fatura gönderimi kilometre taşı. Bu taş tutturulamazsa kapsam daraltılır (e-İrsaliye Faz 2'ye ertelenebilir)."

  - risk: "Performans sorunları toplu fatura işlemlerinde — 500+ faturanın aynı anda oluşturulması"
    severity: düşük
    azaltma: "Toplu fatura işlemleri BullMQ ile asenkron. Batch size limiti (100 fatura/batch). Worker concurrency ayarlanabilir. MVP'de toplu fatura should-have olarak zaten Faz 2'de."

fizibilite: yüksek

fizibilite_notlari: |
  Proje teknik açıdan yüksek fizibiliteye sahiptir. Temel gerekçeler:
  
  1. **Kanıtlanmış teknoloji yığını:** React, Node.js, PostgreSQL üçlüsü dünya genelinde binlerce SaaS ürününde başarıyla kullanılmaktadır. Türkiye'deki geliştirici havuzu geniştir.
  
  2. **Kritik bağımlılık yönetilebilir:** GİB entegrasyonu en büyük teknik risk olmakla birlikte, mevcut özel entegratör API'leri üzerinden bu risk MVP için ortadan kalkar. Adaptör pattern ile uzun vadeli esneklik korunur.
  
  3. **Ölçeklenebilirlik yolu açık:** Monolitik başlangıç → yatay ölçekleme → microservice ayrıştırma yolu net. Erken optimizasyon yapılmadan, ihtiyaç duyuldukça ölçekleme mümkün.
  
  4. **Açık endişeler:**
     - GİB sandbox ortamı erişimi ve test süreci önceden başlatılmalıdır (bürokratik süreç 2-4 hafta sürebilir).
     - Özel entegratör anlaşması MVP başlamadan önce imzalanmalıdır — bu bir blocker olabilir.
     - KVKK uyumluluk danışmanlığı (veri işleme envanteri, aydınlatma metinleri) için hukuki destek gereklidir; bu teknik ekibin kapsamı dışındadır.
     - Fatura PDF şablonlarının GİB görsel standartlarına uygunluğu tasarım aşamasında doğrulanmalıdır.
```


---

## Software Architect ⚠️ HATA

> Bu ajan çalıştırılırken hata oluştu: claude CLI exited with code 1: 

---

## DevOps Engineer ⚠️ HATA

> Bu ajan çalıştırılırken hata oluştu: claude CLI exited with code 1: 

---

## QA Engineer ⚠️ HATA

> Bu ajan çalıştırılırken hata oluştu: claude CLI exited with code 1: 

---

## Security Analyst ⚠️ HATA

> Bu ajan çalıştırılırken hata oluştu: claude CLI exited with code 1: 
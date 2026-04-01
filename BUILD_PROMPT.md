# Multi-Mind: CLI-Based Multi-Agent Decision System - Build Prompt

> Bu prompt'u yeni bir Claude Code context'inde yapistir ve calistir.
> API key gerektirmez, Claude Code Max aboneligi ile `claude -p` uzerinden calisir.

---

## Proje Ozeti

**multi-mind** adinda bir CLI tabanli multi-agent karar sistemi olustur. Bu sistem, bir yazilim projesine stratejik kararlar veren 6 uzman ajandan olusan bir "sanal yonetim kurulu" gibi calisir.

Sistem `claude -p` (Claude Code CLI print mode) uzerinden calisacak. API key GEREKTIRMEZ. Kullanicinin Claude Code Max aboneligini kullanir.

## Teknik Gereksinimler

- **Dil:** TypeScript (Node.js)
- **Calistirma:** `claude -p "prompt" --output-format json` CLI cagrisi uzerinden
- **Orkestrasyon:** DAG (Directed Acyclic Graph) tabanli gorev yonetimi
- **Cikti:** Yapisal dosyalar (JSON/YAML + Markdown raporlar)
- **Etkilesim:** Iteratif (kullanici raporu inceleyip belirli ajanlari tekrar calistirabilir)

## ONEMLI: claude -p Guvenlik Kurali

Sistemde `claude -p` cagrilari yapilirken ortam degiskenlerinde `ANTHROPIC_API_KEY` **TANIMLI OLMAMALIDIR**. Eger tanimliysa CLI, Max aboneligi yerine API uzerinden ucretlendirir. Her `claude -p` cagrisinda bunu garanti altina al:

```typescript
const env = { ...process.env }
delete env.ANTHROPIC_API_KEY
// execSync('claude -p "..."', { env })
```

## Sistem Mimarisi

```
multi-mind/
├── src/
│   ├── index.ts              # CLI giris noktasi
│   ├── orchestrator/
│   │   ├── dag.ts            # DAG engine (gorev bagimliliklari, paralel calistirma)
│   │   ├── scheduler.ts      # Hangi ajanin ne zaman calisacagini yonetir
│   │   └── pipeline.ts       # Pipeline tanimlari ve calistirma
│   ├── agents/
│   │   ├── base-agent.ts     # Temel ajan sinifi (claude -p cagrisi yapar)
│   │   ├── product-manager.ts
│   │   ├── cto.ts
│   │   ├── architect.ts
│   │   ├── devops-strategist.ts
│   │   ├── qa-lead.ts
│   │   └── security-advisor.ts
│   ├── decision/
│   │   ├── router.ts         # Konuya gore lider ajan secimi (hibrit karar)
│   │   ├── synthesizer.ts    # Ajan ciktilarini birlestirip final karar olusturur
│   │   └── feedback.ts       # Kullanici geri bildirimi ile tekrar calistirma
│   ├── context/
│   │   ├── project-loader.ts # Mevcut codebase analizi (git, dosya yapisi, package.json vb.)
│   │   ├── brief-parser.ts   # Yeni proje brief'i parse etme
│   │   └── shared-memory.ts  # Ajanlar arasi paylasilan context/state
│   ├── output/
│   │   ├── report-generator.ts  # Markdown rapor olusturma
│   │   ├── structured-output.ts # JSON/YAML yapisal cikti
│   │   └── templates/           # Rapor sablonlari
│   ├── config/
│   │   └── agents.yaml       # Ajan rolleri, system prompt'lari, konfigurasyonlari
│   └── types/
│       └── index.ts           # Tum tip tanimlari
├── output/                    # Uretilen raporlar ve kararlar buraya yazilir
├── package.json
├── tsconfig.json
└── README.md
```

## 6 Ajan Tanimi

Her ajanin bir rolu, system prompt'u ve uzmanlik alani var. Ajanlar `claude -p` ile calisir.

### 1. Product Manager (PM)
- **Liderlik alani:** Urun kararlari, feature onceliklendirme, scope belirleme
- **Input:** Kullanici brief'i veya mevcut proje analizi
- **Output:** PRD (Product Requirements Document), user story'ler, oncelik matrisi
- **Karar yetkisi:** "Ne yapilacak?" ve "Neden yapilacak?"

### 2. CTO / Tech Lead
- **Liderlik alani:** Tech stack kararlari, teknik fizibilite, build vs buy
- **Input:** PM'in ciktisi + proje context'i
- **Output:** Tech stack onerisi, teknik kisitlamalar, maliyet/performans analizi
- **Karar yetkisi:** "Hangi teknolojilerle yapilacak?"

### 3. Architect
- **Liderlik alani:** Sistem tasarimi, modul yapisi, API kontratlari
- **Input:** PM + CTO ciktilari
- **Output:** Mimari diyagram (text tabanli), modul yapisi, API spec, veri modeli
- **Karar yetkisi:** "Nasil yapilandirilacak?"

### 4. DevOps Strategist
- **Liderlik alani:** Deployment, CI/CD, infra, monitoring
- **Input:** Architect ciktisi + tech stack
- **Output:** Deployment plani, CI/CD pipeline tanimi, infra gereksinimleri
- **Karar yetkisi:** "Nasil deploy edilecek ve izlenecek?"

### 5. QA Lead
- **Liderlik alani:** Test stratejisi, kalite metrikleri, risk degerlendirmesi
- **Input:** PM + Architect ciktilari
- **Output:** Test plani, kalite kriterleri, risk matrisi, test turleri ve kapsam
- **Karar yetkisi:** "Nasil test edilecek ve kalite nasil olculecek?"

### 6. Security Advisor
- **Liderlik alani:** Guvenlik degerlendirmesi, tehdit modelleme, OWASP
- **Input:** Architect + DevOps ciktilari
- **Output:** Tehdit modeli, guvenlik gereksinimleri, OWASP checklist, auth/authz stratejisi
- **Karar yetkisi:** "Guvenlik riskleri neler ve nasil onlenecek?"

## Hibrit Karar Mekanizmasi

Konu bazli lider ajan secimi:

```yaml
decision_routing:
  product_decisions:    # "hangi feature oncelikli?", "scope ne olmali?"
    leader: product-manager
    consulted: [cto, qa-lead]

  technical_decisions:  # "hangi framework?", "monolith mi microservice mi?"
    leader: cto
    consulted: [architect, devops-strategist]

  architecture_decisions:  # "API nasil olsun?", "veri modeli?"
    leader: architect
    consulted: [cto, security-advisor]

  infrastructure_decisions:  # "nasil deploy?", "hangi cloud?"
    leader: devops-strategist
    consulted: [cto, architect]

  quality_decisions:    # "test stratejisi?", "kabul kriterleri?"
    leader: qa-lead
    consulted: [product-manager, architect]

  security_decisions:   # "auth nasil?", "data encryption?"
    leader: security-advisor
    consulted: [architect, devops-strategist]
```

Lider ajan final karari verir, danisilan ajanlar goruslerini sunar. Catisma durumunda lider belirleyicidir.

## DAG Orkestrasyon

### Yeni Proje Brief'i Icin Varsayilan DAG:

```
brief-parser
    |
    v
[Product Manager] -----> [CTO / Tech Lead]
                              |
                    +---------+---------+
                    |                   |
                    v                   v
              [Architect]      [DevOps Strategist]
                    |                   |
                    +---+-------+-------+
                        |       |
                        v       v
                   [QA Lead] [Security Advisor]
                        |       |
                        +---+---+
                            |
                            v
                      [Synthesizer]
                            |
                            v
                     Final Rapor + YAML
```

- PM ve CTO sirayla calisir (PM'in ciktisi CTO'ya gider)
- Architect ve DevOps Strategist PARALEL calisir
- QA Lead ve Security Advisor PARALEL calisir
- Synthesizer tum ciktilari birlestirir

### Mevcut Codebase Analizi Icin DAG:

```
project-loader (git analiz, dosya yapisi, deps)
    |
    v
[Tum 6 ajan PARALEL calisir - mevcut durumu degerlendirir]
    |
    v
[Synthesizer - bulgulari birlestirir]
    |
    v
Final Rapor + Iyilestirme Onerileri YAML
```

## CLI Kullanim Arayuzu

```bash
# Yeni proje analizi
multi-mind new "Etkinlik yonetim platformu, multi-tenant SaaS, B2B"

# Mevcut proje analizi
multi-mind analyze /path/to/project

# Belirli bir konuda karar
multi-mind decide "Monolith mi microservice mi?" --context /path/to/project

# Onceki raporu geri bildirimle tekrar calistir
multi-mind revise output/2024-01-15/report.md --feedback "Security kismi yetersiz, OAuth2 + RBAC detaylandirilsin"

# Tek bir ajani tekrar calistir
multi-mind rerun security-advisor --input output/2024-01-15/ --feedback "OWASP Top 10 eksik"

# Ajanlar arasi tartisma modu
multi-mind debate "PostgreSQL vs MongoDB" --context /path/to/project
```

## Cikti Yapisi

Her calistirmada `output/` altina tarihli klasor olusturulur:

```
output/2024-01-15-etkinlik-platformu/
├── summary.md              # Birlesik yonetici ozeti
├── decisions.yaml          # Tum kararlar yapisal formatta
├── roadmap.yaml            # Fazlandirilmis yol haritasi
├── agents/
│   ├── product-manager.md  # PM'in detayli raporu
│   ├── cto.md              # CTO'nun teknik analizi
│   ├── architect.md        # Mimari spec
│   ├── devops.md           # Deployment stratejisi
│   ├── qa-lead.md          # Test plani
│   └── security.md         # Guvenlik degerlendirmesi
├── artifacts/
│   ├── tech-stack.yaml     # Secilen teknolojiler
│   ├── api-spec.yaml       # API kontratlari
│   ├── data-model.yaml     # Veri modeli
│   ├── test-plan.yaml      # Test plani
│   └── threat-model.yaml   # Tehdit modeli
└── meta.json               # Calistirma metadatasi (sure, token kullanimi, dag bilgisi)
```

## Iteratif Geri Bildirim

Kullanici raporu inceledikten sonra:
1. Belirli bir ajani feedback ile tekrar calistirabilir
2. Tum pipeline'i yeni talimatlarla tekrar tetikleyebilir
3. Bir karar uzerinde "debate" modu acabilir (2+ ajan karsi gorusler sunar)

Tekrar calistirmada:
- Sadece ilgili ajan(lar) calisir, tum pipeline tekrarlanmaz
- Onceki ciktilar context olarak verilir
- Yeni cikti oncekinin ustune yazilmaz, versiyonlanir

## Teknik Uygulama Notlari

### claude -p Cagrisi
```typescript
// Her ajan icin temel cagri
async function callAgent(systemPrompt: string, userPrompt: string): Promise<string> {
  const env = { ...process.env }
  delete env.ANTHROPIC_API_KEY  // MAX aboneligi kullanmak icin SART

  const result = execSync(
    `claude -p "${escapedPrompt}" --system-prompt "${escapedSystem}" --output-format json`,
    { env, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 300000 }
  )
  return result
}
```

### DAG Engine
- Her node bir ajan gorevi
- Bagimliliklar tamamlaninca node otomatik tetiklenir
- Bagimsiz node'lar paralel calisir (Promise.all)
- Hata durumunda retry + fallback mekanizmasi

### Shared Memory
- Ajanlar arasi paylasilan context bir JSON objesi olarak tutulur
- Her ajan calistiginda ciktisini shared memory'ye yazar
- Sonraki ajanlar onceki ciktilari context olarak alir

## Baslangic Adimlari

1. `npm init` ile proje olustur
2. TypeScript, tsx (calistirici), commander (CLI) ve yaml (parser) kur
3. Oncelik sirasi:
   - Ilk olarak base-agent.ts yaz (claude -p cagrisi yapan temel sinif)
   - Sonra DAG engine
   - Sonra 6 ajani tanimla
   - Sonra CLI arayuzu
   - Son olarak cikti uretimi ve iteratif geri bildirim

## Onemli Kisitlamalar

- ASLA `@anthropic-ai/sdk` veya `openai` paketi KULLANMA. Tek LLM erisimi `claude -p` CLI uzerinden.
- ANTHROPIC_API_KEY ortam degiskenini her zaman temizle.
- Her ajanin ciktisi yapisal olmali (JSON parse edilebilir).
- Timeout'lar olmali (bir ajan 5 dk'dan uzun surerse hata ver).
- Ciktilar her zaman dosyaya yazilmali, sadece stdout'a degil.

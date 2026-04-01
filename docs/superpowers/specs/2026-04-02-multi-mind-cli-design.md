# multi-mind CLI Design Spec

> Open source, CLI tabanlı multi-agent karar sistemi.
> Yazılım projelerine stratejik kararlar veren uzman AI ajanlardan oluşan "sanal danışman kurulu".

---

## 1. Ürün Vizyonu

### Problem
Freelancer'lar ve küçük ajanslar, müşteriye PM + CTO + Architect seviyesinde teknik analiz sunmak zorunda ama bu kapasiteye sahip değiller. Tek kişi veya küçük ekip olarak her perspektifi kapsamak mümkün değil.

### Çözüm
multi-mind, open-multi-agent kütüphanesinin orkestrasyon altyapısı üzerinde, `claude -p` CLI ile çalışan uzman AI ajanlarını bir danışman kurulu gibi organize eder. Brief yazarsın, ajanlar sıralı/paralel çalışır, profesyonel teknik analiz raporu çıkar.

> **Not:** Ajanlar doğrudan Anthropic API yerine `claude -p` CLI üzerinden çalışır. Bu sayede kullanıcının API key'e ihtiyacı yoktur — mevcut Claude Code Max aboneliği yeterlidir. open-multi-agent'ın LLMAdapter'ı, `claude -p` çağrısı yapan custom bir adapter ile değiştirilir.

### Hedef Kitle
- **Birinci dalga:** Freelancer'lar ve küçük ajanslar
- **İkinci dalga:** Startup teknik ekipleri

### İş Modeli: Open Core
- CLI tamamen açık kaynak ve ücretsiz (MIT lisansı)
- Premium katman (sonraki aşama): sektöre özel ajan şablonları, web dashboard, takım özellikleri

### Kullanım Modeli: Proje bazlı iteratif
1. Kullanıcı brief yazar → ajanlar çalışır → rapor çıkar
2. Geri bildirimle iterasyon: tek ajan rerun, debate modu, feedback ile güncelleme

---

## 2. Temel Foundation: open-multi-agent

Sıfırdan yazmak yerine [open-multi-agent](https://github.com/JackChen-me/open-multi-agent) kütüphanesi üzerine inşa ediyoruz.

### open-multi-agent'tan kullanacağımız modüller

| Modül | Karşılığı | Ne sağlıyor |
|-------|-----------|-------------|
| `Orchestrator` | DAG Engine | Coordinator pattern — hedefi alt görevlere ayırır, DAG'da çalıştırır |
| `TaskQueue` | Bağımlılık yönetimi | Kahn's algorithm ile topological sort, cascade failure |
| `Scheduler` | Zamanlayıcı | 4 strateji: round-robin, least-busy, capability-match, dependency-first |
| `AgentRunner` | Ajan çalıştırıcı | Konuşma döngüsü, tool calling, multi-turn |
| `LLMAdapter` | Provider katmanı | **Custom adapter ile değiştirilecek** — `claude -p` CLI üzerinden çalışacak |
| `SharedMemory` | Ajanlar arası state | Namespaced key-value store |
| `Tool System` | Araçlar | Zod-based, bash/file_read/file_write/file_edit/grep dahil |

### Bizim ekleyeceğimiz katmanlar

| Katman | Amaç |
|--------|------|
| **CLI** | Commander.js ile komut arayüzü |
| **YAML Ajan Sistemi** | Deklaratif ajan tanımları, custom ajan desteği |
| **Output** | Markdown + JSON/YAML rapor üretimi |
| **Config** | Proje bazlı yapılandırma |

---

## 3. Mimari

### Dizin Yapısı

```
multi-mind/
├── src/
│   ├── cli/
│   │   ├── index.ts              # CLI giriş noktası (commander.js)
│   │   └── commands/
│   │       ├── new.ts            # multi-mind new "..."
│   │       ├── analyze.ts        # multi-mind analyze ./path
│   │       ├── decide.ts         # multi-mind decide "..."
│   │       ├── rerun.ts          # multi-mind rerun <agent>
│   │       ├── debate.ts         # multi-mind debate "..."
│   │       └── agents.ts         # multi-mind agents list|init
│   ├── agents/
│   │   ├── loader.ts             # YAML → AgentConfig dönüştürücü
│   │   └── defaults.ts           # Varsayılan ajan listesi
│   ├── orchestrator/
│   │   └── pipeline.ts           # Komutlara özel pipeline tanımları
│   ├── context/
│   │   ├── brief-parser.ts       # Kullanıcı brief'ini yapılandırır
│   │   └── project-loader.ts     # Mevcut codebase'den context çıkarır
│   ├── output/
│   │   ├── markdown.ts           # Markdown rapor üretici
│   │   └── structured.ts         # JSON/YAML çıktı üretici
│   └── types/
│       └── index.ts              # Paylaşılan tipler
├── agents/                       # Ajan tanım dosyaları (YAML)
│   ├── product-manager.yaml
│   ├── cto.yaml
│   ├── architect.yaml
│   └── custom/                   # Kullanıcı custom ajanları
├── package.json
├── tsconfig.json
└── README.md
```

### Veri Akışı

```
CLI Komutu
    │
    ▼
Brief Parser / Project Loader
    │
    ▼
Pipeline (komuta özel ajan seti + DAG tanımı)
    │
    ▼
open-multi-agent Orchestrator
    ├── YAML Loader → AgentConfig[] oluşturur
    ├── Team oluşturur (agents + shared memory)
    ├── TaskQueue'ya görevleri yükler (depends_on'dan)
    ├── Scheduler çalıştırır (dependency-first strateji)
    │   ├── [Product Manager] ──► SharedMemory'ye yazar
    │   ├── [CTO] (PM çıktısını okur) ──► SharedMemory'ye yazar
    │   └── [Architect] (PM + CTO çıktısını okur) ──► SharedMemory'ye yazar
    └── Tüm çıktılar toplanır
    │
    ▼
Output (Markdown + JSON/YAML)
    │
    ▼
output/<tarih>-<slug>/ dizinine yazılır
```

### open-multi-agent entegrasyonu

open-multi-agent'ın orkestrasyon katmanını (TaskQueue, Scheduler, SharedMemory, Team) kullanıyoruz. Ancak LLMAdapter'ı `claude -p` CLI çağrısı yapan custom bir adapter ile değiştiriyoruz.

```typescript
// src/agents/claude-cli-adapter.ts
// open-multi-agent'ın LLMAdapter interface'ini implemente eder
// Her ajan çağrısında: claude -p --output-format json "system prompt + context + brief"
import { execSync } from 'child_process';

export class ClaudeCliAdapter implements LLMAdapter {
  async chat(messages, options) {
    const prompt = buildPromptFromMessages(messages);
    const result = execSync(
      `claude -p --output-format json "${escapeShell(prompt)}"`,
      { timeout: 300_000, encoding: 'utf-8' }
    );
    return JSON.parse(result);
  }
}
```

```typescript
// Örnek: multi-mind new komutu iç yapısı
import { Team, TaskQueue, Scheduler } from 'open-multi-agent';
import { ClaudeCliAdapter } from '../agents/claude-cli-adapter';

// YAML'dan yüklenen ajan tanımları
const agents = loadAgentsFromYaml('./agents/');

// Custom LLM adapter ile team oluştur
const team = new Team({
  agents: agents.map(a => ({
    name: a.name,
    systemPrompt: a.system_prompt,
    llmAdapter: new ClaudeCliAdapter()  // claude -p kullanır
  })),
  scheduler: new Scheduler('dependency-first'),
  onProgress: (event) => updateSpinner(event)
});

const result = await team.run(briefPrompt);
```

---

## 4. Ajan Sistemi

### YAML Tanım Formatı

```yaml
# agents/cto.yaml
name: cto
display_name: "CTO / Tech Lead"
description: "Tech stack kararları, teknik fizibilite, maliyet analizi"
phase: 2
depends_on:
  - product-manager
input_from:
  - product-manager

model: claude-sonnet-4-6    # opsiyonel, varsayılan kullanılır
temperature: 0.7             # opsiyonel

system_prompt: |
  Sen 15+ yıl deneyimli bir CTO'sun.

  Görevlerin:
  - Tech stack seçimi ve gerekçelendirmesi
  - Teknik fizibilite analizi
  - Build vs buy kararları
  - Maliyet ve zaman tahmini
  - Teknik risk değerlendirmesi

  Çıktını şu yapıda ver:
  - tech_stack: Seçilen teknolojiler ve gerekçeleri
  - rationale: Neden bu stack
  - risks: Teknik riskler ve mitigasyon
  - cost_estimate: Yaklaşık maliyet/süre

output_schema:
  type: object
  required:
    - tech_stack
    - rationale
    - risks
  properties:
    tech_stack:
      type: object
      description: "Kategori bazlı teknoloji seçimleri"
    rationale:
      type: string
      description: "Genel strateji ve gerekçe"
    risks:
      type: array
      items:
        type: object
        properties:
          risk:
            type: string
          severity:
            type: string
            enum: [low, medium, high]
          mitigation:
            type: string
    cost_estimate:
      type: object
      description: "Zaman ve maliyet tahmini"
```

### MVP Varsayılan Ajanlar

| Ajan | Phase | Depends On | Sorumluluk |
|------|-------|------------|------------|
| **Product Manager** | 1 | - | Brief'i analiz eder, gereksinimleri çıkarır, önceliklendirme yapar |
| **CTO** | 2 | product-manager | Tech stack, fizibilite, build vs buy, maliyet |
| **Architect** | 3 | product-manager, cto | Sistem mimarisi, modül yapısı, veri akışı, API tasarımı |

### Varsayılan DAG

```
[Product Manager] → [CTO] → [Architect]
     phase 1         phase 2    phase 3
```

### Custom Ajan Ekleme

Kullanıcı `agents/custom/` altına YAML dosyası koyar:

```bash
multi-mind agents init security-analyst
# → agents/custom/security-analyst.yaml şablonu oluşturur
```

Sistem `agents/` ve `agents/custom/` dizinlerini tarar, YAML'ları yükler, `depends_on` ilişkilerine göre DAG'ı otomatik oluşturur.

---

## 5. CLI Komutları

### `multi-mind new <brief>`

Yeni proje analizi. Brief metni verilir, tüm ajanlar sırayla çalışır.

```bash
multi-mind new "E-ticaret platformu, Next.js, multi-tenant, Türkiye pazarı"
```

Davranış:
1. Brief'i parse et → yapılandırılmış context oluştur
2. Varsayılan pipeline çalıştır (PM → CTO → Architect)
3. Her ajan tamamlandığında spinner + kısa özet
4. Sonuç raporu `output/<tarih>-<slug>/` dizinine yaz

### `multi-mind analyze <path>`

Mevcut projeyi analiz et. Codebase'den context çıkarır, ajanlarla değerlendirir.

```bash
multi-mind analyze ./my-project
```

Davranış:
1. `project-loader` ile codebase'den bilgi çıkar (tech stack, yapı, bağımlılıklar)
2. Context'i brief olarak kullan
3. Aynı pipeline'ı çalıştır

### `multi-mind decide <soru>`

Belirli bir konuda karar al.

```bash
multi-mind decide "Monolith mi microservice mi?" --context ./project
```

Davranış:
1. Soruyu tüm ajanlara gönder
2. Her ajan kendi perspektifinden değerlendirir
3. Bir synthesizer son kararı özetler

### `multi-mind rerun <agent>`

Tek bir ajanı yeniden çalıştır, opsiyonel geri bildirimle.

```bash
multi-mind rerun cto --input output/2026-04-02-eticaret/ --feedback "Maliyet analizi daha detaylı olmalı"
```

Davranış:
1. Belirtilen output dizinindeki önceki sonuçları yükle
2. Feedback'i context'e ekle
3. Sadece belirtilen ajanı çalıştır
4. Çıktıyı güncelle

### `multi-mind debate <konu>`

İki ajan karşıt görüş sunar.

```bash
multi-mind debate "PostgreSQL vs MongoDB" --agents cto,architect
```

Davranış:
1. İlk ajan "pro" pozisyonunda argüman sunar
2. İkinci ajan "con" pozisyonunda karşı argüman sunar
3. Her iki tarafın özeti + önerilen karar sunulur

### `multi-mind agents list`

Mevcut ajanları listeler (varsayılan + custom).

### `multi-mind agents init <name>`

Yeni custom ajan için YAML şablonu oluşturur.

### Global Flagler

| Flag | Açıklama |
|------|----------|
| `--verbose` | Detaylı DAG çalışma bilgisi |
| `--output-dir <path>` | Özel çıktı dizini |
| `--model <model>` | Tüm ajanlar için model override |
| `--agents <list>` | Sadece belirli ajanları çalıştır |

---

## 6. Çıktı Formatı

### Dizin Yapısı

```
output/2026-04-02-eticaret-platformu/
├── summary.md              # Birleşik özet rapor
├── decisions.yaml          # Tüm kararlar yapısal formatta
├── agents/
│   ├── product-manager.md  # PM'in Markdown raporu
│   ├── product-manager.yaml# PM'in yapısal çıktısı
│   ├── cto.md
│   ├── cto.yaml
│   ├── architect.md
│   └── architect.yaml
└── meta.json               # Çalışma metadatası
```

### summary.md Yapısı

```markdown
# multi-mind Analiz Raporu: E-ticaret Platformu

**Tarih:** 2026-04-02
**Brief:** E-ticaret platformu, Next.js, multi-tenant, Türkiye pazarı

---

## Yönetici Özeti
[Tüm ajanların çıktılarından sentezlenmiş 3-5 cümle]

## Product Manager Görüşü
[PM çıktısının özeti]

## CTO Görüşü
[CTO çıktısının özeti]

## Architect Görüşü
[Architect çıktısının özeti]

## Kararlar ve Öneriler
[Ortak noktalar, ayrışmalar, nihai öneriler]
```

### meta.json Yapısı

```json
{
  "version": "1.0.0",
  "created_at": "2026-04-02T14:30:00Z",
  "brief": "E-ticaret platformu...",
  "agents_used": ["product-manager", "cto", "architect"],
  "dag_execution": {
    "total_duration_ms": 45000,
    "agents": {
      "product-manager": { "duration_ms": 15000, "tokens": 2500 },
      "cto": { "duration_ms": 12000, "tokens": 2100 },
      "architect": { "duration_ms": 18000, "tokens": 3200 }
    }
  },
  "model": "claude-sonnet-4-6"
}
```

---

## 7. Teknik Altyapı

### Teknoloji Seçimleri

| Bileşen | Seçim | Gerekçe |
|---------|-------|---------|
| Dil | TypeScript | open-multi-agent ile uyum |
| Runtime | Node.js >= 18 | ESM desteği |
| CLI framework | Commander.js | Hafif, yaygın, yeterli |
| YAML parser | yaml paketi | YAML 1.2 desteği |
| Spinner/UI | ora | Terminal spinner |
| Çalıştırıcı | tsx | TypeScript doğrudan çalıştırma |
| Foundation | open-multi-agent | Orkestrasyon, DAG, SharedMemory |
| LLM çağrısı | `claude -p` CLI | Max aboneliği ile çalışır, API key gerektirmez |

### Gereksinimler

- **Claude Code Max aboneliği** — `claude` CLI'ın sistemde kurulu ve oturum açmış olması gerekir
- Node.js >= 18

### Bağımlılıklar

```json
{
  "dependencies": {
    "open-multi-agent": "latest",
    "commander": "^12.0.0",
    "yaml": "^2.4.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0"
  }
}
```

### DAG Engine (open-multi-agent üzerinden)

- YAML'daki `depends_on` → TaskQueue'ya bağımlılık olarak yüklenir
- `dependency-first` scheduler stratejisi varsayılan
- Bağımsız ajanlar `Promise.all` ile paralel
- Hata durumu: cascade failure (open-multi-agent'ın mevcut davranışı). Retry middleware MVP sonrası eklenecek.

### Güvenlik

- Ajan çıktıları JSON parse ile validate edilir
- Kullanıcı girdileri `claude -p` çağrısında shell injection'a karşı escape edilir
- open-multi-agent'ın bash tool'u varsayılan olarak devre dışı (multi-mind ajanlarının shell erişimine ihtiyacı yok)
- `claude -p` çağrıları 5 dakika timeout ile sınırlandırılır

### Dağıtım

- npm paketi: `npx multi-mind new "..."`
- GitHub'da açık kaynak (MIT lisansı)
- Bin entry: `"bin": { "multi-mind": "./dist/cli/index.js" }`
- Ön koşul: Claude Code Max aboneliği + `claude` CLI kurulu

---

## 8. MVP Dışı (Sonraki Aşamalar)

### Aşama 2: Ek Ajanlar
- DevOps Engineer
- QA / Test Engineer
- Security Analyst

### Aşama 3: Premium Katman
- Sektöre özel ajan şablonları (fintech, e-ticaret, healthtech)
- Web dashboard — raporları tarayıcıda görüntüleme
- PDF export, paylaşım linkleri

### Aşama 4: Takım Özellikleri
- Paylaşılan projeler
- Karar geçmişi
- Çoklu kullanıcı desteği

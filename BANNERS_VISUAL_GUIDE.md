# 🎨 Guia Visual - Onde Tudo Está

## 1️⃣ Painel Admin - Gerenciamento de Banners

```
┌─────────────────────────────────────────────────────┐
│ 🔒 Painel Administrativo                      [Sair]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 Estatísticas (Total Usuários, etc)              │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │ 📤 Gerenciamento de Banners                    │ │
│  ├──────────────────┬──────────────────────────────┤ │
│  │  Banner 1        │  Banner 2                    │ │
│  │  (Esquerdo)      │  (Direito)                   │ │
│  ├──────────────────┼──────────────────────────────┤ │
│  │ ┌──────────────┐ │ ┌──────────────┐             │ │
│  │ │   Preview    │ │ │   Preview    │             │ │
│  │ │   (160px)    │ │ │   (160px)    │             │ │
│  │ └──────────────┘ │ └──────────────┘             │ │
│  │                  │                               │ │
│  │ 📁 Escolher      │ 📁 Escolher                  │ │
│  │    arquivo       │    arquivo                   │ │
│  │                  │                               │ │
│  │ 🔗 Link:         │ 🔗 Link:                     │ │
│  │ [___________]    │ [___________]                │ │
│  │                  │                               │ │
│  │ [💾 Salvar]      │ [💾 Salvar]                  │ │
│  └──────────────────┴──────────────────────────────┘ │
│                                                     │
│  👨‍⚖️ Gestão de Advogados                            │
│  [Tabela com status, verificação, etc]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Localização no código:** `components/Dashboards.tsx` linhas ~4155-4285

---

## 2️⃣ Feed de Advogados - Banners Dinâmicos

```
┌─────────────────────────────────────────────────────────────┐
│ 🌐 Oportunidades em Aberto               [Sair]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐                          ┌────────────┐    │
│  │            │     CASOS (Feed)         │            │    │
│  │  BANNER 1  │   ┌──────────────────┐   │  BANNER 2  │    │
│  │  (Dinâ)    │   │ Caso 1           │   │  (Dinâ)    │    │
│  │            │   ├──────────────────┤   │            │    │
│  │ 📷Foto     │   │ Caso 2           │   │ 📷Foto     │    │
│  │ 🔗Link     │   ├──────────────────┤   │ 🔗Link     │    │
│  │            │   │ Caso 3           │   │            │    │
│  │            │   └──────────────────┘   │            │    │
│  │ Click→     │                          │ Click→     │    │
│  │ Abre Link  │                          │ Abre Link  │    │
│  │            │                          │            │    │
│  └────────────┘                          └────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Localização no código:** `components/Dashboards.tsx` linhas ~3706-3821

---

## 3️⃣ Fluxo de Dados

```
ADMIN                          SUPABASE                    ADVOGADO
┌──────────────────┐          ┌─────────────────┐         ┌──────────────────┐
│  AdminDashboard  │          │  admin_banners  │         │ LawyerDashboard  │
│  ┌────────────┐  │          │  (tabela)       │         │ ┌──────────────┐  │
│  │ Upload ✓   │  │    1     │ ┌──────────┐   │    3    │ │ Fetch        │  │
│  │ Link ✓     │──┼─────────→│ │banner_1  │───┼────────→│ │ Data Global  │  │
│  │ Save ✓     │  │          │ │banner_2  │   │    5    │ │ (state)      │  │
│  └────────────┘  │    2     │ └──────────┘   │         │ └──────────────┘  │
│                  │   ↓      │        ↑       │    4    │ ┌──────────────┐  │
│   Storage ←──────┼─────────→│  Storage       │ Realtime│ │ Render       │  │
│                  │ Upload   │  (bucket)      │←────────→│ │ Dynamic IMG  │  │
└──────────────────┘ URL      └─────────────────┘         └──────────────────┘
```

**Números:**
1. POST: updateBanner() → admin_banners
2. Upload arquivo → Storage bucket
3. Realtime Sub: "change em admin_banners"
4. fetchBanners() → refetch dados
5. Global state atualiza → LawyerDashboard re-renders

---

## 4️⃣ Arquivos Modificados

```
📁 Projeto
├── 📄 types.ts
│   └─ +15 linhas: Interface Banner
│
├── 📄 store.tsx
│   ├─ +1 linha: import Banner
│   ├─ +1 linha: banners state
│   ├─ +52 linhas: fetchBanners() e updateBanner()
│   ├─ +3 linhas: Realtime subscription
│   ├─ +1 linha: fetchBanners() ao login
│   └─ +1 linha: funções no provider value
│
├── 📄 components/Dashboards.tsx
│   ├─ +1 linha (LawyerDashboard): import banners
│   ├─ +20 linhas (LawyerDashboard): renderizar banners dinâmicos
│   ├─ +1 linha (AdminDashboard): import { banners, updateBanner }
│   ├─ +120 linhas (AdminDashboard): UI de upload
│   └─ +45 linhas (AdminDashboard): handlers de upload/save
│
└── 📋 Documentação
    ├── BANNERS_SETUP.sql (novo)
    ├── BANNERS_QUICKSTART.md (novo)
    ├── BANNERS_SUMMARY.md (novo)
    ├── BANNERS_IMPLEMENTATION.md (novo)
    ├── BANNERS_CHECKLIST.md (novo)
    ├── BANNERS_CHANGES.md (novo)
    └── BANNERS_VISUAL_GUIDE.md (este)
```

---

## 5️⃣ Estado Global (Store)

```typescript
// Antes (store.tsx)
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [users, setUsers] = useState<User[]>([]);
const [cases, setCases] = useState<Case[]>([]);
// ... outros estados

// Depois (adicionado)
const [banners, setBanners] = useState<Banner[]>([]);

// Também adicionado ao contexto:
fetchBanners: () => Promise<void>;
updateBanner: (name: string, imageUrl: string, linkUrl: string) => Promise<void>;
```

---

## 6️⃣ Contexto de Uso (No Componente)

```typescript
// AdminDashboard
const { banners, updateBanner } = useApp();

// LawyerDashboard
const { banners } = useApp();

const banner1 = banners.find(b => b.name === 'banner_1');
```

---

## 7️⃣ Estados da UI Admin

```
[Escolher Arquivo]
        ↓
   Selecionando...
        ↓
   [Fazendo Upload...]  ← savingBanner1 = true
        ↓
   ✅ Preview Atualizado
        ↓
   [Cola URL no input]
        ↓
   [💾 Salvar]  ← habilitado
        ↓
   Salvando...
        ↓
   "✅ Banner 1 atualizado com sucesso!"
        ↓
   Pronto!
```

---

## 8️⃣ Banco de Dados (Supabase)

```sql
-- Tabela criada por BANNERS_SETUP.sql
admin_banners
├── id (UUID, PK)
├── name (VARCHAR) -- 'banner_1' ou 'banner_2'
├── image_url (TEXT) -- URL do Supabase Storage
├── link_url (TEXT) -- URL de destino
├── updated_at (TIMESTAMP)
└── created_at (TIMESTAMP)

-- Registros iniciais
banner_1 | https://...placeholder... | #
banner_2 | https://...placeholder... | #
```

---

## 9️⃣ Storage (Supabase)

```
Bucket: banners (público)
├── banner_1_1708950123456_logo.png
├── banner_2_1708950234567_offer.jpg
├── banner_1_1708950456789_new-logo.png
└── ...

URL retornada:
https://[projeto].supabase.co/storage/v1/object/public/banners/banner_1_...png
```

---

## 🔟 Realtime Subscription

```typescript
// store.tsx linha ~200
supabase
  .channel('public_updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'admin_banners' },
    (payload) => { fetchBanners(); }
  )
  .subscribe();

// Resultado:
// Admin muda banner → Banco atualiza → Realtime notifica → fetchBanners() → state atualiza → LawyerDashboard re-renderiza
// Tudo em <1 segundo
```

---

## 📍 Como Navegar o Código

### Para Admin Entender (Quick Read)
1. `BANNERS_QUICKSTART.md` (5 min)
2. Seção "Gerenciamento de Banners" em AdminDashboard

### Para Dev Entender (Full Read)
1. `BANNERS_CHANGES.md` (qual mudança em qual linha)
2. `types.ts` (interface Banner)
3. `store.tsx` linhas 1052-1097 (lógica)
4. `Dashboards.tsx` linhas 4155-4285 (UI Admin)

### Para Debugar
1. Console.log em `fetchBanners()` → verifica se dados carregam
2. Network tab → verifica uploads
3. Supabase Dashboard → verifica dados no BD
4. Realtime → verifica subscriptions

---

## 🎯 TL;DR - Visualização Rápida

```
┌─ types.ts
│  └─ Banner { id, name, imageUrl, linkUrl, updatedAt }
│
├─ store.tsx
│  ├─ State: banners: Banner[]
│  ├─ Fetch: fetchBanners() → admin_banners
│  ├─ Update: updateBanner(name, imageUrl, linkUrl)
│  └─ Realtime: auto-sync quando admin muda
│
├─ AdminDashboard (UI Upload)
│  ├─ File input → uploadBannerImage() → Storage
│  ├─ URL input → handleBannerXLinkChange() → BD
│  └─ Preview + Save button
│
└─ LawyerDashboard (Renderizar)
   ├─ Busca: const banner1 = banners.find(...)
   ├─ Exibe: <img src={banner1?.imageUrl} />
   └─ Link: href={banner1?.linkUrl}
```

---

**Tudo pronto para usar!** ✨

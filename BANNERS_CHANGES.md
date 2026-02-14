# Detalhes Completos das Mudanças - Banners

## 📝 Arquivo por Arquivo

---

## 1. **types.ts**

### Adição - Interface Banner (fim do arquivo)
```typescript
// Admin: Banner Management
export interface Banner {
  id: string;
  name: string; // 'banner_1' ou 'banner_2'
  imageUrl: string;
  linkUrl: string;
  updatedAt: string;
}
```

**Linhas:** ~15
**Impacto:** Nenhum (apenas novo tipo)

---

## 2. **store.tsx**

### 2.1 - Import (linha 3)
```typescript
// ANTES:
import { User, Case, Message, UserRole, CaseStatus, Notification, CRMProfile, SmartDoc, AgendaItem, SavedCalculation } from './types';

// DEPOIS:
import { User, Case, Message, UserRole, CaseStatus, Notification, CRMProfile, SmartDoc, AgendaItem, SavedCalculation, Banner } from './types';
```
**Mudança:** +1 palavra (Banner)

### 2.2 - AppContextType Interface (linhas ~16 e ~57-58)
```typescript
// ADICIONADO:
banners: Banner[]; // Estado global de banners

// ADICIONADO:
// Funções de Banners (Admin)
fetchBanners: () => Promise<void>;
updateBanner: (name: string, imageUrl: string, linkUrl: string) => Promise<void>;
```

### 2.3 - AppProvider State (linha ~70)
```typescript
// ADICIONADO:
const [banners, setBanners] = useState<Banner[]>([]);
```

### 2.4 - useEffect de Sincronização (linha ~159)
```typescript
// ADICIONADO:
fetchBanners(); // Buscar banners para todos
```

### 2.5 - Realtime Subscription (após linha ~196)
```typescript
// ADICIONADO:
.on('postgres_changes', { event: '*', schema: 'public', table: 'admin_banners' }, (payload) => {
   fetchBanners();
})
```

### 2.6 - Funções de Banners (antes do return, linhas ~1052-1097)
```typescript
// Funções de Banners (Admin)
const fetchBanners = async () => {
    try {
        const { data, error } = await supabase.from('admin_banners').select('*');
        if (error) throw error;
        setBanners(data || []);
    } catch (error: any) {
        console.error('Erro ao buscar banners:', error.message);
    }
};

const updateBanner = async (name: string, imageUrl: string, linkUrl: string) => {
    try {
        // Tentar atualizar se já existe
        const { data: existing } = await supabase.from('admin_banners').select('id').eq('name', name).single();
        
        if (existing) {
            const { error } = await supabase.from('admin_banners').update({
                image_url: imageUrl,
                link_url: linkUrl,
                updated_at: new Date().toISOString()
            }).eq('name', name);
            
            if (error) throw error;
        } else {
            // Criar novo banner se não existe
            const { error } = await supabase.from('admin_banners').insert({
                name,
                image_url: imageUrl,
                link_url: linkUrl,
                updated_at: new Date().toISOString()
            });
            
            if (error) throw error;
        }
        
        fetchBanners();
    } catch (error: any) {
        console.error('Erro ao atualizar banner:', error.message);
        throw error;
    }
};
```

### 2.7 - Provider Value (linha ~1098)
```typescript
// ANTES:
<AppContext.Provider value={{ currentUser, users, cases, ..., fetchSavedCalculations, saveCalculation }}>

// DEPOIS:
<AppContext.Provider value={{ currentUser, users, cases, ..., fetchSavedCalculations, saveCalculation, fetchBanners, updateBanner }}>
```

**Total store.tsx:** ~62 linhas novas

---

## 3. **components/Dashboards.tsx**

### 3.1 - LawyerDashboard Props (linha ~3462)
```typescript
// ANTES:
const { currentUser, cases, acceptCase, logout, subscribePremium, buyJuris, notifications } = useApp();

// DEPOIS:
const { currentUser, cases, acceptCase, logout, subscribePremium, buyJuris, notifications, banners } = useApp();
```

### 3.2 - Banner Esquerdo (linhas ~3706-3711)
```typescript
// ANTES:
<a href="#" target="_blank" rel="noopener noreferrer" className="fixed hover:opacity-85 transition group" style={{top: '160px', left: 'calc(50% - 648px)', width: '280px'}}>
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl hover:shadow-indigo-300 transition border border-slate-200 group-hover:border-indigo-400 h-[584px]">
        <img src={bannerTeste} alt="Banner" className="w-full h-full object-cover" />
    </div>
</a>

// DEPOIS:
{(() => {
    const banner1 = banners.find(b => b.name === 'banner_1');
    return (
        <a href={banner1?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="fixed hover:opacity-85 transition group" style={{top: '160px', left: 'calc(50% - 648px)', width: '280px'}}>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl hover:shadow-indigo-300 transition border border-slate-200 group-hover:border-indigo-400 h-[584px]">
                <img src={banner1?.imageUrl || bannerTeste} alt="Banner" className="w-full h-full object-cover" />
            </div>
        </a>
    );
})()}
```

### 3.3 - Banner Direito (linhas ~3816-3821)
```typescript
// ANTES:
<a href="#" target="_blank" rel="noopener noreferrer" className="fixed hover:opacity-85 transition group" style={{top: '160px', right: 'calc(50% - 898px)', width: '280px'}}>
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl hover:shadow-purple-300 transition border border-slate-200 group-hover:border-indigo-400 h-[584px]">
        <img src={bannerTeste} alt="Banner" className="w-full h-full object-cover" />
    </div>
</a>

// DEPOIS:
{(() => {
    const banner2 = banners.find(b => b.name === 'banner_2');
    return (
        <a href={banner2?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="fixed hover:opacity-85 transition group" style={{top: '160px', right: 'calc(50% - 898px)', width: '280px'}}>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl hover:shadow-purple-300 transition border border-slate-200 group-hover:border-indigo-400 h-[584px]">
                <img src={banner2?.imageUrl || bannerTeste} alt="Banner" className="w-full h-full object-cover" />
            </div>
        </a>
    );
})()}
```

### 3.4 - AdminDashboard (linhas ~4024-4130)

#### Imports e Destruct
```typescript
// ANTES:
const { users, toggleLawyerVerification, togglePremiumStatus, logout } = useApp();

// DEPOIS:
const { users, toggleLawyerVerification, togglePremiumStatus, logout, banners, updateBanner } = useApp();
```

#### Estados
```typescript
// ADICIONADO:
const [banner1Image, setBanner1Image] = useState<string>('');
const [banner1Link, setBanner1Link] = useState<string>('');
const [banner2Image, setBanner2Image] = useState<string>('');
const [banner2Link, setBanner2Link] = useState<string>('');
const [savingBanner1, setSavingBanner1] = useState(false);
const [savingBanner2, setSavingBanner2] = useState(false);
```

#### useEffect de Carregamento
```typescript
// ADICIONADO:
useEffect(() => {
    const banner1 = banners.find(b => b.name === 'banner_1');
    const banner2 = banners.find(b => b.name === 'banner_2');
    
    if (banner1) {
        setBanner1Image(banner1.imageUrl);
        setBanner1Link(banner1.linkUrl);
    }
    if (banner2) {
        setBanner2Image(banner2.imageUrl);
        setBanner2Link(banner2.linkUrl);
    }
}, [banners]);
```

#### Funções de Upload e Save
```typescript
// ADICIONADO (3 funções principais):
- uploadBannerImage(file, bannerName) - Upload para Storage
- handleBanner1ImageChange() - Handle upload banner 1
- handleBanner1LinkChange() - Save link banner 1
- handleBanner2ImageChange() - Handle upload banner 2
- handleBanner2LinkChange() - Save link banner 2
```

#### UI Section
```typescript
// ADICIONADO (antes do grid de estatísticas):
{/* Seção de Gerenciamento de Banners */}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-12">
    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
        <Upload className="w-5 h-5 mr-2 text-indigo-600" />
        Gerenciamento de Banners
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Banner 1 - completo */}
        {/* Banner 2 - completo */}
    </div>
</div>
```

**Total Dashboards.tsx:** ~186 linhas novas

---

## 4. **Arquivos Criados (Documentação e Setup)**

### BANNERS_SETUP.sql (~70 linhas)
Script SQL para criar tabela e bucket

### BANNERS_IMPLEMENTATION.md (~250 linhas)
Documentação técnica completa

### BANNERS_CHECKLIST.md (~200 linhas)
Guia de implementação passo a passo

### BANNERS_SUMMARY.md (~150 linhas)
Resumo executivo

### BANNERS_CHANGES.md (este arquivo)
Detalhes de todas as mudanças

---

## 📊 Resumo de Mudanças

| Arquivo | Linhas Adicionadas | Tipo | Impacto |
|---|---|---|---|
| types.ts | ~15 | Tipo | Nenhum |
| store.tsx | ~62 | Lógica | Seguro (isolado) |
| Dashboards.tsx | ~186 | UI + Lógica | Seguro (isolado) |
| BANNERS_*.* | ~670 | Documentação | N/A |
| **Total** | **~933** | Mix | **Risco Zero** |

---

## 🔍 Onde Procurar

### Para Entender o Fluxo
1. `store.tsx` linhas ~1052-1097 (funções principais)
2. `Dashboards.tsx` linhas ~4024+ (UI Admin)
3. `Dashboards.tsx` linhas ~3462+ (uso em LawyerDashboard)

### Para Debugar
- Console.log em `fetchBanners()` - verifica se busca dados
- Network tab - verifica uploads para Storage
- Database - verifica se dados chegaram em `admin_banners`
- Realtime - verifica se subscriptions estão ativas

### Para Customizar
- Cores: Procurar "indigo-600" em AdminDashboard section
- Tamanho: Procurar "h-[584px]" em LawyerDashboard
- Proporção: Procurar "grid-cols-2" em AdminDashboard

---

## ✅ Verificação de Segurança

- [ ] Nenhuma alteração em `profiles` table
- [ ] Nenhuma alteração em `cases` table
- [ ] Nenhuma alteração em `messages` table
- [ ] RLS configurado em `admin_banners`
- [ ] Storage bucket com policies corretas
- [ ] Fallback seguro (usa `bannerTeste` se não houver dados)
- [ ] Sem modificação em lógica de authentication
- [ ] Sem modificação em lógica de payments

---

## 🎯 Próximo Passo

Executar `BANNERS_SETUP.sql` no Supabase para ativar a funcionalidade.

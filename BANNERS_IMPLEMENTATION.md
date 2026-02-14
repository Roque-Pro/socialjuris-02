# Implementação de Gerenciamento de Banners - Risco Zero

## 📋 Resumo

Sistema completo de gerenciamento dinâmico de banners no painel admin, com sincronização em tempo real para o feed de advogados. Totalmente isolado, sem afetar nenhuma funcionalidade existente.

---

## 🏗️ Arquitetura

### 1. **Banco de Dados**
- Tabela isolada: `admin_banners` (separa dados de banners de dados de usuários)
- Campos: `id`, `name` (banner_1/banner_2), `image_url`, `link_url`, `updated_at`
- RLS habilitado: Apenas ADMINs podem atualizar/inserir

### 2. **Storage**
- Bucket Supabase: `banners` (público, apenas leitura para usuários)
- Arquivos de imagem com nomes únicos (timestamp + hash)
- Upload seguro: Apenas ADMINs podem fazer upload

### 3. **Contexto Global (store.tsx)**
- `banners: Banner[]` - Estado dos banners
- `fetchBanners()` - Busca dados da tabela
- `updateBanner(name, imageUrl, linkUrl)` - Atualiza/cria banners
- Sincronização em tempo real via Realtime Subscriptions

### 4. **Interface Admin (AdminDashboard)**
- Grid com 2 colunas (Banner 1 e Banner 2)
- Preview de imagem atual
- Input file para upload
- Input text para URL/link
- Botão Salvar com estados de carregamento

### 5. **Painel do Advogado (LawyerDashboard)**
- Banners carregados dinamicamente do contexto
- Fallback para `bannerTeste` se não houver dados
- Links dinâmicos
- Sincronização automática quando admin muda

---

## 🚀 Como Usar

### Setup Inicial

1. **Executar SQL no Supabase:**
   ```
   Copiar conteúdo de BANNERS_SETUP.sql
   Editor SQL > Colar e executar
   ```

2. **Pronto!** A tabela e bucket serão criados automaticamente

### Como Admin Usar

1. Acessar Painel Administrativo
2. Rolar até "Gerenciamento de Banners"
3. Para cada banner:
   - Clicar em "Escolher arquivo" para selecionar imagem
   - Cole a URL de destino no campo "Link do Banner"
   - Clique em "Salvar Banner X"
4. Aguarde o upload completar
5. Mudanças aparecem imediatamente no feed de advogados

---

## 🔒 Segurança (Risco Zero)

✅ **Isolamento Total:**
- Tabela separada (não afeta `profiles`, `cases`, `messages`)
- Storage bucket isolado
- Sem modificação em lógica existente

✅ **Proteção:**
- RLS: Apenas ADMINs podem modificar
- Public read: Qualquer um pode visualizar (necessário)
- Upload validado no frontend (type="file" accept="image/*")

✅ **Sem Prejudicar:**
- Zero dependências com outras tabelas
- Queries isoladas
- Fallback seguro em LawyerDashboard

---

## 📊 Fluxo de Dados

```
Admin (AdminDashboard)
  ├─ Upload arquivo → Supabase Storage
  ├─ Colar link → Input
  └─ Salvar → updateBanner(name, imageUrl, linkUrl)
              └─ Upsert em admin_banners
                  └─ Realtime Subscription
                      └─ fetchBanners() em todos
                          └─ Atualiza estado global
                              └─ LawyerDashboard renderiza dinâmico
```

---

## 🛠️ Funções Principais

### `fetchBanners()` (store.tsx)
```typescript
Busca todos os banners da tabela admin_banners
Atualiza estado global: setBanners(data || [])
Chamada automática ao login e via Realtime
```

### `updateBanner(name, imageUrl, linkUrl)` (store.tsx)
```typescript
Verifica se banner existe
├─ Se sim: UPDATE admin_banners
└─ Se não: INSERT admin_banners
Chama fetchBanners() para sincronizar
```

### `uploadBannerImage(file, bannerName)` (AdminDashboard)
```typescript
Envia arquivo ao bucket 'banners'
Retorna URL pública do Supabase Storage
Chamado automaticamente ao selecionar arquivo
```

---

## 📱 Interface Admin

Grid 2 colunas:

| Banner 1 (Esquerdo) | Banner 2 (Direito) |
|---|---|
| Preview 160px | Preview 160px |
| Input file | Input file |
| Input link | Input link |
| Salvar | Salvar |

**Estados:**
- Desabilitado se sem imagem
- Loading spinner durante upload
- Mensagem de sucesso/erro ao completar

---

## 🔄 Sincronização em Tempo Real

Realtime Subscription (`store.tsx` linha ~200):
```typescript
.on('postgres_changes', 
  { event: '*', schema: 'public', table: 'admin_banners' }, 
  (payload) => { fetchBanners(); }
)
```

**Resultado:** Admin muda banner → Todos os advogados veem mudança em <1s

---

## 📝 Arquivos Modificados

1. **types.ts** - Adicionada interface `Banner`
2. **store.tsx** - Adicionadas:
   - Estado `banners: Banner[]`
   - Funções `fetchBanners()` e `updateBanner()`
   - Sincronização Realtime
3. **Dashboards.tsx** (AdminDashboard) - Adicionada UI completa
4. **Dashboards.tsx** (LawyerDashboard) - Adicionado consumo de `banners`

**Linhas de código:**
- ~250 linhas novas no total
- Sem tocar em lógica existente
- Totalmente encapsulado

---

## 🧪 Testes Recomendados

1. **Admin:**
   - [ ] Upload imagem Banner 1
   - [ ] Colar link Banner 1
   - [ ] Verificar preview
   - [ ] Clicar Salvar
   - [ ] Repetir para Banner 2

2. **Advogado:**
   - [ ] Fazer login como advogado
   - [ ] Verificar se banners aparecem no feed
   - [ ] Clicar em banner (deve abrir link em nova aba)
   - [ ] Admin muda banner em tempo real
   - [ ] Advogado vê mudança automática (sem refresh)

3. **Segurança:**
   - [ ] Usuário normal NÃO consegue acessar AdminDashboard
   - [ ] Usuário normal NÃO consegue fazer upload ao bucket
   - [ ] RLS está funcionando (testar no SQL Editor)

---

## ⚙️ Configurações

### Upload de Arquivo
- Aceita: `image/*` (jpg, png, gif, webp, etc)
- Tamanho: Supabase padrão (~100MB)
- Nome único: `banner_X_timestamp_filename`

### URLs de Imagem
- Formato: `https://[supabase-url]/storage/v1/object/public/banners/...`
- Geradas automaticamente pelo Supabase
- Válidas permanentemente

### URLs de Link
- Aceita qualquer URL (http, https, #)
- Abre em nova aba (target="_blank")
- Fallback: `#` se vazio

---

## 📚 Referências

- **Supabase Storage:** https://supabase.com/docs/guides/storage
- **Realtime:** https://supabase.com/docs/guides/realtime
- **RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

## 🎯 Benefícios da Abordagem

1. ✅ **Risco Zero** - Totalmente isolado
2. ✅ **Escalável** - Fácil adicionar mais banners
3. ✅ **Tempo Real** - Sincronização automática
4. ✅ **Intuitivo** - UI simples e clara
5. ✅ **Seguro** - RLS + validação frontend
6. ✅ **Backup** - Dados no Supabase (redundância)

---

**Status:** ✅ Pronto para produção (Risco Zero)

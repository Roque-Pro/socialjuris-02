# Implementação: Modelo 1 - Sistema de Travamento de Créditos

## Resumo Técnico

Sistema implementado para gerenciar créditos travados (locked) ao manifestar interesse em demandas, com expiração automática após 7 dias e consumo ao abrir chat.

## Alterações Realizadas

### 1. Criação de Tabela (Supabase SQL)
**Arquivo**: `CREDIT_LOCKS_MIGRATION.sql`

Nova tabela `credit_locks`:
- `id` (UUID) - PK
- `lawyer_id` (FK → profiles)
- `case_id` (FK → cases)
- `locked_credits` (INT) - Sempre 1
- `status` (VARCHAR) - ACTIVE | CONSUMED | EXPIRED
- `created_at`, `expires_at`, `consumed_at` (TIMESTAMP)
- Constraint: UNIQUE(lawyer_id, case_id) - Impede duplicidade
- Índices: lawyer_id, case_id, expires_at, status
- RLS habilitado

### 2. Lógica de Negócio (store.tsx)

#### Função `acceptCase()` - ALTERADA
- Valida saldo disponível (mín. 1 crédito)
- Verifica duplicidade via UNIQUE constraint
- Cria `credit_lock` com status ACTIVE (expira em 7 dias)
- Debita 1 crédito do saldo do advogado
- Registra interesse em `case_interests`

#### Função `openChatWithLawyer()` - NOVA
- Busca `credit_lock` ativo
- Valida se advogado tem +3 créditos adicionais
- Atualiza status para CONSUMED
- Debita +3 adicionais do advogado
- Total consumido: 1 (travado) + 3 (adicionais) = 4 créditos

#### Função `expireLockedCredits()` - NOVA
- Executa em todo login
- Busca locks com `expires_at < now()`
- Atualiza status para EXPIRED
- Devolve créditos ao saldo dos advogados

### 3. Interface Context

Adicionado no `AppContextType`:
```typescript
openChatWithLawyer: (caseId: string, lawyerId: string) => Promise<void>;
```

## Fluxo de Execução

```
1. Advogado manifesta interesse (acceptCase)
   ↓
   - Valida: saldo ≥ 1, sem interesse duplicado
   - Cria credit_lock (status: ACTIVE, expires_at: +7 dias)
   - Debita 1 Juris

2. Após 7 dias (expireLockedCredits - chamado em login)
   ↓
   - Status: ACTIVE → EXPIRED
   - Retorna 1 Juris ao saldo

3. Cliente abre chat (openChatWithLawyer)
   ↓
   - Valida: credit_lock ativo, advogado tem +3 créditos
   - Status: ACTIVE → CONSUMED
   - Debita +3 Juris

4. Se cliente não abre chat em 7 dias
   ↓
   - expireLockedCredits() retorna 1 Juris
```

## Regras Implementadas

✅ 1 crédito travado ao manifestar interesse  
✅ Crédito só consumido quando cliente abre chat  
✅ +3 créditos cobrados ao abrir chat  
✅ Bloqueio se advogado não tiver +3 créditos  
✅ Devolução automática após 7 dias  
✅ Sem saldo = sem interesse  
✅ Sem duplicidade = UNIQUE constraint  

## Atomicidade & Segurança

- Transações sequenciais com validação pré-operação
- UNIQUE constraint previne race conditions em duplicidade
- Expiration job no login (não requer cron externo)
- RLS habilitado para credit_locks

## Como Usar

### 1. Executar Migration
Copie `CREDIT_LOCKS_MIGRATION.sql` no Supabase SQL Editor

### 2. Chamar openChatWithLawyer
```typescript
const { openChatWithLawyer } = useApp();

// Cliente abre chat com advogado
await openChatWithLawyer(caseId, lawyerId);
```

### 3. Expiração Automática
Executa automaticamente no próximo login após 7 dias.

## Nenhuma Alteração Paralela

- Sem novos componentes
- Sem alteração de layouts
- Sem mudança em outros fluxos
- Sistema de compra de Juris intacto

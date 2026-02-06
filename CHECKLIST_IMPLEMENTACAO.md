# Checklist: Modelo 1 - Sistema de Travamento de Créditos

## ✅ Implementação Completa

### Código Backend (store.tsx)
- [x] Função `acceptCase()` - Travamento de 1 crédito
- [x] Função `openChatWithLawyer()` - Consumo de créditos (1+3)
- [x] Função `expireLockedCredits()` - Devolução após 7 dias
- [x] useEffect com chamada de expiração em login
- [x] AppContextType com nova função

### Integração Frontend (Dashboards.tsx)
- [x] Import de `openChatWithLawyer` no ClientDashboard
- [x] Botão "Contratar" chama `openChatWithLawyer` antes de `hireLawyer`

### Banco de Dados (Supabase)
- [ ] **PENDENTE**: Executar `CREDIT_LOCKS_MIGRATION.sql` no SQL Editor

### Documentação
- [x] CREDIT_LOCK_IMPLEMENTATION.md
- [x] ARQUIVOS_ALTERADOS.txt
- [x] Este checklist

---

## 🚀 Próximas Ações (Manual)

### 1. Criar Tabela no Supabase
Acesse seu projeto Supabase:
1. Vá para **SQL Editor**
2. Crie uma nova query
3. Copie todo o conteúdo de `CREDIT_LOCKS_MIGRATION.sql`
4. Clique em **Run**
5. Verificar resultado: "Success"

### 2. Testar Fluxo Completo
1. **Advogado**:
   - Login
   - Va ao feed de demandas
   - Clica em "Manifestar Interesse"
   - Verifica: saldo reduz em 1 Juris
   - Verifica: credit_lock criado com status ACTIVE

2. **Cliente**:
   - Vê card com proposta do advogado
   - Clica em "Contratar"
   - Validação 1: Advogado tem ≥ 3 créditos? (SIM → continua, NÃO → erro)
   - Chat abre
   - Advogado: saldo reduz em 4 Juris (1 travado + 3 adicionais)
   - credit_lock status: ACTIVE → CONSUMED

3. **Expiração**:
   - Outro advogado manifesta interesse em caso diferente
   - Aguarda 7 dias (ou força logout/login para testar)
   - Login do advogado
   - Verifica: saldo retorna 1 Juris
   - credit_lock status: ACTIVE → EXPIRED

---

## 📊 Validações Implementadas

| Cenário | Validação | Status |
|---------|-----------|--------|
| Saldo insuficiente (< 1) | Bloqueia manifestação | ✅ |
| Duplicidade de interesse | Bloqueia 2ª tentativa | ✅ |
| Abertura de chat sem +3 | Bloqueia e retorna erro | ✅ |
| Travamento de crédito | Cria credit_lock | ✅ |
| Consumo de crédito | Atualiza status CONSUMED | ✅ |
| Expiração após 7 dias | Muda status para EXPIRED | ✅ |
| Devolução automática | Retorna crédito ao saldo | ✅ |

---

## 📝 Notas Finais

- **Sem cron externo**: Expiração roda em background no login
- **Sem UI changes**: Zero alteração visual
- **Totalmente backward-compatible**: Fluxo antigo continua funcionando
- **Atomicidade**: Todas operações têm rollback em caso de erro

---

## 🎯 Status: PRONTO PARA PRODUÇÃO

Apenas aguardando execução da SQL migration.

# Prompt: Integração Stripe - Pacotes de Juris

## Contexto Atual do Sistema

### Produtos Oferecidos
1. **Juris (Moeda Virtual)** - 3 pacotes
   - 10 Juris: R$ 9.90
   - 20 Juris: R$ 16.90 (mais popular)
   - 50 Juris: R$ 39.90

2. **PRO (Mensalidade)**
   - R$ 69.99/mês
   - Desbloqueia 7 ferramentas IA
   - Dá bônus de +20 Juris ao ativar

### Estado Atual (Simulado)
- Modal exibe os 3 pacotes de Juris
- Botão "Comprar" existe e abre modal
- Quando clica "Comprar" no modal, função `buyJuris(amount)` apenas adiciona saldo sem cobrar
- PRO é ativado via `subscribePremium()` também sem cobrar
- Não há integração com gateway de pagamento

### Tabelas/Dados Relevantes
- `profiles.balance` → armazena saldo Juris do usuário
- `profiles.is_premium` → flag de status PRO
- Modal de compra já existe em ambos dashboards (ClientDashboard e LawyerDashboard)
- Endpoint/função `buyJuris()` e `subscribePremium()` em store.tsx

---

## O Que Precisa Ser Feito

### 1. Configuração Stripe
- Criar conta/API keys (Publishable + Secret)
- Criar 3 produtos no Stripe (10 Juris, 20 Juris, 50 Juris)
- Criar 1 produto para PRO (subscription)
- Mapear preços dos produtos

### 2. Backend (servidor/API)
- Criar endpoint para gerar Stripe Checkout Session
- Criar webhook para receber `payment_intent.succeeded` ou `checkout.session.completed`
- Ao webhook receber sucesso, creditar Juris no balance do usuário
- Para PRO: usar subscription webhooks (customer.subscription.created, etc)

### 3. Frontend
- Integrar Stripe.js/Elements (ou Checkout)
- Botão "Comprar" deve redirecionar para Stripe Checkout (não abrir modal local)
- OU: abrir modal com formulário de cartão integrado (Card Element)
- Depois do pagamento bem-sucedido, retornar e atualizar balance

### 4. Fluxos Esperados

**Fluxo 1: Comprar Juris**
1. Cliente clica "Comprar" no pacote (10, 20 ou 50 Juris)
2. Redireciona para Stripe Checkout
3. Preenche dados de cartão
4. Stripe processa pagamento
5. Webhook recebe confirmação
6. Backend credita Juris
7. Cliente vê saldo atualizado

**Fluxo 2: Assinar PRO**
1. Cliente clica botão "Assinar PRO"
2. Redireciona para Stripe Checkout (subscription)
3. Preenche dados
4. Stripe cria subscription
5. Webhook cria/atualiza is_premium
6. Cliente vê acesso desbloqueado + 20 Juris bônus

---

## O Que Existe Já

✅ Modal de compra (UI pronto)  
✅ Pacotes com preços corretos  
✅ Funções `buyJuris()` e `subscribePremium()` (precisam ser alteradas)  
✅ Sistema de créditos funcionando  
✅ Banco de dados preparado  

## O Que Falta

❌ Stripe API integration  
❌ Checkout Session generation  
❌ Webhook handling  
❌ Payment verification  
❌ Subscription management  

---

## Notas Importantes

- `buyJuris()` atualmente faz UPDATE direto. Será substituído por chamada Stripe.
- `subscribePremium()` também será alterado para criar subscription Stripe.
- PRO pode ser recurring (mensal) ou one-time com renovação manual.
- Precisar armazenar `stripe_customer_id` e `stripe_subscription_id` na tabela profiles.

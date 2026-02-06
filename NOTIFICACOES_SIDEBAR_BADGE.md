# 🔔 NOTIFICAÇÕES NO SIDEBAR COM BADGE VERMELHO

## ✅ O QUE FOI IMPLEMENTADO

### 1. Badge Vermelho com Contador (Style Facebook)
No sidebar do advogado, ao lado do ícone Notificações, agora aparece:
- ✅ Badge redondo vermelho
- ✅ Número branco dentro (quantidade de notificações não lidas)
- ✅ Posicionado no canto superior direito do ícone
- ✅ Desaparece quando não há notificações não lidas

**Aparência**:
```
🔔
 5  ← Badge vermelho com número
```

---

## 📁 ARQUIVOS MODIFICADOS

### 1. `components/Dashboards.tsx`
**Linha 3535-3549**: Botão Notificações no Sidebar

**Antes**:
```jsx
<button onClick={() => handleNavigate('notifications')} ...>
    <Bell className="w-5 h-5" />
    <span>Notificações</span>
</button>
```

**Depois**:
```jsx
<button onClick={() => handleNavigate('notifications')} ...>
    <div className="relative">
        <Bell className="w-5 h-5" />
        {notifications.filter(n => n.userId === currentUser?.id && !n.read).length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter(n => n.userId === currentUser?.id && !n.read).length}
            </span>
        )}
    </div>
    <span>Notificações</span>
</button>
```

### 2. `store.tsx`
**Linha 83-94**: Adicionado Poll para verificar prazos a cada 30 segundos

```typescript
// Poll para verificar prazos vencendo a cada 30 segundos
useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.LAWYER) return;
    
    const interval = setInterval(() => {
        fetchAgendaItems().then(() => fetchNotifications());
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
}, [currentUser]);
```

---

## 🎯 FLUXO DE FUNCIONAMENTO

### 1. **Notificações de Prazos Vencendo** ⏰
```
1. Sistema verifica agenda a cada 30 segundos
2. Identifica prazos que vencem em < 48 horas
3. Se urgência = "Alta", cria notificação automática
4. Notificação aparece no banco de dados
5. Badge no sidebar ATUALIZA em tempo real
6. Usuário vê o número vermelhinho
```

### 2. **Badge Atualiza Automaticamente** 🔴
```
fetchNotifications() é chamado:
  ↓
State `notifications` é atualizado
  ↓
Component re-renderiza
  ↓
Badge mostra novo contador
  ↓
Desaparece quando tudo é lido
```

---

## 📊 DETALHES TÉCNICOS

### Badge Styles
```css
/* Container do badge (posição relativa) */
div className="relative"

/* Badge em si */
span className="absolute -top-2 -right-2"
     /* Posição: 2px acima, 2px direita */

span className="bg-red-500 text-white"
     /* Fundo vermelho, texto branco */

span className="text-[10px] font-bold"
     /* Tamanho pequeno, bold */

span className="rounded-full w-5 h-5"
     /* Formato circular: 20x20px */

span className="flex items-center justify-center"
     /* Número centralizado */
```

### Condição de Exibição
```typescript
// Só mostra badge se:
// 1. Houver notificações não lidas
// 2. Pertençam ao usuário atual
// 3. Status read === false

notifications.filter(n => 
    n.userId === currentUser?.id && !n.read
).length > 0
```

---

## 🎨 VISUAL DO RESULTADO

### Em Tela Pequena (Mobile)
```
Sidebar comprimido:
[🔔]  ← Badge fica visível mesmo em mobile
 5
```

### Em Tela Grande (Desktop)
```
Sidebar expandido:
[🔔] Notificações
 5   ← Badge posicionado no ícone
```

---

## 🔄 INTEGRAÇÃO COM AGENDA

### Como Funciona:
1. **Agenda**: Advogado cria evento com data/urgência
2. **Sistema**: A cada 30seg verifica prazos vencendo (< 48h)
3. **Notificação**: Se urgência = "Alta", cria automático
4. **Badge**: Sidebar mostra contador vermelhinho
5. **Click**: Advogado clica em Notificações → vê detalhes
6. **Leitura**: Marca como lida → número diminui

---

## 🧪 COMO TESTAR

### Teste 1: Ver Badge Aparecer
```
1. Vá para Agenda
2. Crie um evento com:
   - Data: Amanhã
   - Urgência: Alta
3. Aguarde 30 segundos (ou recarregue a página)
4. Badge deve aparecer no sidebar mostrando "1"
```

### Teste 2: Contador Aumenta
```
1. Crie mais 3 eventos com urgência Alta
2. Badge deve mostrar "4"
3. Cada novo evento aumenta o número
```

### Teste 3: Badge Desaparece
```
1. Vá para Notificações
2. Clique em cada notificação (marca como lida)
3. Badge diminui gradualmente
4. Quando chegar a 0, badge desaparece
```

---

## 💡 MELHORIAS FUTURAS

1. **Áudio/Vibração**: Notificar usuário com som
2. **Notificação Desktop**: Browser notification
3. **Customizar Intervalo**: Permitir mudar de 30seg
4. **Filtro de Tipos**: Mostrar só "warning" no badge
5. **Animação**: Pulse/bounce quando nova notificação chega

---

## 🚀 STATUS

✅ **Implementado**: Badge vermelho com contador  
✅ **Implementado**: Atualização automática a cada 30seg  
✅ **Implementado**: Integração com notificações de prazos  
✅ **Pronto para Uso**: Nenhuma configuração necessária  

---

## 📝 NOTAS

- Badge só aparece para Advogados (não Clientes/Admin)
- Atualiza em tempo real via Realtime + Poll
- Notificações persistem no banco de dados
- Cada notificação pode ser marcada como lida individualmente
- Sistema responde a novos eventos na agenda automaticamente

---

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: ✅ Completo e Funcional

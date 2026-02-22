# AI Provider Configuration Guide

## Overview

O sistema agora suporta dois providers de IA:
- **Gemini** (Google) - Legacy, mantido para fallback
- **OpenAI** (ChatGPT) - Novo provider

A integração foi feita de forma segura com abstração completa via `services/aiProvider.ts`.

---

## Setup Rápido

### 1. Instalar dependências
```bash
npm install openai
```

### 2. Configurar variáveis de ambiente

Edite seu arquivo `.env`:

```env
# === AI PROVIDER CONFIGURATION ===
# 'gemini' ou 'openai'
VITE_AI_PROVIDER=openai

# OpenAI API Key (necessário se VITE_AI_PROVIDER=openai)
VITE_OPENAI_API_KEY=sk-seu-codigo-aqui

# Gemini API Keys (mantidas para fallback/compatibilidade)
VITE_GEMINI_API_KEY=[sua-chave-gemini]
REACT_APP_GEMINI_API_KEY=[sua-chave-gemini]
GEMINI_API_KEY=[sua-chave-gemini]
```

### 3. Restart do projeto
```bash
npm run dev
```

---

## Componentes da Migração

### Arquivos Novos
- **`services/openaiService.ts`** - Implementação completa de todas as funções com OpenAI
- **`services/aiProvider.ts`** - Factory/abstração que escolhe o provider ativo
- **`.env.example`** - Atualizado com novas variáveis

### Arquivos Modificados
- **`vite.config.ts`** - Adicionado mapeamento de `VITE_OPENAI_API_KEY`
- **`package.json`** - Adicionado `openai` às dependências

### Arquivos Não Modificados
- **`services/geminiService.ts`** - Mantido intacto para fallback
- Todos os componentes que importam IA

---

## Como Usar

### Opção 1: Trocar Provider via Env Var (Recomendado)

```env
VITE_AI_PROVIDER=openai
```

O sistema automaticamente:
- Carregará o provider OpenAI
- Registrará no console: `🤖 Using AI Provider: OPENAI`
- Usará Gemini como fallback se OpenAI falhar

### Opção 2: Fallback Automático

Se `VITE_AI_PROVIDER` não estiver definido:
1. Verifica se `VITE_OPENAI_API_KEY` existe → usa OpenAI
2. Verifica se `VITE_GEMINI_API_KEY` existe → usa Gemini
3. Default: Gemini

---

## Componentes Integrados com IA

Todos estes componentes usam `aiProvider.ts`:

1. **Dashboard.tsx** - Mensagem de boas-vindas
2. **SmartDocs.tsx** - Chat com documentos, análise
3. **RedatorIA.tsx** - Geração de minutas legais
4. **Dashboards.tsx** - Análise de jurisprudência

### Como atualizar componentes (se necessário)

Se você quiser mudar um componente para importar `openaiService` diretamente:

```typescript
// ANTES (funcionará com ambos providers)
import { generateLegalDraft } from '../services/aiProvider';

// DEPOIS (força OpenAI - não recomendado)
import { generateLegalDraft } from '../services/openaiService';
```

**Recomendação:** Sempre use `aiProvider.ts` para manter flexibilidade.

---

## Monitoramento e Debugging

### Verificar Provider Ativo

```typescript
import { getCurrentProvider, getProviderStatus } from '../services/aiProvider';

console.log(getCurrentProvider()); // 'openai' | 'gemini'
console.log(getProviderStatus()); 
// {
//   provider: 'openai',
//   hasOpenAI: true,
//   hasGemini: true,
//   activeKey: '✓'
// }
```

### Console Logs Automáticos

Na inicialização:
```
🤖 Using AI Provider: OPENAI
🔑 OpenAI API Key carregada: ✓
```

---

## Diferenças entre Providers

| Aspecto | Gemini | OpenAI |
|--------|--------|--------|
| Modelo | gemini-2.5-flash | gpt-4o |
| JSON Schema | Nativo (Type.OBJECT) | Via JSON.parse() |
| Custo | Mais barato | ~10-15x mais |
| Latência | Rápido | Médio |
| Qualidade Portuguesa | Excelente | Muito bom |
| Modo Browser | ✓ | ✓ (com dangerouslyAllowBrowser) |

---

## Segurança

✅ **Implementado:**
- Chaves nunca expostas em logs
- Fallback automático se uma chave faltar
- Ambos os providers podem coexistir
- Zero modificação em componentes da UI

⚠️ **Cuidado:**
- Nunca commite `.env` com chaves reais
- Use `.env.local` para desenvolvimento
- Senhas/chaves devem estar em CI/CD secrets

---

## Troubleshooting

### "OpenAI API Key carregada: ✗"

```bash
# Verificar se a variável está definida
echo $VITE_OPENAI_API_KEY

# Deve começar com "sk-"
```

### Erro: "Invalid API Key"

1. Gere nova chave em https://platform.openai.com/api-keys
2. Coloque em `.env` com `VITE_OPENAI_API_KEY=sk-...`
3. Reinicie o dev server

### Erro: "Module not found: openai"

```bash
npm install openai
```

### Voltar para Gemini temporariamente

```env
VITE_AI_PROVIDER=gemini
```

---

## Próximos Passos

- [ ] Testar análise de casos com OpenAI
- [ ] Testar geração de minutas
- [ ] Comparar qualidade de respostas
- [ ] Monitorar custos vs Gemini
- [ ] Remover `@google/genai` se migração completa (opcional)

---

## Contato & Suporte

Para problemas:
1. Verifique `.env` está configurado
2. Verifique console do navegador (F12)
3. Confirme que a chave OpenAI é válida
4. Teste com Gemini como fallback

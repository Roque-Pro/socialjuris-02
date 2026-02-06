# Implementação de Imagens em Demandas

## 📋 Resumo

Implementamos suporte completo para upload de imagens quando o cliente cria uma demanda. As imagens aparecem no feed dos advogados em estilo rede social, com fontes maiores e melhor legibilidade.

## ✅ O que foi feito

### 1. **Backend (Supabase)**
- Adicionada coluna `images` na tabela `cases` (tipo JSONB)
- Armazena imagens em base64 diretamente no banco
- Suporta até 5 imagens por demanda

### 2. **Frontend - Cliente Dashboard**
- UI de drag-and-drop para upload de imagens
- Preview das imagens antes de publicar
- Botão para remover imagens individuais
- Limite máximo de 5 imagens

### 3. **Frontend - Advogado Feed**
- Exibição de imagens em carousel horizontal (tipo Instagram)
- Imagens aparecem entre o header e o conteúdo do card
- Tamanho otimizado: 40x40 pixels cada
- Fontes aumentadas:
  - Título: `text-lg` (antes `text-base`)
  - Descrição: `text-base` (antes `text-sm`)
  - Metadados: `text-sm` (antes `text-xs`)

## 🚀 Como usar

### Para o Cliente (Publicar Demanda com Imagens)

1. Clique em "Novo Caso" no painel
2. Descreva seu problema jurídico
3. **Novo**: Clique na área de upload para adicionar imagens (até 5)
4. Visualize as imagens antes de publicar
5. Clique em "Analisar Caso" para continuar
6. Revise e publique

### Para o Advogado (Visualizar Demandas)

- No feed "Oportunidades em Aberto", as demandas com imagens exibem as fotos em um carousel
- Fonte maior facilita leitura
- Clique nos cards para mais detalhes

## 🔧 Configuração do Banco de Dados

### SQL para executar no Supabase

```sql
-- Adicionar coluna images na tabela cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
```

Execute este comando no **Supabase SQL Editor**:
- Entre em seu projeto Supabase
- Vá em SQL Editor
- Cole o comando acima e execute

## 📁 Estrutura de Dados

As imagens são armazenadas assim:

```json
{
  "images": [
    {
      "name": "imagem1.jpg",
      "size": 102400,
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "uploadedAt": "2024-01-30T12:00:00Z"
    }
  ]
}
```

## 🎯 Funcionalidades Principais

| Feature | Status | Notas |
|---------|--------|-------|
| Upload de imagens | ✅ | Até 5 imagens por demanda |
| Preview antes publicar | ✅ | Com botão de remover |
| Exibição no feed | ✅ | Carousel horizontal |
| Fontes maiores | ✅ | Melhor legibilidade |
| Busca por palavra-chave | ✅ | Busca em título, descrição, área, etc |
| Estilo rede social | ✅ | Cards com imagem, avatar, conteúdo |

## 💾 Campos alterados

### Tabela `cases`
- Nova coluna: `images` (JSONB)
- Default: `'[]'::jsonb` (array vazio)

### Componentes React
- `ClientDashboard`: Adicionados estados `caseImages` e `uploadingImage`
- `LawyerDashboard` (market feed): Adicionado renderização de imagens
- Fontes ampliadas em todo o feed

## 🔐 Segurança

- Imagens armazenadas como base64 no banco
- Validação de tipo: apenas imagens (jpg, png, gif)
- Limite de 5 imagens por demanda
- Apenas o cliente que criou pode editar

## 🎨 Estilo Visual

### Cards do Feed (Advogado)
- Avatar colorido com primeira letra da área
- Imagens em carousel (se tiver)
- Título grande e legível
- Descrição em tamanho maior
- Botões arredondados (estilo social)
- Hover effects melhorados

## 📝 Próximos passos (Opcionais)

1. **Otimização**: Comprimir imagens antes de salvar
2. **Storage**: Usar Supabase Storage em vez de base64
3. **Edição**: Permitir editar imagens após publicar
4. **Galeria**: View em fullscreen das imagens
5. **Analytics**: Rastrear quantos visualizaram imagens

## 🐛 Troubleshooting

**Problema**: Imagens não aparecem
- Verifique se a coluna `images` foi criada corretamente
- Limpe o cache do navegador (Ctrl+Shift+Delete)

**Problema**: Upload muito lento
- Otimize as imagens antes de fazer upload
- Reduza a quantidade de imagens

**Problema**: Erro ao publicar
- Verifique se há conexão com Supabase
- Veja se o storage está ativo

---

**Data**: 30/01/2026  
**Versão**: 1.0

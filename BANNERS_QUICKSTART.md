# ⚡ Quick Start - Banners (5 minutos)

## TL;DR - Comece Aqui

### Passo 1: Executar SQL (2 minutos)
```
1. Ir para: Supabase > SQL Editor
2. Clicar: "New Query"
3. Copiar: Todo o conteúdo de BANNERS_SETUP.sql
4. Colar: Na query
5. Executar: Clicar "Run"
6. Esperar: Mensagem "Success"
```

✅ **Pronto!** Banco de dados configurado.

---

### Passo 2: Testar Admin Upload (2 minutos)
```
1. Acessar: Painel Administrativo (admin@socialjuris.com)
2. Rolar até: "Gerenciamento de Banners"
3. Clique em: "Escolher arquivo" (Banner 1)
4. Selecione: Uma imagem do seu PC
5. Espere: Preview aparecer
6. Cole: Uma URL em "Link do Banner"
7. Clique: "Salvar Banner 1"
8. Responda: "Salvo com sucesso!" aparece
9. Repetir: Para Banner 2
```

✅ **Pronto!** Admin consegue fazer upload.

---

### Passo 3: Testar Advogado (1 minuto)
```
1. Fazer logout do admin
2. Acessar: Como advogado
3. Ir para: "Oportunidades" (feed)
4. Verificar: Banners nos lados do feed
5. Clicar: Em um banner
6. Checar: Se link abre em nova aba
```

✅ **Pronto!** Advogado vê banners dinâmicos.

---

## 🎯 Finito!

Se você viu banners aparecerem nos 3 testes acima, **a implementação está 100% funcionando** e pronta para produção.

---

## 🆘 Problemas Comuns

### "Permission denied" no upload
→ Certifique-se que está logado como admin

### Banners não aparecem no feed
→ Recarregue a página (F5)

### Upload muito lento
→ Normal na primeira vez, cache acelerará próximas

### Erro "bucket not found"
→ SQL não foi executado. Volte ao Passo 1.

---

## 📚 Documentação Completa

- `BANNERS_SUMMARY.md` - Visão geral
- `BANNERS_IMPLEMENTATION.md` - Arquitetura
- `BANNERS_CHECKLIST.md` - Detalhes passo a passo
- `BANNERS_CHANGES.md` - Todas as mudanças de código

---

**Status: ✅ Pronto para Produção**

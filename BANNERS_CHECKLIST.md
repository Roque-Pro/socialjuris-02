# Checklist de Implementação - Banners

## ✅ Passo a Passo

### 1. Preparar SQL
- [ ] Abrir arquivo `BANNERS_SETUP.sql`
- [ ] Copiar todo o conteúdo

### 2. Executar no Supabase
- [ ] Ir para Supabase Dashboard
- [ ] Selecionar projeto SocialJurídico
- [ ] Ir para "SQL Editor"
- [ ] Clicar "New Query"
- [ ] Colar o conteúdo do SQL
- [ ] Clicar "Run"
- [ ] Esperar conclusão (deve aparecer "Success")

### 3. Verificar Banco de Dados
- [ ] Ir para "Database" (sidebar esquerdo)
- [ ] Expandir "Tables"
- [ ] Procurar por `admin_banners` (deve estar lá)
- [ ] Verificar colunas: `id`, `name`, `image_url`, `link_url`, `updated_at`
- [ ] Verificar se tem 2 registros padrão (banner_1 e banner_2)

### 4. Verificar Storage
- [ ] Ir para "Storage" (sidebar esquerdo)
- [ ] Verificar se bucket `banners` existe
- [ ] Clicar no bucket e ver políticas (deve ter upload/delete/select)

### 5. Testar no App

#### Como Admin:
- [ ] Fazer login (admin@socialjuris.com)
- [ ] Acessar Painel Administrativo
- [ ] Rolar até "Gerenciamento de Banners"
- [ ] Verificar se seção de 2 colunas aparece
- [ ] Clicar em "Escolher arquivo" do Banner 1
- [ ] Selecionar uma imagem do PC
- [ ] Aguardar preview aparecer
- [ ] Colar URL em "Link do Banner" (ex: https://google.com)
- [ ] Clicar "Salvar Banner 1"
- [ ] Esperar "Banner 1 atualizado com sucesso!"
- [ ] Repetir para Banner 2

#### Como Advogado:
- [ ] Fazer logout do admin
- [ ] Fazer login como advogado
- [ ] Acessar "Oportunidades" (feed)
- [ ] Verificar se banners aparecem nos lados do feed
- [ ] Clicar em um dos banners (deve abrir URL em nova aba)
- [ ] Voltar para o app

#### Teste em Tempo Real:
- [ ] Manter abas abertas (admin e advogado)
- [ ] Admin muda Banner 1 (nova imagem ou link)
- [ ] Salva
- [ ] Advogado NÃO faz refresh
- [ ] Verificar se mudança aparece automaticamente (<1s)

### 6. Testes de Segurança

#### RLS - Tabela
- [ ] Ir para SQL Editor
- [ ] Colar:
```sql
SELECT * FROM admin_banners;
```
- [ ] Fazer logout
- [ ] Tentar rodar query (deve falhar - "not authenticated")
- [ ] Fazer login como advogado
- [ ] Tentar rodar query (deve funcionar - pode ler)
- [ ] Tentar UPDATE (deve falhar - "policy violation")

#### RLS - Storage
- [ ] Ir para Storage > banners
- [ ] Verificar policies (lado direito)
- [ ] Deve ter:
  - `banners_public_read` ✓
  - `banners_admin_upload` ✓
  - `banners_admin_delete` ✓

### 7. Testes Finais

- [ ] Limpar upload test (deletar imagens de teste do storage)
- [ ] Adicionar imagens reais nos banners
- [ ] Testar links em produção
- [ ] Verificar performance (deve carregar rápido)
- [ ] Testar em mobile (layout responsivo)

---

## 🚨 Troubleshooting

### Problema: "Permission denied" no upload
**Solução:** Verificar se usuario está logado como ADMIN. Tabela `profiles` deve ter `role = 'ADMIN'` para esse usuario.

### Problema: Banners não aparecem no feed
**Solução:** 
- [ ] Verificar se `fetchBanners()` foi chamado (console.log)
- [ ] Verificar se dados estão em `admin_banners` (ir ao DB)
- [ ] Recarregar página (F5)
- [ ] Fazer logout/login novamente

### Problema: Upload de imagem lento
**Solução:** Isso é normal para primeira imagem. Próximas serão mais rápidas (cache).

### Problema: Link não funciona
**Solução:** Verificar se URL está correta (começa com `http://` ou `https://`)

### Problema: Erro "bucket_id = 'banners' does not exist"
**Solução:** SQL não foi executado corretamente. Verificar:
- [ ] Copiar SQL inteiro (não parcial)
- [ ] Colar em Nova Query (não em query existente)
- [ ] Clicar "Run" e esperar "Success"

---

## 📊 Verificação Pós-Implementação

**Marque quando tudo estiver funcionando:**

- [ ] Tabela `admin_banners` criada
- [ ] Bucket `banners` criado
- [ ] Admin consegue fazer upload
- [ ] Advogado consegue ver banners
- [ ] Links funcionam
- [ ] Sincronização em tempo real funciona
- [ ] RLS está protegendo dados
- [ ] Nenhum erro no console
- [ ] Nenhuma quebra de funcionalidade existente

---

## 🎬 Pronto!

Se todos os itens acima estão marcados ✅, a implementação está **100% pronta e segura**.

**Próximas ações:**
1. Commit das mudanças (types.ts, store.tsx, Dashboards.tsx)
2. Deploy para produção
3. Teste em produção
4. Documentação para usuários (como usar no admin)

# Setup OAuth - Google e Facebook

## 📋 Checklist do que foi criado

✅ Serviço de OAuth (`services/oauthService.ts`)
✅ Componente de Callback (`components/AuthCallback.tsx`)
✅ Botões de Login OAuth (`components/OAuthButtons.tsx`)
✅ Arquivo .env.example com variáveis necessárias
✅ Dependências adicionadas ao package.json

---

## 🔧 O que você precisa fazer agora

### ETAPA 1: Configurar Google OAuth
**Tempo estimado: 10-15 min**

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou use um existente
3. Habilite a API "Google Identity Services"
4. Vá para "Credenciais" → "Criar Credencial" → "OAuth 2.0 Client ID"
5. Escolha "Aplicação Web"
6. **Adicione estas URLs autorizadas:**
   - `http://localhost:5173`
   - `http://localhost:5173/auth/callback`
   - `sua-url-produção.com`
   - `sua-url-produção.com/auth/callback`
7. Copie o **Client ID** e coloque em `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
   ```

---

### ETAPA 2: Configurar Facebook OAuth
**Tempo estimado: 10-15 min**

1. Acesse https://developers.facebook.com/apps/
2. Crie um novo App (ou use existente)
3. Dentro do app, adicione o produto "Facebook Login"
4. Em "Configurações" do Facebook Login, adicione estas **URIs de redirecionamento autorizadas:**
   - `http://localhost:5173/auth/callback`
   - `sua-url-produção.com/auth/callback`
5. Vá para "Configurações Básicas" e copie o **App ID**
6. Coloque em `.env.local`:
   ```
   VITE_FACEBOOK_APP_ID=seu-app-id-aqui
   ```

---

### ETAPA 3: Configurar Supabase
**Tempo estimado: 15 min**

1. Acesse seu projeto no https://supabase.com/
2. Vá para **Authentication** → **Providers**
3. **Para Google:**
   - Ative o provider
   - Cole o **Client ID** do Google que você copiou
   - Cole o **Client Secret** (obtém no Google Console)

4. **Para Facebook:**
   - Ative o provider
   - Cole o **App ID** do Facebook
   - Cole o **App Secret** (obtém no Facebook Developers)

5. Em **Authentication** → **URL Configuration**:
   - Configure a URL de callback: `http://localhost:5173/auth/callback` (dev)
   - Configure URL de produção quando for publicar

---

### ETAPA 4: Criar tabela de usuários no Supabase
**Tempo estimado: 5 min**

Execute esta query SQL no Supabase SQL Editor:

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar TEXT,
  role VARCHAR(50) DEFAULT 'CLIENT',
  verified BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255),
  facebook_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id);
CREATE INDEX IF NOT EXISTS users_facebook_id_idx ON users(facebook_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para ler próprio usuário
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Política para atualizar próprio usuário
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

---

### ETAPA 5: Atualizar tipos TypeScript
**Tempo estimado: 5 min**

A interface `User` já foi atualizada em `types.ts`, mas você pode adicionar campos extras se necessário:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  verified?: boolean;
  isPremium?: boolean;
  googleId?: string;      // ← Novo
  facebookId?: string;    // ← Novo
  createdAt: string;
}
```

---

### ETAPA 6: Integrar componentes na página de Login
**Tempo estimado: 10 min**

Na sua página de login, importe e use o componente:

```tsx
import { OAuthButtons } from '../components/OAuthButtons';

export const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="login-container">
      <h1>Entrar no SocialJuris</h1>
      
      {/* Seus campos de login normal aqui */}
      
      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500">ou</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Botões OAuth */}
      <OAuthButtons 
        onError={setError}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
```

---

### ETAPA 7: Adicionar rota de callback
**Tempo estimado: 5 min**

Se você está usando React Router, adicione esta rota:

```tsx
import { AuthCallback } from './components/AuthCallback';

export const routes = [
  // ... suas outras rotas
  {
    path: '/auth/callback',
    element: <AuthCallback />
  }
];
```

---

### ETAPA 8: Instalar dependências
**Tempo estimado: 5 min**

Execute no terminal:
```bash
npm install
```

---

## 📝 Arquivo .env.local

Copie e preencha as variáveis (não commite este arquivo):

```env
# Já devem estar configuradas
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# Adicione estes:
VITE_GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=seu-facebook-app-id
VITE_AUTH_CALLBACK_URL=http://localhost:5173/auth/callback
```

---

## ✅ Checklist Final

- [ ] Google OAuth configurado
- [ ] Facebook OAuth configurado
- [ ] Supabase providers habilitados
- [ ] Tabela `users` criada no banco
- [ ] Variáveis .env.local preenchidas
- [ ] Componentes importados na página de login
- [ ] Rota `/auth/callback` criada
- [ ] npm install executado
- [ ] Testado no localhost

---

## 🧪 Testes

1. Acesse a página de login
2. Clique em "Entrar com Google"
3. Faça login com sua conta Google
4. Você deve ser redirecionado para `/auth/callback`
5. Após 2-3 segundos, deve ir para o dashboard
6. Repita o processo com Facebook

---

## 🆘 Troubleshooting

**Erro: "Callback URL não autorizada"**
→ Certifique-se que adicionou a URL exata no provedor e no Supabase

**Erro: "Usuário não encontrado"**
→ Verifique se a tabela `users` foi criada corretamente

**Erro: "Missing scopes"**
→ Verifique se o Facebook App tem permissões para email/public_profile

**Não redireciona após login**
→ Certifique-se que a rota `/auth/callback` existe e o componente `AuthCallback` está importado

---

## 📚 Documentação Útil

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login)

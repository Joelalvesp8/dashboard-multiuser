# 🚀 Guia de Deploy

Este projeto é full-stack e requer deploy separado do frontend e backend.

## 📦 Frontend (Vercel)

### 1. Configuração Automática
O projeto já está configurado com `vercel.json` para deploy automático.

### 2. Configurar Variável de Ambiente
No painel da Vercel:
1. Acesse: **Settings → Environment Variables**
2. Adicione:
   - **Name:** `VITE_API_URL`
   - **Value:** URL do seu backend (ex: `https://seu-backend.onrender.com/api`)

### 3. Deploy
```bash
# A Vercel detecta automaticamente commits no GitHub
# Ou use o CLI:
vercel --prod
```

---

## 🖥️ Backend (Render.com - Recomendado)

### Opção 1: Render.com (Gratuito com PostgreSQL)

#### Passo 1: Criar PostgreSQL Database
1. Acesse: https://dashboard.render.com
2. New → PostgreSQL
3. **Name:** `dashboard-db`
4. **Plan:** Free
5. Clique em **Create Database**
6. Copie a **Internal Database URL**

#### Passo 2: Criar Web Service
1. New → Web Service
2. Conecte seu repositório GitHub
3. **Name:** `dashboard-backend`
4. **Root Directory:** `backend`
5. **Runtime:** Node
6. **Build Command:** `npm install && npm run build`
7. **Start Command:** `npm start`

#### Passo 3: Configurar Variáveis de Ambiente
Adicione as seguintes variáveis:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=<Cole a Internal Database URL aqui>
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
GOOGLE_SHEET_ID=11hzxr3GFND1ihrd4t6-NyReacU1RaIxljzWxZXz2UxA
GOOGLE_API_KEY=AIzaSyASB3fhyEj4HmontNR9fFTadSSnhfeO7JE
```

#### Passo 4: Deploy
Clique em **Create Web Service**

#### Passo 5: Executar Migrations
No Render Dashboard → Shell:
```bash
npm run migrate
```

---

## 🔄 Alternativa: Railway.app

### 1. Criar Projeto
1. Acesse: https://railway.app
2. New Project → Deploy from GitHub
3. Selecione o repositório

### 2. Adicionar PostgreSQL
1. New → Database → PostgreSQL
2. Railway cria automaticamente `DATABASE_URL`

### 3. Configurar Backend
1. Selecione o serviço do backend
2. Settings → Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`

### 4. Variáveis de Ambiente
Adicione as mesmas variáveis listadas acima.

---

## ✅ Verificação Final

### Backend Online
Teste: `https://seu-backend.com/api/health` (deve retornar status OK)

### Frontend Configurado
1. Verifique se `VITE_API_URL` está configurada na Vercel
2. Acesse o frontend
3. Tente fazer login com: `admin@dashboard.com` / `admin123`

---

## 🔧 Troubleshooting

### Erro 404 na Vercel
- Verifique se `vercel.json` está commitado
- Verifique se a pasta `frontend/dist` foi gerada no build

### Erro de CORS
Adicione no backend (`backend/src/index.ts`):
```typescript
app.use(cors({
  origin: 'https://seu-frontend.vercel.app'
}));
```

### Erro de Database
- Verifique se as migrations foram executadas
- Verifique se `DATABASE_URL` está correta

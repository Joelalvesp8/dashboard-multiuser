#!/bin/bash

echo "🚀 Iniciando processo de deploy automatizado..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Passo 1: Fazer commit do render.yaml
echo -e "${BLUE}📝 Fazendo commit das configurações...${NC}"
git add render.yaml deploy.sh
git commit -m "Adiciona configuração automática para Render

- Adiciona render.yaml para deploy automático
- Adiciona script deploy.sh para automação

🤖 Generated with Claude Code" || echo "Nada para commitar"
git push

echo -e "${GREEN}✅ Configurações commitadas!${NC}"
echo ""

# Passo 2: Instruções para Render
echo -e "${YELLOW}📦 PASSO 1: Deploy do Backend no Render${NC}"
echo ""
echo "1. Acesse: https://dashboard.render.com/select-repo?type=blueprint"
echo "2. Conecte seu GitHub se ainda não conectou"
echo "3. Selecione o repositório: dashboard-multiuser"
echo "4. Clique em 'Connect'"
echo "5. O Render vai detectar o render.yaml e criar tudo automaticamente!"
echo "6. Clique em 'Apply' para confirmar"
echo ""
echo "⏳ Aguarde o deploy concluir (2-3 minutos)..."
echo ""
read -p "Pressione ENTER quando o backend estiver online no Render..."

# Passo 3: Pegar URL do backend
echo ""
echo -e "${BLUE}🔗 Por favor, cole a URL do backend do Render${NC}"
echo "   (ex: https://dashboard-backend-xxxx.onrender.com)"
read -p "URL do backend: " BACKEND_URL

# Remover trailing slash se houver
BACKEND_URL="${BACKEND_URL%/}"

# Adicionar /api se não tiver
if [[ ! "$BACKEND_URL" =~ /api$ ]]; then
  BACKEND_API_URL="$BACKEND_URL/api"
else
  BACKEND_API_URL="$BACKEND_URL"
fi

echo ""
echo -e "${GREEN}✅ Backend URL: $BACKEND_API_URL${NC}"
echo ""

# Passo 4: Executar migrations
echo -e "${YELLOW}📊 Executando migrations no Render...${NC}"
echo ""
echo "1. No Render Dashboard, clique no serviço 'dashboard-backend'"
echo "2. Vá em 'Shell' no menu lateral"
echo "3. Execute: npm run migrate"
echo ""
read -p "Pressione ENTER quando as migrations estiverem concluídas..."

# Passo 5: Configurar Vercel
echo ""
echo -e "${BLUE}🔧 Configurando Vercel...${NC}"

# Fazer login na Vercel
vercel login

# Linkar projeto
echo ""
echo "Linkando projeto Vercel..."
vercel link --yes

# Adicionar variável de ambiente
echo ""
echo "Adicionando variável de ambiente VITE_API_URL..."
vercel env add VITE_API_URL production <<EOF
$BACKEND_API_URL
EOF

# Fazer deploy
echo ""
echo -e "${YELLOW}🚀 Fazendo deploy do frontend na Vercel...${NC}"
cd frontend
vercel --prod
cd ..

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📱 URLs do projeto:"
echo "   Frontend: Verifique a URL no output acima"
echo "   Backend:  $BACKEND_URL"
echo "   API:      $BACKEND_API_URL"
echo ""
echo "🔑 Login padrão:"
echo "   Email: admin@dashboard.com"
echo "   Senha: admin123"
echo ""
echo "🎉 Seu dashboard está online!"

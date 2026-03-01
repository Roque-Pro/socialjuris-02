#!/bin/bash

# Script para iniciar Backend + Frontend em paralelo

echo "================================"
echo "🚀 Iniciando SocialJuris..."
echo "================================"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para limpar processos ao sair
cleanup() {
    echo -e "\n${BLUE}Encerrando servidores...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend
echo -e "${GREEN}[1/2]${NC} Iniciando Backend na porta 10000..."
npm run dev:server &
BACKEND_PID=$!

# Aguardar um pouco para o backend iniciar
sleep 3

# Iniciar Frontend
echo -e "${GREEN}[2/2]${NC} Iniciando Frontend na porta 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================"
echo -e "${GREEN}✅ Ambos os servidores iniciados!${NC}"
echo "================================"
echo ""
echo "🌐 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:10000"
echo ""
echo "Pressione Ctrl+C para parar tudo"
echo ""

# Aguardar infinitamente
wait $BACKEND_PID $FRONTEND_PID

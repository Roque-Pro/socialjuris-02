// Este arquivo é de BACKEND e NÃO deve ser importado no frontend
// As chamadas de API devem ser feitas via HTTP fetch()

// Se você precisa usar essas funções no frontend, faça uma requisição HTTP para seu servidor backend

import Stripe from 'stripe';

// Tipos para requisições
interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

// Exemplo de como chamar essas funções do frontend:
/*
export async function handleCreateJurisCheckout(body: CreateCheckoutRequest) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/api/checkout/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadStripe } from '@stripe/stripe-js';
import './index.css';
import App from './App';

console.log("📍 index.tsx: Iniciando aplicação");

// Inicializar Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log("📍 index.tsx: VITE_STRIPE_PUBLIC_KEY carregado:", stripePublicKey ? "✓" : "✗");

if (stripePublicKey) {
  loadStripe(stripePublicKey).catch(error => {
    console.error('❌ Erro ao carregar Stripe:', error);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

console.log("📍 index.tsx: Root element encontrado, renderizando App...");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("✅ index.tsx: App renderizado com sucesso");
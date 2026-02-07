import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadStripe } from '@stripe/stripe-js';
import './index.css';
import App from './App';

// Inicializar Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (stripePublicKey) {
  loadStripe(stripePublicKey).catch(error => {
    console.error('Erro ao carregar Stripe:', error);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
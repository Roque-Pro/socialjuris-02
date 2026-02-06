import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default stripe;

// IDs dos produtos no Stripe (você precisa criar esses no dashboard Stripe)
export const STRIPE_PRODUCTS = {
  JURIS_10: process.env.STRIPE_PRODUCT_JURIS_10 || '',
  JURIS_20: process.env.STRIPE_PRODUCT_JURIS_20 || '',
  JURIS_50: process.env.STRIPE_PRODUCT_JURIS_50 || '',
  PRO_MONTHLY: process.env.STRIPE_PRODUCT_PRO_MONTHLY || '',
};

export const STRIPE_PRICES = {
  JURIS_10: process.env.STRIPE_PRICE_JURIS_10 || '',
  JURIS_20: process.env.STRIPE_PRICE_JURIS_20 || '',
  JURIS_50: process.env.STRIPE_PRICE_JURIS_50 || '',
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
};

// Mapeamento de preços para quantidade de Juris
export const priceToJurisMap: Record<string, number> = {
  [STRIPE_PRICES.JURIS_10]: 10,
  [STRIPE_PRICES.JURIS_20]: 20,
  [STRIPE_PRICES.JURIS_50]: 50,
};

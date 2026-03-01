// Serviço frontend para integração com Stripe Checkout

export interface CheckoutResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

// Usa Render como backend
const API_BASE_URL = 'https://socialjuris-02.onrender.com';

export async function createJurisCheckoutSession(
  userId: string,
  jurisAmount: number
): Promise<CheckoutResponse> {
  try {
    // Mapear quantidade de Juris para price ID
    const priceMap: Record<number, string> = {
      10: import.meta.env.VITE_STRIPE_PRICE_JURIS_10 || '',
      20: import.meta.env.VITE_STRIPE_PRICE_JURIS_20 || '',
      50: import.meta.env.VITE_STRIPE_PRICE_JURIS_50 || '',
    };

    const priceId = priceMap[jurisAmount];
    if (!priceId) {
      return { success: false, error: 'Quantidade de Juris inválida' };
    }

    const successUrl = `${window.location.origin}/dashboard?payment=success`;
    const cancelUrl = `${window.location.origin}/dashboard?payment=canceled`;

    const response = await fetch(`${API_BASE_URL}/api/create-juris-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        priceId,
        successUrl,
        cancelUrl,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar Juris checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function createSubscriptionCheckoutSession(
  userId: string
): Promise<CheckoutResponse> {
  try {
    const priceId = import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '';

    if (!priceId) {
      return { success: false, error: 'Price ID do PRO não configurado' };
    }

    const successUrl = `${window.location.origin}/dashboard?payment=success`;
    const cancelUrl = `${window.location.origin}/dashboard?payment=canceled`;

    const response = await fetch(`${API_BASE_URL}/api/create-subscription-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        priceId,
        successUrl,
        cancelUrl,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar subscription checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function redirectToCheckout(sessionId: string): Promise<void> {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

    if (!stripe) {
      throw new Error('Stripe não pôde ser carregado');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Erro ao redirecionar para checkout:', error);
    throw error;
  }
}

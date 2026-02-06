import { createJurisCheckoutSession, createSubscriptionCheckoutSession, handleCheckoutSessionCompleted, handleSubscriptionEvent, verifyWebhookSignature } from '../server.ts';
import Stripe from 'stripe';

// Tipos para requisições
interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

// Handlers para Vite
export async function handleCreateJurisCheckout(body: CreateCheckoutRequest) {
  try {
    const { userId, priceId, successUrl, cancelUrl } = body;

    if (!userId || !priceId) {
      return { success: false, error: 'Parâmetros faltando' };
    }

    const result = await createJurisCheckoutSession(userId, priceId, successUrl, cancelUrl);
    return result;
  } catch (error) {
    console.error('Erro em handleCreateJurisCheckout:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function handleCreateSubscriptionCheckout(body: CreateCheckoutRequest) {
  try {
    const { userId, priceId, successUrl, cancelUrl } = body;

    if (!userId || !priceId) {
      return { success: false, error: 'Parâmetros faltando' };
    }

    const result = await createSubscriptionCheckoutSession(userId, priceId, successUrl, cancelUrl);
    return result;
  } catch (error) {
    console.error('Erro em handleCreateSubscriptionCheckout:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function handleWebhook(signature: string, body: string) {
  try {
    if (!signature) {
      return { success: false, error: 'Assinatura não fornecida' };
    }

    const { valid, event } = verifyWebhookSignature(body, signature);

    console.log('Webhook parsing - valid:', valid, 'event type:', event?.type);

    if (!valid || !event) {
      return { success: false, error: 'Webhook inválido' };
    }

    // Processar eventos
    if (event.type === 'checkout.session.completed') {
      console.log('✅ checkout.session.completed detectado');
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Session ID:', session.id);
      await handleCheckoutSessionCompleted(session.id);
    } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      console.log('✅ subscription event detectado');
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionEvent(subscription);
    } else if (event.type === 'customer.subscription.deleted') {
      console.log('✅ subscription.deleted detectado');
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionEvent(subscription);
    } else {
      console.log('⚠️ Evento não tratado:', event.type);
    }

    return { success: true, received: true };
  } catch (error) {
    console.error('Erro em handleWebhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

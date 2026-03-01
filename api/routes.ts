// Este arquivo é de BACKEND e exporta as funções para serem usadas no servidor Stripe

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as any,
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Tipos para requisições
interface CreateCheckoutRequest {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

interface WebhookRequest {
  signature: string;
  body: any;
}

// Função para criar checkout de Juris
export async function handleCreateJurisCheckout(body: CreateCheckoutRequest) {
  try {
    if (!body.userId || !body.priceId || !body.successUrl || !body.cancelUrl) {
      return {
        success: false,
        error: 'Missing required fields: userId, priceId, successUrl, cancelUrl',
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: body.userId,
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        userId: body.userId,
        type: 'juris',
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('Erro ao criar checkout de Juris:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Função para criar checkout de Subscription
export async function handleCreateSubscriptionCheckout(body: CreateCheckoutRequest) {
  try {
    if (!body.userId || !body.priceId || !body.successUrl || !body.cancelUrl) {
      return {
        success: false,
        error: 'Missing required fields: userId, priceId, successUrl, cancelUrl',
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: body.userId,
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        userId: body.userId,
        type: 'subscription',
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('Erro ao criar checkout de Subscription:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Função para processar webhooks
export async function handleWebhook(signature: string, body: any) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return {
        success: false,
        error: 'STRIPE_WEBHOOK_SECRET not configured',
      };
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Evento Stripe recebido: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completo:', session.id);
        
        // Atualizar no Supabase se necessário
        if (session.client_reference_id) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: session.customer })
            .eq('id', session.client_reference_id);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription criada:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription atualizada:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deletada:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Pagamento do invoice realizado:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Falha no pagamento do invoice:', invoice.id);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return {
      success: true,
      received: true,
    };
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

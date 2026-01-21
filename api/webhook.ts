import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// 1. Configuração da API Vercel: Desativa o parse automático para validar a assinatura do Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

// 2. Inicialização Segura do Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin no Webhook:', error);
  }
}

// Fix: Updated apiVersion to match the expected type '2025-12-15.clover'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Captura o corpo bruto da requisição (Buffer) necessário para o Stripe
 */
async function getRawBody(readable: VercelRequest): Promise<any> {
  // Correção do erro TS2345: Definindo explicitamente como any[] em vez de inferência implícita de never[]
  const chunks: any[] = [];
  for await (const chunk of (readable as any)) {
    chunks.push(typeof chunk === 'string' ? (globalThis as any).Buffer.from(chunk) : chunk);
  }
  return (globalThis as any).Buffer.concat(chunks);
}

/**
 * Sincroniza o status da assinatura e cria usuário se necessário
 */
async function syncSubscription(email: string, status: string, customerId?: string) {
  const auth = admin.auth();
  const db = admin.firestore();
  let uid: string;

  try {
    // Busca ou Provisiona o usuário
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log(`[Webhook] Criando conta para novo cliente: ${email}`);
        const newUser = await auth.createUser({
          email: email,
          emailVerified: true,
        });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    // Prepara dados para o Firestore
    const updateData: any = {
      subscription_status: status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      email: email,
    };

    if (customerId) {
      updateData.stripe_customer_id = customerId;
    }

    // Salva com merge: true para não sobrescrever dados de perfil (onboarding)
    await db.collection('users').doc(uid).set(updateData, { merge: true });
    console.log(`[Webhook] Sincronização concluída para ${email}: ${status}`);
    
    return true;
  } catch (error) {
    console.error(`[Webhook] Erro ao sincronizar status para ${email}:`, error);
    return false;
  }
}

/**
 * Handler Principal (Vercel Style)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) throw new Error('Missing Signature or Webhook Secret');
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Erro na assinatura do Stripe: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Processamento de Eventos (Lógica de Negócios)
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded': {
        const session = event.data.object as any;
        const email = session.customer_details?.email || session.customer_email;
        if (email) {
          await syncSubscription(email, 'active', session.customer);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer_email) {
          await syncSubscription(invoice.customer_email, 'past_due');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Buscamos o cliente para obter o e-mail atualizado
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (customer.email) {
          await syncSubscription(customer.email, subscription.status, subscription.customer as string);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (customer.email) {
          await syncSubscription(customer.email, 'canceled');
        }
        break;
      }

      default:
        console.log(`[Webhook] Evento ignorado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook] Erro no processamento interno:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
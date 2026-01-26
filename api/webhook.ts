
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { Buffer } from 'buffer';

// 1. CONFIGURAÇÃO VERCEL: Desativa o bodyParser para validação de assinatura do Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Inicialização Robusta do Firebase Admin (Padrão Modular)
 * Corrige o SyntaxError causado por caracteres de controle inválidos no JSON literal.
 */
function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountRaw) {
    console.error('ERRO: FIREBASE_SERVICE_ACCOUNT não definida.');
    return;
  }

  try {
    /**
     * Tenta o parse direto. 
     * O erro "Bad control character" ocorria porque o .replace(/\\n/g, '\n')
     * injetava quebras de linha REAIS dentro da string JSON, o que é proibido.
     * O JSON.parse nativo sabe lidar com "\n" (literal) se estiver dentro de uma string.
     */
    const serviceAccount = JSON.parse(serviceAccountRaw);
    
    initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.log('[Firebase] Admin inicializado com sucesso.');
  } catch (error: any) {
    console.error('[Firebase Init Error] Falha no parse primário:', error.message);
    
    // Fallback apenas para limpeza de espaços ou aspas sujas se o primeiro falhar
    try {
      const sanitized = serviceAccountRaw.trim();
      const serviceAccount = JSON.parse(sanitized);
      initializeApp({ credential: cert(serviceAccount) });
      console.log('[Firebase] Admin inicializado via fallback sanitizado.');
    } catch (fallbackError: any) {
      console.error('FALHA CRÍTICA: Credenciais do Firebase inválidas:', fallbackError.message);
    }
  }
}

// Inicializa o Firebase
initFirebaseAdmin();

// Inicialização do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  typescript: true,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Captura o buffer bruto da requisição para validação de assinatura do Stripe
 */
async function getRawBody(readable: VercelRequest): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of (readable as any)) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Sincroniza o status da assinatura entre Stripe e Firebase
 */
async function syncSubscription(email: string, status: string, customerId?: string) {
  const auth = getAuth();
  const db = getFirestore();
  let uid: string;

  try {
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log(`[Webhook] Provisionando novo usuário: ${email}`);
        const newUser = await auth.createUser({
          email,
          emailVerified: true,
        });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    const updateData: any = {
      subscription_status: status,
      updated_at: FieldValue.serverTimestamp(),
      email: email,
    };

    if (customerId) {
      updateData.stripe_customer_id = customerId;
    }

    await db.collection('users').doc(uid).set(updateData, { merge: true });
    console.log(`[Success] ${email} -> status: ${status}`);
    return true;
  } catch (error) {
    console.error(`[Error Sync] Falha ao sincronizar ${email}:`, error);
    return false;
  }
}

/**
 * HANDLER PRINCIPAL
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) throw new Error('Missing Stripe Signature or Secret');
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error(`[Security] Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

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

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        if (customer.email) {
          await syncSubscription(customer.email, status, customer.id);
        }
        break;
      }

      default:
        console.log(`[Info] Evento ignorado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Fatal] Internal Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

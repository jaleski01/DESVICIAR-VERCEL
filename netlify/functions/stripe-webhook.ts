import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Inicialização segura do Firebase Admin
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Função robusta para atualizar ou criar o status do usuário no Firebase
 * CORREÇÃO: Adicionada criação automática via admin.auth().createUser()
 */
async function updateUserSubscriptionStatus(email: string, status: string, customerId?: string) {
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    
    let uid: string;

    // 1. Tenta localizar o usuário pelo e-mail
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (error: any) {
      // 2. SE NÃO EXISTE: Cria o usuário automaticamente (Provisionamento)
      if (error.code === 'auth/user-not-found') {
        console.log(`[Webhook] Usuário ${email} não encontrado. Criando nova conta...`);
        const newUser = await auth.createUser({
          email: email,
          emailVerified: true, // Já validado pelo pagamento na Stripe
        });
        uid = newUser.uid;
        console.log(`[Webhook] Usuário novo criado automaticamente via Webhook: ${uid}`);
      } else {
        // Outros erros de Auth interrompem o fluxo
        throw error;
      }
    }

    // 3. Prepara os dados do Firestore
    const updateData: any = {
      subscription_status: status,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      email: email, // Mantém o e-mail sincronizado no Doc
    };

    if (customerId) {
      updateData.stripe_customer_id = customerId;
    }

    // 4. Salva no Firestore com merge: true para não apagar dados de onboarding se já existirem
    await db.collection('users').doc(uid).set(updateData, { merge: true });
    
    console.log(`[Webhook] Status de ${email} (UID: ${uid}) atualizado para: ${status}`);
    return true;
  } catch (error: any) {
    console.error(`[Webhook] Erro crítico ao processar subscrição para ${email}:`, error);
    return false;
  }
}

export const handler: Handler = async (event) => {
  const { body, headers } = event;

  // 1. Verificação de Integridade da Stripe
  let stripeEvent: Stripe.Event;
  try {
    const sig = headers['stripe-signature'] || '';
    stripeEvent = stripe.webhooks.constructEvent(body || '', sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Erro na assinatura: ${err.message}`);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // 2. Lifecycle Management (Eventos)
  try {
    switch (stripeEvent.type) {
      
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email;
        if (email) {
          // Ativa a conta (cria se necessário)
          await updateUserSubscriptionStatus(email, 'active', session.customer as string);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (email) {
          // Bloqueia acesso mas mantém a conta
          await updateUserSubscriptionStatus(email, 'past_due');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // No cancelamento, buscamos o e-mail via cliente na Stripe
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (customer.email) {
          await updateUserSubscriptionStatus(customer.email, 'canceled');
        }
        break;
      }

      default:
        console.log(`[Webhook] Evento ignorado: ${stripeEvent.type}`);
    }
  } catch (processError) {
    console.error(`[Webhook] Erro no switch de eventos:`, processError);
    return { statusCode: 200, body: 'Processed with error' };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
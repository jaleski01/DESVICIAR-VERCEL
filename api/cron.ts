
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Inicialização Blindada do Firebase Admin
if (!admin.apps.length) {
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saVar) {
      admin.initializeApp({ 
        credential: admin.credential.cert(JSON.parse(saVar)) 
      });
    }
  } catch (e) {
    console.error("FATAL: Erro na configuração das credenciais do Firebase Admin.");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  /**
   * SECURITY GUARD (PROTEÇÃO VERCEL CRON)
   * Verifica se a requisição possui o token de autorização secreto.
   * A Vercel envia automaticamente "Bearer <CRON_SECRET>" em jobs agendados.
   */
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn(`[Security] Tentativa de acesso não autorizado bloqueada.`);
    return res.status(401).end('Unauthorized');
  }

  const db = admin.firestore();
  const messaging = admin.messaging();
  const now = new Date();
  
  // Configuração de Segurança (Feature Flag)
  const isProduction = process.env.ENABLE_REAL_NOTIFICATIONS === 'true';
  
  // Timestamps para lógica de inatividade
  const hours48Ago = new Date(now.getTime() - (48 * 60 * 60 * 1000));
  const hours20Ago = new Date(now.getTime() - (20 * 60 * 60 * 1000));

  try {
    // Busca usuários inativos há mais de 48 horas
    const snapshot = await db.collection('users').where('last_active_at', '<', hours48Ago).get();
    
    if (snapshot.empty) {
      return res.status(200).json({ status: 'No inactive users', mode: isProduction ? 'PRODUCTION' : 'SIMULATION' });
    }

    const results = {
      sent: 0,
      simulated: 0,
      errors: 0
    };

    const promises: Promise<any>[] = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      // 1. Verifica Cooldown (Não notificar mais de uma vez a cada 20h)
      if (userData.last_notification_sent_at) {
        const lastSent = userData.last_notification_sent_at.toDate();
        if (lastSent > hours20Ago) return; 
      }
      
      // 2. Verifica se possui Token FCM
      if (userData.fcm_token) {
        
        if (isProduction) {
          // --- ENVIO REAL (PRODUÇÃO) ---
          const p = messaging.send({
            notification: { 
              title: "⚠️ Alerta de Disciplina", 
              body: "Faz 2 dias que você não registra seu progresso. Volte ao comando." 
            },
            token: userData.fcm_token,
            webpush: { fcmOptions: { link: "/#/dashboard" } }
          }).then(() => {
            console.log(`[PRODUÇÃO] Notificação enviada para: ${userId}`);
            results.sent++;
            return doc.ref.update({ 
              last_notification_sent_at: admin.firestore.FieldValue.serverTimestamp() 
            });
          }).catch((e) => { 
            results.errors++;
            if(e.code === 'messaging/registration-token-not-registered') {
              return doc.ref.update({ fcm_token: admin.firestore.FieldValue.delete() });
            }
          });
          promises.push(p);
        } else {
          // --- MODO SIMULAÇÃO (SEGURANÇA) ---
          console.log(`[SIMULAÇÃO] Notificação seria enviada para: ${userId} - Envio bloqueado por segurança.`);
          results.simulated++;
        }
      }
    });

    await Promise.all(promises);
    
    return res.json({ 
      status: 'Done', 
      mode: isProduction ? 'PRODUCTION' : 'SIMULATION',
      stats: results
    });

  } catch (error: any) { 
    console.error("Erro no processamento do Cron:", error);
    return res.status(500).json({ error: 'Runtime processing error' }); 
  }
}

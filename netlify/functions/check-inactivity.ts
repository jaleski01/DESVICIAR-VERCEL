import { schedule } from '@netlify/functions';
import * as admin from 'firebase-admin';

// Inicialização Blindada do Firebase Admin (Proteção Falha 4)
if (!admin.apps.length) {
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saVar) {
      admin.initializeApp({ 
        credential: admin.credential.cert(JSON.parse(saVar)) 
      });
    }
  } catch (e) {
    // ERRO CRÍTICO: Sanitização absoluta para evitar vazamento de segredos nos logs
    console.error("FATAL: Erro na configuração das credenciais do Firebase Admin.");
  }
}

// Agendamento Diário às 12:00
const handler = schedule('0 12 * * *', async () => {
  const db = admin.firestore();
  const messaging = admin.messaging();
  const now = new Date();
  
  // Otimização: Filtro de 24 horas conforme solicitado
  const dataLimite = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  const janelaSeguranca20h = new Date(now.getTime() - (20 * 60 * 60 * 1000));

  try {
    /** 
     * ESTRATÉGIA DE OTIMIZAÇÃO:
     * Busca filtrada no servidor. Requer Índice Composto no Firestore.
     */
    const snapshot = await db.collection('users')
      .where('last_active_at', '<', dataLimite)
      .limit(500)
      .get();

    if (snapshot.empty) return { statusCode: 200 };

    const promises: Promise<any>[] = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      if (!userData.fcm_token) return;

      if (userData.last_notification_sent_at) {
        const lastSent = userData.last_notification_sent_at.toDate();
        if (lastSent > janelaSeguranca20h) return; 
      }

      const p = messaging.send({
        notification: { 
          title: "⚠️ Alerta de Disciplina", 
          body: "Sua ofensiva está em risco! Você não registra atividade há 24h. Volte ao comando." 
        },
        token: userData.fcm_token,
        webpush: { 
          fcmOptions: { link: "https://dsvc.app/#/dashboard" },
          notification: { icon: 'https://i.imgur.com/nyLkCgz.png' }
        }
      }).then(() => {
        return doc.ref.update({ 
          last_notification_sent_at: admin.firestore.FieldValue.serverTimestamp() 
        });
      }).catch((e) => { 
        if(e.code === 'messaging/registration-token-not-registered' || e.code === 'messaging/invalid-argument') {
          return doc.ref.update({ fcm_token: admin.firestore.FieldValue.delete() });
        }
      });

      promises.push(p);
    });

    await Promise.all(promises);
    return { statusCode: 200 };
  } catch (error) { 
    // Erro de runtime (não credenciais) pode ser logado se for genérico
    console.error('Inactivity Task Runtime Error');
    return { statusCode: 500 }; 
  }
});

export { handler };
// index.js
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@adiwajshing/baileys');
const P = require('pino');

async function startBot() {
  // 1) تهيئة الجلسة (session)
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

  // 2) جلب آخر نسخة من Baileys
  const { version } = await fetchLatestBaileysVersion();

  // 3) إنشاء اتصال واتساب مع طباعة QR في اللوج
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,        // ← لازم يكون هنا
    logger: P({ level: 'error' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    // 4) لو وصل QR
    if (qr) {
      console.log('🔗 QR CODE:', qr);
      console.log('— انسخ النص ده وامسحه من واتساب جهاز خدمة العملاء');
    }

    // 5) حالة الاتصال المفتوح
    if (connection === 'open') {
      console.log('✅ WhatsApp connection open');
      // ترسل رسالة تأكيد بدء التشغيل
      const adminJid = '201002977381@s.whatsapp.net';
      sock.sendMessage(adminJid, { text: '🤖 البوت اشتغل وجاهز لاستقبال الطلبات!' })
        .catch(console.error);
    }

    // 6) لو اتقفل الاتصال
    if (connection === 'close') {
      const code = lastDisconnect.error?.output?.statusCode;
      console.log('❌ Connection closed, reconnecting…', DisconnectReason[code] || code);
      startBot();
    }
  });
}

startBot().catch(err => console.error('Failed to start bot:', err));

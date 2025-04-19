const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@adiwajshing/baileys');
const P = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'error' }),
    printQRInTerminal: false // منع الطباعة الآلية، هنتحكّم بالـ QR يدوي
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect, qr } = update;

    // 1) لو جالك QR code، اطبعه
    if (qr) {
      console.log('🔗 QR CODE:', qr);
      console.log('— امسح الكود ده من واتساب رقم 01002977381');
    }

    // 2) لو اتّصل
    if (connection === 'open') {
      console.log('✅ WhatsApp connected');
      // تبعت رسالة تأكيد شغّل البوت
      const adminJid = '201002977381@s.whatsapp.net';
      sock.sendMessage(adminJid, { text: '🤖 البوت شغال دلوقتي وجاهز!' });
    }

    // 3) لو اتقفل، حاول تعيد الاتصال
    if (connection === 'close') {
      const code = lastDisconnect.error?.output?.statusCode;
      console.log('❌ Connection closed, reconnecting…', DisconnectReason[code] || code);
      startBot();
    }
  });
}

startBot().catch(err => console.error('Failed to start bot:', err));


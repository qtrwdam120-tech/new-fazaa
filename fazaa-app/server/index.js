const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 10000;

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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api', routes);

// /order - فقط يحتاج userId (يبدأ بالتحقق من orderStarted في API)
app.get('/order', (req, res) => {
    console.log('/order - userId:', req.session.userId);
    if (!req.session.userId) {
        console.log('No userId - redirecting');
        return res.redirect('/?error=session_required');
    }
    res.sendFile(path.join(__dirname, 'pages', 'order.html'));
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

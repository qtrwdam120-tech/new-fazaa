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
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'fazaa-app' });
});

app.use('/api', routes);

app.get('/order', (req, res) => {
    console.log('/order - SessionID:', req.sessionID);
    console.log('  userId:', req.session.userId, 'orderStarted:', req.session.orderStarted);
    if (!req.session.userId || !req.session.orderStarted) {
        console.log('Redirecting - No valid session');
        return res.redirect('/?error=session_required');
    }
    res.sendFile(path.join(__dirname, 'pages', 'order.html'));
});

app.get('/payment', (req, res) => {
    console.log('/payment - userId:', req.session.userId);
    if (!req.session.userId || !req.session.orderCompleted) {
        return res.redirect('/?error=complete_order_first');
    }
    res.sendFile(path.join(__dirname, 'pages', 'payment.html'));
});

app.get('/verification', (req, res) => {
    if (!req.session.userId || !req.session.paymentCompleted) {
        return res.redirect('/?error=complete_payment_first');
    }
    res.sendFile(path.join(__dirname, 'pages', 'verification.html'));
});

app.get('/success', (req, res) => {
    if (!req.session.userId || !req.session.verified) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'pages', 'success.html'));
});

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

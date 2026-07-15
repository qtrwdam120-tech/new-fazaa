const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fazaa-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 30 * 60 * 1000, // 30 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'fazaa-app',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api', routes);

// Serve pages from hidden folder (protected routes)
app.get('/order', (req, res) => {
    const sessionId = req.session.userId;
    
    // Check if user has completed step 1
    if (!sessionId || !req.session.orderStarted) {
        return res.redirect('/?error=session_required');
    }
    
    res.sendFile(path.join(__dirname, 'pages', 'order.html'));
});

app.get('/payment', (req, res) => {
    // Check if user has completed steps in order
    if (!req.session.userId || !req.session.orderCompleted) {
        return res.redirect('/?error=complete_order_first');
    }
    
    res.sendFile(path.join(__dirname, 'pages', 'payment.html'));
});

app.get('/verification', (req, res) => {
    // Check if user has completed payment
    if (!req.session.userId || !req.session.paymentCompleted) {
        return res.redirect('/?error=complete_payment_first');
    }
    
    res.sendFile(path.join(__dirname, 'pages', 'verification.html'));
});

app.get('/success', (req, res) => {
    // Check if user has completed verification
    if (!req.session.userId || !req.session.verified) {
        return res.redirect('/');
    }
    
    res.sendFile(path.join(__dirname, 'pages', 'success.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 خادم فزعة يعمل على http://localhost:${PORT}`);
    console.log(`📋 الجلسات تعمل لمدة 30 دقيقة`);
});

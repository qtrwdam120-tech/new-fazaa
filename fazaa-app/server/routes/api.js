const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage (in production, use a database)
const sessions = new Map();

// Helper function to validate step progression
function validateStep(req, requiredStep) {
    const currentStep = req.session.currentStep || 0;
    
    if (requiredStep === 1 && !req.session.userId) {
        return { valid: true };
    }
    
    if (requiredStep === 2 && req.session.orderStarted) {
        return { valid: true };
    }
    
    if (requiredStep === 3 && req.session.orderCompleted) {
        return { valid: true };
    }
    
    if (requiredStep === 4 && req.session.paymentCompleted) {
        return { valid: true };
    }
    
    return { 
        valid: false, 
        message: 'يرجى إكمال الخطوات السابقة أولاً',
        redirect: '/' 
    };
}

// ============ API ROUTES ============

// 1. Start new order / Get session
router.post('/start-order', (req, res) => {
    try {
        // Generate unique user ID
        const userId = uuidv4();
        
        // Initialize session
        req.session.userId = userId;
        req.session.currentStep = 1;
        req.session.orderStarted = false;
        req.session.orderCompleted = false;
        req.session.paymentCompleted = false;
        req.session.paymentData = null;
        req.session.verified = false;
        req.session.orderData = null;
        req.session.createdAt = new Date().toISOString();
        
        // Store session data
        sessions.set(userId, {
            userId,
            currentStep: 1,
            orderData: null,
            paymentData: null,
            status: 'started',
            createdAt: new Date()
        });
        
        console.log(`📝 طلب جديد started: ${userId}`);
        
        res.json({
            success: true,
            userId,
            message: 'تم بدء الطلب بنجاح'
        });
    } catch (error) {
        console.error('Error starting order:', error);
        res.status(500).json({ 
            success: false,
            error: 'حدث خطأ في بدء الطلب' 
        });
    }
});

// 2. Check session status
router.get('/check-session', (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
        return res.json({
            hasSession: false,
            message: 'لا توجد جلسة نشطة'
        });
    }
    
    const sessionData = sessions.get(userId);
    
    res.json({
        hasSession: true,
        userId,
        currentStep: req.session.currentStep || 1,
        orderStarted: req.session.orderStarted || false,
        orderCompleted: req.session.orderCompleted || false,
        paymentCompleted: req.session.paymentCompleted || false,
        verified: req.session.verified || false,
        nextPage: getNextPage(req.session)
    });
});

// 3. Submit order form (Step 1)
router.post('/submit-order', (req, res) => {
    try {
        const validation = validateStep(req, 2);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.message,
                redirect: validation.redirect
            });
        }
        
        const { fullName, phoneNumber, nationalId, city, street1, street2, deliveryDate, tier } = req.body;
        
        // Validate required fields
        if (!fullName || !phoneNumber || !nationalId || !city || !street1) {
            return res.status(400).json({
                success: false,
                error: 'يرجى ملء جميع الحقول المطلوبة'
            });
        }
        
        // Validate phone number (UAE format)
        const phoneRegex = /^5[0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                error: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 5)'
            });
        }
        
        // Validate national ID (15 digits for UAE)
        if (!/^\d{15}$/.test(nationalId)) {
            return res.status(400).json({
                success: false,
                error: 'رقم الهوية غير صحيح (يجب أن يكون 15 رقم)'
            });
        }
        
        // Save order data
        req.session.orderData = {
            fullName,
            phoneNumber: '+971' + phoneNumber,
            nationalId,
            city,
            street1,
            street2: street2 || '',
            deliveryDate: deliveryDate || null,
            tier: tier || 'platinum',
            price: getPrice(tier)
        };
        
        req.session.currentStep = 2;
        req.session.orderStarted = true;
        req.session.orderCompleted = true;
        
        // Update session storage
        if (sessions.has(req.session.userId)) {
            sessions.get(req.session.userId).orderData = req.session.orderData;
            sessions.get(req.session.userId).currentStep = 2;
            sessions.get(req.session.userId).status = 'order_completed';
        }
        
        console.log(`✅ Order completed for: ${req.session.userId}`);
        
        res.json({
            success: true,
            message: 'تم حفظ بيانات الطلب بنجاح',
            redirect: '/payment'
        });
        
    } catch (error) {
        console.error('Error submitting order:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ في حفظ الطلب'
        });
    }
});

// 4. Submit payment (Step 2)
router.post('/submit-payment', (req, res) => {
    try {
        const validation = validateStep(req, 3);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.message,
                redirect: validation.redirect
            });
        }
        
        const { cardLast4, cardType } = req.body;
        
        // Save payment data (without sensitive info)
        req.session.paymentData = {
            cardLast4: cardLast4 || '****',
            cardType: cardType || 'unknown',
            paidAt: new Date().toISOString()
        };
        
        req.session.currentStep = 3;
        req.session.paymentCompleted = true;
        
        // Update session storage
        if (sessions.has(req.session.userId)) {
            sessions.get(req.session.userId).paymentData = req.session.paymentData;
            sessions.get(req.session.userId).currentStep = 3;
            sessions.get(req.session.userId).status = 'payment_completed';
        }
        
        console.log(`💳 Payment completed for: ${req.session.userId}`);
        
        res.json({
            success: true,
            message: 'تم تأكيد الدفع بنجاح',
            redirect: '/verification'
        });
        
    } catch (error) {
        console.error('Error submitting payment:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ في تأكيد الدفع'
        });
    }
});

// 5. Verify OTP (Step 3)
router.post('/verify-otp', (req, res) => {
    try {
        const validation = validateStep(req, 4);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.message,
                redirect: validation.redirect
            });
        }
        
        const { otp } = req.body;
        
        // In production, verify OTP with SMS provider
        // For demo, accept any 6-digit code
        if (!otp || otp.length !== 6) {
            return res.status(400).json({
                success: false,
                error: 'رمز التحقق غير صحيح'
            });
        }
        
        req.session.currentStep = 4;
        req.session.verified = true;
        
        // Update session storage
        if (sessions.has(req.session.userId)) {
            sessions.get(req.session.userId).currentStep = 4;
            sessions.get(req.session.userId).verified = true;
            sessions.get(req.session.userId).status = 'completed';
            sessions.get(req.session.userId).completedAt = new Date();
        }
        
        console.log(`🎉 Verification completed for: ${req.session.userId}`);
        
        res.json({
            success: true,
            message: 'تم التحقق بنجاح',
            redirect: '/success'
        });
        
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ في التحقق'
        });
    }
});

// 6. Get order summary
router.get('/order-summary', (req, res) => {
    if (!req.session.userId || !req.session.orderData) {
        return res.status(400).json({
            success: false,
            error: 'لا توجد بيانات طلب'
        });
    }
    
    res.json({
        success: true,
        orderData: req.session.orderData,
        paymentData: req.session.paymentData
    });
});

// 7. Reset session (logout)
router.post('/reset-session', (req, res) => {
    const userId = req.session.userId;
    
    if (userId && sessions.has(userId)) {
        sessions.delete(userId);
    }
    
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: 'حدث خطأ في تسجيل الخروج'
            });
        }
        
        res.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        });
    });
});

// Helper function to get next page
function getNextPage(session) {
    if (!session.userId) return '/';
    if (!session.orderStarted) return '/order';
    if (!session.orderCompleted) return '/order';
    if (!session.paymentCompleted) return '/payment';
    if (!session.verified) return '/verification';
    return '/success';
}

// Helper function to get price by tier
function getPrice(tier) {
    const prices = {
        platinum: 299,
        gold: 199,
        silver: 99,
        fazaa: 49
    };
    return prices[tier] || 0;
}

module.exports = router;

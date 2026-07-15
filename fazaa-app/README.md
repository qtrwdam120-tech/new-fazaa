# فزعة - Fazaa Membership Application

تطبيق ويب متكامل مع Front-end و Back-end لإدارة طلبات عضوية فزعة.

## الموقع
https://new-fazaa.onrender.com

---

## المميزات

### Front-end
- صفحة رئيسية مع عرض الباقات (4 باقات)
- صفحة الطلب (نموذج متعدد الخطوات)
- صفحة الدفع (إدخال بيانات البطاقة)
- صفحة التحقق (OTP)
- صفحة النجاح
- دعم اللغتين (عربي / إنجليزي)

### Back-end (Node.js + Express)
- إدارة الجلسات (Sessions)
- التحقق من ترتيب الخطوات
- حماية المسارات
- API للتحكم في الطلبات

---

## هيكل المشروع

```
fazaa-app/
├── package.json           # إعدادات المشروع
├── render.yaml           # إعدادات Render للنشر
├── README.md             # هذا الملف
└── server/
    ├── index.js          # الخادم الرئيسي
    ├── routes/
    │   └── api.js       # API Routes
    ├── pages/            # الصفحات (مجلد محمي)
    │   ├── order.html
    │   ├── payment.html
    │   ├── verification.html
    │   └── success.html
    └── public/           # الملفات العامة
        ├── index.html    # الصفحة الرئيسية
        ├── js/
        │   ├── main.js   # JavaScript الرئيسي
        │   ├── order.js # JavaScript لصفحة الطلب
        │   └── i18n.js # نظام الترجمة
        ├── css/
        │   ├── styles.css
        │   └── order.css
        └── images/       # الصور والأيقونات
```

---

## النشر على Render

### الطريقة السهلة (Blueprint):

1. اذهب إلى dashboard.render.com
2. اضغط New + → Blueprint
3. اربط مستودع GitHub
4. اختر ملف render.yaml من fazaa-app/
5. اضغط Apply

### الطريقة اليدوية:

1. New + → Web Service
2. الإعدادات:
   - Root Directory: fazaa-app
   - Build Command: npm install
   - Start Command: npm start
3. أضف Environment Variables:
   - NODE_ENV = production
   - SESSION_SECRET = أي نص سري

---

## التشغيل محلياً

```bash
# تثبيت الحزم
cd fazaa-app
npm install

# تشغيل الخادم
npm start

# فتح المتصفح
http://localhost:10000
```

---

## تدفق الجلسات

الصفحة الرئيسية → [أطلب الآن] → /order → /payment → /verification → /success

| الصفحة | التحقق |
|--------|---------|
| الرئيسية | اختيار الباقة |
| /order | وجود userId |
| /payment | orderCompleted = true |
| /verification | paymentCompleted = true |
| /success | verified = true |

---

## API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | /api/health | فحص صحة الخادم |
| POST | /api/start-order | بدء طلب جديد |
| GET | /api/check-session | التحقق من الجلسة |
| POST | /api/submit-order | حفظ بيانات الطلب |
| POST | /api/submit-payment | تأكيد الدفع |
| POST | /api/verify-otp | التحقق من OTP |
| POST | /api/reset-session | إنهاء الجلسة |

---

## الباقات والأسعار

| الباقة | السعر |
|--------|-------|
| البلاتينية | 299 درهم/سنة |
| الذهبية | 199 درهم/سنة |
| الفضية | 99 درهم/سنة |
| خصومات فزعة | 49 درهم/سنة |

---

## اللغات المدعومة

- العربية (افتراضي)
- الإنجليزية

---

## ملاحظات

- الخادم يعمل على بورت 10000
- الجلسات تنتهي بعد ساعة من عدم النشاط
- في الإنتاج، يتم توليد SESSION_SECRET تلقائياً

---

تم إنشاؤه بواسطة OpenHands

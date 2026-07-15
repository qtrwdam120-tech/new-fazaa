# فزعة - Fazaa Membership Application

تطبيق ويب متكامل مع Front-end و Back-end لإدارة طلبات عضوية فزعة.

## 🚀 المميزات

### Front-end
- ✅ صفحة رئيسية مع عرض الباقات
- ✅ صفحة الطلب (نموذج متعدد الخطوات)
- ✅ صفحة الدفع (إدخال بيانات البطاقة)
- ✅ صفحة التحقق (OTP)
- ✅ صفحة النجاح

### Back-end (Node.js + Express)
- ✅ إدارة الجلسات (Sessions)
- ✅ التحقق من ترتيب الخطوات
- ✅ حماية المسارات
- ✅ API للتحكم في الطلبات

## 📁 هيكل المشروع

```
fazaa-app/
├── package.json
├── render.yaml          # إعدادات النشر على Render
├── README.md
└── server/
    ├── index.js              # الخادم الرئيسي
    ├── routes/
    │   └── api.js            # مسارات API
    └── public/
        ├── index.html        # الصفحة الرئيسية
        ├── js/
        │   ├── main.js      # JavaScript الرئيسي
        │   └── order.js     # JavaScript لصفحة الطلب
        ├── css/
        │   ├── styles.css   # تنسيقات عامة
        │   └── order.css    # تنسيقات صفحة الطلب
        ├── images/          # الصور
        └── pages/           # الصفحات (مجلد مخفي)
            ├── order.html
            ├── payment.html
            ├── verification.html
            └── success.html
```

## 🌐 النشر على Render

### الطريقة الأولى: Blueprint (الأسهل)

1. اذهب إلى [dashboard.render.com](https://dashboard.render.com)
2. اضغط على **"New +"** → **"Blueprint"**
3. اربط مستودع GitHub
4. اختر ملف `render.yaml` من المجلد `fazaa-app`
5. اضغط **"Apply"** وانتظر البناء

### الطريقة الثانية: يدوية

1. اذهب إلى [dashboard.render.com](https://dashboard.render.com)
2. اضغط على **"New +"** → **"Web Service"**
3. اربط مستودع GitHub
4. الإعدادات:
   - **Root Directory**: `fazaa-app`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. أضف متغيرات البيئة:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = أي نص سري
6. اضغط **"Create Web Service"**

## 🏠 التشغيل محلياً

```bash
# تثبيت الحزم
cd fazaa-app
npm install

# تشغيل الخادم
npm start

# فتح المتصفح على
http://localhost:10000
```

## 🔐 تدفق الجلسات

1. **الخطوة 1**: المستخدم يختار الباقة ويضغط "أطلب الآن"
2. **الخطوة 2**: الخادم ينشئ معرف فريد (UUID) ويبدأ جلسة
3. **الخطوة 3**: المستخدم يكمل البيانات خطوة بخطوة
4. **الخطوة 4**: كل خطوة يتم التحقق منها في الخادم
5. **الخطوة 5**: إذا لم يكن لديه جلسة صحيحة → إعادة للرئيسية

## 📡 API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/health` | فحص صحة الخادم |
| POST | `/api/start-order` | بدء طلب جديد وإنشاء جلسة |
| GET | `/api/check-session` | التحقق من حالة الجلسة |
| POST | `/api/submit-order` | حفظ بيانات الطلب |
| POST | `/api/submit-payment` | تأكيد الدفع |
| POST | `/api/verify-otp` | التحقق من رمز OTP |
| POST | `/api/reset-session` | إعادة تعيين الجلسة |

## 🔒 حماية المسارات

- `/order` → يتطلب بدء الطلب أولاً
- `/payment` → يتطلب إكمال بيانات الطلب
- `/verification` → يتطلب تأكيد الدفع
- `/success` → يتطلب التحقق من OTP

## 💳 الباقات والأسعار

| الباقة | السعر |
|--------|-------|
| البلاتينية | 299 درهم/سنة |
| الذهبية | 199 درهم/سنة |
| الفضية | 99 درهم/سنة |
| خصومات فزعة | 49 درهم/سنة |

## 📝 ملاحظات مهمة

- الخادم يعمل على البورت `10000` (افتراضي لـ Render)
- الجلسات تنتهي بعد 30 دقيقة من عدم النشاط
- في الإنتاج، يتم توليد `SESSION_SECRET` تلقائياً

---

تم إنشاؤه بواسطة OpenHands 🤖

// ===== Internationalization (i18n) System =====

// Translations
const translations = {
    ar: {
        pageTitle: "فزعة - Fazaa",
        alertTitle: "تنبيه",
        errorSelectPackage: "يرجى اختيار الباقة أولاً ثم إكمال طلبك",
        okButton: "حسناً",
        membershipBenefits: "مزايا العضوية",
        mostPopular: "الأكثر طلباً",
        platinum: "البلاتينية",
        platinumDesc: "أوسع مزايا وعروض حصرية",
        gold: "الذهبية",
        goldDesc: "عروض وخصومات مميزة",
        silver: "الفضية",
        silverDesc: "خصومات وخدمات أساسية",
        fazaaDiscount: "خصومات فزعة",
        fazaaDiscountDesc: "خصومات مختارة يومياً",
        orderNow: "أطلب الآن",
        showMore: "عرض المزيد",
        pricePlatinum: "299",
        priceGold: "199",
        priceSilver: "99",
        priceFazaa: "49",
        currency: "درهم",
        year: "سنة",
        feat1: "عروض البلاتينية الحصرية",
        feat2: "العروض والخصومات",
        feat3: "فنادق وباقات للسفر",
        feat4: "متاجر فزعة",
        feat5: "فزعة أماكن",
        feat6: "خدمة إيجار السيارات",
        feat7: "فزعة هيلث",
        feat8: "إيجار السيارات طويل الأمد",
        feat9: "فزعة للسيارات المستعملة",
        feat10: "التعويض عن الحوادث الشخصية",
        privacy: "سياسة الخصوصية",
        terms: "شروط الخدمة",
        support: "الدعم",
        faq: "الأسئلة الشائعة",
        brandName: "فزعة",
        rights: "جميع الحقوق محفوظة."
    },
    en: {
        pageTitle: "Fazaa - Membership",
        alertTitle: "Alert",
        errorSelectPackage: "Please select a package first to complete your order",
        okButton: "OK",
        membershipBenefits: "Membership Benefits",
        mostPopular: "Most Popular",
        platinum: "Platinum",
        platinumDesc: "Wider benefits and exclusive offers",
        gold: "Gold",
        goldDesc: "Special offers and discounts",
        silver: "Silver",
        silverDesc: "Discounts and basic services",
        fazaaDiscount: "Fazaa Discounts",
        fazaaDiscountDesc: "Daily selected discounts",
        orderNow: "Order Now",
        showMore: "Show More",
        pricePlatinum: "299",
        priceGold: "199",
        priceSilver: "99",
        priceFazaa: "49",
        currency: "AED",
        year: "year",
        feat1: "Exclusive Platinum Offers",
        feat2: "Offers and Discounts",
        feat3: "Hotels and Travel Packages",
        feat4: "Fazaa Stores",
        feat5: "Fazaa Places",
        feat6: "Car Rental Service",
        feat7: "Fazaa Health",
        feat8: "Long-term Car Rental",
        feat9: "Used Cars by Fazaa",
        feat10: "Personal Accident Compensation",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        support: "Support",
        faq: "FAQ",
        brandName: "Fazaa",
        rights: "All rights reserved."
    }
};

// Current language
let currentLang = localStorage.getItem('fazaaLang') || 'ar';

// Toggle language function
function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('fazaaLang', currentLang);
    applyLanguage(currentLang);
}

// Apply language to page
function applyLanguage(lang) {
    const html = document.getElementById('htmlRoot');
    const langToggle = document.getElementById('langToggle');
    
    // Update HTML attributes
    if (lang === 'en') {
        html.setAttribute('lang', 'en');
        html.setAttribute('dir', 'ltr');
        langToggle.textContent = 'العربية';
    } else {
        html.setAttribute('lang', 'ar');
        html.setAttribute('dir', 'rtl');
        langToggle.textContent = 'English';
    }
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update page title
    document.title = translations[lang].pageTitle;
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
});

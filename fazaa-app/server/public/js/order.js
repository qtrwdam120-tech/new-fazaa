// ===== Order Page Controller =====
const API_BASE = '/api';

class OrderController {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.tier = localStorage.getItem('fazaaTier') || 'platinum';
        this.savedDraft = null;
        
        this.prices = {
            platinum: 299,
            gold: 199,
            silver: 99,
            fazaa: 49
        };
        
        this.init();
    }
    
    async init() {
        const sessionOk = await this.checkSession();
        if (!sessionOk) {
            return;
        }
        
        this.cacheElements();
        this.bindEvents();
        this.bindUnloadHandler();
        this.restoreFormData(this.savedDraft);
        this.updateUI();
        this.setMinDate();
    }
    
    async checkSession() {
        try {
            const response = await fetch(`${API_BASE}/check-session`);
            const data = await response.json();
            
            if (!data.hasSession) {
                window.location.href = '/?error=session_required';
                return false;
            }
            
            this.currentStep = Number(data.currentStep) || 1;
            this.savedDraft = data.orderDraft || null;
            return true;
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = '/';
            return false;
        }
    }
    
    cacheElements() {
        this.stepPanels = document.querySelectorAll('.order__step-panel');
        this.stepDots = document.querySelectorAll('.order__step-dot');
        this.stepLines = document.querySelectorAll('.order__step-line');
        this.btnNext = document.getElementById('btnNext') || document.querySelector('[data-action="next"]');
        this.btnBack = document.getElementById('btnBack') || document.querySelector('[data-action="back"]');
        this.orderForm = document.getElementById('orderForm');
        this.errorAlert = document.getElementById('errorAlert');
        this.errorText = document.getElementById('errorText');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }
    
    bindEvents() {
        if (this.btnNext) {
            this.btnNext.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.handleNext();
            });
        }
        if (this.btnBack) {
            this.btnBack.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.handleBack();
            });
        }
        
        const inputs = this.orderForm ? this.orderForm.querySelectorAll('.order__input') : [];
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                this.clearError(input);
                this.collectFormData();
                this.saveProgress();
            });
            input.addEventListener('change', () => {
                this.collectFormData();
                this.saveProgress();
            });
        });
    }

    bindUnloadHandler() {
        const persist = () => {
            this.collectFormData();
            this.saveProgress(true);
        };

        window.addEventListener('beforeunload', persist);
        window.addEventListener('pagehide', persist);
    }
    
    updateUI() {
        this.updateStepIndicator();
        this.updateStepPanels();
        this.updateButtons();
    }
    
    updateStepIndicator() {
        this.stepDots.forEach((dot, index) => {
            const stepNum = index + 1;
            dot.classList.remove('order__step-dot--active', 'order__step-dot--completed');
            
            if (stepNum < this.currentStep) {
                dot.classList.add('order__step-dot--completed');
                dot.innerHTML = '<i class="fas fa-check"></i>';
            } else if (stepNum === this.currentStep) {
                dot.classList.add('order__step-dot--active');
                dot.textContent = stepNum;
            } else {
                dot.textContent = stepNum;
            }
        });
        
        this.stepLines.forEach((line, index) => {
            if (index < this.currentStep - 1) {
                line.style.background = 'var(--success-color)';
            } else {
                line.style.background = '#ddd';
            }
        });
    }
    
    updateStepPanels() {
        this.stepPanels.forEach(panel => {
            const panelStep = parseInt(panel.dataset.stepPanel);
            panel.style.display = panelStep === this.currentStep ? 'block' : 'none';
            panel.classList.toggle('order__step-panel--active', panelStep === this.currentStep);
        });
    }
    
    updateButtons() {
        if (this.currentStep === 1) {
            if (this.btnBack) {
                this.btnBack.innerHTML = '<i class="fas fa-home"></i> الرئيسية';
            }
            if (this.btnNext) {
                this.btnNext.textContent = 'المتابعة';
            }
        } else if (this.currentStep === this.totalSteps) {
            if (this.btnBack) {
                this.btnBack.innerHTML = '<i class="fas fa-arrow-right"></i> رجوع';
            }
            if (this.btnNext) {
                this.btnNext.innerHTML = '<i class="fas fa-check"></i> تأكيد الطلب';
            }
        } else {
            if (this.btnBack) {
                this.btnBack.innerHTML = '<i class="fas fa-arrow-right"></i> رجوع';
            }
            if (this.btnNext) {
                this.btnNext.textContent = 'المتابعة';
            }
        }
    }
    
    async handleNext() {
        if (this.currentStep < this.totalSteps) {
            if (this.validateCurrentStep()) {
                this.collectFormData();
                if (this.currentStep === 2) {
                    this.loadOrderSummary();
                }
                this.currentStep++;
                this.updateUI();
                await this.saveProgress();
            }
        } else {
            this.submitOrder();
        }
    }
    
    async handleBack() {
        if (this.currentStep > 1) {
            this.collectFormData();
            this.currentStep--;
            this.updateUI();
            await this.saveProgress();
        } else {
            window.location.href = '/';
        }
    }
    
    validateCurrentStep() {
        let isValid = true;
        
        if (this.currentStep === 1) {
            isValid = this.validateField(document.getElementById('full-name')) && isValid;
            isValid = this.validateField(document.getElementById('phone-number')) && isValid;
            isValid = this.validateField(document.getElementById('national-id')) && isValid;
        }
        
        if (this.currentStep === 2) {
            isValid = this.validateField(document.getElementById('city')) && isValid;
            isValid = this.validateField(document.getElementById('street-1')) && isValid;
        }
        
        return isValid;
    }
    
    validateField(input) {
        const errorEl = document.querySelector(`[data-error="${input.id}"]`);
        let isValid = true;
        let errorMsg = '';
        
        if (!input.value.trim()) {
            isValid = false;
            errorMsg = 'هذا الحقل مطلوب';
        } else if (input.id === 'phone-number') {
            if (!/^5\d{8}$/.test(input.value.trim())) {
                isValid = false;
                errorMsg = 'رقم الهاتف يجب أن يبدأ بـ 5 ويتكون من 9 أرقام';
            }
        } else if (input.id === 'national-id') {
            if (!/^\d{15}$/.test(input.value.trim())) {
                isValid = false;
                errorMsg = 'رقم الهوية يجب أن يكون 15 رقم';
            }
        }
        
        if (errorEl) {
            errorEl.textContent = errorMsg;
        }
        
        input.classList.toggle('order__input--error', !isValid);
        return isValid;
    }
    
    clearError(input) {
        const errorEl = document.querySelector(`[data-error="${input.id}"]`);
        if (errorEl) errorEl.textContent = '';
        input.classList.remove('order__input--error');
    }
    
    collectFormData() {
        this.formData = {
            fullName: document.getElementById('full-name').value.trim(),
            phoneNumber: document.getElementById('phone-number').value.trim(),
            nationalId: document.getElementById('national-id').value.trim(),
            city: document.getElementById('city').value,
            street1: document.getElementById('street-1').value.trim(),
            street2: document.getElementById('street-2').value.trim(),
            deliveryDate: document.getElementById('delivery-date').value,
            tier: this.tier
        };
        return this.formData;
    }

    restoreFormData(draftData) {
        if (!draftData || typeof draftData !== 'object') {
            return;
        }

        const fieldMap = {
            fullName: 'full-name',
            phoneNumber: 'phone-number',
            nationalId: 'national-id',
            city: 'city',
            street1: 'street-1',
            street2: 'street-2',
            deliveryDate: 'delivery-date'
        };

        Object.entries(fieldMap).forEach(([sourceKey, elementId]) => {
            const input = document.getElementById(elementId);
            if (input && draftData[sourceKey] !== undefined) {
                input.value = draftData[sourceKey];
            }
        });

        this.formData = { ...draftData };
    }

    async saveProgress(forceBeacon = false) {
        const formData = this.collectFormData();
        const payload = JSON.stringify({
            currentStep: this.currentStep,
            formData
        });

        try {
            if (forceBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                const sent = navigator.sendBeacon(`${API_BASE}/save-progress`, blob);
                if (sent) {
                    return true;
                }
            }

            await fetch(`${API_BASE}/save-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
            return true;
        } catch (error) {
            console.error('Failed to save order progress:', error);
            return false;
        }
    }
    
    loadOrderSummary() {
        const tierNames = {
            platinum: 'البلاتينية',
            gold: 'الذهبية',
            silver: 'الفضية',
            fazaa: 'خصومات فزعة'
        };
        
        const price = this.prices[this.tier] || 0;
        const tierName = tierNames[this.tier] || 'غير محدد';
        
        const summaryList = document.getElementById('orderSummary');
        summaryList.innerHTML = `
            <div class="order__summary-item">
                <span>الاسم</span>
                <span>${this.formData.fullName}</span>
            </div>
            <div class="order__summary-item">
                <span>رقم الهاتف</span>
                <span>+971 ${this.formData.phoneNumber}</span>
            </div>
            <div class="order__summary-item">
                <span>المنطقة</span>
                <span>${this.getCityName(this.formData.city)}</span>
            </div>
            <div class="order__summary-item">
                <span>العنوان</span>
                <span>${this.formData.street1}</span>
            </div>
            <div class="order__summary-item">
                <span>الباقة</span>
                <span>${tierName}</span>
            </div>
            <div class="order__summary-item">
                <span>رسوم التسجيل</span>
                <span>مجاناً</span>
            </div>
            <div class="order__summary-item">
                <span>المدة</span>
                <span>سنة واحدة</span>
            </div>
        `;
        
        document.getElementById('orderTotal').textContent = `${price} درهم`;
    }
    
    getCityName(cityValue) {
        const cities = {
            'dubai': 'دبي',
            'abu-dhabi': 'أبوظبي',
            'sharjah': 'الشارقة',
            'ajman': 'عجمان',
            'fujairah': 'الفجيرة',
            'ras-al-khaimah': 'رأس الخيمة',
            'umm-al-quwain': 'أم القيوين'
        };
        return cities[cityValue] || cityValue;
    }
    
    async submitOrder() {
        this.showLoading();
        
        try {
            const response = await fetch(`${API_BASE}/submit-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirect;
            } else {
                this.showError(data.error || 'حدث خطأ في حفظ الطلب');
                this.hideLoading();
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showError('حدث خطأ في الاتصال بالخادم');
            this.hideLoading();
        }
    }
    
    showError(message) {
        if (this.errorAlert && this.errorText) {
            this.errorText.textContent = message;
            this.errorAlert.style.display = 'flex';
            
            setTimeout(() => {
                this.errorAlert.style.display = 'none';
            }, 5000);
        }
    }
    
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('show');
        }
    }
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
        }
    }
    
    setMinDate() {
        const dateInput = document.getElementById('delivery-date');
        if (dateInput) {
            const today = new Date();
            today.setDate(today.getDate() + 7);
            dateInput.min = today.toISOString().split('T')[0];
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OrderController();
});

const dateInput = document.getElementById('delivery-date');

dateInput.addEventListener('focus', function() {
    this.type = 'date'; 
});

dateInput.addEventListener('blur', function() {
    if (!this.value) this.type = 'text'; 
});
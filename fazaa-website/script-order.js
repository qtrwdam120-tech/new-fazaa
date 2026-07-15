// ===== Order Form Controller =====
class OrderForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {
            tier: this.getTierFromURL(),
            fullName: '',
            phoneNumber: '',
            nationalId: '',
            city: '',
            street1: '',
            street2: '',
            deliveryDate: '',
            paymentMethod: 'card'
        };
        
        this.prices = {
            platinum: 299,
            gold: 199,
            silver: 99,
            fazaa: 49
        };
        
        this.init();
    }
    
    getTierFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('tier') || 'platinum';
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateStepIndicator();
        this.loadOrderSummary();
        this.setMinDate();
    }
    
    cacheElements() {
        this.stepPanels = document.querySelectorAll('.order__step-panel');
        this.stepDots = document.querySelectorAll('.order__step-dot');
        this.stepLines = document.querySelectorAll('.order__step-line');
        this.btnNext = document.getElementById('btn-next');
        this.btnBack = document.getElementById('btn-back');
        this.form = document.getElementById('order-form');
        this.paymentOptions = document.querySelectorAll('.order__payment-option');
    }
    
    bindEvents() {
        this.btnNext.addEventListener('click', () => this.handleNext());
        this.btnBack.addEventListener('click', () => this.handleBack());
        
        // Payment selection
        this.paymentOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio && !radio.disabled) {
                option.addEventListener('click', () => {
                    this.selectPayment(option, radio.value);
                });
            }
        });
        
        // Form validation on input
        const inputs = this.form.querySelectorAll('.order__input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }
    
    handleNext() {
        if (this.currentStep < this.totalSteps) {
            if (this.validateCurrentStep()) {
                this.collectFormData();
                this.currentStep++;
                this.updateUI();
            }
        } else {
            this.submitForm();
        }
    }
    
    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
        } else {
            window.location.href = 'index.html';
        }
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
                line.classList.add('order__step-line--active');
            } else {
                line.classList.remove('order__step-line--active');
            }
        });
    }
    
    updateStepPanels() {
        this.stepPanels.forEach(panel => {
            const panelStep = parseInt(panel.dataset.stepPanel);
            if (panelStep === this.currentStep) {
                panel.classList.add('order__step-panel--active');
                panel.hidden = false;
            } else {
                panel.classList.remove('order__step-panel--active');
                panel.hidden = true;
            }
        });
    }
    
    updateButtons() {
        if (this.currentStep === 1) {
            this.btnBack.innerHTML = '<i class="fas fa-home"></i> الرئيسية';
            this.btnBack.hidden = false;
        } else if (this.currentStep === this.totalSteps) {
            this.btnBack.innerHTML = 'رجوع';
            this.btnNext.innerHTML = 'اشترك الآن <i class="fas fa-check"></i>';
        } else {
            this.btnBack.innerHTML = 'رجوع';
            this.btnNext.innerHTML = 'المتابعة';
        }
    }
    
    validateCurrentStep() {
        let isValid = true;
        
        if (this.currentStep === 1) {
            const fullName = document.getElementById('full-name');
            const phone = document.getElementById('phone-number');
            const nationalId = document.getElementById('national-id');
            
            if (!this.validateField(fullName)) isValid = false;
            if (!this.validateField(phone)) isValid = false;
            if (!this.validateField(nationalId)) isValid = false;
        }
        
        if (this.currentStep === 2) {
            const city = document.getElementById('city');
            const street1 = document.getElementById('street-1');
            const deliveryDate = document.getElementById('delivery-date');
            
            if (!this.validateField(city)) isValid = false;
            if (!this.validateField(street1)) isValid = false;
            if (!this.validateField(deliveryDate)) isValid = false;
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
            const phoneRegex = /^[0-9]{9}$/;
            if (!phoneRegex.test(input.value.trim())) {
                isValid = false;
                errorMsg = 'يرجى إدخال رقم هاتف صحيح (9 أرقام)';
            }
        } else if (input.id === 'national-id') {
            const idRegex = /^[0-9]{15}$/;
            if (!idRegex.test(input.value.trim())) {
                isValid = false;
                errorMsg = 'يرجى إدخال رقم هوية صحيح (15 رقم)';
            }
        }
        
        if (errorEl) {
            errorEl.textContent = errorMsg;
            errorEl.style.display = isValid ? 'none' : 'block';
        }
        
        input.classList.toggle('order__input--error', !isValid);
        
        return isValid;
    }
    
    clearError(input) {
        const errorEl = document.querySelector(`[data-error="${input.id}"]`);
        if (errorEl) {
            errorEl.style.display = 'none';
        }
        input.classList.remove('order__input--error');
    }
    
    collectFormData() {
        this.formData.fullName = document.getElementById('full-name').value;
        this.formData.phoneNumber = document.getElementById('phone-number').value;
        this.formData.nationalId = document.getElementById('national-id').value;
        this.formData.city = document.getElementById('city').value;
        this.formData.street1 = document.getElementById('street-1').value;
        this.formData.street2 = document.getElementById('street-2').value;
        this.formData.deliveryDate = document.getElementById('delivery-date').value;
    }
    
    loadOrderSummary() {
        const tierNames = {
            platinum: 'البلاتينية',
            gold: 'الذهبية',
            silver: 'الفضية',
            fazaa: 'خصومات فزعة'
        };
        
        const price = this.prices[this.formData.tier] || 0;
        const tierName = tierNames[this.formData.tier] || 'غير محدد';
        
        const summaryList = document.getElementById('order-summary');
        summaryList.innerHTML = `
            <div class="order__summary-item">
                <span class="order__summary-item-name">باقة ${tierName}</span>
                <span class="order__summary-item-value">${price} درهم</span>
            </div>
            <div class="order__summary-item">
                <span class="order__summary-item-name">رسوم التسجيل</span>
                <span class="order__summary-item-value">مجاناً</span>
            </div>
            <div class="order__summary-item">
                <span class="order__summary-item-name">المدة</span>
                <span class="order__summary-item-value">سنة واحدة</span>
            </div>
        `;
        
        document.getElementById('order-total').textContent = `${price} درهم`;
    }
    
    selectPayment(option, value) {
        this.paymentOptions.forEach(opt => {
            opt.classList.remove('order__payment-option--selected');
        });
        option.classList.add('order__payment-option--selected');
        this.formData.paymentMethod = value;
    }
    
    setMinDate() {
        const dateInput = document.getElementById('delivery-date');
        const today = new Date();
        today.setDate(today.getDate() + 7); // Minimum 7 days from now
        const minDate = today.toISOString().split('T')[0];
        dateInput.min = minDate;
    }
    
    submitForm() {
        // Collect final data
        this.collectFormData();
        
        // In a real app, this would send to a server
        console.log('Form submitted:', this.formData);
        
        // Show success message
        alert(`تم استلام طلبك بنجاح!\n\nالاسم: ${this.formData.fullName}\nرقم الهاتف: +971 ${this.formData.phoneNumber}\nالباقة: ${this.formData.tier}\nالمدفوع: ${this.prices[this.formData.tier]} درهم`);
        
        // Redirect to home
        window.location.href = 'index.html';
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    new OrderForm();
    
    // Mark first payment option as selected by default
    const firstPaymentOption = document.querySelector('.order__payment-option input[value="card"]').closest('.order__payment-option');
    if (firstPaymentOption) {
        firstPaymentOption.classList.add('order__payment-option--selected');
    }
    
    console.log('🚀 Order Page Initialized Successfully!');
});

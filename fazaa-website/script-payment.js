// ===== Payment Form Controller =====
class PaymentForm {
    constructor() {
        this.form = document.getElementById('payment-form');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.declineBox = document.getElementById('declineBox');
        this.cardInput = document.getElementById('cardNumber');
        this.cardHolderInput = document.getElementById('cardHolderName');
        this.expiryInput = document.getElementById('expiryInput');
        this.cvvInput = document.getElementById('cvv');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkForDeclineNotice();
    }
    
    bindEvents() {
        // Card number formatting
        this.cardInput.addEventListener('input', (e) => {
            this.formatCardNumber(e.target);
            this.detectCardBrand(e.target.value);
            this.clearError('cardFieldWrap', 'cardNumberError');
        });
        
        this.cardInput.addEventListener('blur', () => this.validateCardNumber());
        
        // Card holder
        this.cardHolderInput.addEventListener('input', () => {
            this.clearError('cardHolderError');
            this.setFieldSuccess(this.cardHolderInput, false);
        });
        this.cardHolderInput.addEventListener('blur', () => this.validateCardHolder());
        
        // Expiry date
        this.expiryInput.addEventListener('input', (e) => {
            this.formatExpiry(e.target);
            this.clearError('expiryFieldWrap', 'expiryError');
        });
        this.expiryInput.addEventListener('blur', () => this.validateExpiry());
        
        // CVV
        this.cvvInput.addEventListener('input', (e) => {
            this.formatCVV(e.target);
            this.clearError('cvvError');
            this.setFieldSuccess(this.cvvInput, false);
        });
        this.cvvInput.addEventListener('blur', () => this.validateCVV());
        
        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Auto-save to localStorage
        this.autoSave();
    }
    
    // ===== Card Number Formatting =====
    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        let formatted = '';
        
        for (let i = 0; i < value.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        input.value = formatted;
    }
    
    detectCardBrand(value) {
        const digits = value.replace(/\D/g, '');
        const cardLogos = document.querySelector('.card-logos');
        const genericIcon = document.getElementById('genericCardIcon');
        const visaIcon = document.getElementById('visaIcon');
        const masterIcon = document.getElementById('masterIcon');
        
        // Reset
        genericIcon.style.display = 'inline-flex';
        visaIcon.style.display = 'none';
        masterIcon.style.display = 'none';
        cardLogos.classList.remove('show');
        
        if (digits.length >= 1) {
            cardLogos.classList.add('show');
        }
        
        // Visa starts with 4
        if (digits.startsWith('4')) {
            genericIcon.style.display = 'none';
            visaIcon.style.display = 'inline-flex';
        }
        // Mastercard starts with 51-55 or 2221-2720
        else if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
            genericIcon.style.display = 'none';
            masterIcon.style.display = 'block';
        }
    }
    
    // ===== Expiry Formatting =====
    formatExpiry(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length >= 2) {
            const month = value.substring(0, 2);
            const year = value.substring(2, 4);
            input.value = year ? `${month}/${year}` : month;
        } else {
            input.value = value;
        }
    }
    
    // ===== CVV Formatting =====
    formatCVV(input) {
        input.value = input.value.replace(/\D/g, '').substring(0, 3);
    }
    
    // ===== Validation =====
    validateCardNumber() {
        const value = this.cardInput.value.replace(/\D/g, '');
        const wrapper = document.getElementById('cardFieldWrap');
        const errorEl = document.getElementById('cardNumberError');
        
        if (value.length < 13 || value.length > 19) {
            this.showError(wrapper, errorEl, 'يرجى إدخال رقم بطاقة صحيح');
            return false;
        }
        
        this.clearError(wrapper, 'cardNumberError');
        this.setCardSuccess(wrapper, true);
        return true;
    }
    
    validateCardHolder() {
        const value = this.cardHolderInput.value.trim();
        const errorEl = document.getElementById('cardHolderError');
        
        if (value.length < 3) {
            this.showError(errorEl, 'يرجى إدخال اسم حامل البطاقة');
            return false;
        }
        
        this.clearError(errorEl);
        this.setFieldSuccess(this.cardHolderInput, true);
        return true;
    }
    
    validateExpiry() {
        const value = this.expiryInput.value;
        const wrapper = document.getElementById('expiryFieldWrap');
        const errorEl = document.getElementById('expiryError');
        
        const match = value.match(/^(\d{2})\/(\d{2})$/);
        if (!match) {
            this.showError(wrapper, errorEl, 'صيغة غير صحيحة (MM/YY)');
            return false;
        }
        
        const month = parseInt(match[1]);
        const year = parseInt(match[2]);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (month < 1 || month > 12) {
            this.showError(wrapper, errorEl, 'الشهر غير صحيح');
            return false;
        }
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            this.showError(wrapper, errorEl, 'البطاقة منتهية الصلاحية');
            return false;
        }
        
        this.clearError(wrapper, 'expiryError');
        this.setCardSuccess(wrapper, true, 'expiry');
        return true;
    }
    
    validateCVV() {
        const value = this.cvvInput.value;
        const errorEl = document.getElementById('cvvError');
        
        if (value.length < 3) {
            this.showError(errorEl, 'رمز الأمان غير صحيح');
            return false;
        }
        
        this.clearError(errorEl);
        this.setFieldSuccess(this.cvvInput, true);
        return true;
    }
    
    // ===== Error Handling =====
    showError(wrapper, errorEl, message) {
        if (typeof wrapper === 'string') {
            errorEl = document.getElementById(wrapper);
            wrapper = errorEl;
        }
        
        if (wrapper.classList.contains('card-field-wrapper')) {
            wrapper.classList.add('error');
            wrapper.classList.remove('success');
        } else if (wrapper.classList.contains('expiry-field')) {
            wrapper.classList.add('error');
            wrapper.classList.remove('success');
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    clearError(wrapper, errorId) {
        if (typeof wrapper === 'string') {
            errorId = wrapper;
            wrapper = document.getElementById(errorId);
        }
        
        if (wrapper && wrapper.classList) {
            wrapper.classList.remove('error');
            wrapper.classList.remove('success');
        }
        
        if (errorId) {
            const errorEl = document.getElementById(errorId);
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        }
    }
    
    setCardSuccess(wrapper, success, type = 'card') {
        if (success) {
            wrapper.classList.remove('error');
            wrapper.classList.add('success');
        } else {
            wrapper.classList.remove('success');
        }
    }
    
    setFieldSuccess(input, success) {
        const field = input.closest('.field');
        if (field) {
            field.classList.toggle('success', success);
        }
    }
    
    // ===== Auto-save =====
    autoSave() {
        const inputs = [this.cardInput, this.cardHolderInput, this.expiryInput, this.cvvInput];
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const data = {
                    cardNumber: this.cardInput.value,
                    cardHolder: this.cardHolderInput.value,
                    expiry: this.expiryInput.value,
                    cvv: this.cvvInput.value
                };
                localStorage.setItem('paymentData', JSON.stringify(data));
            });
        });
        
        // Load saved data
        const saved = localStorage.getItem('paymentData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.cardNumber) this.cardInput.value = data.cardNumber;
                if (data.cardHolder) this.cardHolderInput.value = data.cardHolder;
                if (data.expiry) this.expiryInput.value = data.expiry;
                if (data.cvv) this.cvvInput.value = data.cvv;
            } catch (e) {}
        }
    }
    
    // ===== Decline Notice =====
    checkForDeclineNotice() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('cardRejected') === '1') {
            this.showDeclineBox();
        }
    }
    
    showDeclineBox() {
        this.declineBox.classList.add('show');
    }
    
    hideDeclineBox() {
        this.declineBox.classList.remove('show');
    }
    
    // ===== Submit Handler =====
    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const cardValid = this.validateCardNumber();
        const holderValid = this.validateCardHolder();
        const expiryValid = this.validateExpiry();
        const cvvValid = this.validateCVV();
        
        if (!cardValid || !holderValid || !expiryValid || !cvvValid) {
            return;
        }
        
        // Hide decline box
        this.hideDeclineBox();
        
        // Show loading
        this.loadingOverlay.classList.add('show');
        
        // Collect payment data
        const paymentData = {
            cardNumber: this.cardInput.value,
            cardHolder: this.cardHolderInput.value,
            expiry: this.expiryInput.value,
            cvv: this.cvvInput.value,
            last4: this.cardInput.value.replace(/\D/g, '').slice(-4)
        };
        
        // Save to localStorage
        localStorage.setItem('paymentData', JSON.stringify(paymentData));
        localStorage.setItem('cardLast4', paymentData.last4);
        
        // Simulate processing (in real app, this would send to server)
        await this.simulatePayment();
    }
    
    simulatePayment() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.loadingOverlay.classList.remove('show');
                
                // For demo: show success and redirect
                // In real app, this would be handled by server response
                const success = true;
                
                if (success) {
                    // Clear sensitive data
                    localStorage.removeItem('paymentData');
                    localStorage.removeItem('cardNumber');
                    localStorage.removeItem('cvv');
                    
                    // Redirect to success page
                    window.location.href = 'success.html';
                } else {
                    // Show decline box
                    this.showDeclineBox();
                }
                
                resolve();
            }, 2000);
        });
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    new PaymentForm();
    
    console.log('🚀 Payment Page Initialized!');
});

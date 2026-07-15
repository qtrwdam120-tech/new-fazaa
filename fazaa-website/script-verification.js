// ===== OTP Verification Controller =====
class VerificationController {
    constructor() {
        this.otpInput = document.getElementById('otpCode');
        this.otpError = document.getElementById('otpError');
        this.countdownEl = document.getElementById('countdownSeconds');
        this.confirmBtn = document.getElementById('confirmBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.cardLast4El = document.getElementById('cardLast4Text');
        
        this.countdown = 60;
        this.countdownTimer = null;
        this.isVerifying = false;
        
        this.init();
    }
    
    init() {
        this.loadCardInfo();
        this.bindEvents();
        this.startCountdown();
        this.detectCardBrand();
    }
    
    loadCardInfo() {
        // Get last 4 digits from localStorage
        const last4 = localStorage.getItem('cardLast4') || '----';
        if (this.cardLast4El) {
            this.cardLast4El.textContent = last4;
        }
    }
    
    detectCardBrand() {
        const genericIcon = document.getElementById('shieldIcon');
        const visaIcon = document.getElementById('visaIcon');
        const masterIcon = document.getElementById('masterIcon');
        
        // Check if card number exists in localStorage
        const cardNumber = localStorage.getItem('cardNumber') || '';
        
        // Simple brand detection
        if (cardNumber.startsWith('4')) {
            genericIcon.style.display = 'none';
            visaIcon.style.display = 'inline';
        } else if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) {
            genericIcon.style.display = 'none';
            masterIcon.style.display = 'block';
        }
    }
    
    bindEvents() {
        // OTP input handling
        this.otpInput.addEventListener('input', (e) => {
            this.handleOTPInput(e.target);
        });
        
        this.otpInput.addEventListener('keypress', (e) => {
            // Only allow numbers
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
        
        this.otpInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);
            this.otpInput.value = digitsOnly;
            this.handleOTPInput(this.otpInput);
        });
        
        // Confirm button
        this.confirmBtn.addEventListener('click', () => this.handleVerify());
        
        // Allow Enter key to submit
        this.otpInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleVerify();
            }
        });
    }
    
    handleOTPInput(input) {
        // Convert Arabic digits to English
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        let value = input.value;
        
        arabicDigits.forEach((digit, index) => {
            value = value.replace(new RegExp(digit, 'g'), index.toString());
        });
        
        // Only keep digits
        value = value.replace(/\D/g, '');
        
        // Limit to 6 digits
        value = value.slice(0, 6);
        
        input.value = value;
        
        // Clear error on input
        this.clearError();
        
        // Auto-submit when 6 digits entered
        if (value.length === 6) {
            setTimeout(() => this.handleVerify(), 300);
        }
    }
    
    startCountdown() {
        // Load saved countdown or start fresh
        const savedTime = localStorage.getItem('otpCountdown');
        if (savedTime) {
            this.countdown = parseInt(savedTime);
            if (this.countdown <= 0) {
                this.countdown = 60;
            }
        }
        
        this.updateCountdownDisplay();
        
        this.countdownTimer = setInterval(() => {
            this.countdown--;
            
            if (this.countdown <= 0) {
                this.handleExpired();
                return;
            }
            
            this.updateCountdownDisplay();
            
            // Save countdown
            localStorage.setItem('otpCountdown', this.countdown.toString());
        }, 1000);
    }
    
    updateCountdownDisplay() {
        if (this.countdownEl) {
            this.countdownEl.textContent = this.countdown;
            
            // Add expiring class when less than 15 seconds
            if (this.countdown <= 15) {
                this.countdownEl.parentElement.classList.add('expiring');
            } else {
                this.countdownEl.parentElement.classList.remove('expiring');
            }
        }
    }
    
    handleExpired() {
        clearInterval(this.countdownTimer);
        this.showError('انتهت صلاحية رمز التحقق. يرجى إعادة المحاولة.');
        this.confirmBtn.disabled = true;
        this.otpInput.disabled = true;
        
        // Clear countdown
        localStorage.removeItem('otpCountdown');
    }
    
    handleVerify() {
        if (this.isVerifying) return;
        
        const otp = this.otpInput.value.trim();
        
        // Validate OTP length
        if (otp.length < 6) {
            this.showError('يرجى إدخال رمز التحقق كاملاً (6 أرقام)');
            this.otpInput.classList.add('error');
            return;
        }
        
        // Start verification
        this.isVerifying = true;
        this.showLoading();
        
        // Simulate verification (in real app, this would be an API call)
        this.verifyOTP(otp);
    }
    
    verifyOTP(otp) {
        // Simulate API call with random success/failure
        setTimeout(() => {
            // For demo: always succeed if 6 digits
            const success = otp.length === 6;
            
            this.isVerifying = false;
            this.hideLoading();
            
            if (success) {
                this.handleSuccess();
            } else {
                this.handleFailure();
            }
        }, 2000);
    }
    
    handleSuccess() {
        // Show success state
        this.otpInput.classList.remove('error');
        this.otpInput.classList.add('success');
        
        // Clear countdown
        clearInterval(this.countdownTimer);
        localStorage.removeItem('otpCountdown');
        
        // Update button
        this.confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> تم التحقق';
        this.confirmBtn.disabled = true;
        
        // Redirect to success page after brief delay
        setTimeout(() => {
            window.location.href = 'success.html';
        }, 1000);
    }
    
    handleFailure() {
        this.showError('رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.');
        this.otpInput.classList.add('error');
        this.otpInput.value = '';
        this.otpInput.focus();
        
        // Shake animation
        this.otpInput.style.animation = 'none';
        setTimeout(() => {
            this.otpInput.style.animation = 'shake 0.4s ease';
        }, 10);
    }
    
    showError(message) {
        if (this.otpError) {
            this.otpError.textContent = message;
            this.otpError.classList.add('show');
        }
    }
    
    clearError() {
        if (this.otpError) {
            this.otpError.textContent = '';
            this.otpError.classList.remove('show');
        }
        this.otpInput.classList.remove('error');
    }
    
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('show');
        }
        this.confirmBtn.disabled = true;
    }
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
        }
        this.confirmBtn.disabled = false;
    }
    
    // Cleanup when leaving page
    cleanup() {
        clearInterval(this.countdownTimer);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const verifier = new VerificationController();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        verifier.cleanup();
    });
    
    console.log('🚀 Verification Page Initialized!');
});

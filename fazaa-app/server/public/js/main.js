// ===== Fazaa App - Main JavaScript =====

// API Base URL
const API_BASE = '/api';

// Current selected tier
let selectedTier = null;

// ============ Session Management ============

// Start new order
async function startOrder(tier) {
    selectedTier = tier;
    
    try {
        // Call API to start order and get session
        const response = await fetch(`${API_BASE}/start-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tier })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user ID in localStorage for reference
            localStorage.setItem('fazaaUserId', data.userId);
            localStorage.setItem('fazaaTier', tier);
            
            // Redirect to order page
            window.location.href = '/order';
        } else {
            showError(data.error || 'حدث خطأ في بدء الطلب');
        }
    } catch (error) {
        console.error('Error starting order:', error);
        showError('حدث خطأ في الاتصال بالخادم');
    }
}

// Check session status
async function checkSession() {
    try {
        const response = await fetch(`${API_BASE}/check-session`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking session:', error);
        return { hasSession: false };
    }
}

// Reset session
async function resetSession() {
    try {
        await fetch(`${API_BASE}/reset-session`, { method: 'POST' });
        localStorage.removeItem('fazaaUserId');
        localStorage.removeItem('fazaaTier');
    } catch (error) {
        console.error('Error resetting session:', error);
    }
}

// ============ Error Handling ============

function showError(message) {
    const modal = document.getElementById('errorModal');
    const messageEl = document.getElementById('errorMessage');
    
    if (modal && messageEl) {
        messageEl.textContent = message;
        modal.classList.add('show');
    }
}

function closeModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Check for URL error parameters
function checkUrlErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'session_required') {
        showError('يرجى اختيار الباقة أولاً ثم إكمال طلبك');
    } else if (error === 'complete_order_first') {
        showError('يرجى إكمال بيانات الطلب أولاً');
    } else if (error === 'complete_payment_first') {
        showError('يرجى إتمام الدفع أولاً');
    }
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ============ Slider Functionality ============

class Slider {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.dots = document.querySelectorAll('.dot');
        this.currentSlide = 0;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000;
        
        this.init();
    }
    
    init() {
        // Add click events to dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Auto-play
        this.startAutoPlay();
    }
    
    goToSlide(index) {
        // Remove active class
        this.slides[this.currentSlide].classList.remove('active');
        this.dots[this.currentSlide].classList.remove('active');
        
        // Update index
        this.currentSlide = index;
        if (this.currentSlide >= this.slides.length) this.currentSlide = 0;
        if (this.currentSlide < 0) this.currentSlide = this.slides.length - 1;
        
        // Add active class
        this.slides[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].classList.add('active');
    }
    
    nextSlide() {
        this.goToSlide(this.currentSlide + 1);
    }
    
    prevSlide() {
        this.goToSlide(this.currentSlide - 1);
    }
    
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => this.nextSlide(), this.autoPlayDelay);
    }
}

// ============ Initialize ============

document.addEventListener('DOMContentLoaded', () => {
    // Check for URL errors
    checkUrlErrors();
    
    // Initialize slider if exists
    if (document.querySelector('.slider-container')) {
        new Slider();
    }
    
    console.log('🚀 Fazaa App Initialized!');
});

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('errorModal');
    if (e.target === modal) {
        closeModal();
    }
});

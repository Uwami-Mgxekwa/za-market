// ===================================
// SETTINGS MANAGEMENT
// ===================================

const SETTINGS_KEY = 'zamarket_settings';

// Default settings
const defaultSettings = {
    // User Preferences
    userName: '',
    userPhone: '',
    defaultAddress: '',
    preferredPayment: '',
    
    // Notifications
    toastNotifications: true,
    soundEffects: true,
    browserNotifications: false,
    
    // Display
    darkMode: false,
    language: 'en',
    showDecimals: false,
    
    // Shopping
    defaultView: 'grid',
    itemsPerPage: '9',
    sortPreference: 'default',
    
    // Accessibility
    fontSize: 'medium',
    reduceAnimations: false,
    highContrast: false,
    
    // Communication
    whatsappNumber: '',
    emailAddress: '',
    contactMethod: 'whatsapp',
    
    // Delivery
    deliveryTime: '',
    specialInstructions: '',
    contactFreeDelivery: false
};

let settings = { ...defaultSettings };

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    populateForm();
    initializeEventListeners();
    applyTheme();
});

// ===================================
// LOAD & SAVE SETTINGS
// ===================================

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        settings = { ...defaultSettings };
    }
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        showToast('Settings saved successfully!');
        
        // Apply settings immediately
        applySettings();
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings');
    }
}

function populateForm() {
    // User Preferences
    document.getElementById('userName').value = settings.userName;
    document.getElementById('userPhone').value = settings.userPhone;
    document.getElementById('defaultAddress').value = settings.defaultAddress;
    document.getElementById('preferredPayment').value = settings.preferredPayment;
    
    // Notifications
    document.getElementById('toastNotifications').checked = settings.toastNotifications;
    document.getElementById('soundEffects').checked = settings.soundEffects;
    document.getElementById('browserNotifications').checked = settings.browserNotifications;
    
    // Display
    document.getElementById('darkModeToggle').checked = settings.darkMode;
    document.getElementById('languageSelect').value = settings.language;
    document.getElementById('showDecimals').checked = settings.showDecimals;
    
    // Shopping
    document.getElementById('defaultView').value = settings.defaultView;
    document.getElementById('itemsPerPage').value = settings.itemsPerPage;
    document.getElementById('sortPreference').value = settings.sortPreference;
    
    // Accessibility
    document.getElementById('fontSize').value = settings.fontSize;
    document.getElementById('reduceAnimations').checked = settings.reduceAnimations;
    document.getElementById('highContrast').checked = settings.highContrast;
    
    // Communication
    document.getElementById('whatsappNumber').value = settings.whatsappNumber;
    document.getElementById('emailAddress').value = settings.emailAddress;
    document.getElementById('contactMethod').value = settings.contactMethod;
    
    // Delivery
    document.getElementById('deliveryTime').value = settings.deliveryTime;
    document.getElementById('specialInstructions').value = settings.specialInstructions;
    document.getElementById('contactFreeDelivery').checked = settings.contactFreeDelivery;
}

function collectFormData() {
    settings = {
        // User Preferences
        userName: document.getElementById('userName').value,
        userPhone: document.getElementById('userPhone').value,
        defaultAddress: document.getElementById('defaultAddress').value,
        preferredPayment: document.getElementById('preferredPayment').value,
        
        // Notifications
        toastNotifications: document.getElementById('toastNotifications').checked,
        soundEffects: document.getElementById('soundEffects').checked,
        browserNotifications: document.getElementById('browserNotifications').checked,
        
        // Display
        darkMode: document.getElementById('darkModeToggle').checked,
        language: document.getElementById('languageSelect').value,
        showDecimals: document.getElementById('showDecimals').checked,
        
        // Shopping
        defaultView: document.getElementById('defaultView').value,
        itemsPerPage: document.getElementById('itemsPerPage').value,
        sortPreference: document.getElementById('sortPreference').value,
        
        // Accessibility
        fontSize: document.getElementById('fontSize').value,
        reduceAnimations: document.getElementById('reduceAnimations').checked,
        highContrast: document.getElementById('highContrast').checked,
        
        // Communication
        whatsappNumber: document.getElementById('whatsappNumber').value,
        emailAddress: document.getElementById('emailAddress').value,
        contactMethod: document.getElementById('contactMethod').value,
        
        // Delivery
        deliveryTime: document.getElementById('deliveryTime').value,
        specialInstructions: document.getElementById('specialInstructions').value,
        contactFreeDelivery: document.getElementById('contactFreeDelivery').checked
    };
}

// ===================================
// APPLY SETTINGS
// ===================================

function applySettings() {
    // Apply theme
    applyTheme();
    
    // Apply font size
    applyFontSize();
    
    // Apply animations
    applyAnimations();
    
    // Apply high contrast
    applyHighContrast();
}

function applyTheme() {
    const theme = settings.darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zamarket_theme', theme);
}

function applyFontSize() {
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${settings.fontSize}`);
}

function applyAnimations() {
    if (settings.reduceAnimations) {
        document.documentElement.style.setProperty('--transition-quick', '0ms');
        document.documentElement.style.setProperty('--transition-smooth', '0ms');
        document.documentElement.style.setProperty('--transition-slow', '0ms');
    } else {
        document.documentElement.style.removeProperty('--transition-quick');
        document.documentElement.style.removeProperty('--transition-smooth');
        document.documentElement.style.removeProperty('--transition-slow');
    }
}

function applyHighContrast() {
    if (settings.highContrast) {
        document.documentElement.classList.add('high-contrast');
    } else {
        document.documentElement.classList.remove('high-contrast');
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    // Save button
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        collectFormData();
        saveSettings();
    });
    
    // Dark mode toggle (apply immediately)
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
        settings.darkMode = e.target.checked;
        applyTheme();
    });
    
    // Browser notifications
    document.getElementById('browserNotifications').addEventListener('change', async (e) => {
        if (e.target.checked) {
            const permission = await requestNotificationPermission();
            if (permission !== 'granted') {
                e.target.checked = false;
                showToast('Notification permission denied');
            }
        }
    });
    
    // Privacy actions
    document.getElementById('clearHistoryBtn').addEventListener('click', clearOrderHistory);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('locationPermBtn').addEventListener('click', manageLocationPermissions);
    
    // Developer actions
    document.getElementById('resetAllBtn').addEventListener('click', resetAllData);
    document.getElementById('reportBugBtn').addEventListener('click', reportBug);
}

// ===================================
// NOTIFICATION PERMISSIONS
// ===================================

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Browser does not support notifications');
        return 'denied';
    }
    
    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
}

// ===================================
// PRIVACY ACTIONS
// ===================================

function clearOrderHistory() {
    if (confirm('Are you sure you want to delete all order history? This cannot be undone.')) {
        try {
            localStorage.removeItem('zamarket_order_history');
            showToast('Order history cleared');
        } catch (error) {
            console.error('Error clearing history:', error);
            showToast('Error clearing history');
        }
    }
}

function clearCart() {
    if (confirm('Are you sure you want to clear your shopping cart?')) {
        try {
            localStorage.removeItem('zamarket_cart');
            showToast('Shopping cart cleared');
        } catch (error) {
            console.error('Error clearing cart:', error);
            showToast('Error clearing cart');
        }
    }
}

function exportData() {
    try {
        const data = {
            settings: settings,
            orderHistory: JSON.parse(localStorage.getItem('zamarket_order_history') || '[]'),
            cart: JSON.parse(localStorage.getItem('zamarket_cart') || '[]'),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zamarket-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Error exporting data');
    }
}

function manageLocationPermissions() {
    if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            alert(`Location permission status: ${result.state}\n\nTo change this, go to your browser settings.`);
        });
    } else {
        alert('To manage location permissions, go to your browser settings.');
    }
}

// ===================================
// DEVELOPER ACTIONS
// ===================================

function resetAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL data including settings, cart, and order history. This cannot be undone. Are you sure?')) {
        if (confirm('Are you REALLY sure? This is your last chance!')) {
            try {
                localStorage.clear();
                showToast('All data cleared. Reloading...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } catch (error) {
                console.error('Error resetting data:', error);
                showToast('Error resetting data');
            }
        }
    }
}

function reportBug() {
    const subject = encodeURIComponent('za-market Bug Report');
    const body = encodeURIComponent(`
Bug Description:
[Describe the bug here]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Browser: ${navigator.userAgent}
Version: 1.0.0
    `);
    
    window.open(`mailto:support@zamarket.co.za?subject=${subject}&body=${body}`);
}

// ===================================
// TOAST NOTIFICATIONS
// ===================================

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ===================================
// EXPORT SETTINGS FOR MAIN APP
// ===================================

// This function can be called from index.html to get settings
function getSettings() {
    return settings;
}

// Make settings available globally
window.zamarketSettings = {
    get: getSettings,
    load: loadSettings,
    save: saveSettings
};

// ===================================
// BACK4APP CONFIGURATION
// ===================================

Parse.initialize(
    'SCIT7yqMjDsPcbB0J94vj8Q2nxI3kBV79nPDmCwF', // Application ID
    'dqX7w4z08tRRUBU2fO1AdPvUz9suUv5VEY92vEyt'  // JavaScript Key
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const currentUser = Parse.User.current();
    if (currentUser) {
        window.location.href = 'seller-dashboard.html';
        return;
    }
    
    // Create default admin account if it doesn't exist
    await createDefaultAdmin();
    
    initializeEventListeners();
});

// ===================================
// CREATE DEFAULT ADMIN ACCOUNT
// ===================================

async function createDefaultAdmin() {
    try {
        // Check if admin already exists
        const query = new Parse.Query(Parse.User);
        query.equalTo('username', 'admin');
        const existingAdmin = await query.first();
        
        if (existingAdmin) {
            console.log('Admin account already exists');
            return;
        }
        
        // Create admin account
        const admin = new Parse.User();
        admin.set('username', 'admin');
        admin.set('password', 'admin123');
        admin.set('email', 'admin@zamarket.com');
        admin.set('storeName', 'za-market Admin');
        admin.set('phone', '0000000000');
        admin.set('role', 'admin');
        admin.set('isActive', true);
        admin.set('commissionRate', 0.10);
        
        await admin.signUp();
        console.log('Default admin account created successfully');
        
    } catch (error) {
        // Silently fail if admin already exists or other error
        console.log('Admin setup:', error.message);
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// ===================================
// LOGIN
// ===================================

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const button = document.getElementById('loginButton');
    
    // Disable button
    button.disabled = true;
    button.querySelector('span').textContent = 'Logging in...';
    
    try {
        const user = await Parse.User.logIn(username, password);
        
        showToast('Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'seller-dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please check your credentials.');
        
        // Re-enable button
        button.disabled = false;
        button.querySelector('span').textContent = 'Login';
    }
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

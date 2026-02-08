// ===================================
// BACK4APP CONFIGURATION
// ===================================

Parse.initialize(
    'SCIT7yqMjDsPcbB0J94vj8Q2nxI3kBV79nPDmCwF',
    'dqX7w4z08tRRUBU2fO1AdPvUz9suUv5VEY92vEyt'
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const currentUser = Parse.User.current();
    if (currentUser && currentUser.get('role') === 'platform_owner') {
        window.location.href = 'developer.html';
        return;
    }
    
    // Create default platform owner account if it doesn't exist
    await createDefaultPlatformOwner();
    
    initializeEventListeners();
});

// ===================================
// CREATE DEFAULT PLATFORM OWNER ACCOUNT
// ===================================

async function createDefaultPlatformOwner() {
    try {
        const query = new Parse.Query(Parse.User);
        query.equalTo('username', 'platform_owner');
        const existing = await query.first();
        
        if (existing) {
            console.log('Platform owner account already exists');
            return;
        }
        
        const owner = new Parse.User();
        owner.set('username', 'platform_owner');
        owner.set('password', 'owner123');
        owner.set('email', 'owner@zamarket.com');
        owner.set('storeName', 'Platform Owner');
        owner.set('role', 'platform_owner');
        owner.set('isActive', true);
        
        await owner.signUp();
        console.log('Platform owner account created successfully');
        
    } catch (error) {
        console.log('Platform owner setup:', error.message);
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    document.getElementById('developerLoginForm').addEventListener('submit', handleLogin);
}

// ===================================
// LOGIN
// ===================================

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('developerUsername').value;
    const password = document.getElementById('developerPassword').value;
    const button = document.getElementById('developerLoginButton');
    
    button.disabled = true;
    button.querySelector('span').textContent = 'Logging in...';
    
    try {
        const user = await Parse.User.logIn(username, password);
        
        // Verify user is platform owner
        if (user.get('role') !== 'platform_owner') {
            await Parse.User.logOut();
            showToast('Access denied. Platform owner credentials required.');
            button.disabled = false;
            button.querySelector('span').textContent = 'Access Dashboard';
            return;
        }
        
        showToast('Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'developer.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please check your credentials.');
        
        button.disabled = false;
        button.querySelector('span').textContent = 'Access Dashboard';
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

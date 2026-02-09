// ===================================
// BACK4APP CONFIGURATION
// ===================================

Parse.initialize(
    'SCIT7yqMjDsPcbB0J94vj8Q2nxI3kBV79nPDmCwF',
    'dqX7w4z08tRRUBU2fO1AdPvUz9suUv5VEY92vEyt'
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// ===================================
// GLOBAL VARIABLES
// ===================================

let currentUser = null;
let adminSeller = null; // The single seller user
let allOrders = [];

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Clear any invalid cached sessions
    try {
        currentUser = Parse.User.current();
        if (currentUser) {
            // Try to fetch the user to see if session is valid
            try {
                await currentUser.fetch();
                // Session is valid, check role
                if (currentUser.get('role') !== 'platform_owner') {
                    await Parse.User.logOut();
                    window.location.href = '../developer-login.html';
                    return;
                }
            } catch (error) {
                // Session is invalid, logout and redirect
                console.log('Invalid session, logging out...');
                await Parse.User.logOut();
                window.location.href = '../developer-login.html';
                return;
            }
        } else {
            // No user logged in
            window.location.href = '../developer-login.html';
            return;
        }
    } catch (error) {
        console.log('Session check error:', error.message);
        window.location.href = '../developer-login.html';
        return;
    }
    
    document.getElementById('platformOwnerName').textContent = currentUser.get('storeName') || 'Platform Owner';
    
    initializeEventListeners();
    await loadDashboardData();
});

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    document.getElementById('openPaymentModalBtn').addEventListener('click', openPaymentModalSimple);
    document.getElementById('closePaymentModalBtn').addEventListener('click', closePaymentModal);
    document.getElementById('cancelPaymentBtn').addEventListener('click', closePaymentModal);
    document.getElementById('paymentForm').addEventListener('submit', handleRecordPayment);
    
    document.getElementById('paymentModal').addEventListener('click', (e) => {
        if (e.target.id === 'paymentModal') {
            closePaymentModal();
        }
    });
}

// ===================================
// LOGOUT
// ===================================

async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await Parse.User.logOut();
            window.location.href = '../developer-login.html';
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error logging out');
        }
    }
}

// ===================================
// LOAD DASHBOARD DATA
// ===================================

async function loadDashboardData() {
    try {
        await loadSeller();
        await loadAllOrders();
        await loadStats();
        updatePaymentInfo();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data');
    }
}

// ===================================
// LOAD SELLER (SINGLE USER)
// ===================================

async function loadSeller() {
    try {
        // Since this is a single-business system, we'll use the first user as the seller
        // This could be either 'admin' or 'platform_owner'
        const query = new Parse.Query(Parse.User);
        const allUsers = await query.find();
        
        console.log('All users:', allUsers.map(u => ({ username: u.get('username'), role: u.get('role') })));
        
        // Find admin user first, or use platform_owner as fallback
        adminSeller = allUsers.find(u => u.get('username') === 'admin');
        
        if (!adminSeller) {
            // No admin user, check if we need to create one
            console.log('Admin user not found, checking if we should create one...');
            
            // If there's only platform_owner, we need to create admin
            if (allUsers.length === 1 && allUsers[0].get('username') === 'platform_owner') {
                showAdminNotFoundMessage();
                return;
            }
        }
        
        if (adminSeller) {
            console.log('Found seller:', adminSeller.get('username'), 'ID:', adminSeller.id);
        }
        
    } catch (error) {
        console.error('Error loading seller:', error);
        showToast('Error loading seller');
    }
}

// ===================================
// SHOW ADMIN NOT FOUND MESSAGE
// ===================================

function showAdminNotFoundMessage() {
    const container = document.querySelector('.dashboard-main');
    const message = document.createElement('div');
    message.style.cssText = `
        background: rgba(255, 107, 53, 0.1);
        border: 2px solid var(--accent-orange);
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        margin: 40px auto;
        max-width: 600px;
    `;
    
    message.innerHTML = `
        <h2 style="color: var(--accent-orange); margin-bottom: 20px;">⚠️ Admin User Not Found</h2>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">
            The seller account (admin) doesn't exist in the database yet.
        </p>
        <button class="dashboard-button" onclick="createAdminUser()" style="background: var(--accent-orange); font-size: 1.1rem;">
            Create Admin User Now
        </button>
        <p style="margin-top: 20px; font-size: 0.9rem; color: var(--text-secondary);">
            This will create the seller account with username: admin, password: admin123
        </p>
    `;
    
    container.insertBefore(message, container.firstChild);
}

// ===================================
// CREATE ADMIN USER
// ===================================

async function createAdminUser() {
    try {
        showToast('Creating admin user...');
        
        // First check if admin already exists
        const checkQuery = new Parse.Query(Parse.User);
        checkQuery.equalTo('username', 'admin');
        const existingAdmin = await checkQuery.first();
        
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.id);
            showToast('Admin user already exists! Refreshing...');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            return;
        }
        
        // Create new admin user
        const admin = new Parse.User();
        admin.set('username', 'admin');
        admin.set('password', 'admin123');
        admin.set('email', 'admin@zamarket.com');
        admin.set('storeName', 'za-market Admin');
        admin.set('phone', '0000000000');
        admin.set('role', 'admin');
        admin.set('isActive', true);
        admin.set('commissionRate', 0.15);
        admin.set('outstandingBalance', 0);
        admin.set('totalPaid', 0);
        admin.set('accountStatus', 'Active');
        
        const result = await admin.signUp();
        
        console.log('Admin user created successfully:', result.id);
        showToast('Admin user created successfully! Refreshing...');
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error creating admin user:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 202 || error.message.includes('already exists')) {
            showToast('Admin user already exists. Refreshing...');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showToast('Error: ' + error.message);
        }
    }
}

// Make function globally available
window.createAdminUser = createAdminUser;

// ===================================
// LOAD ALL ORDERS
// ===================================

async function loadAllOrders() {
    try {
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        query.include('seller');
        query.descending('createdAt');
        query.limit(1000);
        
        allOrders = await query.find();
        
        console.log(`Found ${allOrders.length} orders in database`);
        
        await autoCompleteOrders();
        renderRecentOrders();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders');
    }
}

// ===================================
// AUTO-COMPLETE ORDERS AFTER 3 HOURS
// ===================================

async function autoCompleteOrders() {
    try {
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        query.equalTo('status', 'Pending');
        
        const pendingOrders = await query.find();
        const threeHoursAgo = new Date(Date.now() - (3 * 60 * 60 * 1000));
        let completedCount = 0;
        
        for (const order of pendingOrders) {
            const createdAt = order.get('createdAt');
            
            if (createdAt < threeHoursAgo) {
                order.set('status', 'Completed');
                order.set('completedAt', new Date());
                await order.save();
                completedCount++;
                console.log(`Auto-completed order: ${order.get('orderId')}`);
            }
        }
        
        if (completedCount > 0) {
            console.log(`Auto-completed ${completedCount} orders`);
            const updatedQuery = new Parse.Query(Order);
            updatedQuery.include('seller');
            updatedQuery.descending('createdAt');
            updatedQuery.limit(1000);
            allOrders = await updatedQuery.find();
        }
        
    } catch (error) {
        console.error('Error auto-completing orders:', error);
    }
}

// ===================================
// RENDER RECENT ORDERS
// ===================================

function renderRecentOrders() {
    const container = document.getElementById('recentOrdersList');
    
    if (allOrders.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No orders yet</p>';
        return;
    }
    
    container.innerHTML = '';
    const recentOrders = allOrders.slice(0, 10);
    
    recentOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        container.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const div = document.createElement('div');
    div.className = 'order-card';
    
    const seller = order.get('seller');
    const storeName = seller?.get('storeName') || 'Unknown Store';
    const orderId = order.get('orderId');
    const total = order.get('total') || 0;
    const commission = order.get('commission') || 0;
    const status = order.get('status') || 'Pending';
    const createdAt = order.get('createdAt');
    const customerName = order.get('customerName') || 'Unknown';
    
    const statusClass = status === 'Completed' ? 'status-completed' : 
                       status === 'Pending' ? 'status-pending' : 'status-disputed';
    
    div.innerHTML = `
        <div class="order-card-header">
            <div>
                <strong>${orderId}</strong>
                <span style="color: var(--text-secondary); margin-left: 10px;">${storeName}</span>
            </div>
            <span class="status-badge ${statusClass}">${status}</span>
        </div>
        <div class="order-card-body">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Total:</strong> R${total.toFixed(2)}</p>
            <p><strong>Commission:</strong> R${commission.toFixed(2)}</p>
            <p><strong>Date:</strong> ${createdAt.toLocaleString('en-ZA')}</p>
        </div>
    `;
    
    return div;
}

// ===================================
// LOAD STATS
// ===================================

async function loadStats() {
    try {
        document.getElementById('totalOrders').textContent = allOrders.length;
        
        const pendingCommission = adminSeller ? (adminSeller.get('outstandingBalance') || 0) : 0;
        document.getElementById('pendingCommission').textContent = `R${pendingCommission.toFixed(2)}`;
        
        const commissionReceived = adminSeller ? (adminSeller.get('totalPaid') || 0) : 0;
        document.getElementById('commissionReceived').textContent = `R${commissionReceived.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===================================
// UPDATE PAYMENT INFO DISPLAY
// ===================================

function updatePaymentInfo() {
    if (adminSeller) {
        document.getElementById('sellerNameDisplay').textContent = adminSeller.get('storeName') || 'za-market Admin';
        document.getElementById('currentBalanceDisplay').textContent = `R${(adminSeller.get('outstandingBalance') || 0).toFixed(2)}`;
        document.getElementById('lastPaymentDisplay').textContent = adminSeller.get('lastPaymentDate') 
            ? new Date(adminSeller.get('lastPaymentDate')).toLocaleDateString('en-ZA')
            : 'Never';
        document.getElementById('totalPaidDisplay').textContent = `R${(adminSeller.get('totalPaid') || 0).toFixed(2)}`;
    }
}

// ===================================
// OPEN PAYMENT MODAL
// ===================================

function openPaymentModalSimple() {
    if (!adminSeller) {
        showToast('No seller found. Please refresh the page.');
        return;
    }
    
    const modal = document.getElementById('paymentModal');
    const title = document.getElementById('paymentModalTitle');
    const sellerIdInput = document.getElementById('paymentSellerId');
    const amountInput = document.getElementById('paymentAmount');
    
    title.textContent = `Record Payment - ${adminSeller.get('storeName')}`;
    sellerIdInput.value = adminSeller.id;
    
    const outstandingBalance = adminSeller.get('outstandingBalance') || 0;
    amountInput.value = outstandingBalance.toFixed(2);
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('paymentForm').reset();
}

// ===================================
// RECORD PAYMENT
// ===================================

async function handleRecordPayment(e) {
    e.preventDefault();
    
    const sellerId = document.getElementById('paymentSellerId').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const method = document.getElementById('paymentMethod').value;
    const reference = document.getElementById('paymentReference').value;
    const notes = document.getElementById('paymentNotes').value;
    const button = document.getElementById('savePaymentBtn');
    
    button.disabled = true;
    button.textContent = 'Recording...';
    
    try {
        const sellerQuery = new Parse.Query(Parse.User);
        const seller = await sellerQuery.get(sellerId);
        
        const Payment = Parse.Object.extend('Payment');
        const payment = new Payment();
        
        payment.set('seller', seller);
        payment.set('amount', amount);
        payment.set('paymentMethod', method);
        payment.set('reference', reference || '');
        payment.set('notes', notes || '');
        payment.set('recordedBy', currentUser);
        payment.set('paymentDate', new Date());
        
        await payment.save();
        
        const currentBalance = seller.get('outstandingBalance') || 0;
        const totalPaid = seller.get('totalPaid') || 0;
        
        seller.set('outstandingBalance', Math.max(0, currentBalance - amount));
        seller.set('totalPaid', totalPaid + amount);
        seller.set('lastPaymentDate', new Date());
        
        if (currentBalance - amount <= 0) {
            seller.set('accountStatus', 'Active');
            seller.set('warningIssuedDate', null);
        }
        
        await seller.save();
        
        showToast('Payment recorded successfully!');
        closePaymentModal();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('Error recording payment: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = 'Record Payment';
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

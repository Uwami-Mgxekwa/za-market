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
let sellers = [];
let allOrders = [];

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = Parse.User.current();
    
    if (!currentUser || currentUser.get('role') !== 'platform_owner') {
        window.location.href = 'developer-login.html';
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
    document.getElementById('refreshSellersBtn').addEventListener('click', loadDashboardData);
    
    // Payment modal
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
            window.location.href = 'developer-login.html';
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
        await Promise.all([
            loadSellers(),
            loadAllOrders(),
            loadStats()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data');
    }
}

// ===================================
// LOAD SELLERS
// ===================================

async function loadSellers() {
    try {
        const query = new Parse.Query(Parse.User);
        query.equalTo('role', 'admin');
        query.descending('createdAt');
        
        sellers = await query.find();
        
        console.log(`Found ${sellers.length} sellers with role 'admin'`);
        
        // If no sellers found, try to find all users
        if (sellers.length === 0) {
            console.log('No sellers with role admin, checking all users...');
            const allUsersQuery = new Parse.Query(Parse.User);
            const allUsers = await allUsersQuery.find();
            console.log(`Total users in database: ${allUsers.length}`);
            allUsers.forEach(user => {
                console.log(`User: ${user.get('username')}, Role: ${user.get('role')}`);
            });
        }
        
        renderSellersTable();
        
    } catch (error) {
        console.error('Error loading sellers:', error);
        showToast('Error loading sellers');
    }
}

function renderSellersTable() {
    const tbody = document.getElementById('sellersTableBody');
    
    if (sellers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No sellers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    sellers.forEach(seller => {
        const row = createSellerRow(seller);
        tbody.appendChild(row);
    });
}

function createSellerRow(seller) {
    const tr = document.createElement('tr');
    
    const storeName = seller.get('storeName') || 'Unknown Store';
    const outstandingBalance = seller.get('outstandingBalance') || 0;
    const totalPaid = seller.get('totalPaid') || 0;
    const lastPaymentDate = seller.get('lastPaymentDate');
    const accountStatus = seller.get('accountStatus') || 'Active';
    
    // Calculate seller's orders and revenue
    const sellerOrders = allOrders.filter(order => order.get('seller')?.id === seller.id);
    const totalRevenue = sellerOrders.reduce((sum, order) => sum + (order.get('total') || 0), 0);
    
    const lastPaymentText = lastPaymentDate 
        ? new Date(lastPaymentDate).toLocaleDateString('en-ZA')
        : 'Never';
    
    const statusClass = accountStatus === 'Active' ? 'status-active' : 
                       accountStatus === 'Warning' ? 'status-warning' : 'status-suspended';
    
    tr.innerHTML = `
        <td><strong>${storeName}</strong></td>
        <td>${sellerOrders.length}</td>
        <td>R${totalRevenue.toFixed(2)}</td>
        <td><strong style="color: var(--accent-orange);">R${outstandingBalance.toFixed(2)}</strong></td>
        <td>${lastPaymentText}</td>
        <td><span class="status-badge ${statusClass}">${accountStatus}</span></td>
        <td>
            <button class="table-action-btn record-payment" data-seller-id="${seller.id}">
                Record Payment
            </button>
            ${accountStatus === 'Suspended' ? 
                `<button class="table-action-btn activate" data-seller-id="${seller.id}">Activate</button>` :
                `<button class="table-action-btn suspend" data-seller-id="${seller.id}">Suspend</button>`
            }
        </td>
    `;
    
    // Event listeners
    const recordPaymentBtn = tr.querySelector('.record-payment');
    recordPaymentBtn.addEventListener('click', () => openPaymentModal(seller));
    
    const actionBtn = tr.querySelector('.activate, .suspend');
    if (actionBtn) {
        actionBtn.addEventListener('click', () => toggleSellerStatus(seller));
    }
    
    return tr;
}

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
        
        // Auto-complete pending orders after 3 hours
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
        
        const threeHoursAgo = new Date(Date.now() - (3 * 60 * 60 * 1000)); // 3 hours in milliseconds
        let completedCount = 0;
        
        for (const order of pendingOrders) {
            const createdAt = order.get('createdAt');
            
            // If order is older than 3 hours, mark as completed
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
            // Reload orders to show updated status
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

function renderRecentOrders() {
    const container = document.getElementById('recentOrdersList');
    
    if (allOrders.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No orders yet</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Show last 10 orders
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
        // Total sellers
        document.getElementById('totalSellers').textContent = sellers.length;
        
        // Total orders
        document.getElementById('totalOrders').textContent = allOrders.length;
        
        // Calculate pending commission (outstanding balance from all sellers)
        const pendingCommission = sellers.reduce((sum, seller) => {
            return sum + (seller.get('outstandingBalance') || 0);
        }, 0);
        document.getElementById('pendingCommission').textContent = `R${pendingCommission.toFixed(2)}`;
        
        // Calculate commission received (total paid by all sellers)
        const commissionReceived = sellers.reduce((sum, seller) => {
            return sum + (seller.get('totalPaid') || 0);
        }, 0);
        document.getElementById('commissionReceived').textContent = `R${commissionReceived.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===================================
// PAYMENT MODAL
// ===================================

function openPaymentModal(seller) {
    const modal = document.getElementById('paymentModal');
    const title = document.getElementById('paymentModalTitle');
    const sellerIdInput = document.getElementById('paymentSellerId');
    const amountInput = document.getElementById('paymentAmount');
    
    title.textContent = `Record Payment - ${seller.get('storeName')}`;
    sellerIdInput.value = seller.id;
    
    // Pre-fill with outstanding balance
    const outstandingBalance = seller.get('outstandingBalance') || 0;
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
        // Get seller
        const sellerQuery = new Parse.Query(Parse.User);
        const seller = await sellerQuery.get(sellerId);
        
        // Create payment record
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
        
        // Update seller's balance
        const currentBalance = seller.get('outstandingBalance') || 0;
        const totalPaid = seller.get('totalPaid') || 0;
        
        seller.set('outstandingBalance', Math.max(0, currentBalance - amount));
        seller.set('totalPaid', totalPaid + amount);
        seller.set('lastPaymentDate', new Date());
        
        // Update account status if balance is cleared
        if (currentBalance - amount <= 0) {
            seller.set('accountStatus', 'Active');
            seller.set('warningIssuedDate', null);
        }
        
        await seller.save(null, { useMasterKey: true });
        
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
// TOGGLE SELLER STATUS
// ===================================

async function toggleSellerStatus(seller) {
    const currentStatus = seller.get('accountStatus') || 'Active';
    const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    
    const action = newStatus === 'Suspended' ? 'suspend' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} ${seller.get('storeName')}?`)) {
        return;
    }
    
    try {
        seller.set('accountStatus', newStatus);
        await seller.save(null, { useMasterKey: true });
        
        showToast(`Seller ${action}d successfully`);
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error updating seller status:', error);
        showToast('Error updating seller status');
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

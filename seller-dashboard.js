// ===================================
// BACK4APP CONFIGURATION
// ===================================

Parse.initialize(
    'SCIT7yqMjDsPcbB0J94vj8Q2nxI3kBV79nPDmCwF', // Application ID
    'dqX7w4z08tRRUBU2fO1AdPvUz9suUv5VEY92vEyt'  // JavaScript Key
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// ===================================
// GLOBAL VARIABLES
// ===================================

let currentUser = null;
let currentEditingProduct = null;

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    currentUser = Parse.User.current();
    if (!currentUser) {
        window.location.href = 'seller-login.html';
        return;
    }
    
    // Display seller name
    document.getElementById('sellerName').textContent = currentUser.get('storeName') || 'Seller';
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load products
    await loadProducts();
    
    // Load stats
    await loadStats();
});

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    // Logout
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    
    // Add product
    document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
    
    // Refresh products
    document.getElementById('refreshProductsBtn').addEventListener('click', loadProducts);
    
    // Modal controls
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    // Product form
    document.getElementById('productForm').addEventListener('submit', handleSaveProduct);
    
    // Image preview
    document.getElementById('productImage').addEventListener('change', handleImageSelect);
    document.getElementById('productImageUrl').addEventListener('input', handleImageUrlInput);
    
    // Close modal on overlay click
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target.id === 'productModal') {
            closeModal();
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
            window.location.href = 'seller-login.html';
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error logging out');
        }
    }
}

// ===================================
// LOAD PRODUCTS
// ===================================

async function loadProducts() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        // Since this is a single-business system, show all products
        // query.equalTo('seller', currentUser);
        query.descending('createdAt');
        
        const products = await query.find();
        
        displayProducts(products);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products');
    }
}

function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    const emptyState = document.getElementById('emptyState');
    
    if (products.length === 0) {
        productsList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = createProductItem(product);
        productsList.appendChild(productItem);
    });
}

function createProductItem(product) {
    const div = document.createElement('div');
    div.className = 'product-item';
    
    const imageUrl = product.get('imageUrl') || product.get('image')?.url() || 'https://via.placeholder.com/100';
    
    div.innerHTML = `
        <img src="${imageUrl}" alt="${product.get('name')}" class="product-item-image">
        <div class="product-item-info">
            <h3 class="product-item-name">${product.get('name')}</h3>
            <p class="product-item-description">${product.get('description')}</p>
            <p class="product-item-price">R${product.get('price').toFixed(2)}</p>
        </div>
        <div class="product-item-actions">
            <button class="product-item-btn edit" data-id="${product.id}">Edit</button>
            <button class="product-item-btn delete" data-id="${product.id}">Delete</button>
        </div>
    `;
    
    // Add event listeners
    div.querySelector('.edit').addEventListener('click', () => openEditProductModal(product));
    div.querySelector('.delete').addEventListener('click', () => handleDeleteProduct(product));
    
    return div;
}

// ===================================
// LOAD STATS
// ===================================

async function loadStats() {
    try {
        // Auto-complete pending orders after 3 hours
        await autoCompleteOrders();
        
        // Count products
        const Product = Parse.Object.extend('Product');
        const productQuery = new Parse.Query(Product);
        // Since this is a single-business system, count all products
        // productQuery.equalTo('seller', currentUser);
        const productCount = await productQuery.count();
        
        document.getElementById('totalProducts').textContent = productCount;
        
        // Load orders
        const Order = Parse.Object.extend('Order');
        const orderQuery = new Parse.Query(Order);
        // Since this is a single-business system, show all orders
        // orderQuery.equalTo('seller', currentUser);
        const orders = await orderQuery.find();
        
        document.getElementById('totalOrders').textContent = orders.length;
        
        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => sum + (order.get('total') || 0), 0);
        document.getElementById('totalRevenue').textContent = `R${totalRevenue.toFixed(2)}`;
        
        // Display commission owed and account status
        displayCommissionInfo();
        
    } catch (error) {
        console.error('Error loading stats:', error);
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
        }
        
    } catch (error) {
        console.error('Error auto-completing orders:', error);
    }
}

// ===================================
// DISPLAY COMMISSION INFO
// ===================================

function displayCommissionInfo() {
    const outstandingBalance = currentUser.get('outstandingBalance') || 0;
    const accountStatus = currentUser.get('accountStatus') || 'Active';
    const lastPaymentDate = currentUser.get('lastPaymentDate');
    const warningIssuedDate = currentUser.get('warningIssuedDate');
    
    // Check if commission info section exists, if not create it
    let commissionSection = document.getElementById('commissionSection');
    
    if (!commissionSection) {
        commissionSection = document.createElement('div');
        commissionSection.id = 'commissionSection';
        commissionSection.className = 'commission-info-section';
        
        // Insert after stats grid
        const statsGrid = document.querySelector('.stats-grid');
        statsGrid.parentNode.insertBefore(commissionSection, statsGrid.nextSibling);
    }
    
    // Calculate days since last payment (only if there's an outstanding balance)
    const daysSincePayment = lastPaymentDate 
        ? Math.floor((new Date() - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24))
        : 0;
    
    let warningHTML = '';
    
    // Only show warnings if there's an outstanding balance
    if (outstandingBalance > 0) {
        if (accountStatus === 'Suspended') {
            warningHTML = `
                <div class="warning-banner suspended">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <strong>Account Suspended</strong>
                        <p>Your account has been suspended due to outstanding payments. Please settle your balance to reactivate.</p>
                    </div>
                </div>
            `;
        } else if (daysSincePayment > 14 && lastPaymentDate) {
            warningHTML = `
                <div class="warning-banner critical">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div>
                        <strong>Final Warning - Account Will Be Suspended</strong>
                        <p>Grace period expired. Please make payment immediately to avoid account suspension.</p>
                    </div>
                </div>
            `;
        } else if (daysSincePayment > 7 && lastPaymentDate) {
            warningHTML = `
                <div class="warning-banner warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <strong>Payment Overdue - Grace Period</strong>
                        <p>Your payment is overdue. You have ${14 - daysSincePayment} days remaining before account suspension.</p>
                    </div>
                </div>
            `;
        }
    }
    
    commissionSection.innerHTML = `
        ${warningHTML}
        <div class="commission-card">
            <div class="commission-header">
                <h3>Commission Summary</h3>
                <span class="account-status ${accountStatus.toLowerCase()}">${accountStatus}</span>
            </div>
            <div class="commission-details">
                <div class="commission-item">
                    <span class="commission-label">Outstanding Balance:</span>
                    <span class="commission-value outstanding">R${outstandingBalance.toFixed(2)}</span>
                </div>
                <div class="commission-item">
                    <span class="commission-label">Commission Rate:</span>
                    <span class="commission-value">15%</span>
                </div>
                <div class="commission-item">
                    <span class="commission-label">Last Payment:</span>
                    <span class="commission-value">${lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString('en-ZA') : 'Never'}</span>
                </div>
                <div class="commission-item">
                    <span class="commission-label">Payment Due:</span>
                    <span class="commission-value">${daysSincePayment > 7 ? 'Overdue' : 'Weekly'}</span>
                </div>
            </div>
            <div class="commission-note">
                <p><strong>Payment Instructions:</strong> Ensure immediate payments at all times to avoid inconveniences. Use the banking details below to make your payment.</p>
            </div>
        </div>
        
        <div class="payment-details-card" id="paymentDetailsCard">
            <div class="payment-details-header">
                <h3>Payment Details</h3>
                <button class="download-btn" id="downloadPaymentDetailsBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download as Image
                </button>
            </div>
            <div class="payment-details-content" id="paymentDetailsContent">
                <div class="payment-detail-row">
                    <span class="detail-label">Bank Name:</span>
                    <span class="detail-value">Standard Bank</span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Branch Name:</span>
                    <span class="detail-value">SOUTHDALE</span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Branch Code:</span>
                    <span class="detail-value">6405</span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Account Holder:</span>
                    <span class="detail-value">MR UWAMI UM MGXEKWA</span>
                </div>
                <div class="payment-detail-row highlight">
                    <span class="detail-label">Account Number:</span>
                    <span class="detail-value">10 20 821 613 6</span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Account Type:</span>
                    <span class="detail-value">CURRENT</span>
                </div>
            </div>
            <div class="payment-reference-note">
                <p><strong>Important:</strong> Please use your Order ID or Store Name as payment reference.</p>
            </div>
        </div>
    `;
    
    // Add download functionality
    const downloadBtn = document.getElementById('downloadPaymentDetailsBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPaymentDetails);
    }
}

// ===================================
// DOWNLOAD PAYMENT DETAILS AS IMAGE
// ===================================

async function downloadPaymentDetails() {
    try {
        const button = document.getElementById('downloadPaymentDetailsBtn');
        button.disabled = true;
        button.innerHTML = '<span>Generating...</span>';
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;
        
        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        ctx.strokeStyle = '#7B3FE4';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Header
        ctx.fillStyle = '#7B3FE4';
        ctx.fillRect(20, 20, canvas.width - 40, 80);
        
        // Logo/Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('za-market', canvas.width / 2, 70);
        
        ctx.font = '18px Arial';
        ctx.fillText('Payment Details', canvas.width / 2, 95);
        
        // Payment details
        const details = [
            { label: 'Bank Name:', value: 'Standard Bank' },
            { label: 'Branch Name:', value: 'SOUTHDALE' },
            { label: 'Branch Code:', value: '6405' },
            { label: 'Account Holder:', value: 'MR UWAMI UM MGXEKWA' },
            { label: 'Account Number:', value: '10 20 821 613 6' },
            { label: 'Account Type:', value: 'CURRENT' }
        ];
        
        let yPosition = 150;
        
        details.forEach((detail, index) => {
            // Label
            ctx.fillStyle = '#666666';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(detail.label, 60, yPosition);
            
            // Value
            ctx.fillStyle = '#000000';
            ctx.font = index === 4 ? 'bold 24px Arial' : 'bold 22px Arial';
            ctx.fillText(detail.value, 300, yPosition);
            
            // Highlight account number
            if (index === 4) {
                ctx.strokeStyle = '#FF6B35';
                ctx.lineWidth = 2;
                ctx.strokeRect(290, yPosition - 25, 450, 35);
            }
            
            yPosition += 60;
        });
        
        // Footer note
        ctx.fillStyle = '#7B3FE4';
        ctx.fillRect(20, 520, canvas.width - 40, 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Use your Order ID or Store Name as payment reference', canvas.width / 2, 555);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'za-market-payment-details.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Payment details downloaded successfully!');
            
            // Reset button
            button.disabled = false;
            button.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download as Image
            `;
        });
        
    } catch (error) {
        console.error('Error downloading payment details:', error);
        showToast('Error downloading payment details');
        
        // Reset button
        const button = document.getElementById('downloadPaymentDetailsBtn');
        button.disabled = false;
        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download as Image
        `;
    }
}

// ===================================
// MODAL CONTROLS
// ===================================

function openAddProductModal() {
    currentEditingProduct = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('productModal').classList.remove('hidden');
}

function openEditProductModal(product) {
    currentEditingProduct = product;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.get('name');
    document.getElementById('productDescription').value = product.get('description');
    document.getElementById('productPrice').value = product.get('price');
    
    const imageUrl = product.get('imageUrl') || product.get('image')?.url();
    if (imageUrl) {
        document.getElementById('productImageUrl').value = imageUrl;
        document.getElementById('previewImg').src = imageUrl;
        document.getElementById('imagePreview').classList.remove('hidden');
    }
    
    document.getElementById('productModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
    currentEditingProduct = null;
}

// ===================================
// IMAGE HANDLING
// ===================================

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('previewImg').src = event.target.result;
            document.getElementById('imagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function handleImageUrlInput(e) {
    const url = e.target.value;
    if (url) {
        document.getElementById('previewImg').src = url;
        document.getElementById('imagePreview').classList.remove('hidden');
    }
}

// ===================================
// SAVE PRODUCT
// ===================================

async function handleSaveProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const imageFile = document.getElementById('productImage').files[0];
    const imageUrl = document.getElementById('productImageUrl').value;
    const button = document.getElementById('saveProductBtn');
    
    // Disable button
    button.disabled = true;
    button.textContent = 'Saving...';
    
    try {
        let product;
        
        if (currentEditingProduct) {
            // Update existing product
            product = currentEditingProduct;
        } else {
            // Create new product
            const Product = Parse.Object.extend('Product');
            product = new Product();
            product.set('seller', currentUser);
        }
        
        // Set product data
        product.set('name', name);
        product.set('description', description);
        product.set('price', price);
        
        // Handle image
        if (imageFile) {
            // Sanitize filename - remove spaces and special characters
            const sanitizedName = imageFile.name
                .replace(/\s+/g, '_')  // Replace spaces with underscores
                .replace(/[()]/g, '')   // Remove parentheses
                .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove other special chars
            
            const parseFile = new Parse.File(sanitizedName, imageFile);
            await parseFile.save();
            product.set('image', parseFile);
        } else if (imageUrl) {
            product.set('imageUrl', imageUrl);
        }
        
        // Save product
        await product.save();
        
        showToast(currentEditingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        
        // Close modal and reload products
        closeModal();
        await loadProducts();
        await loadStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Error saving product: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = 'Save Product';
    }
}

// ===================================
// DELETE PRODUCT
// ===================================

async function handleDeleteProduct(product) {
    if (!confirm(`Are you sure you want to delete "${product.get('name')}"?`)) {
        return;
    }
    
    try {
        await product.destroy();
        showToast('Product deleted successfully!');
        await loadProducts();
        await loadStats();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Error deleting product');
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

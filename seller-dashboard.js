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
        query.equalTo('seller', currentUser);
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
        // Count products
        const Product = Parse.Object.extend('Product');
        const productQuery = new Parse.Query(Product);
        productQuery.equalTo('seller', currentUser);
        const productCount = await productQuery.count();
        
        document.getElementById('totalProducts').textContent = productCount;
        
        // TODO: Load orders and revenue when order system is implemented
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalRevenue').textContent = 'R0';
        
    } catch (error) {
        console.error('Error loading stats:', error);
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

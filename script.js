// ===================================
// BACK4APP CONFIGURATION
// ===================================

Parse.initialize(
    'SCIT7yqMjDsPcbB0J94vj8Q2nxI3kBV79nPDmCwF', // Application ID
    'dqX7w4z08tRRUBU2fO1AdPvUz9suUv5VEY92vEyt'  // JavaScript Key
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// ===================================
// CONFIGURATION
// ===================================

const CONFIG = {
    sellerWhatsAppNumber: '27635722080', // Seller WhatsApp number (country code + number, no + or spaces)
    storeName: 'za-market',
    currency: 'R'
};

// ===================================
// STATE MANAGEMENT
// ===================================

let PRODUCTS = []; // Will be loaded from database
let cart = [];
let currentPage = 'products'; // products, cart, checkout, history
let searchQuery = '';
let filteredProducts = [];
let orderHistory = [];

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    loadCartFromStorage();
    loadThemeFromStorage();
    loadOrderHistoryFromStorage();
    loadAndApplySettings(); // Load settings from settings page
    
    // Load products from database
    await loadProductsFromDatabase();
    
    renderProducts();
    updateCartBadge();
    initializeEventListeners();
    showPage('products');
    
    // Initialize AOS animations
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50
        });
    }
});

// ===================================
// LOAD PRODUCTS FROM DATABASE
// ===================================

async function loadProductsFromDatabase() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        query.descending('createdAt');
        
        const results = await query.find();
        
        // Convert Parse objects to plain objects
        PRODUCTS = results.map((product, index) => {
            const imageUrl = product.get('imageUrl') || product.get('image')?.url() || 'https://via.placeholder.com/800x600/7B3FE4/FFFFFF?text=Product';
            
            return {
                id: product.id, // Use Parse object ID
                name: product.get('name'),
                description: product.get('description'),
                price: product.get('price'),
                image: imageUrl
            };
        });
        
        filteredProducts = [...PRODUCTS];
        
        console.log(`Loaded ${PRODUCTS.length} products from database`);
        
    } catch (error) {
        console.error('Error loading products from database:', error);
        showToast('Error loading products. Please refresh the page.');
        PRODUCTS = [];
        filteredProducts = [];
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    // Navigation
    document.getElementById('cartButton').addEventListener('click', () => showPage('cart'));
    document.getElementById('historyButton').addEventListener('click', () => showPage('history'));
    document.getElementById('settingsButton').addEventListener('click', () => window.location.href = 'settings.html');
    document.getElementById('backToProducts').addEventListener('click', () => showPage('products'));
    document.getElementById('shopNowButton').addEventListener('click', () => showPage('products'));
    document.getElementById('backToCart').addEventListener('click', () => showPage('cart'));
    document.getElementById('proceedToCheckout').addEventListener('click', () => showPage('checkout'));
    document.getElementById('backToProductsFromHistory').addEventListener('click', () => showPage('products'));
    document.getElementById('startShoppingFromHistory').addEventListener('click', () => showPage('products'));
    
    // Location button
    document.getElementById('useLocationButton').addEventListener('click', requestLocation);
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const clearSearchButton = document.getElementById('clearSearchButton');
    
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            clearSearch();
        }
    });
    searchClear.addEventListener('click', clearSearch);
    clearSearchButton.addEventListener('click', clearSearch);
    
    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
}

// ===================================
// PRODUCT RENDERING
// ===================================

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    productsGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsGrid.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    }
    
    productsGrid.classList.remove('hidden');
    noResults.classList.add('hidden');
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Refresh AOS animations
    if (typeof AOS !== 'undefined') {
        setTimeout(() => {
            AOS.refresh();
        }, 100);
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', Math.min(product.id * 100, 500));
    
    card.innerHTML = `
        <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="product-image" 
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/800x600/7B3FE4/FFFFFF?text=${encodeURIComponent(product.name)}'"
        >
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-footer">
                <span class="product-price">${CONFIG.currency}${product.price}</span>
                <button class="add-to-cart-button" data-product-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    
    const addButton = card.querySelector('.add-to-cart-button');
    addButton.addEventListener('click', (e) => {
        addToCart(product.id);
        createCartFlyAnimation(e, product);
    });
    
    return card;
}

// ===================================
// CART MANAGEMENT
// ===================================

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartBadge();
    showToast(`${product.name} added to cart`);
    
    // Visual feedback
    const button = document.querySelector(`[data-product-id="${productId}"]`);
    button.classList.add('added');
    button.textContent = 'Added!';
    
    setTimeout(() => {
        button.classList.remove('added');
        button.textContent = 'Add to Cart';
    }, 1000);
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    saveCartToStorage();
    renderCart();
    updateCartBadge();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    renderCart();
    updateCartBadge();
    showToast('Item removed from cart');
}

function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCartBadge();
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ===================================
// CART RENDERING
// ===================================

function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartSummary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        cartEmpty.classList.remove('hidden');
        cartItemsContainer.classList.add('hidden');
        cartSummary.classList.add('hidden');
        return;
    }
    
    cartEmpty.classList.add('hidden');
    cartItemsContainer.classList.remove('hidden');
    cartSummary.classList.remove('hidden');
    
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = createCartItem(item);
        cartItemsContainer.appendChild(cartItem);
    });
    
    updateCartTotal();
}

function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    
    const subtotal = item.price * item.quantity;
    
    div.innerHTML = `
        <img 
            src="${item.image}" 
            alt="${item.name}" 
            class="cart-item-image"
            onerror="this.src='https://via.placeholder.com/400x400/7B3FE4/FFFFFF?text=${encodeURIComponent(item.name)}'"
        >
        <div class="cart-item-details">
            <h3 class="cart-item-name">${item.name}</h3>
            <p class="cart-item-price">${CONFIG.currency}${item.price} each</p>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-button" data-action="decrease" data-product-id="${item.id}">−</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-button" data-action="increase" data-product-id="${item.id}">+</button>
                </div>
                <button class="remove-button" data-product-id="${item.id}">Remove</button>
            </div>
        </div>
        <div class="cart-item-subtotal">
            <strong>${CONFIG.currency}${subtotal}</strong>
        </div>
    `;
    
    // Event listeners
    const decreaseBtn = div.querySelector('[data-action="decrease"]');
    const increaseBtn = div.querySelector('[data-action="increase"]');
    const removeBtn = div.querySelector('.remove-button');
    
    decreaseBtn.addEventListener('click', () => updateQuantity(item.id, -1));
    increaseBtn.addEventListener('click', () => updateQuantity(item.id, 1));
    removeBtn.addEventListener('click', () => removeFromCart(item.id));
    
    return div;
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
}

function updateCartTotal() {
    const total = getCartTotal();
    document.getElementById('cartTotal').textContent = `${CONFIG.currency}${total}`;
}

// ===================================
// CHECKOUT
// ===================================

function renderCheckout() {
    const orderSummary = document.getElementById('checkoutOrderSummary');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    orderSummary.innerHTML = '';
    
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <span class="order-item-name">${item.quantity}x ${item.name}</span>
            <span class="order-item-price">${CONFIG.currency}${item.price * item.quantity}</span>
        `;
        orderSummary.appendChild(div);
    });
    
    const total = getCartTotal();
    checkoutTotal.textContent = `${CONFIG.currency}${total}`;
}

function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    
    const formData = new FormData(e.target);
    const customerName = formData.get('customerName');
    const customerPhone = formData.get('customerPhone');
    const deliveryAddress = formData.get('deliveryAddress');
    const paymentMethod = formData.get('paymentMethod');
    
    if (!paymentMethod) {
        showToast('Please select a payment method');
        return;
    }
    
    const orderData = {
        orderId: generateOrderId(),
        customerName,
        customerPhone,
        deliveryAddress,
        paymentMethod,
        items: cart,
        total: getCartTotal()
    };
    
    openWhatsApp(orderData);
}

function generateOrderId() {
    const prefix = 'ZA';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
}

function getPaymentMethodLabel(method) {
    const labels = {
        'cash': 'Cash on Delivery',
        'card': 'Card on Delivery',
        'online': 'Pay Online'
    };
    return labels[method] || method;
}

async function openWhatsApp(orderData) {
    const message = generateWhatsAppMessage(orderData);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${CONFIG.sellerWhatsAppNumber}?text=${encodedMessage}`;
    
    // Save order to database
    await saveOrderToDatabase(orderData);
    
    // Save order to history
    saveOrderToHistory(orderData);
    
    // Show success modal
    showSuccessModal(orderData.orderId);
    
    // Redirect to WhatsApp after 3 seconds
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        hideSuccessModal();
        
        // Clear cart and reset form
        clearCart();
        showPage('products');
        document.getElementById('checkoutForm').reset();
    }, 3000);
}

// ===================================
// SAVE ORDER TO DATABASE
// ===================================

async function saveOrderToDatabase(orderData) {
    try {
        // Get the seller (admin user)
        const sellerQuery = new Parse.Query(Parse.User);
        sellerQuery.equalTo('role', 'admin');
        const seller = await sellerQuery.first();
        
        if (!seller) {
            console.error('No seller found with role admin');
            console.log('Attempting to find any user...');
            // Fallback: try to get the first user
            const fallbackQuery = new Parse.Query(Parse.User);
            const anySeller = await fallbackQuery.first();
            if (!anySeller) {
                console.error('No users found in database');
                return;
            }
            console.log('Using fallback seller:', anySeller.get('username'));
        }
        
        const actualSeller = seller || await new Parse.Query(Parse.User).first();
        
        // Create order
        const Order = Parse.Object.extend('Order');
        const order = new Order();
        
        order.set('orderId', orderData.orderId);
        order.set('seller', actualSeller);
        order.set('customerName', orderData.customerName);
        order.set('customerPhone', orderData.customerPhone);
        order.set('deliveryAddress', orderData.deliveryAddress);
        order.set('paymentMethod', orderData.paymentMethod);
        order.set('items', orderData.items);
        order.set('total', orderData.total);
        order.set('commission', orderData.total * 0.15); // 15% commission
        order.set('status', 'Pending');
        
        await order.save();
        
        console.log('Order saved to database:', orderData.orderId);
        
        // Update seller's outstanding balance (try without master key first)
        try {
            const currentBalance = actualSeller.get('outstandingBalance') || 0;
            actualSeller.set('outstandingBalance', currentBalance + (orderData.total * 0.15));
            await actualSeller.save();
            console.log('Seller balance updated successfully');
        } catch (balanceError) {
            console.error('Error updating seller balance:', balanceError.message);
            console.log('Order saved but balance not updated - platform owner can update manually');
        }
        
    } catch (error) {
        console.error('Error saving order to database:', error);
        // Don't block the order flow if database save fails
    }
}

function generateWhatsAppMessage(orderData) {
    let message = `Hi, I'd like to place an order from ${CONFIG.storeName}.\n\n`;
    message += `Order ID: ${orderData.orderId}\n\n`;
    message += `Items:\n`;
    
    orderData.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `- ${item.quantity}x ${item.name} - ${CONFIG.currency}${itemTotal}\n`;
    });
    
    message += `\nTotal: ${CONFIG.currency}${orderData.total}\n\n`;
    message += `Payment Method: ${getPaymentMethodLabel(orderData.paymentMethod)}\n\n`;
    message += `Delivery Address:\n${orderData.deliveryAddress}\n\n`;
    message += `Name: ${orderData.customerName}\n`;
    message += `Phone: ${orderData.customerPhone}`;
    
    return message;
}

// ===================================
// PAGE NAVIGATION
// ===================================

function showPage(page) {
    currentPage = page;
    
    // Hide all sections
    document.getElementById('productsSection').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
    document.getElementById('checkoutSection').classList.add('hidden');
    document.getElementById('historySection').classList.add('hidden');
    
    // Show selected section
    switch(page) {
        case 'products':
            document.getElementById('productsSection').classList.remove('hidden');
            break;
        case 'cart':
            document.getElementById('cartSection').classList.remove('hidden');
            renderCart();
            break;
        case 'checkout':
            if (cart.length === 0) {
                showToast('Your cart is empty');
                showPage('products');
                return;
            }
            document.getElementById('checkoutSection').classList.remove('hidden');
            renderCheckout();
            break;
        case 'history':
            document.getElementById('historySection').classList.remove('hidden');
            renderOrderHistory();
            break;
    }
    
    // Scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Refresh AOS animations
    if (typeof AOS !== 'undefined') {
        setTimeout(() => {
            AOS.refresh();
        }, 100);
    }
}

// ===================================
// STORAGE
// ===================================

function saveCartToStorage() {
    try {
        localStorage.setItem('zamarket_cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart to storage:', error);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('zamarket_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Error loading cart from storage:', error);
        cart = [];
    }
}

// ===================================
// TOAST NOTIFICATIONS
// ===================================

function showToast(message) {
    // Check if toast notifications are enabled
    const settings = getSettings();
    if (settings.toastNotifications === false) {
        return; // Don't show toast if disabled
    }
    
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ===================================
// SUCCESS MODAL
// ===================================

function showSuccessModal(orderId) {
    const modal = document.getElementById('successModal');
    const orderNumber = document.getElementById('orderNumber');
    
    orderNumber.textContent = orderId;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Check if sound effects are enabled
    const settings = getSettings();
    const soundEnabled = settings.soundEffects !== false;
    
    // Trigger confetti animation only if sound effects enabled
    if (typeof confetti !== 'undefined' && soundEnabled) {
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#7B3FE4', '#FF6B35', '#00B4D8', '#FFD700']
            });
        }, 300);
        
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#7B3FE4', '#FF6B35', '#00B4D8', '#FFD700']
            });
        }, 500);
        
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#7B3FE4', '#FF6B35', '#00B4D8', '#FFD700']
            });
        }, 700);
    }
}

function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ===================================
// CART FLY ANIMATION
// ===================================

function createCartFlyAnimation(event, product) {
    const button = event.target;
    const buttonRect = button.getBoundingClientRect();
    const cartButton = document.getElementById('cartButton');
    const cartRect = cartButton.getBoundingClientRect();
    
    // Create flying element
    const flyingEl = document.createElement('div');
    flyingEl.style.cssText = `
        position: fixed;
        left: ${buttonRect.left}px;
        top: ${buttonRect.top}px;
        width: 40px;
        height: 40px;
        background: var(--gradient-primary);
        border-radius: 50%;
        z-index: 9999;
        pointer-events: none;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    document.body.appendChild(flyingEl);
    
    // Trigger animation
    setTimeout(() => {
        flyingEl.style.left = `${cartRect.left + cartRect.width / 2}px`;
        flyingEl.style.top = `${cartRect.top + cartRect.height / 2}px`;
        flyingEl.style.transform = 'scale(0)';
        flyingEl.style.opacity = '0';
    }, 10);
    
    // Remove element after animation
    setTimeout(() => {
        flyingEl.remove();
        // Bounce cart badge
        const badge = document.getElementById('cartBadge');
        badge.style.animation = 'none';
        setTimeout(() => {
            badge.style.animation = 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        }, 10);
    }, 800);
}


// ===================================
// ===================================
// THEME LOADING
// ===================================

function loadThemeFromStorage() {
    try {
        const savedTheme = localStorage.getItem('zamarket_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (error) {
        console.error('Error loading theme from storage:', error);
    }
}


// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    
    // Show/hide clear button
    const searchClear = document.getElementById('searchClear');
    if (searchQuery) {
        searchClear.classList.remove('hidden');
    } else {
        searchClear.classList.add('hidden');
    }
    
    // Filter products
    filterProducts();
    
    // Update results info
    updateSearchResultsInfo();
    
    // Re-render products
    renderProducts();
}

function filterProducts() {
    if (!searchQuery) {
        filteredProducts = [...PRODUCTS];
        return;
    }
    
    filteredProducts = PRODUCTS.filter(product => {
        // Search in product name
        const nameMatch = product.name.toLowerCase().includes(searchQuery);
        
        // Search in product description
        const descriptionMatch = product.description.toLowerCase().includes(searchQuery);
        
        // Search by price (if user types a number)
        const priceMatch = product.price.toString().includes(searchQuery);
        
        // Return true if any field matches
        return nameMatch || descriptionMatch || priceMatch;
    });
}

function updateSearchResultsInfo() {
    const resultsInfo = document.getElementById('searchResultsInfo');
    const resultsText = document.getElementById('searchResultsText');
    
    if (!searchQuery) {
        resultsInfo.classList.add('hidden');
        return;
    }
    
    resultsInfo.classList.remove('hidden');
    
    const count = filteredProducts.length;
    const productWord = count === 1 ? 'product' : 'products';
    
    if (count > 0) {
        resultsText.innerHTML = `Found <strong>${count}</strong> ${productWord} matching "<strong>${escapeHtml(searchQuery)}</strong>"`;
    } else {
        resultsText.innerHTML = `No products found for "<strong>${escapeHtml(searchQuery)}</strong>"`;
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const resultsInfo = document.getElementById('searchResultsInfo');
    
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    resultsInfo.classList.add('hidden');
    
    filteredProducts = [...PRODUCTS];
    renderProducts();
    
    // Focus back on search input
    searchInput.focus();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// ===================================
// LOCATION FUNCTIONALITY
// ===================================

async function requestLocation() {
    const button = document.getElementById('useLocationButton');
    const addressField = document.getElementById('deliveryAddress');
    
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser');
        return;
    }
    
    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = 'Getting location...';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Use reverse geocoding to get address
                const address = await reverseGeocode(latitude, longitude);
                addressField.value = address;
                showToast('Location added successfully!');
            } catch (error) {
                console.error('Error getting address:', error);
                addressField.value = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                showToast('Location coordinates added');
            }
            
            // Reset button
            button.classList.remove('loading');
            button.disabled = false;
            button.querySelector('span').textContent = originalText;
        },
        (error) => {
            console.error('Error getting location:', error);
            
            let errorMessage = 'Unable to get your location';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location permission denied. Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }
            
            showToast(errorMessage);
            
            // Reset button
            button.classList.remove('loading');
            button.disabled = false;
            button.querySelector('span').textContent = originalText;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function reverseGeocode(lat, lon) {
    // Using OpenStreetMap Nominatim API (free, no API key needed)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'za-market'
        }
    });
    
    if (!response.ok) {
        throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    // Format address
    const address = data.address;
    const parts = [];
    
    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    if (address.suburb) parts.push(address.suburb);
    if (address.city || address.town) parts.push(address.city || address.town);
    if (address.postcode) parts.push(address.postcode);
    
    return parts.join(', ') || data.display_name;
}

// ===================================
// ORDER HISTORY
// ===================================

function saveOrderToHistory(orderData) {
    const order = {
        ...orderData,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    orderHistory.unshift(order); // Add to beginning
    saveOrderHistoryToStorage();
}

function renderOrderHistory() {
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    
    if (orderHistory.length === 0) {
        historyList.classList.add('hidden');
        historyEmpty.classList.remove('hidden');
        return;
    }
    
    historyList.classList.remove('hidden');
    historyEmpty.classList.add('hidden');
    historyList.innerHTML = '';
    
    orderHistory.forEach(order => {
        const orderItem = createOrderHistoryItem(order);
        historyList.appendChild(orderItem);
    });
}

function createOrderHistoryItem(order) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const itemsHtml = order.items.map(item => `
        <div class="history-product-item">
            <span class="history-product-name">${item.quantity}x ${item.name}</span>
            <span class="history-product-price">${CONFIG.currency}${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    div.innerHTML = `
        <div class="history-item-header">
            <div class="history-item-info">
                <div class="history-order-id">${order.orderId}</div>
                <div class="history-order-date">${order.date}</div>
            </div>
            <div class="history-order-total">${CONFIG.currency}${order.total}</div>
        </div>
        <div class="history-items-list">
            ${itemsHtml}
        </div>
        <div class="history-item-footer">
            <div class="history-payment-method">
                <strong>Payment:</strong> ${order.paymentMethod}
            </div>
            <button class="history-reorder-button" data-order-id="${order.orderId}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Reorder
            </button>
        </div>
    `;
    
    // Add reorder functionality
    const reorderButton = div.querySelector('.history-reorder-button');
    reorderButton.addEventListener('click', () => reorderItems(order));
    
    return div;
}

function reorderItems(order) {
    // Clear current cart
    cart = [];
    
    // Add all items from the order to cart
    order.items.forEach(item => {
        const product = PRODUCTS.find(p => p.id === item.id);
        if (product) {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: item.quantity
            });
        }
    });
    
    saveCartToStorage();
    updateCartBadge();
    showToast(`${order.items.length} items added to cart!`);
    showPage('cart');
}

function saveOrderHistoryToStorage() {
    try {
        localStorage.setItem('zamarket_order_history', JSON.stringify(orderHistory));
    } catch (error) {
        console.error('Error saving order history:', error);
    }
}

function loadOrderHistoryFromStorage() {
    try {
        const saved = localStorage.getItem('zamarket_order_history');
        if (saved) {
            orderHistory = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading order history:', error);
        orderHistory = [];
    }
}


// ===================================
// SETTINGS INTEGRATION
// ===================================

function loadAndApplySettings() {
    try {
        const saved = localStorage.getItem('zamarket_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            // Apply font size
            if (settings.fontSize) {
                document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
                document.documentElement.classList.add(`font-${settings.fontSize}`);
            }
            
            // Apply animations preference
            if (settings.reduceAnimations) {
                document.documentElement.style.setProperty('--transition-quick', '0ms');
                document.documentElement.style.setProperty('--transition-smooth', '0ms');
                document.documentElement.style.setProperty('--transition-slow', '0ms');
            }
            
            // Apply high contrast
            if (settings.highContrast) {
                document.documentElement.classList.add('high-contrast');
            }
            
            // Pre-fill checkout form with saved data
            if (settings.userName || settings.userPhone || settings.defaultAddress) {
                prefillCheckoutForm(settings);
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function prefillCheckoutForm(settings) {
    // Wait for checkout form to be available
    const checkoutObserver = new MutationObserver(() => {
        const nameField = document.getElementById('customerName');
        const phoneField = document.getElementById('customerPhone');
        const addressField = document.getElementById('deliveryAddress');
        
        if (nameField && settings.userName && !nameField.value) {
            nameField.value = settings.userName;
        }
        if (phoneField && settings.userPhone && !phoneField.value) {
            phoneField.value = settings.userPhone;
        }
        if (addressField && settings.defaultAddress && !addressField.value) {
            addressField.value = settings.defaultAddress;
        }
        
        // Pre-select payment method
        if (settings.preferredPayment) {
            const paymentRadio = document.querySelector(`input[name="paymentMethod"][value="${settings.preferredPayment}"]`);
            if (paymentRadio) {
                paymentRadio.checked = true;
            }
        }
    });
    
    checkoutObserver.observe(document.body, { childList: true, subtree: true });
}

function getSettings() {
    try {
        const saved = localStorage.getItem('zamarket_settings');
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}

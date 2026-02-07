// ===================================
// CONFIGURATION
// ===================================

const CONFIG = {
    sellerWhatsAppNumber: '27635722080', // Seller WhatsApp number (country code + number, no + or spaces)
    storeName: 'za-market',
    currency: 'R'
};

// ===================================
// SAMPLE PRODUCTS DATA
// ===================================

const PRODUCTS = [
    {
        id: 1,
        name: 'Beef Burger',
        description: 'Juicy beef patty with fresh lettuce, tomatoes, and special sauce',
        price: 80,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
    },
    {
        id: 2,
        name: 'Chicken Burger',
        description: 'Grilled chicken breast with crispy lettuce and mayo',
        price: 70,
        image: 'https://images.unsplash.com/photo-1562547200-1c5c7024e8c8?w=400&h=300&fit=crop'
    },
    {
        id: 3,
        name: 'Veggie Burger',
        description: 'Plant-based patty with fresh vegetables and avocado',
        price: 65,
        image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop'
    },
    {
        id: 4,
        name: 'Chips',
        description: 'Crispy golden fries with seasoning',
        price: 30,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop'
    },
    {
        id: 5,
        name: 'Coke',
        description: 'Refreshing cold Coca-Cola 330ml',
        price: 20,
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop'
    },
    {
        id: 6,
        name: 'Milkshake',
        description: 'Creamy vanilla milkshake',
        price: 45,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop'
    }
];

// ===================================
// STATE MANAGEMENT
// ===================================

let cart = [];
let currentPage = 'products'; // products, cart, checkout

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    renderProducts();
    updateCartBadge();
    initializeEventListeners();
    showPage('products');
});

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    // Navigation
    document.getElementById('cartButton').addEventListener('click', () => showPage('cart'));
    document.getElementById('backToProducts').addEventListener('click', () => showPage('products'));
    document.getElementById('shopNowButton').addEventListener('click', () => showPage('products'));
    document.getElementById('backToCart').addEventListener('click', () => showPage('cart'));
    document.getElementById('proceedToCheckout').addEventListener('click', () => showPage('checkout'));
    
    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
}

// ===================================
// PRODUCT RENDERING
// ===================================

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    PRODUCTS.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
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
    addButton.addEventListener('click', () => addToCart(product.id));
    
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
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
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

function openWhatsApp(orderData) {
    const message = generateWhatsAppMessage(orderData);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${CONFIG.sellerWhatsAppNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Clear cart and show success
    setTimeout(() => {
        clearCart();
        showToast('Order sent! Check WhatsApp to complete your order.');
        showPage('products');
        document.getElementById('checkoutForm').reset();
    }, 500);
}

function generateWhatsAppMessage(orderData) {
    let message = `Hi 👋 I'd like to place an order from ${CONFIG.storeName}.\n\n`;
    message += `Order ID: ${orderData.orderId}\n\n`;
    message += `Items:\n`;
    
    orderData.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.quantity}x ${item.name} – ${CONFIG.currency}${itemTotal}\n`;
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
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
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
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

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
    loadThemeFromStorage();
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
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
    // Navigation
    document.getElementById('cartButton').addEventListener('click', () => showPage('cart'));
    document.getElementById('backToProducts').addEventListener('click', () => showPage('products'));
    document.getElementById('shopNowButton').addEventListener('click', () => showPage('products'));
    document.getElementById('backToCart').addEventListener('click', () => showPage('cart'));
    document.getElementById('proceedToCheckout').addEventListener('click', () => showPage('checkout'));
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
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
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', Math.min(product.id * 100, 500));
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
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
    
    // Trigger confetti animation
    if (typeof confetti !== 'undefined') {
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
// THEME TOGGLE
// ===================================

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    updateThemeIcon(newTheme);
    saveThemeToStorage(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

function saveThemeToStorage(theme) {
    try {
        localStorage.setItem('zamarket_theme', theme);
    } catch (error) {
        console.error('Error saving theme to storage:', error);
    }
}

function loadThemeFromStorage() {
    try {
        const savedTheme = localStorage.getItem('zamarket_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } catch (error) {
        console.error('Error loading theme from storage:', error);
    }
}

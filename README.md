# za-market 🛒

**WhatsApp-First Online Marketplace for South Africa**

A modern, minimal, mobile-first e-commerce platform designed for single sellers serving local customers in South Africa. Browse products, add to cart, and complete orders via pre-filled WhatsApp messages.

---

## 🎨 Brand Identity

- **Primary Color:** White `#FFFFFF`
- **Secondary Color:** Black `#000000`
- **Accent Color:** Purple `#7B3FE4`

Clean, minimal design with purple used sparingly for CTAs, active states, and highlights.

---

## ✨ Features

- **Product Browsing:** Clean grid layout with product images, descriptions, and prices
- **Shopping Cart:** Add/remove items, adjust quantities, view totals
- **Checkout Flow:** Customer details, delivery address, payment method selection
- **WhatsApp Integration:** One-click order placement via pre-filled WhatsApp message
- **LocalStorage:** Cart persists across sessions
- **Responsive Design:** Mobile-first, works perfectly on all devices
- **Toast Notifications:** Instant feedback for user actions

---

## 🚀 Quick Start

### 1. Configure WhatsApp Number

Open `script.js` and update the seller's WhatsApp number:

```javascript
const CONFIG = {
    sellerWhatsAppNumber: '27123456789', // Replace with your number (country code + number)
    storeName: 'za-market',
    currency: 'R'
};
```

**Important:** Use the format `27XXXXXXXXX` (country code + number, no spaces, no + sign)

### 2. Add Your Products

In `script.js`, replace the sample products with your own:

```javascript
const PRODUCTS = [
    {
        id: 1,
        name: 'Your Product Name',
        description: 'Product description',
        price: 100,
        image: 'path/to/image.jpg'
    },
    // Add more products...
];
```

### 3. Deploy

Upload all three files to your web hosting:
- `index.html`
- `styles.css`
- `script.js`

Or test locally by opening `index.html` in your browser.

---

## 📁 File Structure

```
za-market/
├── index.html      # Main HTML structure
├── styles.css      # All styling and design system
└── script.js       # Cart logic, checkout, WhatsApp integration
```

---

## 🛠️ Customization Guide

### Change Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --color-primary: #FFFFFF;
    --color-secondary: #000000;
    --color-accent: #7B3FE4;        /* Change to your brand color */
    --color-accent-hover: #6A0DAD;
}
```

### Update Payment Methods

In `index.html`, modify the payment options section (~line 150):

```html
<label class="payment-option">
    <input type="radio" name="paymentMethod" value="your-method" required>
    <div class="payment-option-content">
        <span class="payment-option-title">Your Payment Method</span>
    </div>
</label>
```

Don't forget to update the labels in `script.js`:

```javascript
function getPaymentMethodLabel(method) {
    const labels = {
        'cash': 'Cash on Delivery',
        'card': 'Card on Delivery',
        'your-method': 'Your Custom Method'
    };
    return labels[method] || method;
}
```

### Customize WhatsApp Message

Edit the `generateWhatsAppMessage()` function in `script.js`:

```javascript
function generateWhatsAppMessage(orderData) {
    let message = `Hi 👋 I'd like to place an order from ${CONFIG.storeName}.\n\n`;
    // Customize your message format here...
    return message;
}
```

---

## 📱 Payment Methods

The checkout includes three payment options:

1. **Pay on Delivery – Cash** ✅
2. **Pay on Delivery – Card / Tap** ✅
3. **Pay Online** (Coming Soon) 🚧

The "Pay Online" option is currently disabled and marked as "Coming Soon" - perfect placeholder for future payment gateway integration.

---

## 🔧 Key Functions

### Cart Management
- `addToCart(productId)` - Add item to cart
- `updateQuantity(productId, change)` - Increase/decrease quantity
- `removeFromCart(productId)` - Remove item
- `clearCart()` - Empty cart

### Navigation
- `showPage(page)` - Switch between products/cart/checkout

### WhatsApp
- `generateOrderId()` - Creates unique order ID (ZA-XXXX)
- `generateWhatsAppMessage(orderData)` - Formats order for WhatsApp
- `openWhatsApp(orderData)` - Sends order to seller

---

## 🎯 Next Steps (Backend Integration)

This is a **frontend-only** implementation. To add backend functionality:

1. **Backend Integration:** Connect to Back4App or similar
2. **Order Management:** Store orders in database
3. **Product Management:** Admin dashboard for products
4. **Payment Gateway:** Integrate PayFast, Yoco, or Stripe
5. **User Accounts:** Customer login and order history

---

## 📊 Sample Order Flow

1. Customer browses products
2. Adds items to cart
3. Proceeds to checkout
4. Fills in delivery details
5. Selects payment method
6. Clicks "Confirm Order on WhatsApp"
7. WhatsApp opens with pre-filled message
8. Customer sends message to seller
9. Seller confirms and processes order

---

## 🌍 South African Context

- Currency: South African Rand (R)
- Country code: +27
- Mobile-first design (high mobile usage in SA)
- WhatsApp integration (most popular messaging app)
- Simple payment options (cash/card on delivery)

---

## 📄 License

Free to use and modify for your business.

---

## 💬 Support

For questions or customization help, reach out via WhatsApp or email.

Built with ❤️ for South African entrepreneurs.

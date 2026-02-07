# 🎨 Customization Guide

## Quick Customization Tips

### 1. Change Brand Colors

Edit the CSS variables in `styles.css` (lines 10-30):

```css
:root {
    /* Change these to your brand colors */
    --primary-600: #7B3FE4;  /* Main brand color */
    --accent-orange: #FF6B35; /* Secondary accent */
    --accent-teal: #00B4D8;   /* Tertiary accent */
}
```

### 2. Update Store Name

In `script.js` (line 8):

```javascript
const CONFIG = {
    sellerWhatsAppNumber: '27635722080',
    storeName: 'YOUR-STORE-NAME', // Change this
    currency: 'R'
};
```

And in `index.html` (line 5):

```html
<title>YOUR-STORE-NAME | Order Fresh. Delivered Fast.</title>
```

### 3. Customize Hero Section

In `index.html` (around line 40):

```html
<h1 class="hero-title">
    Your Headline.<br>Your <span class="gradient-text">Message</span>.
</h1>
<p class="hero-subtitle">
    Your custom subtitle goes here
</p>
```

### 4. Change Hero Badge

In `index.html` (around line 35):

```html
<div class="hero-badge">
    <svg>...</svg>
    <span>YOUR CUSTOM TEXT</span>
</div>
```

### 5. Update Trust Indicators

In `index.html` (around line 50):

```html
<div class="hero-feature">
    <svg>...</svg>
    <span>Your Feature</span>
</div>
```

### 6. Modify Products

In `script.js` (around line 20):

```javascript
const PRODUCTS = [
    {
        id: 1,
        name: 'Product Name',
        description: 'Your description',
        price: 100,
        image: 'https://your-image-url.jpg'
    }
];
```

**Image Tips:**
- Use high-quality images (at least 800x600px)
- Recommended: Unsplash, Pexels for free images
- Format: JPG or WebP for best performance
- Aspect ratio: 4:3 works best

### 7. Customize Footer

In `index.html` (around line 180):

```html
<footer class="footer">
    <div class="container">
        <p>Powered by <a href="https://your-site.com">Your Brand</a></p>
    </div>
</footer>
```

### 8. Adjust Animation Speed

In `styles.css` (around line 50):

```css
:root {
    --transition-quick: 150ms;   /* Fast animations */
    --transition-smooth: 300ms;  /* Normal animations */
    --transition-slow: 500ms;    /* Slow animations */
}
```

### 9. Change Font Pairing

Replace Google Fonts link in `index.html` (line 10):

```html
<!-- Current fonts -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap">

<!-- Example alternative -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap">
```

Then update in `styles.css`:

```css
:root {
    --font-display: 'Poppins', sans-serif;
    --font-body: 'Inter', sans-serif;
}
```

### 10. Disable Confetti

In `script.js`, comment out the confetti code (around line 450):

```javascript
function showSuccessModal(orderId) {
    // ... existing code ...
    
    // Comment out this section to disable confetti
    /*
    if (typeof confetti !== 'undefined') {
        // confetti code here
    }
    */
}
```

### 11. Change Success Modal Color

In `styles.css` (around line 800):

```css
.success-modal {
    background: var(--gradient-primary); /* Change this */
    /* Or use a solid color: */
    /* background: #10B981; */ /* Green */
    /* background: #3B82F6; */ /* Blue */
}
```

### 12. Adjust Card Hover Effect

In `styles.css` (around line 400):

```css
.product-card:hover {
    transform: translateY(-8px); /* Change lift amount */
    box-shadow: var(--shadow-2xl); /* Change shadow */
}
```

### 13. Modify Payment Methods

In `index.html` (around line 140):

```html
<label class="payment-option">
    <input type="radio" name="paymentMethod" value="custom">
    <div class="payment-option-content">
        <span class="payment-option-title">Your Payment Method</span>
    </div>
</label>
```

And update labels in `script.js`:

```javascript
function getPaymentMethodLabel(method) {
    const labels = {
        'cash': 'Cash on Delivery',
        'card': 'Card on Delivery',
        'custom': 'Your Custom Method'
    };
    return labels[method] || method;
}
```

### 14. Change WhatsApp Message Format

In `script.js` (around line 350):

```javascript
function generateWhatsAppMessage(orderData) {
    let message = `Your custom greeting\n\n`;
    message += `Order: ${orderData.orderId}\n\n`;
    // Customize the rest...
    return message;
}
```

### 15. Adjust Mobile Breakpoints

In `styles.css` (around line 900):

```css
@media (max-width: 768px) {
    /* Tablet styles */
}

@media (max-width: 480px) {
    /* Mobile styles */
}
```

---

## 🎨 Color Scheme Presets

### Option 1: Ocean Blue
```css
--primary-600: #0066FF;
--accent-orange: #00D9FF;
--accent-teal: #7B2FE4;
```

### Option 2: Sunset Vibes
```css
--primary-600: #FF6B35;
--accent-orange: #FFD700;
--accent-teal: #FF3366;
```

### Option 3: Forest Green
```css
--primary-600: #10B981;
--accent-orange: #34D399;
--accent-teal: #059669;
```

### Option 4: Royal Purple (Current)
```css
--primary-600: #7B3FE4;
--accent-orange: #FF6B35;
--accent-teal: #00B4D8;
```

---

## 🚀 Advanced Customizations

### Add Product Badges

In `script.js`, modify `createProductCard`:

```javascript
card.innerHTML = `
    <div class="product-badge">NEW</div>
    <img src="${product.image}" alt="${product.name}">
    ...
`;
```

Add CSS:

```css
.product-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--accent-orange);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-full);
    font-weight: 700;
    font-size: 0.75rem;
    z-index: 10;
}
```

### Add Product Categories

Create filter buttons above the product grid and filter products by category.

### Add Wishlist Feature

Add heart icon to product cards and store favorites in localStorage.

### Add Product Quick View

Create a modal that shows product details without leaving the page.

---

## 💡 Pro Tips

1. **Test on Mobile**: Always check how changes look on mobile devices
2. **Keep It Fast**: Don't add too many heavy images or animations
3. **Brand Consistency**: Use your brand colors throughout
4. **Accessibility**: Maintain good color contrast (4.5:1 minimum)
5. **Performance**: Optimize images before uploading

---

## 🆘 Need Help?

- Check browser console for errors (F12)
- Test in different browsers (Chrome, Safari, Firefox)
- Validate HTML at validator.w3.org
- Use Chrome DevTools for responsive testing

---

**Happy Customizing! 🎨**

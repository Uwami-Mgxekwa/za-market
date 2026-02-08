# za-market Platform - System Overview

## 🎯 BUSINESS MODEL

**Commission-Based Platform (Uber Model)**
- 15% commission on all orders
- Business owner collects full payment from customers
- Platform tracks commission owed
- Weekly payment cycle with grace period

---

## 👥 USER ROLES

### 1. **CUSTOMERS** (index.html)
- Browse products from database
- Add to cart and checkout
- Orders redirect to WhatsApp
- Order saved to database automatically

### 2. **BUSINESS OWNER/SELLER** (seller-login.html → seller-dashboard.html)
- **Login**: username: `admin`, password: `admin123`
- Manage products (add, edit, delete)
- View orders and revenue
- See commission owed
- Receive payment warnings

### 3. **PLATFORM OWNER/DEVELOPER** (developer-login.html → developer.html)
- **Login**: username: `platform_owner`, password: `owner123`
- View all sellers and their stats
- See total platform revenue
- Record payments manually
- Suspend/activate seller accounts
- View all orders across platform

---

## 📊 ORDER FLOW

1. **Customer places order** → Saved to database as "Pending"
2. **After 2-4 hours** → Auto-marked as "Completed" (future feature)
3. **Commission calculated** → 15% added to seller's outstanding balance
4. **Seller sees balance** → In their dashboard
5. **Platform owner records payment** → Manually when received
6. **Balance updated** → Deducted from seller's outstanding amount

---

## 💰 PAYMENT ENFORCEMENT

### Week 1: Normal Operation
- Orders accumulate
- Commission tracked
- No warnings

### Week 2: Grace Period (Days 8-14)
- **Warning banner** appears in seller dashboard
- "Payment Overdue - Grace Period"
- Shows days remaining

### After Week 2: Account Suspension
- **Critical warning** appears
- Account status changes to "Suspended"
- Seller cannot manage products (future feature)
- Must settle balance to reactivate

---

## 🗄️ DATABASE STRUCTURE

### **Product Table**
- name, description, price, image/imageUrl
- seller (pointer to User)
- createdAt, updatedAt

### **Order Table**
- orderId, items (JSON), total, commission
- seller (pointer to User)
- customerName, customerPhone, deliveryAddress, paymentMethod
- status (Pending/Completed/Disputed)
- createdAt, completedAt

### **Payment Table**
- seller (pointer to User)
- amount, paymentMethod, reference, notes
- recordedBy (platform owner)
- paymentDate

### **User Table** (Extended)
- username, password, email, storeName, phone
- role (admin/platform_owner)
- outstandingBalance, totalPaid, lastPaymentDate
- accountStatus (Active/Warning/Suspended)
- warningIssuedDate, commissionRate (0.15)

---

## 🔐 DEFAULT CREDENTIALS

**Business Owner:**
- URL: `seller-login.html`
- Username: `admin`
- Password: `admin123`

**Platform Owner:**
- URL: `developer-login.html`
- Username: `platform_owner`
- Password: `owner123`

---

## 🚀 FEATURES IMPLEMENTED

### Customer Store (index.html)
✅ Product catalog from database
✅ Search functionality
✅ Shopping cart
✅ Checkout with location services
✅ WhatsApp integration
✅ Order history
✅ Dark/light mode
✅ Settings page
✅ Order saved to database

### Seller Dashboard (seller-dashboard.html)
✅ Product management (CRUD)
✅ Image upload with sanitization
✅ Order tracking
✅ Revenue statistics
✅ Commission summary
✅ Payment warnings
✅ Account status display

### Platform Owner Dashboard (developer.html)
✅ View all sellers
✅ Platform statistics
✅ Record payments manually
✅ Update seller balances
✅ Suspend/activate accounts
✅ View all orders
✅ Payment history tracking

---

## 📝 IMPORTANT NOTES

1. **Payment Tracking**: Manual process - platform owner records payments when received
2. **Order Completion**: Currently all orders marked as "Pending" (auto-completion feature pending)
3. **Account Suspension**: Automatic based on payment dates
4. **Commission Rate**: Fixed at 15% (can be customized per seller in database)
5. **WhatsApp Integration**: Orders redirect to WhatsApp for communication
6. **Database**: Back4App (Parse) - free tier

---

## 🔄 NEXT STEPS (Future Enhancements)

- [ ] Auto-complete orders after 2-4 hours
- [ ] SMS/Email notifications for payment reminders
- [ ] Payment gateway integration (optional)
- [ ] Seller analytics dashboard
- [ ] Customer reviews and ratings
- [ ] Multi-seller support (if expanding beyond single business)
- [ ] Export reports to CSV/PDF
- [ ] Mobile app version

---

## 🛠️ TECHNICAL STACK

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Back4App (Parse Server)
- **Database**: Parse Database (MongoDB)
- **Authentication**: Parse User Authentication
- **Styling**: Custom CSS with CSS Variables
- **Animations**: AOS.js, Canvas Confetti
- **Icons**: Inline SVG

---

**Last Updated**: February 8, 2026
**Version**: 2.0
**Developer**: za-market Platform Team

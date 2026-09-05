const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');

const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

// Routes imports
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const contactRoutes = require('./routes/contact.routes');
const productCategoryRoutes = require('./routes/productCategory.routes');
const productRoutes = require('./routes/product.routes');
const analyticAccountRoutes = require('./routes/analyticAccount.routes');
const budgetRoutes = require('./routes/budget.routes');
const salesOrderRoutes = require('./routes/salesOrder.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const purchaseOrderRoutes = require('./routes/purchaseOrder.routes');
const vendorBillRoutes = require('./routes/vendorBill.routes');
const paymentRoutes = require('./routes/payment.routes');
const accountRoutes = require('./routes/account.routes');
const journalRoutes = require('./routes/journal.routes');
const journalEntryRoutes = require('./routes/journalEntry.routes');
const reportRoutes = require('./routes/report.routes');
const portalRoutes = require('./routes/portal.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: env.FRONTEND_URL,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Request logging for development
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytic-accounts', analyticAccountRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/vendor-bills', vendorBillRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/upload', uploadRoutes);

// Global Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

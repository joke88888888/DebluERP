require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employees.routes'));
app.use('/api/brands', require('./routes/brands.routes'));
app.use('/api/models', require('./routes/models.routes'));
app.use('/api/versions', require('./routes/versions.routes'));
app.use('/api/product-categories', require('./routes/productCategories.routes'));
app.use('/api/production-methods', require('./routes/productionMethods.routes'));
app.use('/api/colors', require('./routes/colors.routes'));
app.use('/api/sizes', require('./routes/sizes.routes'));
app.use('/api/genders', require('./routes/genders.routes'));
app.use('/api/provinces', require('./routes/provinces.routes'));
app.use('/api/regions', require('./routes/regions.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/discount-codes', require('./routes/discountCodes.routes'));
app.use('/api/commission-rules', require('./routes/commissionRules.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/lid-molds', require('./routes/lidMolds.routes'));
app.use('/api/floor-molds', require('./routes/floorMolds.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Deblu ERP Server running' }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Deblu ERP Server running on port ${PORT}`);
});

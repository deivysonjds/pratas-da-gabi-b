const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const auth = require('../controllers/authController');
const clients = require('../controllers/clientController');
const users = require('../controllers/userController');
const categories = require('../controllers/categoryController');
const products = require('../controllers/productController');
const sales = require('../controllers/saleController');
const installments = require('../controllers/installmentController');
const productImage = require('../controllers/productImageController');

// Rotas públicas estritamente necessárias para autenticação e compra na vitrine.
router.post('/auth/login', auth.login);
router.post('/auth/refresh', auth.refresh);
router.post('/auth/logout', auth.logout);
router.get('/products', products.findAll);
router.post('/sales', sales.createPublicSale);

function protectedCrudRoutes(path, controller) {
  router.post(path, authenticate, controller.create);
  router.get(path, authenticate, controller.findAll);
  router.get(`${path}/:id`, authenticate, controller.findById);
  router.put(`${path}/:id`, authenticate, controller.update);
  router.delete(`${path}/:id`, authenticate, controller.remove);
}

protectedCrudRoutes('/clients', clients);
protectedCrudRoutes('/users', users);
protectedCrudRoutes('/categories', categories);
protectedCrudRoutes('/products', products);
protectedCrudRoutes('/installments', installments);

router.patch('/sales/:id/status', authenticate, sales.updateStatus);
router.patch('/installments/:id/status', authenticate, installments.updateStatus);
router.post('/sales/complete', authenticate, sales.createComplete);
router.get('/sales', authenticate, sales.findAll);
router.get('/sales/:id', authenticate, sales.findById);
router.put('/sales/:id', authenticate, sales.update);
router.delete('/sales/:id', authenticate, sales.deleteSale);
router.post('/products/:id/image', authenticate, productImage.upload.single('image'), productImage.uploadImage);

module.exports = router;

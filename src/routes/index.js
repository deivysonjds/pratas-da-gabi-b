const express = require('express');
const router = express.Router();

const clients = require('../controllers/clientController');
const users = require('../controllers/userController');
const categories = require('../controllers/categoryController');
const products = require('../controllers/productController');
const sales = require('../controllers/saleController');
const installments = require('../controllers/installmentController');
const productImage = require('../controllers/productImageController');

function crudRoutes(path, controller) {
  router.post(path, controller.create);
  router.get(path, controller.findAll);
  router.get(`${path}/:id`, controller.findById);
  router.put(`${path}/:id`, controller.update);
  router.delete(`${path}/:id`, controller.remove);
}

crudRoutes('/clients', clients);
crudRoutes('/users', users);
crudRoutes('/categories', categories);
crudRoutes('/products', products);
crudRoutes('/installments', installments);

// Rotas específicas de vendas ficam antes de /sales/:id.
router.post('/sales/complete', sales.createComplete);
router.post('/sales', sales.create);
router.get('/sales', sales.findAll);
router.get('/sales/:id', sales.findById);
router.put('/sales/:id', sales.update);
router.delete('/sales/:id', sales.deleteSale);

router.post('/products/:id/image', productImage.upload.single('image'), productImage.uploadImage);

module.exports = router;

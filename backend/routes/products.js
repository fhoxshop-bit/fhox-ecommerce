const express = require('express')
const { upload } = require('../utils/cloudinaryService')

const router = express.Router()
const productController = require('../controllers/productController')

router.get('/', productController.getProducts)
router.get('/:id', productController.getProductById)
router.post('/', upload.single('image'), productController.createProduct)
router.put('/:id', upload.single('image'), productController.updateProduct)
router.delete('/:id', productController.deleteProduct)

module.exports = router

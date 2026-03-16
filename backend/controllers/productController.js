const fs = require('fs')
const path = require('path')

const PRODUCTS_FILE = path.join(__dirname, '..', 'products.json')

function readProducts() {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8')
    const data = JSON.parse(raw)
    // ensure new fields exist with sensible defaults
    return data.map(p => {
      // For backward compatibility, convert old stock to sizeStock if needed
      let sizeStock = p.sizeStock
      if (!sizeStock && p.stock) {
        // Old format - distribute stock equally to all sizes
        const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
        const stockPerSize = Math.ceil(p.stock / defaultSizes.length)
        sizeStock = {}
        defaultSizes.forEach(size => {
          sizeStock[size] = stockPerSize
        })
      }
      if (!sizeStock) {
        sizeStock = {
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          XXL: 0,
          XXXL: 0
        }
      }
      
      return {
        stock: p.stock !== undefined ? p.stock : 0,
        active: p.active !== undefined ? p.active : true,
        codAvailable: p.codAvailable !== undefined ? p.codAvailable : true,
        availableSizes: p.availableSizes || ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        sizeStock: sizeStock,
        ...p,
      }
    })
  } catch (err) {
    return []
  }
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8')
}

// Export helper functions for use in other controllers
exports.readProducts = readProducts
exports.writeProducts = writeProducts

exports.getProducts = (req, res) => {
  const products = readProducts()
  res.json(products)
}

exports.getProductById = (req, res) => {
  const { id } = req.params
  const products = readProducts()
  const product = products.find(p => p.id === parseInt(id))
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  res.json(product)
}

exports.createProduct = (req, res) => {
  try {
    const products = readProducts()
    const { name, gender, price, description, active, codAvailable, availableSizes } = req.body

    const image = req.file ? req.file.path : null

    // Parse availableSizes if it's a string (from FormData)
    let sizes = availableSizes
    if (typeof availableSizes === 'string') {
      try {
        sizes = JSON.parse(availableSizes)
      } catch {
        sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
      }
    }
    if (!Array.isArray(sizes)) {
      sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    }

    // Build sizeStock object from form data
    const sizeStock = {
      S: Number(req.body.sizeStock_S) || 0,
      M: Number(req.body.sizeStock_M) || 0,
      L: Number(req.body.sizeStock_L) || 0,
      XL: Number(req.body.sizeStock_XL) || 0,
      XXL: Number(req.body.sizeStock_XXL) || 0,
      XXXL: Number(req.body.sizeStock_XXXL) || 0,
    }

    // Calculate total stock
    const totalStock = Object.values(sizeStock).reduce((sum, val) => sum + val, 0)

    const maxId = products.reduce((max, p) => Math.max(max, p.id || 0), 0)
    const newProduct = {
      id: maxId + 1,
      name: name || '',
      gender: gender || '',
      price: price ? Number(price) : 0,
      actualPrice: req.body.actualPrice ? Number(req.body.actualPrice) : (price ? Number(price) : 0),
      discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : (price ? Number(price) : 0),
      description: description || '',
      stock: totalStock,
      active: active !== undefined ? (active === 'true' || active === true) : true,
      codAvailable: codAvailable !== undefined ? (codAvailable === 'true' || codAvailable === true) : true,
      availableSizes: sizes,
      sizeStock: sizeStock,
      imageUrl: image,
    }

    products.push(newProduct)
    writeProducts(products)

    res.status(201).json(newProduct)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create product' })
  }
}

exports.updateProduct = (req, res) => {
  try {
    const { id } = req.params
    const { name, gender, price, description, active, codAvailable, availableSizes } = req.body
    const products = readProducts()

    const productIndex = products.findIndex(p => p.id === parseInt(id))
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Parse availableSizes if it's a string (from FormData)
    let sizes = availableSizes
    if (typeof availableSizes === 'string') {
      try {
        sizes = JSON.parse(availableSizes)
      } catch {
        sizes = products[productIndex].availableSizes
      }
    }
    if (!Array.isArray(sizes)) {
      sizes = products[productIndex].availableSizes
    }

    // Build sizeStock object from form data (if provided)
    let sizeStock = products[productIndex].sizeStock
    if (req.body.sizeStock_S !== undefined) {
      sizeStock = {
        S: Number(req.body.sizeStock_S) || 0,
        M: Number(req.body.sizeStock_M) || 0,
        L: Number(req.body.sizeStock_L) || 0,
        XL: Number(req.body.sizeStock_XL) || 0,
        XXL: Number(req.body.sizeStock_XXL) || 0,
        XXXL: Number(req.body.sizeStock_XXXL) || 0,
      }
    }

    // Calculate total stock
    const totalStock = Object.values(sizeStock).reduce((sum, val) => sum + val, 0)

    const updatedProduct = {
      ...products[productIndex],
      name: name !== undefined ? name : products[productIndex].name,
      gender: gender !== undefined ? gender : products[productIndex].gender,
      price: price !== undefined ? Number(price) : products[productIndex].price,
      actualPrice: req.body.actualPrice !== undefined ? Number(req.body.actualPrice) : (products[productIndex].actualPrice || products[productIndex].price),
      discountPrice: req.body.discountPrice !== undefined ? Number(req.body.discountPrice) : (products[productIndex].discountPrice || products[productIndex].price),
      description: description !== undefined ? description : products[productIndex].description,
      stock: totalStock,
      active: active !== undefined ? (active === 'true' || active === true) : products[productIndex].active,
      codAvailable: codAvailable !== undefined ? (codAvailable === 'true' || codAvailable === true) : products[productIndex].codAvailable,
      availableSizes: sizes,
      sizeStock: sizeStock,
    }

    if (req.file) {
      updatedProduct.imageUrl = req.file.path
    }

    products[productIndex] = updatedProduct
    writeProducts(products)

    res.json(updatedProduct)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

exports.deleteProduct = (req, res) => {
  try {
    const { id } = req.params
    const products = readProducts()

    const filteredProducts = products.filter(p => p.id !== parseInt(id))
    if (filteredProducts.length === products.length) {
      return res.status(404).json({ error: 'Product not found' })
    }

    writeProducts(filteredProducts)
    res.json({ message: 'Product deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete product' })
  }
}

import React, { useState, useEffect } from 'react'
import { FiSearch, FiEdit2, FiTrash2, FiFilter, FiX } from 'react-icons/fi'
import './Collections.css'

export default function Collections() {
  const [products, setProducts] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    gender: '',
    price: '',
    actualPrice: '',
    discountPrice: '',
    description: '',
    stock: 0,
    sizeStock_S: 0,
    sizeStock_M: 0,
    sizeStock_L: 0,
    sizeStock_XL: 0,
    sizeStock_XXL: 0,
    sizeStock_XXXL: 0,
    active: true,
    codAvailable: true,
    image: null,
  })
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [stockFilter, setStockFilter] = useState('all')
  const [editingSizeField, setEditingSizeField] = useState(null)
  const [sizeInputValue, setSizeInputValue] = useState('')

  // Fetch products
  useEffect(() => {
    let mounted = true
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          // Sort by id descending (newest first)
          const sorted = data.sort((a, b) => b.id - a.id)
          setProducts(sorted)
        }
      })
      .catch(err => console.error('Failed to load products', err))
    return () => { mounted = false }
  }, [])

  const [searchTerm, setSearchTerm] = useState('')
  // gender filter removed per request

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      
      setProducts(products.filter(p => p.id !== id))
      alert('Product deleted successfully')
    } catch (err) {
      console.error(err)
      alert('Failed to delete product')
    }
  }

  // Handle edit modal open
  const handleEditOpen = (product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name,
      gender: product.gender,
      price: product.price,
      actualPrice: product.actualPrice || product.price,
      discountPrice: product.discountPrice || product.price,
      description: product.description,
      stock: product.stock || 0,
      sizeStock_S: product.sizeStock && product.sizeStock.S ? product.sizeStock.S : 0,
      sizeStock_M: product.sizeStock && product.sizeStock.M ? product.sizeStock.M : 0,
      sizeStock_L: product.sizeStock && product.sizeStock.L ? product.sizeStock.L : 0,
      sizeStock_XL: product.sizeStock && product.sizeStock.XL ? product.sizeStock.XL : 0,
      sizeStock_XXL: product.sizeStock && product.sizeStock.XXL ? product.sizeStock.XXL : 0,
      sizeStock_XXXL: product.sizeStock && product.sizeStock.XXXL ? product.sizeStock.XXXL : 0,
      active: product.active !== false,
      codAvailable: product.codAvailable !== false,
      image: null,
    })
    setEditImagePreview(product.imageUrl || product.image || null)
  }

  // Handle edit modal close
  const handleEditClose = () => {
    setEditingProduct(null)
    setEditFormData({
      name: '',
      gender: '',
      price: '',
      actualPrice: '',
      discountPrice: '',
      description: '',
      stock: 0,
      sizeStock_S: 0,
      sizeStock_M: 0,
      sizeStock_L: 0,
      sizeStock_XL: 0,
      sizeStock_XXL: 0,
      sizeStock_XXXL: 0,
      active: true,
      codAvailable: true,
      image: null,
    })
    setEditImagePreview(null)
  }

  // Handle form input change
  const handleEditInputChange = (e) => {
    const { name, value, type } = e.target
    let val = value
    if (type === 'number') {
      val = value === '' ? '' : Number(value)
    }
    if (name === 'active') {
      // select returns string
      val = value === 'true' || value === true
    }
    setEditFormData({ ...editFormData, [name]: val })
  }

  // Handle size field click - open modal
  const openSizeModal = (sizeKey) => {
    const fieldName = `sizeStock_${sizeKey}`
    setSizeInputValue(editFormData[fieldName] || '')
    setEditingSizeField(sizeKey)
  }

  // Handle size field modal close
  const closeSizeModal = () => {
    setEditingSizeField(null)
    setSizeInputValue('')
  }

  // Handle size field modal save
  const saveSizeValue = () => {
    if (editingSizeField) {
      const fieldName = `sizeStock_${editingSizeField}`
      const numValue = sizeInputValue === '' ? 0 : Number(sizeInputValue)
      setEditFormData({ ...editFormData, [fieldName]: numValue })
      closeSizeModal()
    }
  }

  // Handle Enter key in modal
  const handleSizeInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveSizeValue()
    } else if (e.key === 'Escape') {
      closeSizeModal()
    }
  }

  // Handle image change in edit modal
  const handleEditImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setEditFormData({ ...editFormData, image: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle update submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const payload = new FormData()
      payload.append('name', editFormData.name)
      payload.append('gender', editFormData.gender)
      payload.append('price', editFormData.price)
      payload.append('actualPrice', editFormData.actualPrice || editFormData.price)
      payload.append('discountPrice', editFormData.discountPrice || editFormData.price)
      payload.append('description', editFormData.description)
      payload.append('sizeStock_S', editFormData.sizeStock_S)
      payload.append('sizeStock_M', editFormData.sizeStock_M)
      payload.append('sizeStock_L', editFormData.sizeStock_L)
      payload.append('sizeStock_XL', editFormData.sizeStock_XL)
      payload.append('sizeStock_XXL', editFormData.sizeStock_XXL)
      payload.append('sizeStock_XXXL', editFormData.sizeStock_XXXL)
      payload.append('active', editFormData.active)
      payload.append('codAvailable', editFormData.codAvailable)
      if (editFormData.image) payload.append('image', editFormData.image)

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        body: payload,
      })
      
      if (!res.ok) throw new Error('Update failed')
      
      const updatedProduct = await res.json()
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      handleEditClose()
      alert('Product updated successfully')
    } catch (err) {
      console.error(err)
      alert('Failed to update product')
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesName = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    let matchesStock = true
    if (stockFilter === 'in') matchesStock = p.stock > 0 && p.active !== false
    if (stockFilter === 'out') matchesStock = p.stock <= 0 && p.active !== false
    if (stockFilter === 'inactive') matchesStock = p.active === false
    return matchesName && matchesStock
  })

  return (
    <div className="collections-page fade-in">
      <div className="collections-header">
        <h1>Collections</h1>
        <p>Manage your products and collections</p>
      </div>

      <div className="collections-controls">
        <div className="search-sort">
          <div className="search-input">
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <FiFilter size={18} />
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
              <option value="all">All products</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gender</th>
              <th>Price</th>
              <th>Size Stock Status</th>
              <th>Active</th>
              <th>COD</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <tr key={product.id} className={`table-row ${product.active === false ? 'row-inactive' : ''} ${product.stock <= 0 ? 'row-out-of-stock' : ''}`}>
                  <td className="product-cell">
                    <div className="product-info">
                      <img src={product.imageUrl || product.image || ''} alt={product.name} />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.gender}</td>
                  <td className="price-cell">₹{product.price}</td>
                  <td className="size-stock-status">
                    <div className="stock-info">
                      <div className="total-stock">
                        <strong>Total: {product.stock || 0}</strong>
                      </div>
                      <div className="sizes-status">
                        {product.sizeStock ? (
                          ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                            <span key={size} className={`size-badge ${product.sizeStock[size] === 0 ? 'out-of-stock' : 'in-stock'}`}>
                              {size}: {product.sizeStock[size] || 0}
                            </span>
                          ))
                        ) : (
                          <span className="size-badge in-stock">All Sizes Available</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={product.active ? 'active-badge' : 'inactive-badge'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={product.codAvailable !== false ? 'active-badge' : 'inactive-badge'}>
                      {product.codAvailable !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="action-icon edit-btn" 
                        title="Edit"
                        onClick={() => handleEditOpen(product)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        className="action-icon delete-btn" 
                        title="Delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={handleEditClose}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="close-btn" onClick={handleEditClose}>
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="edit-form">
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-section">
                  {editImagePreview ? (
                    <div className="image-preview-container">
                      <div className="image-preview">
                        <img src={editImagePreview} alt="Current product" />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            setEditFormData({ ...editFormData, image: null })
                            setEditImagePreview(editingProduct.imageUrl || editingProduct.image || null)
                          }}
                        >
                          <FiX size={20} />
                        </button>
                      </div>
                      <label className="change-image-btn">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageChange(e.target.files[0])}
                          hidden
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="upload-image-btn">
                      Upload New Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleEditImageChange(e.target.files[0])}
                        hidden
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Actual Price (₹)</label>
                  <input
                    type="number"
                    name="actualPrice"
                    value={editFormData.actualPrice}
                    onChange={handleEditInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Discount Price (₹)</label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={editFormData.discountPrice}
                    onChange={handleEditInputChange}
                  />
                </div>

                {editFormData.actualPrice && editFormData.discountPrice && (
                  <div className="form-group" style={{background: '#f0f0f0', padding: '10px', borderRadius: '4px', margin: '10px 0'}}>
                    💡 Discount: {Math.round(((editFormData.actualPrice - editFormData.discountPrice) / editFormData.actualPrice) * 100)}% off
                  </div>
                )}

                <div className="form-group">
                  <label>Total Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={editFormData.stock}
                    onChange={handleEditInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Stock by Size</label>
                  <div className="size-stock-grid">
                    <div className="size-stock-field" onClick={() => openSizeModal('S')}>
                      <label>S</label>
                      <div className="size-stock-display">{editFormData.sizeStock_S || 0}</div>
                    </div>
                    <div className="size-stock-field" onClick={() => openSizeModal('M')}>
                      <label>M</label>
                      <div className="size-stock-display">{editFormData.sizeStock_M || 0}</div>
                    </div>
                    <div className="size-stock-field" onClick={() => openSizeModal('L')}>
                      <label>L</label>
                      <div className="size-stock-display">{editFormData.sizeStock_L || 0}</div>
                    </div>
                    <div className="size-stock-field" onClick={() => openSizeModal('XL')}>
                      <label>XL</label>
                      <div className="size-stock-display">{editFormData.sizeStock_XL || 0}</div>
                    </div>
                    <div className="size-stock-field" onClick={() => openSizeModal('XXL')}>
                      <label>XXL</label>
                      <div className="size-stock-display">{editFormData.sizeStock_XXL || 0}</div>
                    </div>
                    <div className="size-stock-field" onClick={() => openSizeModal('XXXL')}>
                      <label>XXXL</label>
                      <div className="size-stock-display">{editFormData.sizeStock_XXXL || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Active</label>
                  <select
                    name="active"
                    value={editFormData.active}
                    onChange={handleEditInputChange}
                  >
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cash on Delivery Available</label>
                  <select
                    name="codAvailable"
                    value={editFormData.codAvailable}
                    onChange={handleEditInputChange}
                  >
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleEditClose}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Size Input Modal */}
      {editingSizeField && (
        <div className="modal-overlay" onClick={closeSizeModal}>
          <div className="size-input-modal" onClick={(e) => e.stopPropagation()}>
            <div className="size-modal-header">
              <h3>Enter Stock for Size <strong>{editingSizeField}</strong></h3>
              <button className="close-btn" onClick={closeSizeModal}>
                <FiX size={24} />
              </button>
            </div>

            <div className="size-modal-body">
              <input
                type="number"
                value={sizeInputValue}
                onChange={(e) => setSizeInputValue(e.target.value)}
                onKeyDown={handleSizeInputKeyDown}
                autoFocus
                placeholder="Enter stock quantity"
                min="0"
              />
            </div>

            <div className="size-modal-footer">
              <button className="cancel-btn" onClick={closeSizeModal}>
                Cancel
              </button>
              <button className="save-btn" onClick={saveSizeValue}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

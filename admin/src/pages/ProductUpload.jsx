import React, { useState } from 'react'
import { FiUploadCloud, FiX } from 'react-icons/fi'
import './ProductUpload.css'

function ProductUpload() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    price: '',
    actualPrice: '',
    discountPrice: '',
    description: '',
    sizeStock_S: 0,
    sizeStock_M: 0,
    sizeStock_L: 0,
    sizeStock_XL: 0,
    sizeStock_XXL: 0,
    sizeStock_XXXL: 0,
    active: true,
    codAvailable: true,
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    image: null,
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const genders = ['Male', 'Female']
  const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleImageChange(files[0])
    }
  }

  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData({ ...formData, image: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSizeChange = (size) => {
    setFormData(prevData => {
      const sizes = prevData.availableSizes.includes(size)
        ? prevData.availableSizes.filter(s => s !== size)
        : [...prevData.availableSizes, size]
      return { ...prevData, availableSizes: sizes }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('gender', formData.gender)
      payload.append('price', formData.price)
      payload.append('actualPrice', formData.actualPrice || formData.price)
      payload.append('discountPrice', formData.discountPrice || formData.price)
      payload.append('description', formData.description)
      payload.append('sizeStock_S', formData.sizeStock_S)
      payload.append('sizeStock_M', formData.sizeStock_M)
      payload.append('sizeStock_L', formData.sizeStock_L)
      payload.append('sizeStock_XL', formData.sizeStock_XL)
      payload.append('sizeStock_XXL', formData.sizeStock_XXL)
      payload.append('sizeStock_XXXL', formData.sizeStock_XXXL)
      payload.append('active', formData.active)
      payload.append('codAvailable', formData.codAvailable)
      payload.append('availableSizes', JSON.stringify(formData.availableSizes))
      if (formData.image) payload.append('image', formData.image)

      const res = await fetch('/api/products', {
        method: 'POST',
        body: payload,
      })

      if (!res.ok) throw new Error('Upload failed')

      setUploading(false)
      setUploadSuccess(true)
      setFormData({
        name: '',
        gender: '',
        price: '',
        actualPrice: '',
        discountPrice: '',
        description: '',
        sizeStock_S: 0,
        sizeStock_M: 0,
        sizeStock_L: 0,
        sizeStock_XL: 0,
        sizeStock_XXL: 0,
        sizeStock_XXXL: 0,
        active: true,
        codAvailable: true,
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        image: null,
      })
      setImagePreview(null)
      // notify other parts of the app that products have changed
      window.dispatchEvent(new Event('dataUpdated'))
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setUploading(false)
      alert('Failed to upload product')
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, image: null })
    setImagePreview(null)
  }

  return (
    <div className="product-upload-page fade-in">
      <div className="upload-header">
        <h1>Upload Product</h1>
        <p>Add new products to your collections</p>
      </div>

      <div className="upload-container">
        <form onSubmit={handleSubmit} className="upload-form">
          {/* Image Upload Section */}
          <div className="form-section">
            <h3>Product Image</h3>

            {!imagePreview ? (
              <div
                className={`drag-drop-area ${isDragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="drag-drop-content">
                  <FiUploadCloud size={48} />
                  <h4>Drag and drop your image here</h4>
                  <p>or</p>
                  <label className="upload-button">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files[0])}
                      hidden
                    />
                  </label>
                  <span className="file-info">PNG, JPG, GIF up to 10MB</span>
                </div>
              </div>
            ) : (
              <div className="image-preview-container">
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={removeImage}
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <label className="change-image-btn">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                    hidden
                  />
                </label>
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="form-section">
            <h3>Product Details</h3>

            <div className="form-group">
              <label className="label">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                  <label className="label">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select gender</option>
                    {genders.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
              </div>

              <div className="form-group">
                <label className="label">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Actual Price (₹) - For discount reference</label>
                <input
                  type="number"
                  name="actualPrice"
                  value={formData.actualPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Marked price"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="label">Discount Price (₹) - Offer price</label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Sale price"
                  step="0.01"
                />
              </div>
            </div>

            {formData.actualPrice && formData.discountPrice && (
              <div className="reminder-box">
                💡 Discount: {Math.round(((formData.actualPrice - formData.discountPrice) / formData.actualPrice) * 100)}% off
              </div>
            )}

            <div className="form-group">
              <label className="label">Stock by Size (Units Available)</label>
              <div className="size-stock-grid">
                {sizes.map(size => (
                  <div key={size} className="size-stock-field">
                    <label className="size-stock-label">{size}</label>
                    <input
                      type="number"
                      name={`sizeStock_${size}`}
                      value={formData[`sizeStock_${size}`]}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Active</label>
                <select
                  name="active"
                  value={formData.active}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Cash on Delivery Available</label>
                <select
                  name="codAvailable"
                  value={formData.codAvailable}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field textarea"
                placeholder="Enter product description"
                rows="4"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="label">Available Sizes</label>
              <div className="size-selector">
                {sizes.map(size => (
                  <label key={size} className="size-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.availableSizes.includes(size)}
                      onChange={() => handleSizeChange(size)}
                    />
                    <span className="size-label">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUploadCloud size={18} />
                  Upload Product
                </>
              )}
            </button>
          </div>

          {uploadSuccess && (
            <div className="success-message">
              ✓ Product uploaded successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default ProductUpload

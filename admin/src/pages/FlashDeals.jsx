import React, { useState, useEffect } from 'react'
import { FiEdit2, FiTrash2, FiX, FiPlus } from 'react-icons/fi'
import './FlashDeals.css'

export default function FlashDeals() {
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [editingDeal, setEditingDeal] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    productId: '',
    discountPercent: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  })

  // Helper: Convert UTC ISO string to local datetime-local format
  const toLocalDateTimeString = (utcDateString) => {
    if (!utcDateString) return ''
    const date = new Date(utcDateString)
    // Adjust for timezone offset
    const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return localTime.toISOString().slice(0, 16)
  }

  // Helper: Convert local datetime-local string to UTC ISO
  const toUTCDateString = (localDateTimeString) => {
    if (!localDateTimeString) return ''
    const date = new Date(localDateTimeString)
    // Adjust back for timezone offset
    const utcTime = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
    return utcTime.toISOString()
  }

  // Fetch deals and products
  useEffect(() => {
    fetchDeals()
    fetchProducts()
  }, [])

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/flash-deals')
      const data = await res.json()
      setDeals(data)
    } catch (err) {
      console.error('Failed to fetch flash deals', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error('Failed to fetch products', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      productId: '',
      discountPercent: '',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    })
  }

  const handleEdit = (deal) => {
    setEditingDeal(deal)
    setFormData({
      productId: deal.productId,
      discountPercent: deal.discountPercent,
      title: deal.title,
      description: deal.description,
      startTime: toLocalDateTimeString(deal.startTime),
      endTime: toLocalDateTimeString(deal.endTime),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingDeal ? `/api/flash-deals/${editingDeal.id}` : '/api/flash-deals'
      const method = editingDeal ? 'PUT' : 'POST'

      // Convert local times to UTC before sending
      const dataToSend = {
        ...formData,
        startTime: toUTCDateString(formData.startTime),
        endTime: toUTCDateString(formData.endTime),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (!res.ok) throw new Error('Failed to save flash deal')

      fetchDeals()
      setIsCreating(false)
      setEditingDeal(null)
      setFormData({
        productId: '',
        discountPercent: '',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
      })
      alert('Flash deal saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to save flash deal')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flash deal?')) return

    try {
      const res = await fetch(`/api/flash-deals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')

      setDeals(deals.filter(d => d.id !== id))
      alert('Flash deal deleted successfully')
    } catch (err) {
      console.error(err)
      alert('Failed to delete flash deal')
    }
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId)
    return product ? product.name : 'Unknown Product'
  }

  const handleClose = () => {
    setIsCreating(false)
    setEditingDeal(null)
  }

  return (
    <div className="flash-deals-page fade-in">
      <div className="flash-deals-header">
        <h1>⚡ Flash Deals</h1>
        <p>Manage limited-time offers</p>
      </div>

      <button className="create-btn" onClick={handleCreate}>
        <FiPlus size={18} />
        Create Flash Deal
      </button>

      <div className="deals-list">
        {deals.length > 0 ? (
          <table className="deals-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Discount</th>
                <th>Title</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id}>
                  <td>{getProductName(deal.productId)}</td>
                  <td className="discount-cell">{deal.discountPercent}% OFF</td>
                  <td>{deal.title}</td>
                  <td>{new Date(deal.startTime).toLocaleString()}</td>
                  <td>{new Date(deal.endTime).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => handleEdit(deal)} title="Edit">
                        <FiEdit2 size={18} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(deal.id)} title="Delete">
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-deals">
            <p>No flash deals yet. Create one to get started!</p>
          </div>
        )}
      </div>

      {(isCreating || editingDeal) && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDeal ? 'Edit Flash Deal' : 'Create Flash Deal'}</h2>
              <button className="close-btn" onClick={handleClose}>
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="deal-form">
              <div className="form-group">
                <label>Product *</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Discount Percentage (%) *</label>
                <input
                  type="number"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Lightning Deal, Mega Sale"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this flash deal"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

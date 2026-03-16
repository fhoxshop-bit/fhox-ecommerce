const fs = require('fs')
const path = require('path')

const FLASH_DEALS_FILE = path.join(__dirname, '..', 'flashDeals.json')

function readFlashDeals() {
  try {
    const raw = fs.readFileSync(FLASH_DEALS_FILE, 'utf8')
    return JSON.parse(raw) || []
  } catch (err) {
    return []
  }
}

function writeFlashDeals(deals) {
  fs.writeFileSync(FLASH_DEALS_FILE, JSON.stringify(deals, null, 2), 'utf8')
}

// Get all flash deals
exports.getFlashDeals = (req, res) => {
  try {
    const deals = readFlashDeals()
    const now = new Date().getTime()
    
    // Filter only active deals (not expired)
    const activeDeals = deals.filter(deal => {
      const endTime = new Date(deal.endTime).getTime()
      return endTime > now
    })
    
    res.json(activeDeals)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch flash deals' })
  }
}

// Get all flash deals (including expired) - for admin
exports.getAllFlashDeals = (req, res) => {
  try {
    const deals = readFlashDeals()
    res.json(deals)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch flash deals' })
  }
}

// Get single flash deal
exports.getFlashDealById = (req, res) => {
  try {
    const { id } = req.params
    const deals = readFlashDeals()
    const deal = deals.find(d => d.id === parseInt(id))
    
    if (!deal) {
      return res.status(404).json({ error: 'Flash deal not found' })
    }
    
    res.json(deal)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch flash deal' })
  }
}

// Create flash deal
exports.createFlashDeal = (req, res) => {
  try {
    const { productId, discountPercent, startTime, endTime, title, description } = req.body
    
    const deals = readFlashDeals()
    const maxId = deals.reduce((max, d) => Math.max(max, d.id || 0), 0)
    
    const newDeal = {
      id: maxId + 1,
      productId: parseInt(productId),
      discountPercent: parseFloat(discountPercent),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      title: title || '',
      description: description || '',
      active: true,
      createdAt: new Date().toISOString(),
    }
    
    deals.push(newDeal)
    writeFlashDeals(deals)
    
    res.status(201).json(newDeal)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create flash deal' })
  }
}

// Update flash deal
exports.updateFlashDeal = (req, res) => {
  try {
    const { id } = req.params
    const { productId, discountPercent, startTime, endTime, title, description, active } = req.body
    
    const deals = readFlashDeals()
    const dealIndex = deals.findIndex(d => d.id === parseInt(id))
    
    if (dealIndex === -1) {
      return res.status(404).json({ error: 'Flash deal not found' })
    }
    
    deals[dealIndex] = {
      ...deals[dealIndex],
      productId: productId !== undefined ? parseInt(productId) : deals[dealIndex].productId,
      discountPercent: discountPercent !== undefined ? parseFloat(discountPercent) : deals[dealIndex].discountPercent,
      startTime: startTime ? new Date(startTime).toISOString() : deals[dealIndex].startTime,
      endTime: endTime ? new Date(endTime).toISOString() : deals[dealIndex].endTime,
      title: title !== undefined ? title : deals[dealIndex].title,
      description: description !== undefined ? description : deals[dealIndex].description,
      active: active !== undefined ? active : deals[dealIndex].active,
    }
    
    writeFlashDeals(deals)
    res.json(deals[dealIndex])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update flash deal' })
  }
}

// Delete flash deal
exports.deleteFlashDeal = (req, res) => {
  try {
    const { id } = req.params
    const deals = readFlashDeals()
    
    const filteredDeals = deals.filter(d => d.id !== parseInt(id))
    
    if (filteredDeals.length === deals.length) {
      return res.status(404).json({ error: 'Flash deal not found' })
    }
    
    writeFlashDeals(filteredDeals)
    res.json({ message: 'Flash deal deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete flash deal' })
  }
}

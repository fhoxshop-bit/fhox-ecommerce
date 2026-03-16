import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { AuthModalProvider } from './context/AuthModalContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthModalProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </AuthModalProvider>
  </BrowserRouter>
)
       
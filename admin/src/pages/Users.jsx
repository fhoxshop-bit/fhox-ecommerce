import React, { useEffect, useState } from 'react'
import './Users.css'

export default function Users() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(console.error)
  }, [])

  return (
    <div className="users-page fade-in">
      <div className="users-header">
        <h1>Users</h1>
        <p>List of registered users</p>
      </div>
      <div className="users-list">
        {users.length === 0 && <p>No users available.</p>}
        {users.map(u => (
          <div key={u._id} className="user-item">
            <p><strong>{u.customerName || '(no name)'}</strong> ({u.email || 'no email'})</p>
          </div>
        ))}
      </div>
    </div>
  )
}
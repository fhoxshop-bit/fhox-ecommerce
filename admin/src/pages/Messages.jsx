import React, { useState, useEffect } from 'react';
import { FiMail, FiEye, FiEyeOff, FiSend, FiRefreshCw } from 'react-icons/fi';
import './Messages.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch all messages
  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await fetch(`http://localhost:5000/api/messages/${messageId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'read' }),
      });

      // Update local state
      setMessages(messages.map(msg =>
        msg._id === messageId ? { ...msg, status: 'read' } : msg
      ));      // notify header/sidebar to update count
      window.dispatchEvent(new Event('dataUpdated'))    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${selectedMessage._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyMessage }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Reply sent successfully!');
        setReplyMessage('');
        setSelectedMessage(null);
        fetchMessages(); // Refresh the list
        window.dispatchEvent(new Event('dataUpdated'))
      } else {
        alert(result.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return '#ff4757';
      case 'read': return '#ffa502';
      case 'replied': return '#2ed573';
      default: return '#ddd';
    }
  };

  // Get subject display name
  const getSubjectDisplay = (subject) => {
    const subjects = {
      order: 'Order Inquiry',
      product: 'Product Information',
      returns: 'Returns & Exchanges',
      shipping: 'Shipping Information',
      feedback: 'Feedback',
      other: 'Other'
    };
    return subjects[subject] || subject;
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1><FiMail /> Customer Messages</h1>
        <button onClick={fetchMessages} className="refresh-btn">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="messages-content">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="no-messages">
              <FiMail size={48} />
              <p>No messages yet</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`message-item ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (message.status === 'unread') {
                    markAsRead(message._id);
                  }
                }}
              >
                <div className="message-header">
                  <div className="message-sender">
                    <strong>{message.name}</strong>
                    <span className="message-email">{message.email}</span>
                  </div>
                  <div className="message-meta">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(message.status) }}
                    >
                      {message.status}
                    </span>
                    <span className="message-date">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="message-subject">
                  {getSubjectDisplay(message.subject)}
                </div>
                <div className="message-preview">
                  {message.message.length > 100
                    ? `${message.message.substring(0, 100)}...`
                    : message.message
                  }
                </div>
              </div>
            ))
          )}
        </div>

        {selectedMessage && (
          <div className="message-detail">
            <div className="message-detail-header">
              <h3>Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="message-info">
              <div className="info-row">
                <strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})
              </div>
              <div className="info-row">
                <strong>Subject:</strong> {getSubjectDisplay(selectedMessage.subject)}
              </div>
              <div className="info-row">
                <strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
              </div>
              <div className="info-row">
                <strong>Status:</strong>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedMessage.status) }}
                >
                  {selectedMessage.status}
                </span>
              </div>
            </div>

            <div className="message-content">
              <h4>Message:</h4>
              <p>{selectedMessage.message}</p>
            </div>

            {selectedMessage.adminReply && (
              <div className="admin-reply">
                <h4>Your Reply ({new Date(selectedMessage.repliedAt).toLocaleString()}):</h4>
                <p>{selectedMessage.adminReply}</p>
              </div>
            )}

            {selectedMessage.status !== 'replied' && (
              <div className="reply-section">
                <h4>Reply to Customer:</h4>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  rows="6"
                />
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="send-reply-btn"
                >
                  {sendingReply ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <FiSend /> Send Reply
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'alex_codes',
      content: 'Hi! I saw you claimed my web development job. I\'m excited to work with you on this project.',
      timestamp: '2 hours ago',
      isFromUser: false
    },
    {
      id: '2',
      sender: 'you',
      content: 'Thanks! I\'m looking forward to getting started. When would you like to begin?',
      timestamp: '1 hour ago',
      isFromUser: true
    },
    {
      id: '3',
      sender: 'alex_codes',
      content: 'Great! We can start tomorrow. I\'ll send you the project requirements and design files.',
      timestamp: '30 minutes ago',
      isFromUser: false
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: 'you',
        content: newMessage.trim(),
        timestamp: 'now',
        isFromUser: true
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888888',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← back
          </button>
          <h1 style={{ 
            color: '#ffffff', 
            fontSize: '2rem', 
            fontWeight: '800', 
            margin: 0 
          }}>
            messages
          </h1>
        </div>

        {/* Messages Container */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #333333',
          borderRadius: '8px',
          height: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Messages List */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map(message => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.isFromUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  backgroundColor: message.isFromUser ? '#4c1d95' : '#1a1a1a',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: 1.4
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: message.isFromUser ? '#cccccc' : '#888888',
                    marginBottom: '4px',
                    fontWeight: '600'
                  }}>
                    {message.sender} • {message.timestamp}
                  </div>
                  <div>{message.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={{
            borderTop: '1px solid #333333',
            padding: '1rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="type your message..."
              style={{
                flex: 1,
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#4c1d95',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;

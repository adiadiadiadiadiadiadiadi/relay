import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface Message {
  id: string;
  sender_id: number;
  content: string;
  created_at: string;
  sender_name: string;
  isFromUser: boolean;
}

interface Conversation {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_id: number;
  last_message: string;
  last_message_time: string;
  job_title: string;
  recipient1: number;
  recipient2: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Get current user's display name
  const getCurrentUserName = () => {
    if (!currentUser?.email) return 'User';
    return currentUser.email.split('@')[0];
  };

  // API functions
  const fetchConversations = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/conversations/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const messagesWithUserFlag = data.map((msg: any) => ({
          ...msg,
          isFromUser: msg.sender_id === currentUser?.id
        }));
        setMessages(messagesWithUserFlag);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: currentUser.id,
          content: content
        })
      });
      
      if (response.ok) {
        const newMessage = await response.json();
        const messageWithUserFlag = {
          ...newMessage,
          isFromUser: true
        };
        setMessages(prev => [...prev, messageWithUserFlag]);
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load data on component mount
  useEffect(() => {
    if (currentUser?.id) {
      Promise.all([fetchConversations(), fetchUsers()]).then(() => {
        setLoading(false);
      });
    }
  }, [currentUser?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      sendMessage(selectedConversation, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
    setShowNewMessage(false);
    // On mobile, hide conversations list when selecting a conversation
    if (isMobile) {
      setShowConversationsList(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleStartConversation = async (user: any) => {
    if (!currentUser?.id) return;
    
    // Check if conversation already exists
    const existingConversation = conversations.find(c => c.contact_id === user.id);
    if (existingConversation) {
      setSelectedConversation(existingConversation.id);
      fetchMessages(existingConversation.id);
    } else {
      // Create new conversation
      try {
        const response = await fetch('http://localhost:3002/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient1: currentUser.id,
            recipient2: user.id
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSelectedConversation(data.conversation_id);
          setMessages([]);
          // Refresh conversations list
          fetchConversations();
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
    
    setShowNewMessage(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleViewProfile = (contactId: number) => {
    navigate(`/employer/${contactId}`);
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  // Handle opening a specific conversation from job claim
  useEffect(() => {
    if (location.state?.openConversationId) {
      const conversationId = location.state.openConversationId;
      setSelectedConversation(conversationId);
      fetchMessages(conversationId);
      
      // Clear the navigation state
      navigate('/messages', { replace: true });
    } else if (location.state?.startConversationWith) {
      const { name, email, jobTitle } = location.state.startConversationWith;
      
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.contact_name === name);
      
      if (existingConversation) {
        // Open existing conversation
        setSelectedConversation(existingConversation.id);
        fetchMessages(existingConversation.id);
      } else {
        // Find user by name/email and create conversation
        const user = allUsers.find(u => u.name === name || u.email === email);
        if (user) {
          handleStartConversation(user);
        }
      }
      
      // Clear the navigation state
      navigate('/messages', { replace: true });
    }
  }, [location.state, conversations, allUsers, navigate]);

  return (
    <>
      <style>
        {`
          .messages-container::-webkit-scrollbar {
            width: 6px;
          }
          .messages-container::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          .messages-container::-webkit-scrollbar-thumb {
            background: #4c1d95;
            border-radius: 3px;
          }
          .messages-container::-webkit-scrollbar-thumb:hover {
            background: #5b21b6;
          }
          .conversations-list::-webkit-scrollbar {
            width: 6px;
          }
          .conversations-list::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          .conversations-list::-webkit-scrollbar-thumb {
            background: #4c1d95;
            border-radius: 3px;
          }
          .conversations-list::-webkit-scrollbar-thumb:hover {
            background: #5b21b6;
          }
        `}
      </style>
      <div style={{ 
        height: '100vh', 
        backgroundColor: '#0a0a0a',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header />

      {/* Main Messages Layout - Full Screen */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '350px 1fr',
        backgroundColor: '#111111',
        borderTop: '1px solid #333333',
        overflow: 'hidden',
        minHeight: 0
      }}>
          {/* Conversations List */}
          <div style={{
            borderRight: isMobile ? 'none' : '1px solid #333333',
            display: isMobile && !showConversationsList ? 'none' : 'flex',
            flexDirection: 'column',
            width: isMobile ? '100%' : 'auto',
            height: '100%',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #333333',
              backgroundColor: '#1a1a1a'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  conversations
                </h3>
                <button
                  onClick={() => setShowNewMessage(!showNewMessage)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    fontSize: '18px'
                  }}
                  title="New Message"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <path d="M13 8H7"/>
                    <path d="M17 12H7"/>
                  </svg>
                </button>
              </div>
              
              {showNewMessage && (
                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="search users..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333333',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000
                    }}>
                      {searchResults.map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleStartConversation(user)}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #333333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#4c1d95',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#ffffff'
                          }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                              {user.name}
                            </div>
                            <div style={{ color: '#888888', fontSize: '12px' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="conversations-list" style={{ 
              flex: 1, 
              overflowY: 'auto',
              scrollBehavior: 'smooth',
              height: '100%',
              minHeight: 0
            }}>
              {loading ? (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#888888' 
                }}>
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#888888' 
                }}>
                  No conversations yet
                </div>
              ) : (
                conversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #333333',
                      cursor: 'pointer',
                      backgroundColor: selectedConversation === conversation.id ? '#1a1a1a' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(conversation.contact_id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4c1d95',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        {conversation.contact_name}
                      </button>
                    </div>
                    <div style={{ color: '#888888', fontSize: '12px', marginBottom: '0.25rem' }}>
                      {conversation.job_title || 'General conversation'}
                    </div>
                    <div style={{ 
                      color: '#cccccc', 
                      fontSize: '13px', 
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conversation.last_message || 'No messages yet'}
                    </div>
                    <div style={{ color: '#666666', fontSize: '11px', marginTop: '0.25rem' }}>
                      {conversation.last_message_time ? new Date(conversation.last_message_time).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Conversation */}
          <div style={{ 
            display: isMobile && showConversationsList ? 'none' : 'flex', 
            flexDirection: 'column',
            width: isMobile ? '100%' : 'auto'
          }}>
            {selectedConversationData ? (
              <>
                {/* Conversation Header */}
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid #333333',
                  backgroundColor: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {isMobile && (
                    <button
                      onClick={() => setShowConversationsList(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        marginRight: '0.5rem',
                        color: '#cccccc'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleViewProfile(selectedConversationData.contact_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      borderRadius: '50%'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#4c1d95',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#ffffff',
                      transition: 'transform 0.2s'
                    }}>
                      {selectedConversationData.contact_name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div>
                    <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
                      {selectedConversationData.contact_name}
                    </div>
                    <div style={{ color: '#888888', fontSize: '12px' }}>
                      {selectedConversationData.job_title || 'General conversation'}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="messages-container" style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  scrollBehavior: 'smooth',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: 'calc(100vh - 200px)'
                }}>
                  {messages.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888888',
                      fontSize: '16px'
                    }}>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map(message => (
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
                          lineHeight: 1.4,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            color: message.isFromUser ? '#cccccc' : '#888888',
                            marginBottom: '4px',
                            fontWeight: '600'
                          }}>
                            {message.sender_name} • {new Date(message.created_at).toLocaleString()}
                          </div>
                          <div>{message.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
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
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888888',
                fontSize: '16px'
              }}>
                select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages;

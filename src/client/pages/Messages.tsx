import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

interface Conversation {
  id: string;
  contactName: string;
  contactEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  jobTitle: string;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      contactName: 'alex_codes',
      contactEmail: 'alex@example.com',
      lastMessage: 'Great! We can start tomorrow. I\'ll send you the project requirements and design files.',
      lastMessageTime: '30 minutes ago',
      unreadCount: 0,
      jobTitle: 'web development project'
    },
    {
      id: '2',
      contactName: 'design_pro',
      contactEmail: 'design@example.com',
      lastMessage: 'The mockups are ready for review. Let me know what you think!',
      lastMessageTime: '2 hours ago',
      unreadCount: 2,
      jobTitle: 'ui/ux design'
    },
    {
      id: '3',
      contactName: 'blockchain_dev',
      contactEmail: 'blockchain@example.com',
      lastMessage: 'Smart contract is deployed on testnet. Ready for testing.',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      jobTitle: 'smart contract development'
    }
  ]);

  // Mock users data
  const allUsers = [
    { id: '1', name: 'alex_codes', email: 'alex@example.com', avatar: 'A' },
    { id: '2', name: 'design_pro', email: 'design@example.com', avatar: 'D' },
    { id: '3', name: 'blockchain_dev', email: 'blockchain@example.com', avatar: 'B' },
    { id: '4', name: 'marketing_guru', email: 'marketing@example.com', avatar: 'M' },
    { id: '5', name: 'app_builder', email: 'app@example.com', avatar: 'A' },
    { id: '6', name: 'brand_maker', email: 'brand@example.com', avatar: 'B' },
    { id: '7', name: 'seo_expert', email: 'seo@example.com', avatar: 'S' },
    { id: '8', name: 'video_master', email: 'video@example.com', avatar: 'V' }
  ];

  // Get current user's display name
  const getCurrentUserName = () => {
    if (!currentUser?.email) return 'User';
    return currentUser.email.split('@')[0];
  };

  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({
    '1': [
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
    ],
    '2': [
      {
        id: '4',
        sender: 'design_pro',
        content: 'Hi! I\'m working on the UI mockups for your project.',
        timestamp: '3 hours ago',
        isFromUser: false
      },
      {
        id: '5',
        sender: 'you',
        content: 'Perfect! Looking forward to seeing the designs.',
        timestamp: '2.5 hours ago',
        isFromUser: true
      },
      {
        id: '6',
        sender: 'design_pro',
        content: 'The mockups are ready for review. Let me know what you think!',
        timestamp: '2 hours ago',
        isFromUser: false
      }
    ],
    '3': [
      {
        id: '7',
        sender: 'blockchain_dev',
        content: 'Smart contract is deployed on testnet. Ready for testing.',
        timestamp: '1 day ago',
        isFromUser: false
      }
    ]
  });

  const [messages, setMessages] = useState<Message[]>(conversationMessages[selectedConversation] || []);
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

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setMessages(conversationMessages[conversationId] || []);
    setShowNewMessage(false);
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

  const handleStartConversation = (user: any) => {
    // Check if conversation already exists
    const existingConversation = conversations.find(c => c.contactName === user.name);
    if (existingConversation) {
      setSelectedConversation(existingConversation.id);
      setMessages(conversationMessages[existingConversation.id] || []);
    } else {
      // Create new conversation
      const newConversationId = Date.now().toString();
      const newConversation: Conversation = {
        id: newConversationId,
        contactName: user.name,
        contactEmail: user.email,
        lastMessage: 'Conversation started',
        lastMessageTime: 'now',
        unreadCount: 0,
        jobTitle: 'new conversation'
      };
      
      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Initialize empty messages for new conversation
      setConversationMessages(prev => ({
        ...prev,
        [newConversationId]: []
      }));
      setMessages([]);
      setSelectedConversation(newConversationId);
    }
    
    setShowNewMessage(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleViewProfile = (contactName: string) => {
    // Find the user ID from the contact name
    const user = allUsers.find(u => u.name === contactName);
    if (user) {
      navigate(`/employer/${user.id}`);
    } else {
      // Fallback to contact name if ID not found
      navigate(`/employer/${contactName}`);
    }
  };

  const handleDeleteEmptyConversation = (conversationId: string) => {
    const messages = conversationMessages[conversationId] || [];
    if (messages.length === 0 && selectedConversation !== conversationId) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setConversationMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
    }
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  // Auto-delete empty conversations when not viewing them
  useEffect(() => {
    conversations.forEach(conversation => {
      const messages = conversationMessages[conversation.id] || [];
      if (messages.length === 0 && selectedConversation !== conversation.id) {
        handleDeleteEmptyConversation(conversation.id);
      }
    });
  }, [selectedConversation, conversations]);

  // Handle starting conversation with job poster from claim confirmation
  useEffect(() => {
    if (location.state?.startConversationWith) {
      const { name, email, jobTitle } = location.state.startConversationWith;
      
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.contactName === name);
      
      if (existingConversation) {
        // Open existing conversation
        setSelectedConversation(existingConversation.id);
      } else {
        // Create new conversation
        const newConversationId = (conversations.length + 1).toString();
        const newConversation: Conversation = {
          id: newConversationId,
          contactName: name,
          contactEmail: email,
          lastMessage: `Started conversation about: ${jobTitle}`,
          lastMessageTime: 'now',
          unreadCount: 0,
          jobTitle: jobTitle
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversationId);
        
        // Add initial message
        setConversationMessages(prev => ({
          ...prev,
          [newConversationId]: [{
            id: '1',
            sender: 'you',
            content: `Hi! I'm interested in your job: ${jobTitle}`,
            timestamp: 'now',
            isFromUser: true
          }]
        }));
      }
      
      // Clear the navigation state
      navigate('/messages', { replace: true });
    }
  }, [location.state, conversations, navigate]);

  return (
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
        gridTemplateColumns: '350px 1fr',
        backgroundColor: '#111111',
        borderTop: '1px solid #333333',
        overflow: 'hidden'
      }}>
          {/* Conversations List */}
          <div style={{
            borderRight: '1px solid #333333',
            display: 'flex',
            flexDirection: 'column'
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
                            {user.avatar}
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
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map(conversation => (
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
                        handleViewProfile(conversation.contactName);
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
                      {conversation.contactName}
                    </button>
                    {conversation.unreadCount > 0 && (
                      <div style={{
                        backgroundColor: '#4c1d95',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        minWidth: '18px',
                        textAlign: 'center'
                      }}>
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  <div style={{ color: '#888888', fontSize: '12px', marginBottom: '0.25rem' }}>
                    {conversation.jobTitle}
                  </div>
                  <div style={{ 
                    color: '#cccccc', 
                    fontSize: '13px', 
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conversation.lastMessage}
                  </div>
                  <div style={{ color: '#666666', fontSize: '11px', marginTop: '0.25rem' }}>
                    {conversation.lastMessageTime}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Conversation */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                  <button
                    onClick={() => handleViewProfile(selectedConversationData.contactName)}
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
                      {selectedConversationData.contactName.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div>
                    <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
                      {selectedConversationData.contactName}
                    </div>
                    <div style={{ color: '#888888', fontSize: '12px' }}>
                      {selectedConversationData.jobTitle}
                    </div>
                  </div>
                </div>

                {/* Messages */}
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
  );
};

export default Messages;

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader,
  ArrowDown,
  Smile,
  Paperclip,
  MoreHorizontal,
  Headphones
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { useAuth } from '../hooks/useAuth';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot' | 'human';
  timestamp: Date;
  type: 'text' | 'property' | 'contact' | 'system';
  data?: any;
  status?: 'sending' | 'sent' | 'read';
}

interface ChatBotProps {
  propertyId?: string;
  sellerId?: string;
  sellerName?: string;
  propertyTitle?: string;
  propertyPrice?: number;
  propertyImage?: string;
  propertyLocation?: string;
  position?: 'bottom-right' | 'bottom-left' | 'fixed' | 'inline';
  theme?: 'red' | 'blue' | 'green' | 'purple';
  autoOpen?: boolean;
  showTypingIndicator?: boolean;
  enableHumanHandoff?: boolean;
  apiEndpoint?: string;
}

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm max-w-xs">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <Bot className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default function ChatBot({
  propertyId,
  sellerId,
  sellerName = 'Property Owner',
  propertyTitle,
  propertyPrice,
  propertyImage,
  propertyLocation,
  position = 'bottom-right',
  theme = 'red',
  autoOpen = false,
  showTypingIndicator = true,
  enableHumanHandoff = true,
  apiEndpoint = '/api/chatbot'
}: ChatBotProps) {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBotMode, setIsBotMode] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Theme colors
  const themeColors = {
    red: {
      primary: 'bg-red-600',
      primaryHover: 'hover:bg-red-700',
      text: 'text-red-600',
      light: 'bg-red-50',
      border: 'border-red-200'
    },
    blue: {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200'
    },
    green: {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      text: 'text-green-600',
      light: 'bg-green-50',
      border: 'border-green-200'
    },
    purple: {
      primary: 'bg-purple-600',
      primaryHover: 'hover:bg-purple-700',
      text: 'text-purple-600',
      light: 'bg-purple-50',
      border: 'border-purple-200'
    }
  };

  const currentTheme = themeColors[theme];

  // WebSocket connection
  useEffect(() => {
    if (isOpen && user && token) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, user, token]);

  const connectWebSocket = () => {
    try {
      setConnectionStatus('connecting');
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        // Send authentication and context
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          token,
          propertyId,
          sellerId,
          userId: user?.id
        }));
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (isOpen) {
            connectWebSocket();
          }
        }, 3000);
      };

      wsRef.current.onerror = () => {
        setConnectionStatus('disconnected');
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'message':
        addMessage({
          id: data.messageId || Date.now().toString(),
          message: data.message,
          sender: data.sender,
          timestamp: new Date(data.timestamp),
          type: data.messageType || 'text',
          data: data.data,
          status: 'sent'
        });
        break;
      case 'typing':
        setIsTyping(data.isTyping);
        break;
      case 'conversation_created':
        setConversationId(data.conversationId);
        break;
      case 'handoff':
        setIsBotMode(false);
        addMessage({
          id: Date.now().toString(),
          message: 'You are now connected to a human agent. How can we help you?',
          sender: 'human',
          timestamp: new Date(),
          type: 'system'
        });
        break;
    }
  };

  // Initialize bot conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeBotConversation();
    }
  }, [isOpen]);

  const initializeBotConversation = () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      message: `Hi! I'm here to help you with ${propertyTitle ? `"${propertyTitle}"` : 'this property'}. I can answer questions about the property, location, pricing, and connect you with the owner. How can I assist you today?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages([welcomeMessage]);

    // Add property card if available
    if (propertyId && propertyTitle) {
      const propertyCard: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: 'Here are the property details:',
        sender: 'bot',
        timestamp: new Date(),
        type: 'property',
        data: {
          id: propertyId,
          title: propertyTitle,
          price: propertyPrice,
          image: propertyImage,
          location: propertyLocation,
          seller: sellerName
        }
      };
      setMessages(prev => [...prev, propertyCard]);
    }

    // Add quick action buttons
    setTimeout(() => {
      addQuickActions();
    }, 1000);
  };

  const addQuickActions = () => {
    const quickActionsMessage: ChatMessage = {
      id: (Date.now() + 2).toString(),
      message: 'Quick actions:',
      sender: 'bot',
      timestamp: new Date(),
      type: 'system',
      data: {
        actions: [
          { text: 'Ask about price', action: 'price_inquiry' },
          { text: 'Schedule visit', action: 'schedule_visit' },
          { text: 'More details', action: 'more_details' },
          { text: 'Contact seller', action: 'contact_seller' }
        ]
      }
    };
    setMessages(prev => [...prev, quickActionsMessage]);
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    if (!isOpen || isMinimized) {
      setUnreadCount(prev => prev + 1);
    }
    scrollToBottom();
  };

  const updateMessageStatus = (id: string, status: 'sending' | 'sent' | 'read') => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    addMessage(userMessage);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Send via WebSocket if connected
    if (wsRef.current && connectionStatus === 'connected') {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          message: currentMessage,
          propertyId,
          sellerId,
          conversationId,
          isBotMode
        }));
        // Optimistically mark as sent once queued to WS
        updateMessageStatus(userMessage.id, 'sent');
      } catch (err) {
        console.error('WebSocket send failed, falling back to HTTP:', err);
      }
    }

    // If WS isn't connected or send failed, use HTTP fallback
    if (!wsRef.current || connectionStatus !== 'connected') {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            message: currentMessage,
            propertyId,
            sellerId,
            conversationId,
            isBotMode,
            userId: user?.id
          })
        });

        const data = await response.json();

        if (data.success) {
          // Mark user's message as sent
          updateMessageStatus(userMessage.id, 'sent');

          if (data.conversationId) {
            setConversationId(data.conversationId);
          }

          // Add bot/human response
          if (data.response) {
            addMessage({
              id: data.messageId || (Date.now() + 1).toString(),
              message: data.response,
              sender: isBotMode ? 'bot' : 'human',
              timestamp: new Date(),
              type: 'text'
            });
          }
        } else {
          // Ensure the UI doesn't spin forever
          updateMessageStatus(userMessage.id, 'sent');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        updateMessageStatus(userMessage.id, 'sent');
        addMessage({
          id: Date.now().toString(),
          message: 'Sorry, there was an error sending your message. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        });
      }
    }

    setIsLoading(false);
  };

  const handleQuickAction = (action: string) => {
    let message = '';
    
    switch (action) {
      case 'price_inquiry':
        message = 'Can you tell me more about the pricing and any additional costs?';
        break;
      case 'schedule_visit':
        message = 'I would like to schedule a visit to see this property. When is a good time?';
        break;
      case 'more_details':
        message = 'Can you provide more details about the property features and amenities?';
        break;
      case 'contact_seller':
        message = 'I would like to get in direct contact with the property owner.';
        break;
      default:
        return;
    }

    setInputMessage(message);
    setTimeout(() => sendMessage(), 100);
  };

  const switchToHuman = () => {
    if (!enableHumanHandoff) return;
    
    setIsBotMode(false);
    
    // Send handoff request
    if (wsRef.current && connectionStatus === 'connected') {
      wsRef.current.send(JSON.stringify({
        type: 'handoff_request',
        propertyId,
        sellerId,
        conversationId
      }));
    }

    addMessage({
      id: Date.now().toString(),
      message: 'Connecting you to a human agent. Please wait a moment...',
      sender: 'bot',
      timestamp: new Date(),
      type: 'system'
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user';
    const isBot = message.sender === 'bot';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isUser && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isBot ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {isBot ? (
                <Bot className="h-4 w-4 text-blue-600" />
              ) : (
                <User className="h-4 w-4 text-green-600" />
              )}
            </div>
          )}
          
          <div className={`rounded-lg px-4 py-2 shadow-sm ${
            isUser 
              ? `${currentTheme.primary} text-white` 
              : 'bg-white border'
          }`}>
            {message.type === 'property' && message.data ? (
              <div className="space-y-3">
                <p className="text-sm">{message.message}</p>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center space-x-3">
                    {message.data.image && (
                      <img 
                        src={message.data.image} 
                        alt={message.data.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{message.data.title}</h4>
                      {message.data.location && (
                        <p className="text-xs text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {message.data.location}
                        </p>
                      )}
                      {message.data.price && (
                        <p className="text-sm font-semibold text-red-600">
                          ₹{(message.data.price / 100000).toFixed(1)}L
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : message.type === 'system' && message.data?.actions ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">{message.message}</p>
                <div className="grid grid-cols-2 gap-2">
                  {message.data.actions.map((action: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className="text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm">{message.message}</p>
            )}
            
            <div className={`flex items-center justify-between mt-2 text-xs ${
              isUser ? 'text-red-100' : 'text-gray-500'
            }`}>
              <span>{formatTime(message.timestamp)}</span>
              {isUser && message.status && (
                <div className="flex items-center space-x-1">
                  {message.status === 'sending' && <Loader className="h-3 w-3 animate-spin" />}
                  {message.status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                  {message.status === 'read' && <CheckCircle2 className="h-3 w-3 text-blue-300" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'fixed': 'fixed bottom-4 right-4 z-50',
    'inline': 'relative'
  };

  if (!isOpen) {
    return (
      <div className={positionClasses[position]}>
        <button
          onClick={toggleChat}
          className={`relative ${currentTheme.primary} ${currentTheme.primaryHover} text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110`}
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 text-xs bg-yellow-500 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={positionClasses[position]}>
      <div className={`bg-white rounded-lg shadow-2xl border overflow-hidden transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-96 md:h-[500px]'
      } w-80 md:w-96`}>
        {/* Header */}
        <div className={`${currentTheme.primary} text-white p-4 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {isBotMode ? (
                <Bot className="h-4 w-4" />
              ) : (
                <Headphones className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {isBotMode ? 'AI Assistant' : `Chat with ${sellerName}`}
              </h3>
              <div className="flex items-center space-x-1 text-xs opacity-90">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span>
                  {connectionStatus === 'connected' ? 'Online' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {enableHumanHandoff && isBotMode && (
              <button
                onClick={switchToHuman}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                title="Talk to human agent"
              >
                <Headphones className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleChat}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 h-80 md:h-96"
            >
              {messages.map(renderMessage)}
              {isTyping && <TypingIndicator isVisible={true} />}
              <div ref={messagesEndRef} />
              
              {showScrollToBottom && (
                <button
                  onClick={scrollToBottom}
                  className={`fixed bottom-20 right-6 ${currentTheme.primary} text-white p-2 rounded-full shadow-lg`}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4 bg-white">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={isBotMode ? "Ask me anything about this property..." : "Type your message..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="pr-8"
                    disabled={isLoading}
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`${currentTheme.primary} ${currentTheme.primaryHover} text-white p-2`}
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isBotMode && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Powered by AI • {enableHumanHandoff && 'Switch to human chat anytime'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Builder.io compatible export
export const BuilderChatBot = {
  name: 'ChatBot',
  component: ChatBot,
  inputs: [
    {
      name: 'propertyId',
      type: 'string',
      helperText: 'ID of the property this chat is about'
    },
    {
      name: 'sellerId',
      type: 'string',
      helperText: 'ID of the property seller/owner'
    },
    {
      name: 'sellerName',
      type: 'string',
      defaultValue: 'Property Owner',
      helperText: 'Name of the seller to display'
    },
    {
      name: 'propertyTitle',
      type: 'string',
      helperText: 'Title of the property'
    },
    {
      name: 'propertyPrice',
      type: 'number',
      helperText: 'Property price'
    },
    {
      name: 'propertyImage',
      type: 'file',
      allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'],
      helperText: 'Property main image'
    },
    {
      name: 'propertyLocation',
      type: 'string',
      helperText: 'Property location/address'
    },
    {
      name: 'position',
      type: 'string',
      enum: ['bottom-right', 'bottom-left', 'fixed', 'inline'],
      defaultValue: 'bottom-right',
      helperText: 'Position of the chat widget'
    },
    {
      name: 'theme',
      type: 'string',
      enum: ['red', 'blue', 'green', 'purple'],
      defaultValue: 'red',
      helperText: 'Color theme for the chat widget'
    },
    {
      name: 'autoOpen',
      type: 'boolean',
      defaultValue: false,
      helperText: 'Auto-open chat when page loads'
    },
    {
      name: 'enableHumanHandoff',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Allow switching from bot to human chat'
    }
  ]
};

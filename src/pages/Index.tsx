
import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '@/hooks/useTheme';
import { Sidebar } from '@/components/Sidebar';
import { VideoCall } from '@/components/VideoCall';
import { Chat } from '@/components/Chat';
import { FriendsList } from '@/components/FriendsList';
import { Message, Friend, User } from '@/types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data
const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'user2',
    content: 'Hey everyone! How is everyone doing today?',
    timestamp: new Date(Date.now() - 300000),
    type: 'text',
  },
  {
    id: '2',
    senderId: 'user1',
    content: 'Hi there! Just getting started with video calling. This app looks amazing!',
    timestamp: new Date(Date.now() - 240000),
    type: 'text',
  },
  {
    id: '3',
    senderId: 'user3',
    content: 'Welcome to ChromaCall! Feel free to start a video chat anytime.',
    timestamp: new Date(Date.now() - 180000),
    type: 'text',
  },
];

const mockFriends: Friend[] = [
  {
    id: '1',
    user: {
      id: 'friend1',
      name: 'Alex Johnson',
      status: 'online',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    },
    status: 'accepted',
    addedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    user: {
      id: 'friend2',
      name: 'Sarah Chen',
      status: 'busy',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    },
    status: 'accepted',
    addedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    user: {
      id: 'friend3',
      name: 'Mike Rodriguez',
      status: 'offline',
      lastSeen: new Date('2024-01-20'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    },
    status: 'accepted',
    addedAt: new Date('2024-01-05'),
  },
];

const Index = () => {
  const location = useLocation();
  const initialView = location.state?.initialView || 'video';
  const [currentView, setCurrentView] = useState<'video' | 'chat' | 'friends'>(initialView);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const currentUserId = 'user1';
  const userCount = 127;
  const navigate = useNavigate();

  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [currentView, isMobile]);

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUserId,
      content,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages(prev => [...prev, newMessage]);
  }, [currentUserId]);

  const handleStartPrivateChat = useCallback((friendId: string) => {
    console.log('Starting private chat with:', friendId);
    // TODO: Implement private chat functionality
  }, []);

  const handleRemoveFriend = useCallback((friendId: string) => {
    setFriends(prev => prev.filter(friend => friend.id !== friendId));
  }, []);

  const handleBlockFriend = useCallback((friendId: string) => {
    setFriends(prev => prev.filter(friend => friend.id !== friendId));
    console.log('Blocked friend:', friendId);
  }, []);

  const handleViewChange = useCallback((view: 'video' | 'chat' | 'friends') => {
    setCurrentView(view);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'video':
        return <VideoCall />;
      case 'chat':
        return (
          <Chat
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={currentUserId}
          />
        );
      case 'friends':
        return (
          <FriendsList
            friends={friends}
            onStartPrivateChat={handleStartPrivateChat}
            onRemoveFriend={handleRemoveFriend}
            onBlockFriend={handleBlockFriend}
          />
        );
      default:
        return <VideoCall />;
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="chromacall-theme">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col md:flex-row">
        {/* Mobile header with menu button */}
        <div className="md:hidden flex items-center p-4 border-b">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className="mr-2"
          >
            <Menu />
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-chat-primary to-chat-secondary bg-clip-text text-transparent flex-1">
            ChromaCall
          </h1>
        </div>
        
        {/* Sidebar - responsive */}
        <div className={`
          ${isMobile ? 'mobile-sidebar' : ''} 
          ${isMobile && sidebarOpen ? 'open' : ''}
          ${isMobile && !sidebarOpen ? 'closed' : ''}
          ${isMobile ? 'w-64' : ''}
        `}>
          <Sidebar
            currentView={currentView}
            onViewChange={handleViewChange}
            userCount={userCount}
          />
        </div>
        
        {/* Overlay to close sidebar on mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {renderMainContent()}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;

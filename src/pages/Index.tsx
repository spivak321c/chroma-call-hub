
import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '@/hooks/useTheme';
import { Sidebar } from '@/components/Sidebar';
import { VideoCall } from '@/components/VideoCall';
import { Chat } from '@/components/Chat';
import { FriendsList } from '@/components/FriendsList';
import { Message, Friend, User } from '@/types';

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
  const [currentView, setCurrentView] = useState<'video' | 'chat' | 'friends'>('video');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const currentUserId = 'user1';
  const userCount = 127;

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          userCount={userCount}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {renderMainContent()}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;

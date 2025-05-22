
import React from 'react';
import { Video, MessageSquare, Users, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  currentView: 'video' | 'chat' | 'friends' | 'settings';
  onViewChange: (view: 'video' | 'chat' | 'friends') => void;
  userCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  userCount 
}) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'video' as const,
      label: 'Video Chat',
      icon: Video,
      description: 'Start a video call',
    },
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: MessageSquare,
      description: 'Public chat room',
    },
    {
      id: 'friends' as const,
      label: 'Friends',
      icon: Users,
      description: 'Manage friends list',
    },
  ];

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <Card className="h-full flex flex-col bg-sidebar border-sidebar-border md:w-80 w-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-2 md:mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-chat-primary to-chat-secondary flex items-center justify-center">
            <Video className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-chat-primary to-chat-secondary bg-clip-text text-transparent">
              ChromaCall
            </h1>
            <p className="text-xs md:text-sm text-sidebar-foreground/70">
              {userCount} online
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 md:p-4 overflow-auto">
        <nav className="space-y-1 md:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-10 md:h-12 ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm md:text-base">{item.label}</span>
                  <span className="text-xs opacity-70 hidden md:inline">{item.description}</span>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-3 md:p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
          <Avatar className="w-8 h-8 md:w-10 md:h-10">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sidebar-foreground text-sm md:text-base">Anonymous User</p>
            <p className="text-xs md:text-sm text-sidebar-foreground/70">Online</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="icon" 
            className={`bg-sidebar-accent/50 ${currentView === 'settings' ? 'ring-2 ring-primary' : ''}`}
            onClick={handleSettingsClick}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-sidebar-accent/50">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

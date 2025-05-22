
import React, { useState } from 'react';
import { UserPlus, MessageCircle, MoreVertical, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Friend, User } from '@/types';

interface FriendsListProps {
  friends: Friend[];
  onStartPrivateChat: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onBlockFriend: (friendId: string) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  onStartPrivateChat,
  onRemoveFriend,
  onBlockFriend,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFriends = friends.filter(friend =>
    friend.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(f => f.user.status === 'online');
  const offlineFriends = filteredFriends.filter(f => f.user.status !== 'online');

  const StatusIndicator: React.FC<{ status: User['status'] }> = ({ status }) => (
    <div className={`status-indicator status-${status}`} />
  );

  const FriendItem: React.FC<{ friend: Friend }> = ({ friend }) => (
    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="relative">
        <Avatar className="w-8 h-8 md:w-10 md:h-10">
          <AvatarImage src={friend.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.user.id}`} />
          <AvatarFallback>
            {friend.user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1">
          <StatusIndicator status={friend.user.status} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm md:text-base">{friend.user.name}</p>
        <p className="text-xs md:text-sm text-muted-foreground capitalize">
          {friend.user.status}
          {friend.user.status === 'offline' && friend.user.lastSeen && (
            <span className="hidden md:inline ml-1">
              • Last seen {new Date(friend.user.lastSeen).toLocaleDateString()}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 md:w-8 md:h-8"
          onClick={() => onStartPrivateChat(friend.id)}
        >
          <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 md:w-8 md:h-8">
              <MoreVertical className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-sm">
            <DropdownMenuItem onClick={() => onRemoveFriend(friend.id)}>
              Remove Friend
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onBlockFriend(friend.id)}
              className="text-destructive"
            >
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="font-semibold text-base md:text-lg">Friends</h3>
          <Button variant="outline" size="icon" className="w-8 h-8 md:w-10 md:h-10">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
        
        <Input
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Friends List */}
      <ScrollArea className="flex-1 p-2 md:p-4">
        <div className="space-y-4 md:space-y-6">
          {/* Online Friends */}
          {onlineFriends.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                <h4 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Online — {onlineFriends.length}
                </h4>
              </div>
              <div className="space-y-1">
                {onlineFriends.map((friend) => (
                  <FriendItem key={friend.id} friend={friend} />
                ))}
              </div>
            </div>
          )}

          {/* Offline Friends */}
          {offlineFriends.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Circle className="w-2 h-2 fill-gray-400 text-gray-400" />
                <h4 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Offline — {offlineFriends.length}
                </h4>
              </div>
              <div className="space-y-1">
                {offlineFriends.map((friend) => (
                  <FriendItem key={friend.id} friend={friend} />
                ))}
              </div>
            </div>
          )}

          {/* No Friends */}
          {filteredFriends.length === 0 && (
            <div className="text-center py-6 md:py-8">
              <UserPlus className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
              <p className="text-sm md:text-base text-muted-foreground">
                {searchTerm ? 'No friends found' : 'No friends yet'}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Try a different search term' : 'Add some friends to get started!'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

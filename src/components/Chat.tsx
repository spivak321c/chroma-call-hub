
import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from '@/types';
import chatService from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
}

export const Chat: React.FC<ChatProps> = ({ messages: initialMessages, onSendMessage, currentUserId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Connect to the chat service and listen for new messages
  useEffect(() => {
    const messageUnsubscribe = chatService.addMessageListener((message) => {
      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some(m => m.id === message.id);
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
      
      // Show notification for new messages from others
      if (message.senderId !== currentUserId) {
        toast({
          title: `New message`,
          description: message.content.length > 50 
            ? `${message.content.substring(0, 50)}...` 
            : message.content,
        });
      }
    });
    
    const statusUnsubscribe = chatService.addStatusListener((status) => {
      setConnectionStatus(status);
      
      if (status === 'connected') {
        console.log('Chat service connected');
      } else if (status === 'disconnected') {
        toast({
          title: 'Chat disconnected',
          description: 'Trying to reconnect...',
          variant: 'destructive',
        });
      }
    });
    
    return () => {
      messageUnsubscribe();
      statusUnsubscribe();
    };
  }, [currentUserId, toast]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // First update the UI optimistically
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUserId,
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text',
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage('');
      
      // Then send to the service
      const success = chatService.sendMessage({
        senderId: currentUserId,
        content: newMessage.trim(),
      });
      
      if (!success) {
        toast({
          title: 'Failed to send message',
          description: 'Please check your connection and try again',
          variant: 'destructive',
        });
      }
      
      // Also call the parent handler for integration with existing code
      onSendMessage(newMessage.trim());
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-3 md:p-4 border-b">
        <h3 className="font-semibold text-base md:text-lg">Chat</h3>
        <div className="flex justify-between items-center">
          <p className="text-xs md:text-sm text-muted-foreground">
            {messages.length} messages
          </p>
          <div className={`h-2 w-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} title={`Status: ${connectionStatus}`}></div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 md:p-4">
        <div className="space-y-3 md:space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-2 md:gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="w-6 h-6 md:w-8 md:h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} />
                  <AvatarFallback>
                    {message.senderId.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`chat-message ${isOwn ? 'own' : 'other'}`}
                  >
                    <p className="text-xs md:text-sm">{message.content}</p>
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={connectionStatus !== 'connected'}
          />
          <Button type="button" variant="outline" size="icon" className="hidden md:flex">
            <Smile className="w-4 h-4" />
          </Button>
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || connectionStatus !== 'connected'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};


import { Message } from '../types';

type MessageCallback = (message: Message) => void;
type StatusCallback = (status: string) => void;

class ChatService {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
    this.socket = new WebSocket(`${wsProtocol}://${location.host}/ws`);

    this.socket.onopen = () => {
      console.log('ChatService: WebSocket connected');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    };

    this.socket.onclose = () => {
      console.warn('ChatService: WebSocket disconnected');
      this.updateStatus('disconnected');
      this.socket = null;
      this.isConnecting = false;

      // Try to reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`ChatService: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      } else {
        console.error('ChatService: Max reconnect attempts reached');
        this.updateStatus('disconnected - max retries reached');
      }
    };

    this.socket.onerror = (err) => {
      console.error('ChatService: WebSocket error', err);
      this.updateStatus('error');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message' && data.message) {
          this.notifyMessageCallbacks(data.message);
        }
      } catch (e) {
        console.error('ChatService: Failed to parse message', e);
      }
    };
  }

  private updateStatus(status: string) {
    this.statusCallbacks.forEach(callback => callback(status));
  }

  private notifyMessageCallbacks(message: Message) {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  public sendMessage(message: Partial<Message>) {
    if (!message.content || !message.senderId) {
      console.error('ChatService: Invalid message', message);
      return false;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('ChatService: Socket not connected, trying to reconnect');
      this.connect();
      return false;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'chat_message',
        content: message.content,
        senderId: message.senderId,
        recipientId: message.recipientId,
        timestamp: new Date().toISOString(),
        isPrivate: Boolean(message.recipientId)
      }));
      return true;
    } catch (e) {
      console.error('ChatService: Failed to send message', e);
      return false;
    }
  }

  public addMessageListener(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  public addStatusListener(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new ChatService();


export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
  isPrivate?: boolean;
}

export interface Friend {
  id: string;
  user: User;
  status: 'pending' | 'accepted' | 'blocked';
  addedAt: Date;
}

export interface CallState {
  isInCall: boolean;
  callId: string | null;
  isIncoming: boolean;
  remotePeer?: string;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
}

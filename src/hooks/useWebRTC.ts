import { useState, useRef, useCallback } from 'react';
import { CallState, WebRTCConfig } from '../types';

const servers: WebRTCConfig = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "e6166b934e60840d935743c7",
      credential: "uNdKAwfH/TDOs6EP",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "e6166b934e60840d935743c7",
      credential: "uNdKAwfH/TDOs6EP",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "e6166b934e60840d935743c7",
      credential: "uNdKAwfH/TDOs6EP",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "e6166b934e60840d935743c7",
      credential: "uNdKAwfH/TDOs6EP",
    },
  ],
  iceCandidatePoolSize: 10,
};

export const useWebRTC = () => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    callId: null,
    isIncoming: false,
    remotePeer: "anonymous-user", // Default value for anonymity
  });
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const updateStatus = useCallback((message: string) => {
    console.log(`Status: ${message}`);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    pcRef.current = new RTCPeerConnection(servers);
    remoteStreamRef.current = new MediaStream();

    pcRef.current.ontrack = (event) => {
      console.log("Received track:", event.track);
      event.streams[0].getTracks().forEach(track => {
        remoteStreamRef.current?.addTrack(track);
      });
      setCallState(prev => ({ ...prev, remoteStream: remoteStreamRef.current || undefined }));
    };

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN && callState.callId) {
        socketRef.current.send(JSON.stringify({
          type: "ice-candidate",
          callId: callState.callId,
          data: JSON.stringify(event.candidate),
        }));
      }
    };

    pcRef.current.oniceconnectionstatechange = () => {
      if (pcRef.current) {
        setConnectionStatus(pcRef.current.iceConnectionState);
        if (pcRef.current.iceConnectionState === 'failed') {
          endCall();
        }
      }
    };

    return pcRef.current;
  }, [callState.callId]);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      localStreamRef.current = stream;
      setCallState(prev => ({ 
        ...prev, 
        localStream: stream,
        isInCall: true, // Set to true when we start a call
        callId: `call_${Math.random().toString(36).substring(2, 9)}` // Generate a random call ID
      }));
      
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      return stream;
    } catch (error) {
      console.error("Error accessing media:", error);
      throw error;
    }
  }, [createPeerConnection]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  }, [isAudioMuted]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [isVideoOff]);

  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    setCallState({
      isInCall: false,
      callId: null,
      isIncoming: false,
      localStream: undefined,
      remoteStream: undefined,
      remotePeer: undefined,
    });
    
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setConnectionStatus('disconnected');
  }, []);

  return {
    callState,
    setCallState,
    isAudioMuted,
    isVideoOff,
    connectionStatus,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    endCall,
    createPeerConnection,
    updateStatus,
  };
};

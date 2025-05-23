import { CallState, WebRTCConfig } from '../types';

// WebRTC configuration
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

class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: WebSocket | null = null;
  private currentCallId: string | null = null;
  private isCaller: boolean = false;
  private pendingCandidates: RTCIceCandidate[] = [];
  private statusUpdateCallback: (msg: string) => void = () => {};
  private connectionStateCallback: (state: string) => void = () => {};
  private userCountCallback: (count: number) => void = () => {};
  private remoteStreamCallback: (stream: MediaStream) => void = () => {};
  private callStateCallback: (state: Partial<CallState>) => void = () => {};
  private incomingCallCallback: (callId: string, from: string) => void = () => {};
  
  constructor() {
    this.connectSocket();
  }

  public setCallbacks(callbacks: {
    onStatusUpdate?: (msg: string) => void;
    onConnectionState?: (state: string) => void;
    onUserCount?: (count: number) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onCallState?: (state: Partial<CallState>) => void;
    onIncomingCall?: (callId: string, from: string) => void;
  }) {
    if (callbacks.onStatusUpdate) this.statusUpdateCallback = callbacks.onStatusUpdate;
    if (callbacks.onConnectionState) this.connectionStateCallback = callbacks.onConnectionState;
    if (callbacks.onUserCount) this.userCountCallback = callbacks.onUserCount;
    if (callbacks.onRemoteStream) this.remoteStreamCallback = callbacks.onRemoteStream;
    if (callbacks.onCallState) this.callStateCallback = callbacks.onCallState;
    if (callbacks.onIncomingCall) this.incomingCallCallback = callbacks.onIncomingCall;
  }

  private updateStatus(message: string) {
    console.log(`Status: ${message}`);
    this.statusUpdateCallback(message);
  }

  private updateConnectionStatus(state: string) {
    console.log(`Connection state: ${state}`);
    this.connectionStateCallback(state);
  }

  private createPeerConnection() {
    if (this.pc && this.pc.signalingState !== 'closed') {
      console.log("Reusing existing peer connection");
      return this.pc;
    }

    this.pc = new RTCPeerConnection(servers);
    this.remoteStream = new MediaStream();
    
    // Notify the UI that we have a remote stream
    this.remoteStreamCallback(this.remoteStream);
    
    this.pc.ontrack = (event) => {
      console.log("Received track:", event.track);
      event.streams[0].getTracks().forEach(track => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
      
      // Update call state
      this.callStateCallback({
        remoteStream: this.remoteStream
      });
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.socket?.readyState === WebSocket.OPEN && this.currentCallId) {
        console.log("Sending ICE candidate:", event.candidate);
        this.socket.send(JSON.stringify({
          type: "ice-candidate",
          callId: this.currentCallId,
          data: JSON.stringify(event.candidate),
        }));
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      if (this.pc) {
        this.updateConnectionStatus(this.pc.iceConnectionState);
        if (this.pc.iceConnectionState === 'failed') {
          this.updateStatus("Connection failed");
          this.resetCallState();
        }
      }
    };

    return this.pc;
  }

  public async startLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      this.pc = this.createPeerConnection();
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });
      
      // Generate a random call ID
      this.currentCallId = `call_${Math.random().toString(36).substring(2, 9)}`;
      
      // Update call state
      this.callStateCallback({
        localStream: this.localStream,
        isInCall: true,
        callId: this.currentCallId
      });
      
      this.updateStatus("Webcam started");
      return this.localStream;
      
    } catch (e) {
      console.error("Media error:", e);
      this.updateStatus(`Error: Failed to access media: ${e}`);
      throw e;
    }
  }

  public toggleAudio() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        track.enabled = !track.enabled;
        this.updateStatus(track.enabled ? "Audio unmuted" : "Audio muted");
        return !track.enabled; // Return the muted state
      }
    }
    return false;
  }

  public toggleVideo() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        track.enabled = !track.enabled;
        this.updateStatus(track.enabled ? "Video on" : "Video off");
        return !track.enabled; // Return the video off state
      }
    }
    return false;
  }

  private connectSocket(onOpenCallback = () => {}) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      onOpenCallback();
      return;
    }

    const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
    this.socket = new WebSocket(`${wsProtocol}://${location.host}/ws`);

    this.socket.onopen = () => {
      console.log("WebSocket connected");
      this.updateStatus("Connected to signaling server");
      this.updateConnectionStatus("Connected");
      this.pc = this.createPeerConnection();
      onOpenCallback();
    };

    this.socket.onclose = () => {
      console.warn("WebSocket closed");
      this.updateStatus("Disconnected from server");
      this.updateConnectionStatus("Disconnected");
      setTimeout(() => this.connectSocket(), 3000);
    };

    this.socket.onerror = err => {
      console.error("WebSocket error:", err);
      this.updateStatus("WebSocket error");
    };

    this.socket.onmessage = async event => {
      let msg;
      try {
        msg = JSON.parse(event.data);
        console.log("Received message:", msg);
      } catch (e) {
        console.error("Invalid message:", event.data, e);
        this.updateStatus("Error: Invalid message");
        return;
      }

      if (msg.type === "user_count") {
        this.userCountCallback(msg.count || 0);
        return;
      }

      if (msg.type === "incoming_call" && !this.isCaller) {
        this.currentCallId = msg.callId;
        this.incomingCallCallback(msg.callId, msg.from || "Unknown");
        return;
      }

      if (msg.type === "call_taken" && !this.isCaller) {
        this.updateStatus("Call taken by another user");
        this.resetCallState();
        return;
      }

      if (msg.callId && msg.callId !== this.currentCallId) {
        console.warn(`Ignoring message with callId ${msg.callId}, expected ${this.currentCallId}`);
        return;
      }

      try {
        if (msg.type === "offer" && !this.isCaller) {
          this.pc = this.createPeerConnection();
          await this.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.data)));
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
              type: "answer",
              callId: this.currentCallId,
              data: JSON.stringify(this.pc.localDescription),
            }));
          }
          
          this.updateStatus("Sent answer");
          
          for (const candidate of this.pendingCandidates) {
            await this.pc.addIceCandidate(candidate);
          }
          this.pendingCandidates = [];
          
          this.callStateCallback({
            isInCall: true
          });

        } else if (msg.type === "answer" && this.isCaller) {
          if (this.pc) {
            await this.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.data)));
            
            for (const candidate of this.pendingCandidates) {
              await this.pc.addIceCandidate(candidate);
            }
            this.pendingCandidates = [];
            this.updateStatus("Received answer");
          }

        } else if (msg.type === "ice-candidate") {
          const candidate = new RTCIceCandidate(JSON.parse(msg.data));
          if (this.pc?.remoteDescription) {
            await this.pc.addIceCandidate(candidate);
            this.updateStatus("Added ICE candidate");
          } else {
            this.pendingCandidates.push(candidate);
            this.updateStatus("Stored ICE candidate");
          }

        } else if (msg.type === "call_joined") {
          this.updateStatus("Joined call");
          this.callStateCallback({
            isInCall: true
          });

        } else if (msg.type === "peer_disconnected" || msg.type === "hangup") {
          this.updateStatus("Peer disconnected");
          this.resetCallState();

        } else if (msg.type === "error") {
          this.updateStatus(`Error: ${msg.data}`);
          this.resetCallState();
        }
        
      } catch (e) {
        console.error("Message processing error:", e, msg);
        this.updateStatus(`Error processing ${msg.type}`);
      }
    };
  }

  public async startCall() {
    try {
      if (!this.localStream) {
        await this.startLocalStream();
      }
      
      this.isCaller = true;
      this.currentCallId = `call_${Math.random().toString(36).substring(2, 15)}`;
      this.pc = this.createPeerConnection();

      const sendOffer = async () => {
        try {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
              type: "incoming_call",
              callId: this.currentCallId,
              from: "Caller"
            }));
            
            const offer = await this.pc!.createOffer();
            await this.pc!.setLocalDescription(offer);
            
            this.socket.send(JSON.stringify({
              type: "offer",
              callId: this.currentCallId,
              data: JSON.stringify(this.pc!.localDescription),
            }));
          }
          
          this.updateStatus("Sent offer");
          
          // Update call state
          this.callStateCallback({
            isInCall: true, 
            callId: this.currentCallId,
            isIncoming: false
          });
          
        } catch (e) {
          console.error("Offer error:", e);
          this.updateStatus("Error sending offer");
          this.resetCallState();
        }
      };

      this.connectSocket(sendOffer);
      
    } catch (e) {
      console.error("Start call error:", e);
      this.updateStatus(`Error starting call: ${e}`);
      throw e;
    }
  }

  public acceptCall() {
    if (!this.currentCallId) return;
    
    const acceptCallInternal = async () => {
      try {
        if (!this.localStream) {
          await this.startLocalStream();
        }
        
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: "accept_call",
            callId: this.currentCallId,
          }));
        }
        
        this.updateStatus("Accepted call");
        
        // Update call state
        this.callStateCallback({
          isInCall: true, 
          callId: this.currentCallId,
          isIncoming: true
        });
        
      } catch (e) {
        console.error("Accept call error:", e);
        this.updateStatus(`Error accepting call: ${e}`);
      }
    };
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      acceptCallInternal();
    } else {
      this.connectSocket(acceptCallInternal);
    }
  }

  public rejectCall() {
    this.resetCallState();
    this.updateStatus("Rejected call");
  }

  public endCall() {
    if (this.socket?.readyState === WebSocket.OPEN && this.currentCallId) {
      this.socket.send(JSON.stringify({
        type: "hangup",
        callId: this.currentCallId,
      }));
    }
    this.resetCallState();
  }

  private resetCallState() {
    if (this.pc && this.pc.signalingState !== 'closed') {
      this.pc.close();
      this.pc = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    this.currentCallId = null;
    this.isCaller = false;
    this.pendingCandidates = [];
    
    this.updateStatus("Call ended");
    this.updateConnectionStatus("Disconnected");
    
    // Update call state
    this.callStateCallback({
      isInCall: false,
      callId: null,
      isIncoming: false,
      localStream: undefined,
      remoteStream: undefined,
      remotePeer: undefined,
    });
  }
}

export default new WebRTCService();

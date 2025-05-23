
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, UserPlus, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import webRTCService from '@/services/webRTCService';

export const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isIncomingCallModalOpen, setIsIncomingCallModalOpen] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState({ callId: '', from: '' });
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userCount, setUserCount] = useState(0);
  const { toast } = useToast();
  
  // Set up WebRTC callbacks
  useEffect(() => {
    webRTCService.setCallbacks({
      onStatusUpdate: (msg) => {
        console.log(`WebRTC status: ${msg}`);
      },
      onConnectionState: (state) => {
        setConnectionStatus(state);
      },
      onUserCount: (count) => {
        setUserCount(count);
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      onCallState: (state) => {
        if (state.isInCall !== undefined) setIsInCall(state.isInCall);
        
        if (state.localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = state.localStream;
        }
        
        if (state.remoteStream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = state.remoteStream;
        }
      },
      onIncomingCall: (callId, from) => {
        setIncomingCallInfo({ callId, from });
        setIsIncomingCallModalOpen(true);
      }
    });
    
    return () => {
      // Clean up video call if component unmounts
      webRTCService.endCall();
    };
  }, []);

  // Handle local stream setup
  useEffect(() => {
    if (isInCall && localVideoRef.current && !localVideoRef.current.srcObject) {
      webRTCService.startLocalStream()
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(error => {
          console.error('Failed to access camera:', error);
          toast({
            title: "Camera Access Failed",
            description: "Please check your camera permissions and try again.",
            variant: "destructive",
          });
        });
    }
  }, [isInCall, toast]);

  const handleStartCall = useCallback(async () => {
    try {
      setIsPairingModalOpen(true);
      await webRTCService.startCall();
      
      // Simulate random pairing delay
      setTimeout(() => {
        setIsPairingModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsPairingModalOpen(false);
      toast({
        title: "Call Failed",
        description: "Could not establish a connection. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  const handleAcceptCall = useCallback(() => {
    webRTCService.acceptCall();
    setIsIncomingCallModalOpen(false);
  }, []);
  
  const handleRejectCall = useCallback(() => {
    webRTCService.rejectCall();
    setIsIncomingCallModalOpen(false);
  }, []);

  const handleSkipUser = useCallback(() => {
    toast({
      title: "Skipping current user",
      description: "Looking for a new person to chat with...",
    });
    
    // End current call and start a new one
    webRTCService.endCall();
    handleStartCall();
  }, [handleStartCall, toast]);

  const handleAddFriend = useCallback(() => {
    if (!isInCall) {
      toast({
        title: "Cannot add friend",
        description: "No user is connected",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Friend request sent!",
      description: "They'll need to accept your request",
      variant: "default",
    });
    // In a real implementation, this would send a friend request to the backend
  }, [isInCall, toast]);

  const handleToggleAudio = useCallback(() => {
    const muted = webRTCService.toggleAudio();
    setIsAudioMuted(muted);
  }, []);

  const handleToggleVideo = useCallback(() => {
    const videoOff = webRTCService.toggleVideo();
    setIsVideoOff(videoOff);
  }, []);

  const handleEndCall = useCallback(() => {
    webRTCService.endCall();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Pairing Modal */}
      <Dialog open={isPairingModalOpen} onOpenChange={setIsPairingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finding a chat partner...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-center text-muted-foreground">
              We're pairing you with a random person. This may take a moment...
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Incoming Call Modal */}
      <Dialog open={isIncomingCallModalOpen} onOpenChange={setIsIncomingCallModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Incoming Call</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <p className="text-center">
              {incomingCallInfo.from} is calling you
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={handleRejectCall}
                variant="destructive"
              >
                Reject
              </Button>
              <Button 
                onClick={handleAcceptCall}
                variant="default"
              >
                Accept
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-3 md:p-4 overflow-hidden">
        {/* Remote Video */}
        <Card className="flex-1 video-container relative min-h-[200px] md:min-h-[400px]">
          {isInCall ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-element"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <div className="text-center">
                <Monitor className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 text-muted-foreground" />
                <p className="text-sm md:text-base text-muted-foreground">Waiting for peer to connect...</p>
                {userCount > 0 && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    {userCount} {userCount === 1 ? 'user' : 'users'} online
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          <div className="absolute top-2 md:top-4 left-2 md:left-4">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
          </div>
          
          {/* Local Video (shows on top of remote video on mobile) */}
          <div className="md:hidden absolute bottom-3 right-3 w-1/3 aspect-video rounded-lg overflow-hidden border-2 border-background shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-element"
            />
          </div>
        </Card>

        {/* Local Video (desktop only) */}
        <Card className="hidden md:block w-80 video-container relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-element"
          />
          
          {/* Video Status Indicators */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {isAudioMuted && (
              <Badge variant="destructive" className="animate-pulse">
                <MicOff className="w-3 h-3" />
              </Badge>
            )}
            {isVideoOff && (
              <Badge variant="destructive" className="animate-pulse">
                <VideoOff className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="p-3 md:p-6 bg-card border-t">
        <div className="flex justify-center gap-2 md:gap-4">
          {!isInCall ? (
            <Button
              onClick={handleStartCall}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-8"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base">Start Call</span>
            </Button>
          ) : (
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {/* Audio Toggle */}
              <Button
                onClick={handleToggleAudio}
                variant={isAudioMuted ? "destructive" : "outline"}
                size="sm"
                className="md:w-14 md:h-14 w-10 h-10 rounded-full"
              >
                {isAudioMuted ? (
                  <MicOff className="w-4 h-4 md:w-6 md:h-6" />
                ) : (
                  <Mic className="w-4 h-4 md:w-6 md:h-6" />
                )}
              </Button>

              {/* Video Toggle */}
              <Button
                onClick={handleToggleVideo}
                variant={isVideoOff ? "destructive" : "outline"}
                size="sm"
                className="md:w-14 md:h-14 w-10 h-10 rounded-full"
              >
                {isVideoOff ? (
                  <VideoOff className="w-4 h-4 md:w-6 md:h-6" />
                ) : (
                  <Video className="w-4 h-4 md:w-6 md:h-6" />
                )}
              </Button>

              {/* Skip User */}
              <Button
                onClick={handleSkipUser}
                variant="secondary"
                size="sm"
                className="md:w-14 md:h-14 w-10 h-10 rounded-full"
              >
                <SkipForward className="w-4 h-4 md:w-6 md:h-6" />
              </Button>

              {/* Add Friend */}
              <Button
                onClick={handleAddFriend}
                variant="outline"
                size="sm"
                className="md:w-14 md:h-14 w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
              >
                <UserPlus className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
              </Button>

              {/* End Call */}
              <Button
                onClick={handleEndCall}
                variant="destructive"
                size="sm"
                className="md:w-14 md:h-14 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="w-4 h-4 md:w-6 md:h-6" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

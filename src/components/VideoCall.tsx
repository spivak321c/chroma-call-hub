
import React, { useRef, useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, UserPlus, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    callState,
    isAudioMuted,
    isVideoOff,
    connectionStatus,
    startLocalStream,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC();

  useEffect(() => {
    if (callState.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (callState.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  const handleStartCall = async () => {
    try {
      setIsPairingModalOpen(true);
      await startLocalStream();
      // Simulate random pairing delay
      setTimeout(() => {
        setIsPairingModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsPairingModalOpen(false);
    }
  };

  const handleSkipUser = () => {
    toast({
      title: "Skipping current user",
      description: "Looking for a new person to chat with...",
    });
    // Here we would implement the logic to skip the current user
    // For now, we'll just end the current call and start a new one
    endCall();
    handleStartCall();
  };

  const handleAddFriend = () => {
    if (!callState.remotePeer) {
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
    // In a real implementation, we would send a friend request to the backend
  };

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

      {/* Video Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-3 md:p-4 overflow-hidden">
        {/* Remote Video */}
        <Card className="flex-1 video-container relative min-h-[200px] md:min-h-[400px]">
          {callState.remoteStream ? (
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
            {callState.localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="video-element"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Video className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </Card>

        {/* Local Video (desktop only) */}
        <Card className="hidden md:block w-80 video-container relative">
          {callState.localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-element"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Your camera</p>
              </div>
            </div>
          )}
          
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
          {!callState.isInCall ? (
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
                onClick={toggleAudio}
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
                onClick={toggleVideo}
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
                onClick={endCall}
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

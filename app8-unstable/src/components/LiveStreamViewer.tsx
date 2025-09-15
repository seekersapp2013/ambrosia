import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Room, RemoteParticipant, LocalParticipant, Track } from "livekit-client";
import { GatedContentPaywall } from "./GatedContentPaywall";

interface LiveStreamViewerProps {
  streamId: Id<"liveStreams">;
  role: 'broadcaster' | 'viewer';
  roomName?: string;
  onLeave?: () => void;
  onNavigate?: (screen: string, data?: any) => void;
}

export function LiveStreamViewer({ 
  streamId, 
  role, 
  roomName, 
  onLeave, 
  onNavigate 
}: LiveStreamViewerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'ended' | 'error'>('connecting');
  const [hasAudio, setHasAudio] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stream = useQuery(api.liveStreams.getLiveStream, { streamId });
  const hasAccess = useQuery(api.payments.hasAccess, {
    contentType: "liveStream",
    contentId: streamId,
  });
  const generateToken = useMutation(api.liveStreams.generateLiveKitToken);
  const startStream = useMutation(api.liveStreams.startLiveStream);
  const endStream = useMutation(api.liveStreams.endLiveStream);
  const joinStream = useMutation(api.liveStreams.joinLiveStream);
  const leaveStream = useMutation(api.liveStreams.leaveLiveStream);

  useEffect(() => {
    if (stream && (role === 'broadcaster' || hasAccess)) {
      connectToRoom();
    }

    return () => {
      disconnectFromRoom();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [stream, hasAccess]);

  useEffect(() => {
    // Start duration timer when stream is live
    if (streamStatus === 'live' && stream?.startedAt) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(Date.now() - stream.startedAt!);
      }, 1000);
    } else if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [streamStatus, stream?.startedAt]);

  const connectToRoom = async () => {
    if (!stream || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Generate LiveKit token
      const tokenResult = await generateToken({
        streamId,
        role,
      });

      // Connect to LiveKit room
      const room = new Room();
      roomRef.current = room;

      // Set up event listeners
      room.on('connected', () => {
        console.log('Connected to room');
        setIsConnected(true);
        setStreamStatus('live');
        
        if (role === 'broadcaster') {
          startBroadcast();
        } else {
          joinAsViewer();
        }
      });

      room.on('disconnected', () => {
        console.log('Disconnected from room');
        setIsConnected(false);
        if (!isLeaving) {
          setStreamStatus('connecting');
          reconnect();
        } else {
          setStreamStatus('ended');
        }
      });

      room.on('participantConnected', (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);
        setViewerCount(prev => prev + 1);
        
        // Subscribe to participant's tracks
        participant.on('trackSubscribed', (track: Track) => {
          if (track.kind === 'video' && videoRef.current) {
            track.attach(videoRef.current);
          }
        });
      });

      room.on('participantDisconnected', () => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });

      // Connect to room
      const wsUrl = process.env.REACT_APP_LIVEKIT_WS_URL || 'wss://your-livekit-server.com';
      await room.connect(wsUrl, tokenResult.token);

    } catch (error) {
      console.error('Failed to connect to room:', error);
      setConnectionError('Failed to connect to live stream. Please try again.');
      setStreamStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const reconnect = () => {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
      setTimeout(() => {
        setRetryCount(retryCount + 1);
        connectToRoom();
      }, delay);
    } else {
      console.error('Failed to reconnect after multiple attempts.');
      setConnectionError('Connection lost. Please check your internet connection and try again.');
      setStreamStatus('error');
    }
  };

  const startBroadcast = async () => {
    try {
      // Start the live stream in database
      await startStream({
        streamId,
        livekitHost: process.env.LIVEKIT_URL!,
        livekitApiKey: process.env.LIVEKIT_API_KEY!,
        livekitApiSecret: process.env.LIVEKIT_API_SECRET!,
      });
      
      // Enable camera and microphone for broadcaster
      if (roomRef.current) {
        await roomRef.current.localParticipant.enableCameraAndMicrophone();
        
        // Attach local video to preview
        const videoTrack = roomRef.current.localParticipant.videoTracks.values().next().value?.track;
        if (videoTrack && videoRef.current) {
          videoTrack.attach(videoRef.current);
        }
      }
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      setConnectionError('Failed to start broadcast. Please try again.');
    }
  };

  const joinAsViewer = async () => {
    try {
      await joinStream({ streamId });
    } catch (error) {
      console.error('Failed to join as viewer:', error);
    }
  };

  const disconnectFromRoom = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    if (role === 'viewer') {
      try {
        await leaveStream({ streamId });
      } catch (error) {
        console.error('Failed to leave stream:', error);
      }
    }
  };

  const handleEndStream = async () => {
    if (role !== 'broadcaster') return;

    const confirmEnd = window.confirm('Are you sure you want to end this live stream?');
    if (!confirmEnd) return;

    setIsLeaving(true);
    const saveAsReel = window.confirm('Do you want to save this live stream as a reel?');

    try {
      await endStream({
        streamId,
        saveAsReel,
        livekitHost: process.env.LIVEKIT_URL!,
        livekitApiKey: process.env.LIVEKIT_API_KEY!,
        livekitApiSecret: process.env.LIVEKIT_API_SECRET!,
      });
      await disconnectFromRoom();
      onLeave?.();
    } catch (error) {
      console.error('Failed to end stream:', error);
      alert('Failed to end stream. Please try again.');
    }
  };

  const toggleAudio = () => {
    if (roomRef.current && role === 'broadcaster') {
      const audioTrack = roomRef.current.localParticipant.audioTracks.values().next().value?.track;
      if (audioTrack) {
        audioTrack.mute();
        setHasAudio(!audioTrack.isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (roomRef.current && role === 'broadcaster') {
      const videoTrack = roomRef.current.localParticipant.videoTracks.values().next().value?.track;
      if (videoTrack) {
        videoTrack.mute();
        setHasVideo(!videoTrack.isMuted);
      }
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!stream) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (stream.isGated && !hasAccess && role === 'viewer') {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-sm mx-4">
          <GatedContentPaywall
            contentType="liveStream"
            contentId={streamId}
            title={stream.title}
            price={stream.priceAmount || 0}
            token={stream.priceToken || "USD"}
            sellerAddress={stream.sellerAddress}
            onUnlock={() => {
              // Content will automatically become accessible after payment
            }}
            onFundWallet={() => onNavigate?.('fund-wallet')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative">
      {/* Video Container */}
      <div className="absolute inset-0">
        {streamStatus === 'connecting' || isConnecting ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{role === 'broadcaster' ? 'Starting your stream...' : 'Connecting to stream...'}</p>
            </div>
          </div>
        ) : streamStatus === 'error' || connectionError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center px-4">
              <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Connection Error</h3>
              <p className="mb-4">{connectionError || 'Failed to connect to stream'}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : streamStatus === 'ended' ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center px-4">
              <i className="fas fa-video-slash text-4xl mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Stream Ended</h3>
              <p className="mb-4">This live stream has ended.</p>
              <button
                onClick={onLeave}
                className="bg-white text-black px-6 py-3 rounded-lg font-medium"
              >
                Back to Reels
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setIsLeaving(true);
              onLeave?.();
            }}
            className="text-white p-2"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          
          <div className="flex items-center space-x-4">
            {streamStatus === 'live' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
                
                <div className="flex items-center space-x-1 text-white text-sm">
                  <i className="fas fa-eye"></i>
                  <span>{viewerCount}</span>
                </div>
                
                <div className="text-white text-sm">
                  {formatDuration(duration)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stream Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/75 to-transparent p-4">
        <div className="text-white">
          <div className="flex items-center mb-2">
            <span className="font-medium mr-2">@{stream.author.username}</span>
          </div>
          
          <h2 className="text-lg font-bold mb-1">{stream.title}</h2>
          
          {stream.description && (
            <p className="text-sm opacity-90 mb-2">{stream.description}</p>
          )}

          {stream.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stream.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs opacity-75"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Broadcaster Controls */}
      {role === 'broadcaster' && streamStatus === 'live' && (
        <div className="absolute bottom-20 right-4 z-20 flex flex-col space-y-3">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              hasVideo 
                ? 'bg-black bg-opacity-50 text-white' 
                : 'bg-red-500 text-white'
            }`}
            title={hasVideo ? "Turn off camera" : "Turn on camera"}
          >
            <i className={`fas ${hasVideo ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>
          
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              hasAudio 
                ? 'bg-black bg-opacity-50 text-white' 
                : 'bg-red-500 text-white'
            }`}
            title={hasAudio ? "Mute microphone" : "Unmute microphone"}
          >
            <i className={`fas ${hasAudio ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>
          
          <button
            onClick={handleEndStream}
            className="p-3 rounded-full bg-red-500 text-white"
            title="End stream"
          >
            <i className="fas fa-stop"></i>
          </button>
        </div>
      )}
    </div>
  );
}
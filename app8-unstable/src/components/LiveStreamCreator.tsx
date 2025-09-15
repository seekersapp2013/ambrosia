import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PaymentConfig } from './UnifiedPayment';

interface LiveStreamCreatorProps {
  onStreamCreated?: (streamId: string) => void;
  onCancel?: () => void;
  onNavigate?: (screen: string, data?: any) => void;
}

export function LiveStreamCreator({ onStreamCreated, onCancel, onNavigate }: LiveStreamCreatorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isGated, setIsGated] = useState(false);
  const [priceAmount, setPriceAmount] = useState(1);
  const [isSensitive, setIsSensitive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const createLiveStream = useMutation(api.liveStreams.createLiveStream);
  const myProfile = useQuery(api.profiles.getMyProfile);

  useEffect(() => {
    // Request camera and microphone permissions on mount
    requestMediaPermissions();
    
    return () => {
      // Cleanup media stream on unmount
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraEnabled,
        audio: microphoneEnabled
      });
      
      setMediaStream(stream);
      setPermissionError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Media permission error:", error);
      setPermissionError("Camera and microphone access is required to start a live stream. Please allow access and try again.");
    }
  };

  const toggleCamera = async () => {
    const newCameraState = !cameraEnabled;
    setCameraEnabled(newCameraState);
    
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = newCameraState;
      }
    }
  };

  const toggleMicrophone = async () => {
    const newMicState = !microphoneEnabled;
    setMicrophoneEnabled(newMicState);
    
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = newMicState;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Please enter a stream title");
      return;
    }

    if (!mediaStream) {
      alert("Camera and microphone access is required");
      return;
    }

    setIsCreating(true);
    setSubmitError(null);
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const result = await createLiveStream({
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tagsArray,
        isGated,
        priceToken: isGated ? "USD" : undefined,
        priceAmount: isGated ? priceAmount : undefined,
        isSensitive,
      });

      // Navigate to live stream viewer as broadcaster
      onStreamCreated?.(result.streamId);
      onNavigate?.('live-stream-viewer', { 
        streamId: result.streamId, 
        role: 'broadcaster',
        roomName: result.roomName 
      });
    } catch (error: any) {
      console.error("Failed to create live stream:", error);
      setSubmitError(error.message || "Failed to create live stream. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onCancel} className="text-gray-600">
          <i className="fas fa-times text-xl"></i>
        </button>
        <h1 className="text-lg font-semibold">Go Live</h1>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !mediaStream || isCreating}
          className={`px-4 py-2 rounded-lg font-medium ${
            title.trim() && mediaStream && !isCreating
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isCreating ? 'Starting...' : 'Go Live'}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Camera Preview */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Camera Preview
          </label>
          
          {permissionError ? (
            <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center bg-red-50">
              <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
              <p className="text-red-600 mb-4">{permissionError}</p>
              <button
                type="button"
                onClick={requestMediaPermissions}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-h-64 rounded-lg bg-black"
              />
              
              {/* Camera Controls */}
              <div className="absolute bottom-2 left-2 flex space-x-2">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-2 rounded-full ${
                    cameraEnabled 
                      ? 'bg-black bg-opacity-50 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                  title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  <i className={`fas ${cameraEnabled ? 'fa-video' : 'fa-video-slash'} text-sm`}></i>
                </button>
                
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  className={`p-2 rounded-full ${
                    microphoneEnabled 
                      ? 'bg-black bg-opacity-50 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                  title={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  <i className={`fas ${microphoneEnabled ? 'fa-microphone' : 'fa-microphone-slash'} text-sm`}></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stream Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stream Title *
          </label>
          <input
            type="text"
            placeholder="What's your stream about?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2"
            maxLength={100}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            placeholder="Tell viewers what to expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-20 text-base placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            placeholder="Tags (comma separated)..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full text-sm text-gray-600 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: gaming, tutorial, music
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          {/* Sensitive Content */}
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSensitive}
              onChange={(e) => setIsSensitive(e.target.checked)}
              className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              Mark as sensitive content
            </span>
          </label>

          {/* Payment Section */}
          <PaymentConfig
            isGated={isGated}
            setIsGated={setIsGated}
            priceAmount={priceAmount}
            setPriceAmount={setPriceAmount}
            contentType="live stream"
          />
        </div>

        {/* Live Stream Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <i className="fas fa-broadcast-tower text-red-500 mt-1"></i>
            <div>
              <h3 className="font-medium text-red-800 mb-1">Going Live</h3>
              <p className="text-sm text-red-700">
                Your followers will be notified when you start streaming. Make sure you're ready before going live!
              </p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {submitError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
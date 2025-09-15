import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { ReelCard } from "./ReelCard";
import { LiveStreamCard } from "./LiveStreamCard";
import { Doc } from "../../convex/_generated/dataModel";

interface ReelsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export function ReelsScreen({ onNavigate }: ReelsScreenProps = {}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const reels = useQuery(api.reels.listReels, { limit: 20 });
  const liveStreams = useQuery(api.liveStreams.listActiveLiveStreams, { limit: 5 });
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  type FeedItem = (Doc<"reels"> & { type: 'reel' }) | (Doc<"liveStreams"> & { type: 'liveStream' });

  const feedItems: FeedItem[] = [
    ...(liveStreams?.map(s => ({ ...s, type: 'liveStream' as const })) || []),
    ...(reels?.map(r => ({ ...r, type: 'reel' as const })) || []),
  ];

  useEffect(() => {
    // No need to reload the page - just let the component handle authentication state
  }, [isAuthenticated]);

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mr-3"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show loading state while not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Please sign in to view reels</p>
      </div>
    );
  }

  const handleSwipeUp = () => {
    if (feedItems && currentItemIndex < feedItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handleSwipeDown = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      {feedItems === undefined ? (
        // Loading state
        <div className="flex items-center justify-center h-full bg-black">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mr-3"></div>
          <p className="text-white">Loading content...</p>
        </div>
      ) : feedItems.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center h-full bg-black text-white px-4">
          <i className="fas fa-video text-6xl mb-6 opacity-50"></i>
          <h3 className="text-xl font-bold mb-2">No content yet</h3>
          <p className="text-gray-300 text-center mb-6">
            Be the first to create a reel or go live!
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => onNavigate?.('write-reel')}
              className="bg-accent text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Reel
            </button>
            <button 
              onClick={() => onNavigate?.('live-stream-creator')}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Go Live
            </button>
          </div>
        </div>
      ) : (
        // Reels viewer with live streams
        <div className="h-full relative">
          <div 
            className="h-full"
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleTouchEnd = (endEvent: TouchEvent) => {
                const endY = endEvent.changedTouches[0].clientY;
                const diff = startY - endY;
                
                if (Math.abs(diff) > 50) { // Minimum swipe distance
                  if (diff > 0) {
                    handleSwipeUp();
                  } else {
                    handleSwipeDown();
                  }
                }
                
                document.removeEventListener('touchend', handleTouchEnd);
              };
              
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
          {feedItems.map((item, index) => (
            <div
              key={item._id}
              className={`absolute inset-0 transition-transform duration-300 ${
                index === currentItemIndex 
                  ? 'transform translate-y-0' 
                  : index < currentItemIndex 
                    ? 'transform -translate-y-full' 
                    : 'transform translate-y-full'
              }`}
            >
              {item.type === 'reel' ? (
                <ReelCard 
                  reel={item} 
                  isActive={index === currentItemIndex}
                  onNavigate={onNavigate}
                />
              ) : (
                <LiveStreamCard 
                  liveStream={item} 
                  onNavigate={onNavigate}
                />
              )}
            </div>
          ))}
          
          {/* Navigation indicators */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-20">
            {feedItems.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-8 rounded-full ${
                  index === currentItemIndex ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>

          {/* Create Content Buttons */}
          <div className="absolute bottom-20 right-4 flex flex-col space-y-3 z-20">
            {/* Go Live Button */}
            <button
              onClick={() => onNavigate?.('live-stream-creator')}
              className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
              title="Go Live"
            >
              <i className="fas fa-broadcast-tower text-xl"></i>
            </button>
            
            {/* Create Reel Button */}
            <button
              onClick={() => onNavigate?.('write-reel')}
              className="w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg"
              title="Create Reel"
            >
              <i className="fas fa-plus text-xl"></i>
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
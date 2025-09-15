import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { GatedContentPaywall } from "./GatedContentPaywall";

interface ReelCardProps {
  reel: {
    _id: Id<"reels">;
    video: string;
    poster?: string;
    caption?: string;
    tags: string[];
    isSensitive: boolean;
    isGated: boolean;
    priceToken?: string;
    priceAmount?: number;
    views: number;
    createdAt: number;
    author: {
      id?: Id<"users">;
      name?: string;
      username?: string;
      avatar?: string;
    };
  };
  isActive?: boolean;
  onNavigate?: (screen: string, data?: any) => void;
}

export function ReelCard({ reel, isActive = false, onNavigate }: ReelCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSensitiveContent, setShowSensitiveContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const likeReel = useMutation(api.engagement.likeReel);
  const bookmarkReel = useMutation(api.engagement.bookmarkReel);
  const hasAccess = useQuery(api.payments.hasAccess, {
    contentType: "reel",
    contentId: reel._id,
  });
  const videoUrl = useQuery(api.files.getFileUrl, { storageId: reel.video });
  const posterUrl = reel.poster ? useQuery(api.files.getFileUrl, { storageId: reel.poster }) : null;
  
  // Get like and bookmark status from database
  const isLiked = useQuery(api.engagement.isLiked, { 
    contentType: "reel", 
    contentId: reel._id 
  });
  const isBookmarked = useQuery(api.engagement.isBookmarked, { 
    contentType: "reel", 
    contentId: reel._id 
  });

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && hasAccess) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, hasAccess]);

  const handlePlayPause = () => {
    if (!hasAccess && reel.isGated) {
      // Show paywall
      onNavigate?.('paywall', { 
        contentType: 'reel', 
        contentId: reel._id,
        title: reel.caption || 'Reel',
        price: reel.priceAmount,
        token: reel.priceToken,
        sellerAddress: reel.sellerAddress
      });
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = async () => {
    try {
      await likeReel({ reelId: reel._id });
    } catch (error) {
      console.error("Error liking reel:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      await bookmarkReel({ reelId: reel._id });
    } catch (error) {
      console.error("Error bookmarking reel:", error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'now';
  };

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center">
      {/* Video Container */}
      <div className="relative w-full h-full">
        {reel.isSensitive && !showSensitiveContent ? (
          <div className="absolute inset-0 graphic-content-warning flex flex-col items-center justify-center text-white p-4 text-center z-20">
            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <h3 className="font-bold text-xl mb-2">Sensitive Content</h3>
            <p className="mb-4">This reel contains content that some may find sensitive.</p>
            <button 
              onClick={() => setShowSensitiveContent(true)}
              className="bg-white text-accent px-6 py-3 rounded-lg font-medium"
            >
              View Content
            </button>
          </div>
        ) : (
          <>
            {/* Gated Content Overlay */}
            {reel.isGated && !hasAccess && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
                <div className="bg-white rounded-lg max-w-sm mx-4">
                  <GatedContentPaywall
                    contentType="reel"
                    contentId={reel._id}
                    title={reel.caption || 'Premium Reel'}
                    price={reel.priceAmount || 0}
                    token={reel.priceToken || "USD"}
                    sellerAddress={reel.sellerAddress}
                    onUnlock={() => {
                      // Content will automatically become accessible after payment
                    }}
                  />
                </div>
              </div>
            )}

            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              poster={posterUrl || undefined}
              onClick={handlePlayPause}
            >
              <source src={videoUrl || ''} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play/Pause Overlay */}
            {!isPlaying && hasAccess && (
              <div 
                className="absolute inset-0 flex items-center justify-center z-10"
                onClick={handlePlayPause}
              >
                <div className="bg-black bg-opacity-50 rounded-full p-4">
                  <i className="fas fa-play text-white text-3xl"></i>
                </div>
              </div>
            )}
          </>
        )}

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-10">
          {/* Author Avatar */}
          <div className="relative">
            <img 
              src={reel.author.avatar || "https://randomuser.me/api/portraits/women/44.jpg"} 
              alt="Author" 
              className="w-12 h-12 rounded-full border-2 border-white" 
            />
            <div className="absolute -bottom-2 -right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center">
              <i className="fas fa-plus text-xs"></i>
            </div>
          </div>

          {/* Like Button */}
          <button 
            onClick={handleLike}
            className="flex flex-col items-center text-white"
          >
            <i className={`text-3xl mb-1 ${isLiked ? 'fas fa-heart text-red-500' : 'far fa-heart'}`}></i>
            <span className="text-xs">{isLiked ? 'Liked' : 'Like'}</span>
          </button>

          {/* Comment Button */}
          <button 
            onClick={() => onNavigate?.('reel-comments', { reelId: reel._id })}
            className="flex flex-col items-center text-white"
          >
            <i className="far fa-comment text-3xl mb-1"></i>
            <span className="text-xs">Comment</span>
          </button>

          {/* Bookmark Button */}
          <button 
            onClick={handleBookmark}
            className="flex flex-col items-center text-white"
          >
            <i className={`text-3xl ${isBookmarked ? 'fas fa-bookmark text-accent' : 'far fa-bookmark'}`}></i>
          </button>

          {/* Share Button */}
          <button className="flex flex-col items-center text-white">
            <i className="far fa-paper-plane text-3xl"></i>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-4 left-4 right-20 text-white z-10">
          <div className="flex items-center mb-2">
            <span className="font-medium mr-2">@{reel.author.username}</span>
            <span className="text-sm opacity-75">{formatTimeAgo(reel.createdAt)}</span>
          </div>
          
          {reel.caption && (
            <p className="text-sm mb-2 line-clamp-2">{reel.caption}</p>
          )}

          {/* Tags */}
          {reel.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reel.tags.slice(0, 3).map((tag, index) => (
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
    </div>
  );
}
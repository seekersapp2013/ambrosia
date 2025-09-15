import { useState } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ReelEngagementProps {
  reel: {
    _id: Id<"reels">;
    caption?: string;
    author: {
      id?: Id<"users">;
      name?: string;
      username?: string;
      avatar?: string;
    };
    isGated?: boolean;
  };
  onNavigate?: (screen: string, data?: any) => void;
  disabled?: boolean;
  hasAccess?: boolean;
}

export function ReelEngagement({ reel, onNavigate, disabled = false, hasAccess }: ReelEngagementProps) {
  const { isAuthenticated } = useConvexAuth();
  
  const likeReel = useMutation(api.engagement.likeReel);
  const bookmarkReel = useMutation(api.engagement.bookmarkReel);
  
  // Get like and bookmark status from database
  const isLiked = useQuery(api.engagement.isLiked, { 
    contentType: "reel", 
    contentId: reel._id 
  });
  const isBookmarked = useQuery(api.engagement.isBookmarked, { 
    contentType: "reel", 
    contentId: reel._id 
  });
  const likeCount = useQuery(api.engagement.getReelLikeCount, { reelId: reel._id });

  // Get author avatar URL
  const authorAvatarUrl = useQuery(
    api.files.getFileUrl,
    reel.author.avatar ? { storageId: reel.author.avatar } : "skip"
  );

  const handleLike = async () => {
    try {
      if (!isAuthenticated || disabled) {
        alert('Please sign in to like this reel.');
        return;
      }
      if (hasAccess === undefined) return;
      if (reel.isGated && !hasAccess) {
        alert('Unlock this reel to like it.');
        return;
      }
      await likeReel({ reelId: reel._id });
    } catch (error) {
      console.error("Error liking reel:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      if (!isAuthenticated || disabled) {
        alert('Please sign in to bookmark this reel.');
        return;
      }
      await bookmarkReel({ reelId: reel._id });
    } catch (error) {
      console.error("Error bookmarking reel:", error);
    }
  };

  const handleComments = () => {
    if (!isAuthenticated || disabled) {
      alert('Please sign in to view and participate in comments.');
      return;
    }
    if (hasAccess === undefined) return;
    if (reel.isGated && !hasAccess) {
      alert('Unlock this reel to view and participate in comments.');
      return;
    }
    onNavigate?.('reel-comments', { reelId: reel._id });
  };

  const isEngagementDisabled = disabled || !isAuthenticated;
  const isGatedAndNoAccess = reel.isGated && !hasAccess;

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Author Avatar */}
      <div className="relative">
        <img 
          src={authorAvatarUrl || "https://randomuser.me/api/portraits/women/44.jpg"} 
          alt="Author" 
          className="w-12 h-12 rounded-full border-2 border-white object-cover" 
        />
        <div className="absolute -bottom-2 -right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center">
          <i className="fas fa-plus text-xs"></i>
        </div>
      </div>

      {/* Like Button */}
      <button 
        onClick={handleLike}
        disabled={isEngagementDisabled || hasAccess === undefined || isGatedAndNoAccess}
        className={`flex flex-col items-center text-white ${
          isEngagementDisabled || isGatedAndNoAccess ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <i className={`text-3xl mb-1 ${isLiked ? 'fas fa-heart text-red-500' : 'far fa-heart'}`}></i>
        <span className="text-xs">{likeCount !== undefined ? likeCount : 0}</span>
      </button>

      {/* Comment Button */}
      <button 
        onClick={handleComments}
        disabled={isEngagementDisabled || hasAccess === undefined || isGatedAndNoAccess}
        className={`flex flex-col items-center text-white ${
          isEngagementDisabled || isGatedAndNoAccess ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <i className="far fa-comment text-3xl mb-1"></i>
        <span className="text-xs">Comment</span>
      </button>

      {/* Bookmark Button */}
      <button 
        onClick={handleBookmark}
        disabled={isEngagementDisabled}
        className={`flex flex-col items-center text-white ${
          isEngagementDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <i className={`text-3xl ${isBookmarked ? 'fas fa-bookmark text-accent' : 'far fa-bookmark'}`}></i>
      </button>

      {/* Share Button */}
      <button className="flex flex-col items-center text-white">
        <i className="far fa-paper-plane text-3xl"></i>
      </button>

    </div>
  );
}
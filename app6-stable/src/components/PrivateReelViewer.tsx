import { useState, useRef, useEffect } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ReelEngagement } from "./ReelEngagement";
import { GatedContentPaywall } from "./GatedContentPaywall";

interface PrivateReelViewerProps {
    reelId: string;
    onBack: () => void;
    onNavigate?: (screen: string, data?: any) => void;
}

export function PrivateReelViewer({ reelId, onBack, onNavigate }: PrivateReelViewerProps) {
    const { isAuthenticated } = useConvexAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSensitiveContent, setShowSensitiveContent] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const reel = useQuery(api.reels.getReelById, { reelId });

    // Check if user has access to gated content
    const hasAccess = useQuery(api.payments.hasAccess,
        reel?._id ? {
            contentType: "reel",
            contentId: reel._id,
        } : "skip"
    );

    // Get video and poster URLs
    const videoUrl = useQuery(api.files.getFileUrl, 
        reel?.video ? { storageId: reel.video } : "skip"
    );
    const posterUrl = useQuery(api.files.getFileUrl, 
        reel?.poster ? { storageId: reel.poster } : "skip"
    );

    // Get author avatar URL
    const authorAvatarUrl = useQuery(
        api.files.getFileUrl,
        reel?.author?.avatar ? { storageId: reel.author.avatar } : "skip"
    );

    useEffect(() => {
        if (videoRef.current && videoUrl) {
            if (!reel?.isGated || hasAccess) {
                videoRef.current.play().catch(error => {
                    console.log("Video autoplay failed:", error);
                });
                setIsPlaying(true);
            }
        }
    }, [videoUrl, reel?.isGated, hasAccess]);

    const handlePlayPause = () => {
        if (reel?.isGated && !hasAccess) {
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

        if (videoRef.current && videoUrl) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play().catch(error => {
                    console.log("Video play failed:", error);
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    };

    if (reel === undefined) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Loading reel...</p>
                </div>
            </div>
        );
    }

    if (reel === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-center">
                    <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h2 className="text-xl font-bold mb-2">Reel Not Found</h2>
                    <p>This reel doesn't exist or has been removed.</p>
                    <button 
                        onClick={onBack}
                        className="mt-4 bg-accent text-white px-6 py-2 rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={onBack}
                        className="text-white text-xl"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div className="flex items-center space-x-2">
                        <img 
                            src={authorAvatarUrl || "https://randomuser.me/api/portraits/women/44.jpg"} 
                            alt="Author" 
                            className="w-8 h-8 rounded-full object-cover" 
                        />
                        <div className="text-white">
                            <div className="font-medium">@{reel.author.username}</div>
                            <div className="text-xs opacity-75">{formatTimeAgo(reel.createdAt)}</div>
                        </div>
                    </div>
                    <div></div>
                </div>
            </div>

            {/* Video Container */}
            <div className="relative h-screen w-full">
                {reel.isSensitive && !showSensitiveContent ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-20 bg-black">
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
                        {videoUrl ? (
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                loop
                                muted
                                playsInline
                                poster={posterUrl || undefined}
                                onClick={handlePlayPause}
                                onLoadedData={() => {
                                    if (!reel.isGated || hasAccess) {
                                        videoRef.current?.play().catch(error => {
                                            console.log("Video autoplay failed:", error);
                                        });
                                    }
                                }}
                                onError={(e) => {
                                    console.error("Video loading error:", e);
                                }}
                            >
                                <source src={videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
       
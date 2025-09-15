import { Id } from "../../convex/_generated/dataModel";

interface LiveStreamCardProps {
  liveStream: {
    _id: Id<"liveStreams">;
    title: string;
    author: {
      id?: Id<"users">;
      name?: string;
      username?: string;
      avatar?: string;
    };
  };
  onNavigate?: (screen: string, data?: any) => void;
}

export function LiveStreamCard({ liveStream, onNavigate }: LiveStreamCardProps) {
  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>
      <div className="relative z-10 text-white text-center p-4">
        <div className="mb-4">
          <div className="w-24 h-24 rounded-full mx-auto mb-2 bg-red-500 flex items-center justify-center">
            <i className="fas fa-broadcast-tower text-4xl"></i>
          </div>
          <span className="font-medium">@{liveStream.author.username}</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">{liveStream.title}</h2>
        <p className="text-lg mb-6">is live now!</p>
        <button
          onClick={() => onNavigate?.('live-stream-viewer', { streamId: liveStream._id, role: 'viewer' })}
          className="bg-red-500 text-white px-8 py-4 rounded-lg font-medium text-lg"
        >
          Watch Live
        </button>
      </div>
    </div>
  );
}
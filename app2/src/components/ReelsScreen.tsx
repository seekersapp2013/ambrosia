import { useConvexAuth } from "convex/react";
import { useEffect } from "react";

export function ReelsScreen() {
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.reload();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-bold text-lg">Health Stream</h2>
        <button className="text-accent font-medium">Upload</button>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {/* Sample reels/videos */}
        <div className="relative square-image">
          <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Reel" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
            <i className="fas fa-play mr-1"></i>
            <span>24.5k</span>
          </div>
        </div>
        <div className="relative square-image">
          <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Reel" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
            <i className="fas fa-play mr-1"></i>
            <span>18.2k</span>
          </div>
        </div>
        <div className="relative square-image">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Reel" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
            <i className="fas fa-play mr-1"></i>
            <span>32.7k</span>
          </div>
        </div>
        <div className="relative square-image">
          <img src="https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Reel" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
            <i className="fas fa-play mr-1"></i>
            <span>12.1k</span>
          </div>
        </div>
        <div className="relative square-image">
          <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Reel" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
            <i className="fas fa-play mr-1"></i>
            <span>9.8k</span>
          </div>
        </div>
        <div className="relative square-image">
          <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Reel" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
            <i className="fas fa-play mr-1"></i>
            <span>15.3k</span>
          </div>
        </div>
      </div>
    </div>
  );
}
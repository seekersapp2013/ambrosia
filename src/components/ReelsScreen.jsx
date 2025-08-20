export default function ReelsScreen({ vis, showScreen }) {
    return (
      <div id="reels-screen" className={vis('reels-screen')}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <h2 className="font-bold text-lg">Health Stream</h2>
          <button onClick={() => showScreen('camera-screen')} className="text-accent font-medium">Upload</button>
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {[
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&h=800&q=80",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&h=800&q=80",
            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&h=800&q=80",
            "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&h=800&q=80",
            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&h=800&q=80",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&h=800&q=80",
          ].map((src, i) => (
            <div key={i} className="relative square-image">
              <img src={src} alt="Reel" className="w-full h-full object-cover"/>
              <div className="absolute bottom-2 left-2 flex items-center text-white text-sm">
                <i className="fas fa-play mr-1"></i><span>{[24500,18200,32700,12100,9800,15300][i]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
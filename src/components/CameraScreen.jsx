export default function CameraScreen({ vis, showScreen }) {
    return (
      <div id="camera-screen" className={vis('camera-screen') + " bg-black h-screen flex flex-col"}>
        <div className="flex justify-between items-center p-4">
          <button onClick={() => showScreen('reels-screen')}><i className="fas fa-times text-white text-2xl"></i></button>
          <button className="text-white font-medium">Next</button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="border-4 border-white rounded-full p-1">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <i className="fas fa-camera text-gray-700 text-xl"></i>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white">New Post</span>
              <button onClick={() => showScreen('upload-screen')} className="text-accent font-medium">Upload</button>
            </div>
            <div className="flex items-center justify-between text-white">
              <button className="flex flex-col items-center">
                <i className="fas fa-camera text-2xl mb-1"></i><span className="text-xs">Photo</span>
              </button>
              <button className="flex flex-col items-center">
                <i className="fas fa-video text-2xl mb-1"></i><span className="text-xs">Video</span>
              </button>
              <button className="flex flex-col items-center">
                <i className="fas fa-users text-2xl mb-1"></i><span className="text-xs">Live</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
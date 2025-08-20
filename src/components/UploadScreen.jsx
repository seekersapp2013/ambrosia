export default function UploadScreen({ vis, showScreen }) {
    return (
      <div id="upload-screen" className={vis('upload-screen')}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <button onClick={() => showScreen('camera-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
          <span className="font-bold">New Post</span>
          <button className="text-accent font-medium">Share</button>
        </div>
        <div className="bg-white p-4">
          <div className="flex items-center mb-4">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-10 h-10 rounded-full mr-3"/>
            <span className="font-medium">healthyliving</span>
          </div>
          <div className="mb-4">
            <textarea placeholder="Write a caption..." className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-accent"></textarea>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between"><span>Tag People</span><i className="fas fa-chevron-right"></i></div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between"><span>Add Location</span><i className="fas fa-chevron-right"></i></div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-accent mr-2"></i><span>Mark as Graphic Content</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer"/>
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">This will add a warning overlay for sensitive health content</p>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between"><span>Advanced Settings</span><i className="fas fa-chevron-right"></i></div>
          </div>
        </div>
      </div>
    );
  }
  
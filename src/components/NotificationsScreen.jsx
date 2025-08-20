export default function NotificationsScreen({ vis, showScreen }) {
    return (
      <div id="notifications-screen" className={vis('notifications-screen') + " bg-white min-h-screen"}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={() => showScreen('stream-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
          <span className="font-bold">Notifications</span>
          <div className="w-6"></div>
        </div>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="font-bold mb-3">Today</h3>
            <div className="flex items-start mb-4">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-10 h-10 rounded-full mr-3"/>
              <div>
                <p><span className="font-medium">fitnessguru</span> liked your post</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=100&h=100&q=80" alt="Post" className="w-10 h-10 rounded ml-auto"/>
            </div>
            <div className="flex items-start mb-4">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-10 h-10 rounded-full mr-3"/>
              <div>
                <p><span className="font-medium">nutritionist</span> started following you</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
              <button className="ml-auto bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium">Following</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-3">This Week</h3>
            <div className="flex items-start mb-4">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-10 h-10 rounded-full mr-3"/>
              <div>
                <p><span className="font-medium">healthyliving</span> mentioned you in a comment: "Great tips @user!"</p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
              <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=100&h=100&q=80" alt="Post" className="w-10 h-10 rounded ml-auto"/>
            </div>
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-ambrosia-500 flex items-center justify-center mr-3">
                <i className="fas fa-heart text-white"></i>
              </div>
              <div>
                <p>Your post has reached <span className="font-medium">1,000 likes</span></p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
              <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&h=100&q=80" alt="Post" className="w-10 h-10 rounded ml-auto"/>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
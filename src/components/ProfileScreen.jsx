export default function ProfileScreen({ vis, showScreen, profileTab, showProfileTab, tabClass }) {
    return (
      <div id="profile-screen" className={vis('profile-screen') + " bg-white min-h-screen"}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={() => showScreen('stream-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
          <div className="flex items-center"><span className="font-bold mr-2">healthyliving</span><i className="fas fa-chevron-down"></i></div>
          <button><i className="fas fa-ellipsis-h"></i></button>
        </div>
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="relative mr-6">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile" className="w-20 h-20 rounded-full object-cover"/>
              <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center"><i className="fas fa-plus text-xs"></i></div>
            </div>
            <div className="flex-1 flex justify-between">
              {[['Posts',142],['Followers','5.2k'],['Following',328]].map(([label,value],i)=>(
                <div key={i} className="text-center">
                  <div className="font-bold">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <h2 className="font-bold">Healthy Living</h2>
            <p className="text-sm mb-2">Sharing my journey to better health through nutrition and lifestyle changes. Certified nutrition coach.</p>
            <a href="#" className="text-sm text-blue-500">ambrosia.it.com/healthyliving</a>
          </div>
          <div className="flex mb-6">
            <button className="flex-1 bg-gray-100 py-1.5 rounded-lg text-sm font-medium mr-2">Edit Profile</button>
            <button className="flex-1 bg-gray-100 py-1.5 rounded-lg text-sm font-medium">Share Profile</button>
          </div>
          <div className="flex justify-around border-t border-gray-200 pt-3 mb-4">
            <button onClick={() => showProfileTab('posts')} className={tabClass('posts')}><i className="fas fa-th-large"></i></button>
            <button onClick={() => showProfileTab('saved')} className={tabClass('saved')}><i className="fas fa-bookmark"></i></button>
            <button onClick={() => showProfileTab('tagged')} className={tabClass('tagged')}><i className="fas fa-user-tag"></i></button>
          </div>
  
          {/* Posts Grid */}
          {profileTab==='posts' && (
            <div id="profile-posts" className="grid grid-cols-3 gap-0.5">
              {[
                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=300&h=300&q=80",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&h=300&q=80",
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&h=300&q=80",
                "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=300&h=300&q=80",
                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=300&h=300&q=80",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&h=300&q=80",
              ].map((src,i)=>(
                <div key={i} className="square-image"><img src={src} alt="Post" className="w-full h-full object-cover"/></div>
              ))}
            </div>
          )}
  
          {profileTab==='saved' && (
            <div id="profile-saved">
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 rounded-full border-2 border-black mb-3 flex items-center justify-center"><i className="fas fa-bookmark text-2xl"></i></div>
                <h3 className="font-bold text-xl mb-2">Saved Posts</h3>
                <p className="text-gray-500 text-center max-w-xs">Save photos and videos that you want to see again. Only you can see what you've saved.</p>
              </div>
            </div>
          )}
  
          {profileTab==='tagged' && (
            <div id="profile-tagged">
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 rounded-full border-2 border-black mb-3 flex items-center justify-center"><i className="fas fa-user-tag text-2xl"></i></div>
                <h3 className="font-bold text-xl mb-2">Photos of You</h3>
                <p className="text-gray-500 text-center max-w-xs">When people tag you in photos, they'll appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
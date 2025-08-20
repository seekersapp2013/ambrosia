export default function SettingsScreen({ vis, showScreen, logout }) {
    return (
      <div id="settings-screen" className={vis('settings-screen') + " bg-white min-h-screen"}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={() => showScreen('profile-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
          <span className="font-bold">Settings</span>
          <div className="w-6"></div>
        </div>
        <div className="p-4">
          <div className="flex items-center mb-6">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile" className="w-16 h-16 rounded-full mr-4"/>
            <div><h3 className="font-bold">healthyliving</h3><p className="text-sm text-gray-600">Nutrition Expert</p></div>
          </div>
          <div className="space-y-4 mb-6">
            {[
              ['fa-user','Edit Profile'], ['fa-lock','Change Password'],
              ['fa-bell','Notifications'], ['fa-eye-slash','Content Preferences'],
            ].map(([icon,label],i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-ambrosia-100 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-ambrosia-500 text-white flex items-center justify-center mr-3"><i className={`fas ${icon}`}></i></div>
                  <span>{label}</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            ))}
          </div>
          <div className="space-y-4 mb-6">
            {[
              ['fa-info-circle','About Ambrosia'],
              ['fa-question-circle','Help Center'],
              ['fa-shield-alt','Privacy & Security'],
            ].map(([icon,label],i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-ambrosia-100 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-ambrosia-500 text-white flex items-center justify-center mr-3"><i className={`fas ${icon}`}></i></div>
                  <span>{label}</span>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            ))}
          </div>
          <button className="w-full bg-ambrosia-200 text-gray-800 py-3 rounded-lg font-medium mb-2">Switch to Professional Account</button>
          <button onClick={logout} className="w-full text-accent py-3 rounded-lg font-medium">Log Out</button>
        </div>
      </div>
    );
  }
  
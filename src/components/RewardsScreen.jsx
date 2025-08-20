export default function RewardsScreen({ vis }) {
    return (
      <div id="rewards-screen" className={vis('rewards-screen') + " bg-white min-h-screen"}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div><i className="invisible fas fa-arrow-left text-xl"></i></div>
          <span className="font-bold">Health Rewards</span>
          <div className="w-6"></div>
        </div>
        <div className="p-4">
          <div className="bg-gradient-to-r from-ambrosia-300 to-ambrosia-500 rounded-lg p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-4">
              <div><p className="text-sm mb-1">Your Points</p><p className="text-3xl font-bold">1,245</p></div>
              <div className="bg-white bg-opacity-20 rounded-full p-2"><i className="fas fa-gem"></i></div>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mb-1"><div className="bg-white h-2 rounded-full" style={{width:'45%'}}></div></div>
            <p className="text-xs">45% to next reward level</p>
          </div>
  
          <div className="mb-6">
            <h3 className="font-bold mb-3">Available Rewards</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['fa-book','E-Book','"Healthy Living Guide"','500 pts'],
                ['fa-video','Masterclass','"Meal Planning"','750 pts'],
                ['fa-headset','Consultation','With Nutritionist','1,000 pts'],
                ['fa-tshirt','Ambrosia Tee','Organic Cotton','1,500 pts'],
              ].map(([icon,title,sub,pts],i)=>(
                <div key={i} className="bg-ambrosia-100 rounded-lg p-4 border border-ambrosia-300">
                  <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center mb-3 mx-auto">
                    <i className={`fas ${icon}`}></i>
                  </div>
                  <h4 className="font-medium text-center mb-1">{title}</h4>
                  <p className="text-xs text-gray-600 text-center mb-2">{sub}</p>
                  <button className="w-full bg-accent text-white py-1.5 rounded-lg text-sm font-medium">{pts}</button>
                </div>
              ))}
            </div>
          </div>
  
          <div>
            <h3 className="font-bold mb-3">Your Achievements</h3>
            {[
              ['fa-trophy','First Post','Shared your first health journey post','bg-yellow-400'],
              ['fa-trophy','Community Builder','Reached 100 followers','bg-yellow-400'],
              ['fa-lock','Health Expert','Reach 500 followers','bg-gray-300'],
              ['fa-lock','Top Contributor','Earn 5,000 points','bg-gray-300'],
            ].map(([icon,title,desc,bg],i)=>(
              <div key={i} className="flex items-center bg-ambrosia-100 rounded-lg p-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${bg} text-white flex items-center justify-center mr-3`}>
                  <i className={`fas ${icon}`}></i>
                </div>
                <div><p className="font-medium">{title}</p><p className="text-xs text-gray-600">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
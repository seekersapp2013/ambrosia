export default function LeaderboardScreen({ vis, showScreen }) {
    return (
      <div id="leaderboard-screen" className={vis('leaderboard-screen') + " bg-white min-h-screen"}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={() => showScreen('stream-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
          <span className="font-bold">Health Leaderboard</span>
          <div className="w-6"></div>
        </div>
        <div className="p-4">
          <div className="bg-ambrosia-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="leaderboard-position mr-3">1</div>
                <div><p className="font-medium">healthyliving</p><p className="text-xs text-gray-600">Nutrition Expert</p></div>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">1,245 pts</p>
                <p className="text-xs text-gray-600">+120 this week</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1"><div className="bg-accent h-2 rounded-full" style={{width: '85%'}}></div></div>
            <p className="text-xs text-gray-600">85% to next level</p>
          </div>
  
          <div className="mb-6">
            <h3 className="font-bold mb-3">Top Community Members</h3>
            {[
              {pos:2, img:"https://randomuser.me/api/portraits/men/32.jpg", name:"fitnessguru", title:"Personal Trainer", pts:"987 pts", inc:"+85 this week"},
              {pos:3, img:"https://randomuser.me/api/portraits/women/68.jpg", name:"nutritionist", title:"Dietician", pts:"876 pts", inc:"+72 this week"},
              {pos:4, img:"https://randomuser.me/api/portraits/women/12.jpg", name:"yogamaster", title:"Yoga Instructor", pts:"765 pts", inc:"+68 this week"},
              {pos:5, img:"https://randomuser.me/api/portraits/men/45.jpg", name:"mentalhealthadvocate", title:"Therapist", pts:"654 pts", inc:"+60 this week"},
            ].map((p,i)=>(
              <div key={i} className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="leaderboard-position mr-3">{p.pos}</div>
                  <img src={p.img} alt="User" className="w-10 h-10 rounded-full mr-3"/>
                  <div><p className="font-medium">{p.name}</p><p className="text-xs text-gray-600">{p.title}</p></div>
                </div>
                <div className="text-right"><p className="font-bold">{p.pts}</p><p className="text-xs text-gray-600">{p.inc}</p></div>
              </div>
            ))}
          </div>
  
          <div>
            <h3 className="font-bold mb-3">How Points Work</h3>
            {[
              ['fa-heart','Likes Received','+1 pt per like'],
              ['fa-comment','Comments Received','+2 pts per comment'],
              ['fa-user-plus','New Followers','+5 pts per follower'],
              ['fa-medal','Daily Login','+10 pts per day'],
            ].map(([icon,label,val],i)=>(
              <div key={i} className="bg-ambrosia-100 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center mr-3">
                      <i className={`fas ${icon}`}></i>
                    </div>
                    <span>{label}</span>
                  </div>
                  <span className="font-medium">{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
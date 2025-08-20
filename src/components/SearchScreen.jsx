export default function SearchScreen({ vis, showScreen }) {
    return (
      <div id="search-screen" className={vis('search-screen') + " bg-white min-h-screen"}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={() => showScreen('stream-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
          <div className="flex-1 mx-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-full bg-gray-100 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-accent"/>
              <i className="fas fa-search absolute left-3 top-2.5 text-gray-500"></i>
            </div>
          </div>
          <div className="w-6"></div>
        </div>
        <div className="p-4">
          <h3 className="font-bold mb-3">Recent Searches</h3>
          {['nutritionist','healthy recipes','yoga flow'].map((q,i) => (
            <div key={i} className={"flex items-center justify-between " + (i<2 ? "mb-4" : "mb-6")}>
              <div className="flex items-center">
                <i className="fas fa-clock text-gray-400 mr-3"></i><span>{q}</span>
              </div>
              <i className="fas fa-times text-gray-400"></i>
            </div>
          ))}
          <h3 className="font-bold mb-3">Suggested for You</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {img:"https://randomuser.me/api/portraits/women/44.jpg", name:"healthyliving", grad:"from-yellow-400 to-pink-500"},
              {img:"https://randomuser.me/api/portraits/men/32.jpg", name:"fitnessguru", grad:"from-purple-500 to-blue-400"},
              {img:"https://randomuser.me/api/portraits/women/68.jpg", name:"nutritionist", grad:"from-green-400 to-blue-500"},
            ].map((s,i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${s.grad} p-0.5 mb-1`}>
                  <div className="bg-white rounded-full p-0.5">
                    <img src={s.img} alt="User" className="w-full h-full rounded-full object-cover"/>
                  </div>
                </div>
                <span className="text-xs">{s.name}</span>
              </div>
            ))}
          </div>
          <h3 className="font-bold mb-3">Popular Topics</h3>
          <div className="flex flex-wrap gap-2">
            {['#HealthyEating','#MentalHealth','#FitnessJourney','#SelfCare','#Wellness','#ChronicIllness'].map((t,i)=>(
              <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{t}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
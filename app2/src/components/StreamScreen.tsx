import { useConvexAuth } from "convex/react";
import { useEffect } from "react";

interface StreamScreenProps {
  onNavigate?: (screen: string) => void;
}

export function StreamScreen({ onNavigate }: StreamScreenProps = {}) {
  // Suppress unused parameter warning
  void onNavigate;
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.reload();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }
  const toggleLike = (button: HTMLButtonElement) => {
    const icon = button.querySelector('i');
    if (icon?.classList.contains('far')) {
      icon.classList.remove('far');
      icon.classList.add('fas', 'text-red-500');
    } else if (icon) {
      icon.classList.remove('fas', 'text-red-500');
      icon.classList.add('far');
    }
  };

  const showContent = (button: HTMLButtonElement) => {
    const parent = button.parentElement;
    if (parent) {
      parent.classList.add('hidden');
    }
  };

  return (
    <div>
      {/* Story Highlights */}
      <div className="bg-white py-3 px-4 border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-4">
          {/* Add Story Circle */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-ambrosia-300 border-2 border-white flex items-center justify-center mb-1">
              <i className="fas fa-plus text-gray-600"></i>
            </div>
            <span className="text-xs">Your Story</span>
          </div>
          {/* Sample Stories */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-0.5 mb-1">
              <div className="bg-white rounded-full p-0.5">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
            <span className="text-xs">healthyliving</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-400 p-0.5 mb-1">
              <div className="bg-white rounded-full p-0.5">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
            <span className="text-xs">fitnessguru</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 p-0.5 mb-1">
              <div className="bg-white rounded-full p-0.5">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
            <span className="text-xs">nutritionist</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mb-4 bg-white">
        {/* Post 1 */}
        <div className="border-b border-gray-200 pb-4">
          {/* Post Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-8 h-8 rounded-full" />
              <span className="font-medium">healthyliving</span>
            </div>
            <button>
              <i className="fas fa-ellipsis-h text-gray-500"></i>
            </button>
          </div>
          {/* Post Image */}
          <div className="relative square-image">
            <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Post" className="w-full h-full object-cover" />
          </div>
          {/* Post Actions */}
          <div className="px-4 pt-3">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-4">
                <button onClick={(e) => toggleLike(e.currentTarget)} className="text-2xl text-gray-700 hover:text-red-500">
                  <i className="far fa-heart"></i>
                </button>
                <button className="text-2xl text-gray-700">
                  <i className="far fa-comment"></i>
                </button>
                <button className="text-2xl text-gray-700">
                  <i className="far fa-paper-plane"></i>
                </button>
              </div>
              <button className="text-2xl text-gray-700">
                <i className="far fa-bookmark"></i>
              </button>
            </div>
            {/* Likes */}
            <div className="font-medium mb-1">1,234 likes</div>
            {/* Caption */}
            <div className="mb-1">
              <span className="font-medium">healthyliving</span> <span>Starting my day with this nutritious smoothie bowl! Packed with antioxidants and protein to fuel my morning. #HealthyBreakfast #SmoothieBowl</span>
            </div>
            {/* Comments */}
            <div className="text-gray-500 mb-1">View all 128 comments</div>
            <div className="text-sm text-gray-500">2 hours ago</div>
          </div>
        </div>

        {/* Post 2 (with graphic content warning) */}
        <div className="border-b border-gray-200 pb-4">
          {/* Post Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-8 h-8 rounded-full" />
              <span className="font-medium">fitnessguru</span>
            </div>
            <button>
              <i className="fas fa-ellipsis-h text-gray-500"></i>
            </button>
          </div>
          {/* Post Image with Graphic Content Warning */}
          <div className="relative square-image">
            <div className="absolute inset-0 graphic-content-warning flex flex-col items-center justify-center text-white p-4 text-center z-10">
              <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
              <h3 className="font-bold text-lg mb-2">Graphic Content</h3>
              <p className="mb-4">This post contains images that some may find disturbing related to health conditions.</p>
              <button onClick={(e) => showContent(e.currentTarget)} className="bg-white text-accent px-4 py-2 rounded-lg font-medium">View Content</button>
            </div>
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=800&q=80" alt="Post" className="w-full h-full object-cover" />
          </div>
          {/* Post Actions */}
          <div className="px-4 pt-3">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-4">
                <button onClick={(e) => toggleLike(e.currentTarget)} className="text-2xl text-gray-700 hover:text-red-500">
                  <i className="far fa-heart"></i>
                </button>
                <button className="text-2xl text-gray-700">
                  <i className="far fa-comment"></i>
                </button>
                <button className="text-2xl text-gray-700">
                  <i className="far fa-paper-plane"></i>
                </button>
              </div>
              <button className="text-2xl text-gray-700">
                <i className="far fa-bookmark"></i>
              </button>
            </div>
            {/* Likes */}
            <div className="font-medium mb-1">876 likes</div>
            {/* Caption */}
            <div className="mb-1">
              <span className="font-medium">fitnessguru</span> <span>Post-workout recovery is just as important as the workout itself. Here's my routine to prevent injuries and maximize gains. #FitnessRecovery #InjuryPrevention</span>
            </div>
            {/* Comments */}
            <div className="text-gray-500 mb-1">View all 64 comments</div>
            <div className="text-sm text-gray-500">5 hours ago</div>
          </div>
        </div>
      </div>


    </div>
  );
}
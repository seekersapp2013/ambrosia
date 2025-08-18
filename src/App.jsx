import React, { useEffect, useMemo, useState } from 'react';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';

export default function App() {
  // Convex auth
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  // Screens
  const screens = [
    'login-screen','reset-password-screen','signup-screen',
    'stream-screen','reels-screen','camera-screen','upload-screen',
    'notifications-screen','search-screen','profile-screen',
    'leaderboard-screen','rewards-screen','settings-screen'
  ];

  const [activeScreen, setActiveScreen] = useState('login-screen');
  const [appVisible, setAppVisible] = useState(false);
  const [pwaReady, setPwaReady] = useState(false);
  const [graphicCovered, setGraphicCovered] = useState(true);
  const [profileTab, setProfileTab] = useState('posts');
  const [likes, setLikes] = useState({ post1:false, post2:false });

  // Keep your UI in sync with Convex auth state (no markup changes)
  useEffect(() => {
    if (isLoading) return; // until we know
    if (isAuthenticated) {
      setAppVisible(true);
      if (['login-screen','signup-screen','reset-password-screen'].includes(activeScreen)) {
        setActiveScreen('stream-screen');
      }
    } else {
      setAppVisible(false);
      setActiveScreen('login-screen');
    }
  }, [isAuthenticated, isLoading]); // eslint-disable-line

  // PWA prompt availability
  useEffect(() => {
    const onAvail = () => setPwaReady(true);
    window.addEventListener('pwaPromptAvailable', onAvail);
    return () => window.removeEventListener('pwaPromptAvailable', onAvail);
  }, []);

  async function handleInstall() {
    if (window.deferredPrompt) {
      const e = window.deferredPrompt;
      e.prompt();
      await e.userChoice;
      window.deferredPrompt = null;
      setPwaReady(false);
    }
  }

  // Navigation
  function showScreen(screen) {
    if (!screens.includes(screen)) return;
    setActiveScreen(screen);
  }

  // ===== Auth flows (wired to Convex, preserving your exact UI) =====
  async function login() {
    try {
      // In your login screen the first input is "Username" — we treat it as email.
      const root = document.getElementById('login-screen');
      const emailEl = root?.querySelector('input[type="text"]');
      const passwordEl = root?.querySelector('input[type="password"]');
      const email = emailEl?.value?.trim();
      const password = passwordEl?.value;

      if (!email || !password) {
        alert('Enter your email/username and password');
        return;
      }

      const form = new FormData();
      form.set('email', email);
      form.set('password', password);
      form.set('flow', 'signIn');

      await signIn('password', form); // Convex Password provider
      setAppVisible(true);
      setActiveScreen('stream-screen');
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Login failed');
    }
  }

  async function logout() {
    try {
      await signOut();
    } finally {
      setAppVisible(false);
      setActiveScreen('login-screen');
    }
  }

  async function signUp() {
    try {
      const root = document.getElementById('signup-screen');
      const usernameEl = root?.querySelector('input[placeholder="Username"]');
      const emailEl = root?.querySelector('input[type="email"]');
      const passwordEl = root?.querySelector('input[type="password"]');
      const username = usernameEl?.value?.trim();
      const email = emailEl?.value?.trim();
      const password = passwordEl?.value;

      if (!email || !password) {
        alert('Email and password are required');
        return;
      }

      const form = new FormData();
      form.set('email', email);
      form.set('password', password);
      form.set('name', username || ''); // captured for later use if you add a profile table
      form.set('flow', 'signUp');

      await signIn('password', form);
      // TODO: optional — call a Convex mutation to persist `username` in your profile table.
      setAppVisible(true);
      setActiveScreen('stream-screen');
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Sign up failed');
    }
  }

  function resetPassword() {
    alert('Password reset link sent (demo).');
    setActiveScreen('login-screen');
  }
  // ================================================================

  // Post helpers
  function toggleLike(key) {
    setLikes((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function showContent() { setGraphicCovered(false); }
  function showProfileTab(tab) { setProfileTab(tab); }

  // Helpers to toggle classes
  const is = (screen) => activeScreen === screen;
  const vis = (screen) => is(screen) ? '' : 'hidden';
  const tabClass = (tab) => 'profile-tab ' + (profileTab===tab ? 'tab-active' : '');

  return (
    <>
      {/* Login overlay screens */}
      {!appVisible && (
        <>
          {is('login-screen') && (
            <div id="login-screen" className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-accent mb-2">Ambrosia</h1>
                <p className="text-gray-600">Your health community</p>
              </div>
              <form className="w-full max-w-xs">
                <div className="mb-4">
                  <input type="text" placeholder="Username" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
                </div>
                <div className="mb-6">
                  <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
                </div>
                <button type="button" onClick={login} className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4">Log In</button>
                <div className="text-center">
                  <a href="#" onClick={() => setActiveScreen('reset-password-screen')} className="text-accent text-sm">Forgot password?</a>
                </div>
              </form>
              <div className="mt-8 text-center">
                <p className="text-gray-600">Don't have an account? <a href="#" onClick={() => setActiveScreen('signup-screen')} className="text-accent font-medium">Sign Up</a></p>
              </div>
            </div>
          )}

          {is('reset-password-screen') && (
            <div id="reset-password-screen" className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-accent mb-2">Reset Password</h1>
                <p className="text-gray-600">Enter your email to receive a reset link</p>
              </div>
              <form className="w-full max-w-xs">
                <div className="mb-6">
                  <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
                </div>
                <button type="button" onClick={resetPassword} className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4">Send Reset Link</button>
              </form>
              <div className="mt-4 text-center">
                <a href="#" onClick={() => setActiveScreen('login-screen')} className="text-accent text-sm">Back to Login</a>
              </div>
            </div>
          )}

          {is('signup-screen') && (
            <div id="signup-screen" className="fixed inset-0 bg-ambrosia-50 z-50 flex flex-col items-center justify-center p-6">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-accent mb-2">Sign Up</h1>
                <p className="text-gray-600">Join our health community</p>
              </div>
              <form className="w-full max-w-xs">
                <div className="mb-4">
                  <input type="text" placeholder="Username" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
                </div>
                <div className="mb-4">
                  <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
                </div>
                <div className="mb-6">
                  <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"/>
                </div>
                <button type="button" onClick={signUp} className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition duration-200 mb-4">Sign Up</button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-gray-600">Already have an account? <a href="#" onClick={() => setActiveScreen('login-screen')} className="text-accent font-medium">Log In</a></p>
              </div>
            </div>
          )}
        </>
      )}

      {/* App container */}
      <div id="app-container" className={appVisible ? '' : 'hidden'}>
        {/* Header */}
        <header className="bg-white py-3 px-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-accent">Ambrosia</h1>
          <div className="flex items-center space-x-4">
            <button id="pwa-install-btn" onClick={handleInstall} className={(pwaReady ? '' : 'hidden') + " bg-accent text-white px-3 py-1 rounded-lg text-sm font-medium"}>
              <i className="fas fa-download mr-2 text-gray-100"></i> Download App
            </button>
            <button onClick={() => showScreen('notifications-screen')} className="relative">
              <i className="fas fa-bell text-2xl text-gray-700"></i>
              <span className="notification-dot"></span>
            </button>
            <button onClick={() => showScreen('search-screen')}>
              <i className="fas fa-search text-2xl text-gray-700"></i>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="pb-16">
          {/* Stream */}
          <div id="stream-screen" className={vis('stream-screen')}>
            {/* Stories */}
            <div className="bg-white py-3 px-4 border-b border-gray-200 overflow-x-auto">
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-ambrosia-300 border-2 border-white flex items-center justify-center mb-1">
                    <i className="fas fa-plus text-gray-600"></i>
                  </div>
                  <span className="text-xs">Your Story</span>
                </div>

                {/* Story samples */}
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
            </div>

            {/* Posts */}
            <div className="mb-4 bg-white">
              {/* Post 1 */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-8 h-8 rounded-full"/>
                    <span className="font-medium">healthyliving</span>
                  </div>
                  <button><i className="fas fa-ellipsis-h text-gray-500"></i></button>
                </div>
                <div className="relative square-image">
                  <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&h=800&q=80" alt="Post" className="w-full h-full object-cover"/>
                </div>
                <div className="px-4 pt-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex space-x-4">
                      <button onClick={() => toggleLike('post1')} className={"text-2xl " + (likes.post1 ? "text-red-500" : "text-gray-700 hover:text-red-500")}>
                        <i className={(likes.post1 ? "fas" : "far") + " fa-heart"}></i>
                      </button>
                      <button className="text-2xl text-gray-700"><i className="far fa-comment"></i></button>
                      <button className="text-2xl text-gray-700"><i className="far fa-paper-plane"></i></button>
                    </div>
                    <button className="text-2xl text-gray-700"><i className="far fa-bookmark"></i></button>
                  </div>
                  <div className="font-medium mb-1">1,234 likes</div>
                  <div className="mb-1">
                    <span className="font-medium">healthyliving</span> <span>Starting my day with this nutritious smoothie bowl! Packed with antioxidants and protein to fuel my morning. #HealthyBreakfast #SmoothieBowl</span>
                  </div>
                  <div className="text-gray-500 mb-1">View all 128 comments</div>
                  <div className="text-sm text-gray-500">2 hours ago</div>
                </div>
              </div>

              {/* Post 2 with overlay */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-8 h-8 rounded-full"/>
                    <span className="font-medium">fitnessguru</span>
                  </div>
                  <button><i className="fas fa-ellipsis-h text-gray-500"></i></button>
                </div>

                <div className="relative square-image">
                  {graphicCovered && (
                    <div className="absolute inset-0 graphic-content-warning flex flex-col items-center justify-center text-white p-4 text-center z-10">
                      <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
                      <h3 className="font-bold text-lg mb-2">Graphic Content</h3>
                      <p className="mb-4">This post contains images that some may find disturbing related to health conditions.</p>
                      <button onClick={showContent} className="bg-white text-accent px-4 py-2 rounded-lg font-medium">View Content</button>
                    </div>
                  )}
                  <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&h=800&q=80" alt="Post" className="w-full h-full object-cover"/>
                </div>

                <div className="px-4 pt-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex space-x-4">
                      <button onClick={() => toggleLike('post2')} className={"text-2xl " + (likes.post2 ? "text-red-500" : "text-gray-700 hover:text-red-500")}>
                        <i className={(likes.post2 ? "fas" : "far") + " fa-heart"}></i>
                      </button>
                      <button className="text-2xl text-gray-700"><i className="far fa-comment"></i></button>
                      <button className="text-2xl text-gray-700"><i className="far fa-paper-plane"></i></button>
                    </div>
                    <button className="text-2xl text-gray-700"><i className="far fa-bookmark"></i></button>
                  </div>
                  <div className="font-medium mb-1">876 likes</div>
                  <div className="mb-1">
                    <span className="font-medium">fitnessguru</span> <span>Post-workout recovery is just as important as the workout itself. Here's my routine to prevent injuries and maximize gains. #FitnessRecovery #InjuryPrevention</span>
                  </div>
                  <div className="text-gray-500 mb-1">View all 64 comments</div>
                  <div className="text-sm text-gray-500">5 hours ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reels */}
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

          {/* Camera */}
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

          {/* Upload */}
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

          {/* Notifications */}
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

          {/* Search */}
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

          {/* Profile */}
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

          {/* Leaderboard */}
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

          {/* Rewards */}
          <div id="rewards-screen" className={vis('rewards-screen') + " bg-white min-h-screen"}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <button onClick={() => showScreen('stream-screen')}><i className="fas fa-arrow-left text-xl"></i></button>
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

          {/* Settings */}
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
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-4">
          <button onClick={() => showScreen('stream-screen')} className={"flex flex-col items-center " + (is('stream-screen') ? "text-accent" : "text-gray-600")}>
            <i className="fas fa-home text-xl"></i>
          </button>
          <button onClick={() => showScreen('search-screen')} className={"flex flex-col items-center " + (is('search-screen') ? "text-accent" : "text-gray-600")}>
            <i className="fas fa-search text-xl"></i>
          </button>
          <button onClick={() => showScreen('reels-screen')} className={"flex flex-col items-center " + (is('reels-screen') ? "text-accent" : "text-gray-600")}>
            <i className="fas fa-play-circle text-xl"></i>
          </button>
          <button onClick={() => showScreen('leaderboard-screen')} className={"flex flex-col items-center " + (is('leaderboard-screen') ? "text-accent" : "text-gray-600")}>
            <i className="fas fa-chess-queen text-xl"></i>
          </button>
          <button onClick={() => showScreen('profile-screen')} className={"flex flex-col items-center " + (is('profile-screen') ? "text-accent" : "text-gray-600")}>
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Profile" className="w-6 h-6 rounded-full"/>
          </button>
        </nav>
      </div>
    </>
  )
}

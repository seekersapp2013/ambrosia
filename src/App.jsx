import React, { useEffect, useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from "../convex/_generated/api";

// Screens
import LoginScreen from './components/LoginScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import SignupScreen from './components/SignupScreen';
import StreamScreen from './components/StreamScreen';
import ReelsScreen from './components/ReelsScreen';
import CameraScreen from './components/CameraScreen';
import UploadScreen from './components/UploadScreen';
import NotificationsScreen from './components/NotificationsScreen';
import SearchScreen from './components/SearchScreen';
import ProfileScreen from './components/ProfileScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import RewardsScreen from './components/RewardsScreen';
import SettingsScreen from './components/SettingsScreen';
import CrudScreen from './components/CrudScreen';


export default function App() {
  // Convex auth
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  // Current profile (for username) — pass {} so Convex registers no-arg query
  const me = useQuery(api.profiles.getMyProfile, {});
  const setMyUsername = useMutation(api.profiles.setMyUsername);

  // Screens
  const screens = [
    'login-screen','reset-password-screen','signup-screen',
    'stream-screen','reels-screen','camera-screen','upload-screen',
    'notifications-screen','search-screen','profile-screen',
    'leaderboard-screen','rewards-screen','settings-screen',
    'crud-screen' // ← new

  ];

  const [activeScreen, setActiveScreen] = useState('login-screen');
  const [appVisible, setAppVisible] = useState(false);
  const [pwaReady, setPwaReady] = useState(false);
  const [graphicCovered, setGraphicCovered] = useState(true);
  const [profileTab, setProfileTab] = useState('posts');
  const [likes, setLikes] = useState({ post1:false, post2:false });

  // Keep UI in sync with Convex auth state
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      setAppVisible(true);
      if (['login-screen','signup-screen','reset-password-screen'].includes(activeScreen)) {
        setActiveScreen('stream-screen');
      }
    } else {
      setAppVisible(false);
      setActiveScreen('login-screen');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

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

  // ===== Auth flows =====
  async function login() {
    try {
      const root = document.getElementById('login-screen');
      const emailEl = root?.querySelector('input[type="email"]');
      const passwordEl = root?.querySelector('input[type="password"]');
      const email = emailEl?.value?.trim();
      const password = passwordEl?.value;

      if (!email || !password) {
        alert('Enter your email and password');
        return;
      }

      const form = new FormData();
      form.set('email', email);
      form.set('password', password);
      form.set('flow', 'signIn');

      await signIn('password', form);
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
      if (!root) {
        alert('Signup root (#signup-screen) not found. Add id="signup-screen" to your SignupScreen root.');
        return;
      }
  
      // Input selection (no type annotations in .jsx)
      const usernameEl = root.querySelector('#signupusername');
      const emailEl = root.querySelector('input[type="email"]');
      const passwordEl = root.querySelector('input[type="password"]');
  
      if (!usernameEl || !emailEl || !passwordEl) {
        alert('Signup form inputs not found. Check that all inputs have correct types/IDs.');
        return;
      }
  
      const username = usernameEl.value.trim();
      const email = emailEl.value.trim();
      const password = passwordEl.value;
  
      // Validate fields
      if (!username || !email || !password) {
        alert('All fields (username, email, password) are required.');
        return;
      }
  
      if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
        alert('Username must be 3–20 chars, letters/numbers/underscores only.');
        return;
      }
  
      // Prepare form for Convex auth
      const form = new FormData();
      form.set('email', email);
      form.set('password', password);
      form.set('name', username);
      form.set('flow', 'signUp');
  
      // 1. Auth: create account + login
      await signIn('password', form);
  
      // 2. Convex: persist username to profiles table
      try {
        const result = await setMyUsername({ username: username.toLowerCase() });
        console.log('Username set successfully. Profile ID:', result);
      } catch (e) {
        console.error('Failed to set username:', e);
        alert(e?.message || 'Could not save username. You can set it later in Settings.');
      }
  
      // 3. Continue to app
      setAppVisible(true);
      setActiveScreen('stream-screen');
  
    } catch (err) {
      console.error('Sign-up error:', err);
      alert(err?.message || 'Sign up failed');
    }
  }
  
  

  function resetPassword() {
    alert('Password reset link sent (demo).');
    setActiveScreen('login-screen');
  }
  // =======================

  // Post/helpers
  function toggleLike(key) { setLikes((prev) => ({ ...prev, [key]: !prev[key] })); }
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
          <LoginScreen
            isActive={is('login-screen')}
            login={login}
            goReset={() => setActiveScreen('reset-password-screen')}
            goSignup={() => setActiveScreen('signup-screen')}
          />
          <ResetPasswordScreen
            isActive={is('reset-password-screen')}
            resetPassword={resetPassword}
            goLogin={() => setActiveScreen('login-screen')}
          />
          <SignupScreen
            isActive={is('signup-screen')}
            signUp={signUp}
            goLogin={() => setActiveScreen('login-screen')}
          />
        </>
      )}

      {/* App container */}
      <div id="app-container" className={appVisible ? '' : 'hidden'}>
        {/* Top Navigation / Header */}
        <header className="bg-white py-3 px-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-accent">Ambrosia</h1>
          <div className="flex items-center space-x-4">
            {/* Username (from Convex) */}
            {me?.username && (
              <span className="text-gray-700 font-medium truncate max-w-[12ch]">
                {me.username}
              </span>
            )}

            <button
              id="pwa-install-btn"
              onClick={handleInstall}
              className={(pwaReady ? '' : 'hidden') + " bg-accent text-white px-3 py-1 rounded-lg text-sm font-medium"}
            >
              <i className="fas fa-download mr-2 text-gray-100"></i> Download App
            </button>

            <button onClick={() => showScreen('notifications-screen')} className="relative">
              <i className="fas fa-bell text-2xl text-gray-700"></i>
              <span className="notification-dot"></span>
            </button>

            <button onClick={() => showScreen('search-screen')}>
              <i className="fas fa-search text-2xl text-gray-700"></i>
            </button>
             <button onClick={() => showScreen('crud-screen')}>
            <i className="fas fa-edit text-2xl text-gray-700" title="Posts"></i>
            </button>
            <button onClick={logout} title="Log out">
              <i className="fas fa-sign-out-alt text-2xl text-gray-700"></i>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="pb-16">
          <StreamScreen
            vis={vis}
            toggleLike={toggleLike}
            likes={likes}
            graphicCovered={graphicCovered}
            showContent={showContent}
          />
          <ReelsScreen vis={vis} showScreen={showScreen} />
          <CameraScreen vis={vis} showScreen={showScreen} />
          <UploadScreen vis={vis} showScreen={showScreen} />
          <NotificationsScreen vis={vis} showScreen={showScreen} />
          <SearchScreen vis={vis} showScreen={showScreen} />
          <ProfileScreen
            vis={vis}
            showScreen={showScreen}
            profileTab={profileTab}
            showProfileTab={showProfileTab}
            tabClass={tabClass}
          />
          <LeaderboardScreen vis={vis} showScreen={showScreen} />
          <RewardsScreen vis={vis} />
          <SettingsScreen vis={vis} showScreen={showScreen} logout={logout} />
          <CrudScreen vis={vis} />

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
  );
}

import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '../firebase';
import { fetchUserProfiles, createProfile } from '../firebaseUtils';
import { Profile } from '../types';
import { LogIn, LogOut, Plus, User as UserIcon, Award, UserCheck, Flame, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileSelectorProps {
  onProfileSelect: (profile: Profile | null, isGoogleUser: boolean) => void;
  activeProfile: Profile | null;
}

// Local Storage Key for Guest profiles
const GUEST_KEY = 'blitz_guests_v2';

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ 
  onProfileSelect, 
  activeProfile 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load profiles when user changes
  useEffect(() => {
    loadProfileList();
  }, [user]);

  const loadProfileList = async () => {
    setProfilesLoading(true);
    setErrorMessage('');
    try {
      if (user) {
        // Authenticated users get Firestore profiles
        const list = await fetchUserProfiles(user.uid);
        setProfiles(list);
      } else {
        // Guest users get localStorage lists
        const guests = localStorage.getItem(GUEST_KEY);
        if (guests) {
          setProfiles(JSON.parse(guests));
        } else {
          setProfiles([]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("無法讀取存檔 / Failed to list profiles. Using temporary guest records.");
      // Fallback
      const guests = localStorage.getItem(GUEST_KEY);
      if (guests) setProfiles(JSON.parse(guests));
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("登入失敗 / Google Login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      // Clear current selection
      onProfileSelect(null, false);
      await signOut(auth);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProfileName.trim();
    if (!name) return;

    setProfilesLoading(true);
    setErrorMessage('');
    try {
      if (user) {
        const p = await createProfile(name, user.uid);
        setProfiles(prev => [p, ...prev]);
        onProfileSelect(p, true);
      } else {
        // Save locally for Guest
        const p: Profile = {
          id: 'guest_' + Date.now(),
          name,
          maxLvl: 1,
          ownerId: 'guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updated = [p, ...profiles];
        localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
        setProfiles(updated);
        onProfileSelect(p, false);
      }
      setNewProfileName('');
      setShowCreate(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("無法建立檔案 / Failed to save profile.");
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleSelect = (p: Profile) => {
    onProfileSelect(p, !!user);
  };

  const handleGuestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("確定刪除此檔案？ Delete this local profile?")) return;
    const filtered = profiles.filter(p => p.id !== id);
    localStorage.setItem(GUEST_KEY, JSON.stringify(filtered));
    setProfiles(filtered);
    if (activeProfile?.id === id) {
      onProfileSelect(null, false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col gap-6" id="profile-container">
      {/* Auth Banner & Information with Extremely High Contrast (Geometric Balance) */}
      <div className="bg-zinc-900 border-l-8 border-yellow-400 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white rounded-none">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white text-black border-4 border-black rounded-none text-xl font-bold">
            {user ? <UserCheck size={28} strokeWidth={3} /> : <UserIcon size={28} strokeWidth={3} />}
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-yellow-400 uppercase">
              {user ? "雲端儲存已就緒" : "未登入訪客模式"}
            </h3>
            <p className="text-sm font-bold text-zinc-300 lowercase antialiased">
              {user ? `${user.displayName || user.email}` : "SAVED LOCALLY IN BROWSER"}
            </p>
          </div>
        </div>

        {user ? (
          <button 
            onClick={handleGoogleSignOut}
            className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-750 text-white font-black text-lg border-4 border-white rounded-none active:scale-95 transition-all flex items-center justify-center gap-2 uppercase shadow-[4px_4px_0_#000]"
          >
            <LogOut size={22} strokeWidth={3} />
            <span>登出 / LOGOUT</span>
          </button>
        ) : (
          <button 
            onClick={handleGoogleSignIn}
            className="w-full sm:w-auto px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-lg border-4 border-black rounded-none active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0_#FFF] uppercase"
          >
            {authLoading ? <Loader2 className="animate-spin" size={22} strokeWidth={3} /> : <LogIn size={22} strokeWidth={3} />}
            <span>GOOGLE SIGNIN</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-900 border-4 border-red-500 text-white font-extrabold text-lg text-center rounded-none shadow-[4px_4px_0_#000]">
          {errorMessage}
        </div>
      )}

      {/* Main Container (Geometric Balance Style) */}
      <div className="bg-zinc-900 border-l-8 border-white p-6 text-white rounded-none">
        
        {/* Create Profile vs List Profiles */}
        {showCreate ? (
          <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
            <h1 className="text-2xl font-black text-white text-center uppercase tracking-tighter">
              建立您的新檔案<br/>CREATE NEW PROFILE
            </h1>
            
            <div>
              <label className="block text-xl font-black text-yellow-400 mb-2 uppercase tracking-wide">
                請輸入名字 / Enter Name:
              </label>
              <input 
                type="text" 
                required
                maxLength={20}
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="例如: 媽媽, 王爺爺..."
                className="w-full tracking-wide p-4 bg-black border-4 border-yellow-400 rounded-none font-black text-2xl text-yellow-300 placeholder-zinc-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                type="submit" 
                className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-black font-black text-2xl rounded-none border-4 border-black active:scale-95 transition-all shadow-[4px_4px_0_#FFF]"
              >
                儲存 / SAVE
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreate(false)}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-2xl rounded-none border-4 border-white active:scale-95 transition-all shadow-[4px_4px_0_#000]"
              >
                取消 / CANCEL
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b-4 border-yellow-400 pb-3">
              <h2 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-2">
                <UserIcon className="text-yellow-400" size={28} strokeWidth={3} />
                <span>選擇挑戰檔案 / PROFILES</span>
              </h2>
              <button 
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-lg font-black rounded-none border-4 border-black flex items-center gap-1 active:scale-95 shadow-[3px_3px_0_#FFF] uppercase"
              >
                <Plus size={20} strokeWidth={3} />
                <span>新建 / NEW</span>
              </button>
            </div>

            {profilesLoading ? (
              <div className="flex flex-col items-center justify-center p-8 gap-3">
                <Loader2 className="animate-spin text-yellow-400" size={48} strokeWidth={3} />
                <p className="text-xl font-extrabold text-zinc-400">正在讀取記錄中... Loading...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center p-12 bg-black rounded-none border-4 border-dashed border-zinc-700">
                <p className="text-2xl font-black text-yellow-400 mb-2 uppercase">歡迎來到快照閃電戰！</p>
                <p className="text-lg font-bold text-zinc-400">目前沒有挑戰檔案。請點選上方「新建」按鈕來建立您的第一位玩家檔案！</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                {profiles.map((p) => {
                  const isActive = activeProfile?.id === p.id;
                  return (
                    <motion.div
                      key={p.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelect(p)}
                      className={`cursor-pointer p-4 border-4 rounded-none flex justify-between items-center transition-colors select-none ${
                        isActive 
                          ? 'bg-yellow-400 border-white text-black font-black shadow-[4px_4px_0_#FFF]' 
                          : 'bg-black border-zinc-700 text-white hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black tracking-tight uppercase">{p.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 text-base font-black rounded-none flex items-center gap-1 border-2 uppercase ${
                          isActive ? 'bg-black text-yellow-400 border-black' : 'bg-yellow-400 text-black border-white shadow-[2px_2px_0_#000]'
                        }`}>
                          <Flame size={16} fill="currentColor" strokeWidth={0} />
                          <span>LVL {p.maxLvl}</span>
                        </div>

                        {!user && (
                          <button 
                            onClick={(e) => handleGuestDelete(e, p.id)}
                            className="p-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-none font-black text-sm border-2 border-white"
                            title="Delete Guest Profile"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

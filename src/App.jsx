import React, { useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';

// Config & Data
import { auth, db, appId } from './config/firebase';

// Components
import { Sidebar, ChatListPanel, ChatArea, ReelsView, AdminLogin, AdminChatPanel } from './components';

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [view, setView] = useState('chat'); // 'chat', 'reels', or 'admin'
  const [activeChat, setActiveChat] = useState(null);
  // 관리자 상태는 초기화 시 localStorage에서 읽어옴
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthLoading(false);
      }
    });

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    };
    
    initAuth();
    return () => unsubscribe();
  }, []);

  const handleStartChat = async (vlog) => {
    if (!user) return;
    const chatId = `${user.uid}_${vlog.id}`;
    const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', chatId);
    
    await setDoc(chatRef, {
      guestId: user.uid,
      guestName: 'Guest User', 
      vloggerId: vlog.id,
      vloggerName: vlog.username,
      vloggerRole: vlog.role,
      lastTimestamp: serverTimestamp(),
    }, { merge: true });

    setActiveChat({ 
      id: chatId, 
      name: vlog.username, 
      role: vlog.role, 
      vloggerName: vlog.username, 
      vloggerRole: vlog.role, 
      vloggerId: vlog.id 
    });
    setView('chat'); // Go back to chat view
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    auth.signOut();
    window.location.reload();
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      // 이미 관리자면 관리자 뷰로 이동
      setView('admin');
    } else {
      // 관리자 로그인 모달 표시
      setShowAdminLogin(true);
    }
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('isAdmin', 'true');
    setShowAdminLogin(false);
    setView('admin');
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#1e2024] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="h-screen w-full bg-[#1e2024] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold">인증 오류</h2>
          <p className="text-gray-400 text-sm max-w-md">
            Firebase 익명 인증이 활성화되지 않았습니다.<br/>
            Firebase Console에서 Authentication → Sign-in method → Anonymous를 활성화해주세요.
          </p>
          {authError && (
            <p className="text-red-400 text-xs mt-2 bg-red-500/10 px-4 py-2 rounded-lg">
              {authError}
            </p>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#1e2024] font-sans overflow-hidden">
      
      {/* 관리자 로그인 모달 */}
      {showAdminLogin && (
        <AdminLogin 
          onLogin={handleAdminLogin}
          onCancel={() => setShowAdminLogin(false)}
        />
      )}

      {/* 1. Sidebar */}
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        onLogout={handleLogout}
        onAdminClick={handleAdminClick}
        isAdmin={isAdmin}
      />

      {/* 2. Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* 관리자 뷰 */}
        {view === 'admin' && isAdmin ? (
          <AdminChatPanel onBack={() => setView('chat')} />
        ) : (
          <>
            {/* Chat List & Chat Window Layout */}
            <ChatListPanel 
              currentUser={user} 
              activeChatId={activeChat?.id} 
              onSelectChat={setActiveChat} 
            />
            
            <ChatArea 
              activeChat={activeChat} 
              currentUser={user} 
            />

            {/* 3. Reels Overlay (When view is 'reels') */}
            {view === 'reels' && (
              <ReelsView 
                onClose={() => setView('chat')} 
                onStartChat={handleStartChat}
              />
            )}
          </>
        )}
      </div>

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  User,
  Clock,
  MessageCircle
} from 'lucide-react';
import { db, appId } from '../config/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc,
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { VLOG_DATA } from '../data/vlogData';

const AdminChatPanel = ({ onBack }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 모든 채팅방 가져오기
  useEffect(() => {
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats');
    const q = query(chatsRef, orderBy('lastTimestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);
    });
    
    return () => unsubscribe();
  }, []);

  // 선택된 채팅방의 메시지 가져오기
  useEffect(() => {
    if (!selectedChat) return;
    
    const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', `chats/${selectedChat.id}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    
    return () => unsubscribe();
  }, [selectedChat]);

  // 관리자가 메시지 보내기 (vlogger로서)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    const text = newMessage;
    setNewMessage('');
    
    try {
      const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', `chats/${selectedChat.id}/messages`);
      
      await addDoc(messagesRef, {
        text,
        senderId: selectedChat.vloggerId,
        senderType: 'vlogger',
        timestamp: serverTimestamp()
      });
      
      const chatDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', selectedChat.id);
      await setDoc(chatDocRef, {
        lastMessage: text,
        lastTimestamp: serverTimestamp(),
      }, { merge: true });
      
    } catch (error) {
      console.error('메시지 전송 오류:', error);
    }
  };

  const vlogInfo = selectedChat ? VLOG_DATA.find(v => v.id === selectedChat.vloggerId) : null;

  return (
    <div className="flex h-full bg-gray-100">
      {/* 채팅 목록 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg">관리자 채팅 관리</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 px-4">
              <MessageCircle size={40} className="mx-auto mb-2 text-gray-300" />
              <p>아직 채팅이 없습니다</p>
            </div>
          ) : (
            chats.map(chat => {
              const vlog = VLOG_DATA.find(v => v.id === chat.vloggerId);
              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    selectedChat?.id === chat.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {chat.vloggerName?.[0] || 'V'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm truncate">{chat.vloggerName}</h3>
                        <span className="text-[10px] text-gray-400">
                          {chat.lastTimestamp?.seconds 
                            ? new Date(chat.lastTimestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage || '대화 시작'}</p>
                      <p className="text-[10px] text-purple-500 mt-1">{vlog?.role}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* 헤더 */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {selectedChat.vloggerName?.[0]}
                </div>
                <div>
                  <h3 className="font-bold">{selectedChat.vloggerName}</h3>
                  <p className="text-xs text-gray-500">{vlogInfo?.role} 역할로 응답</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User size={14} />
                <span>게스트: {selectedChat.guestId?.slice(0, 8)}...</span>
              </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => {
                const isVlogger = msg.senderType === 'vlogger';
                return (
                  <div key={msg.id} className={`flex ${isVlogger ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isVlogger ? 'order-2' : ''}`}>
                      <div className={`px-4 py-2 rounded-2xl text-sm ${
                        isVlogger 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${isVlogger ? 'justify-end' : ''}`}>
                        <Clock size={10} />
                        <span>
                          {msg.timestamp?.seconds 
                            ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                            : 'Just now'}
                        </span>
                        <span className="ml-1">
                          {isVlogger ? '(관리자)' : '(게스트)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`${selectedChat.vloggerName}(으)로 답장하기...`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`px-6 py-3 rounded-xl transition font-medium flex items-center gap-2 ${
                    newMessage.trim() 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                  전송
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>왼쪽에서 채팅방을 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatPanel;

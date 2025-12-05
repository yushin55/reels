import React, { useState, useEffect } from 'react';
import { Bookmark, Play, X, MessageCircle, Trash2 } from 'lucide-react';
import { db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';

const BookmarksView = ({ onClose, onStartChat }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const bookmarkList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // 클라이언트 사이드에서 정렬
        bookmarkList.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setBookmarks(bookmarkList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching bookmarks:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (bookmarkId) => {
    try {
      await deleteDoc(doc(db, 'bookmarks', bookmarkId));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleStartChat = (vlogData) => {
    onStartChat(vlogData);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#1e2024] flex flex-col">
      {/* 헤더 */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Bookmark size={20} className="text-yellow-400" />
          저장된 영상
          <span className="text-sm font-normal text-gray-400 ml-2">
            {bookmarks.length}개
          </span>
        </h2>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded-full text-white transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">로딩 중...</p>
            </div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <Bookmark size={40} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-500 mb-2">저장된 영상이 없습니다</h3>
            <p className="text-sm text-center">릴스에서 마음에 드는 영상을<br/>저장 버튼으로 추가해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {bookmarks.map((bookmark) => {
              const vlog = bookmark.vlogData;
              return (
                <div 
                  key={bookmark.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-yellow-400 transition group"
                >
                  {/* 썸네일 */}
                  <div className="relative aspect-[9/16] bg-gray-900" style={{maxHeight: '180px'}}>
                    <img 
                      src={`https://img.youtube.com/vi/${vlog.videoId}/maxresdefault.jpg`}
                      alt={vlog.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${vlog.videoId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    {/* 재생 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play size={28} className="text-gray-900 fill-gray-900 ml-1" />
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>

                    {/* 하단 정보 */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {vlog.username[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-xs truncate">{vlog.username}</h3>
                          <p className="text-gray-300 text-[10px] truncate">{vlog.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="p-2 bg-gray-800">
                    <button
                      onClick={() => handleStartChat(vlog)}
                      className="w-full py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageCircle size={12} />
                      대화하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksView;

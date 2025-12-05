import React, { useState, useEffect } from 'react';
import { Bookmark, Play, X, MessageCircle, Trash2, ArrowLeft } from 'lucide-react';
import { db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';

const BookmarksView = ({ onClose, onStartChat }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

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
    setSelectedMentor(vlogData);
    setShowPaymentModal(true);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#1e2024] flex flex-col">
      {/* 헤더 */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose} 
            className="sm:hidden p-2 hover:bg-white/10 rounded-full text-white transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
            <Bookmark size={18} className="text-yellow-400 sm:w-5 sm:h-5" />
            저장된 영상
            <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1 sm:ml-2">
              {bookmarks.length}개
            </span>
          </h2>
        </div>
        <button 
          onClick={onClose} 
          className="hidden sm:block p-2 hover:bg-white/10 rounded-full text-white transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm sm:text-base">로딩 중...</p>
            </div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <Bookmark size={32} className="text-gray-500 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-500 mb-2">저장된 영상이 없습니다</h3>
            <p className="text-xs sm:text-sm text-center">릴스에서 마음에 드는 영상을<br/>저장 버튼으로 추가해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
            {bookmarks.map((bookmark) => {
              const vlog = bookmark.vlogData;
              return (
                <div 
                  key={bookmark.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-yellow-400 transition group"
                >
                  {/* 썸네일 */}
                  <div className="relative w-full bg-gray-900" style={{paddingBottom: '133.33%', maxHeight: '180px'}}>
                    <img 
                      src={`https://img.youtube.com/vi/${vlog.videoId}/maxresdefault.jpg`}
                      alt={vlog.username}
                      className="absolute inset-0 w-full h-full object-cover"
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
                      className="w-full py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-[9px] leading-tight font-bold rounded-lg flex flex-col items-center justify-center gap-0.5 transition"
                    >
                      <span className="flex items-center gap-1">
                        <MessageCircle size={10} />
                        <span>상담채팅 30분</span>
                      </span>
                      <span>13,000원</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 결제 화면 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowPaymentModal(false); setSelectedMentor(null); }}}>
          <div className="bg-[#e8e8e8] shadow-2xl w-full max-w-[800px] flex flex-col sm:flex-row overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 왼쪽: 결제 수단 선택 */}
            <div className="w-[120px] bg-[#d9d9d9] flex flex-col text-[11px]">
              <div className="p-2.5 bg-white border-b border-[#ccc] flex items-center gap-1.5">
                <input type="checkbox" className="w-3 h-3" readOnly />
                <span className="text-gray-600">직접입력</span>
              </div>
              <div className="p-2.5 bg-[#ffcc00] text-gray-800 font-bold border-b border-[#e6b800]">
                신용카드
              </div>
              <div className="flex-1 bg-white">
                <div className="p-2.5 border-b border-[#eee] flex items-center gap-1.5">
                  <input type="checkbox" checked className="w-3 h-3 accent-blue-500" readOnly />
                  <span className="text-gray-700">신용카드</span>
                </div>
                <div className="p-2.5 text-[10px] text-gray-400 leading-tight">
                  신용카드 결제<br/>
                  결제 진행 시 ~
                </div>
                <div className="p-2.5 border-t border-[#eee] flex items-center gap-1.5">
                  <input type="checkbox" className="w-3 h-3" readOnly />
                  <span className="text-gray-600">실시간</span>
                </div>
                <div className="p-2.5 border-t border-[#eee] flex items-center gap-1.5">
                  <input type="checkbox" className="w-3 h-3" readOnly />
                  <span className="text-gray-600">가상계좌</span>
                </div>
                <div className="p-2.5 border-t border-[#eee] flex items-center gap-1.5">
                  <input type="checkbox" className="w-3 h-3" readOnly />
                  <span className="text-gray-600">카카오</span>
                </div>
              </div>
            </div>

            {/* 가운데: 결제 수단 상세 */}
            <div className="flex-1 bg-white p-4 overflow-y-auto border-l border-r border-[#ddd]">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#eee]">
                <div className="flex items-center">
                  <span className="text-[#0066cc] font-bold text-sm">Code</span>
                  <span className="text-[#ff3366] font-bold text-sm">M</span>
                  <span className="text-gray-700 font-bold text-sm">Shop</span>
                </div>
                <p className="text-gray-400 text-[11px]">안전하고 편리한 이니시스결제입니다.</p>
              </div>

              {/* 이용약관 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-800 font-bold text-[13px]">이용약관</span>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3" readOnly />
                    <span className="text-gray-500 text-[11px]">전체동의</span>
                  </label>
                </div>
                <div className="bg-[#f9f9f9] p-3 border border-[#ddd] text-[11px]">
                  <div className="mb-1.5">
                    <span className="text-gray-700">전자금융거래 이용약관</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="text-gray-600">개인정보의 수집 및 이용안내</span>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-2.5 h-2.5" readOnly />
                      <span className="text-gray-500">동의</span>
                    </label>
                    <span className="text-gray-600">개인정보 제공 및 위탁안내</span>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-2.5 h-2.5" readOnly />
                      <span className="text-gray-500">동의</span>
                    </label>
                  </div>
                  <button className="mt-2 px-2.5 py-1 bg-[#ffcc00] text-gray-700 text-[10px] rounded-sm font-medium">
                    약관보기 ▼
                  </button>
                </div>
              </div>

              {/* 간편결제 */}
              <div className="space-y-2">
                {/* 카카오페이 */}
                <div className="flex items-center p-2.5 border border-[#ddd] bg-white cursor-pointer hover:bg-gray-50">
                  <div className="w-[50px] h-[22px] bg-[#ffeb00] rounded-sm flex items-center justify-center mr-3">
                    <span className="text-[#3c1e1e] font-bold text-[10px]">●pay</span>
                  </div>
                  <span className="text-gray-600 text-[12px]">온 국민이 다 쓰는 카카오페이</span>
                </div>

                {/* SSG페이 */}
                <div className="flex items-center justify-between p-2.5 border border-[#ddd] bg-white cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center">
                    <span className="text-[#ff3366] font-bold text-[13px] mr-0.5">SSG</span>
                    <span className="text-[#ffcc00] font-bold text-[13px]">PAY.</span>
                    <span className="text-[#ff6699] text-[11px] ml-2">처음 쓰는 당신에게 3천원이 쏙~</span>
                  </div>
                  <span className="w-5 h-5 border border-[#ccc] rounded-full flex items-center justify-center text-gray-400 text-[12px]">+</span>
                </div>

                {/* 기타 페이 */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">PAYCO</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">L.pay</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">KPAY</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">samsungPay</button>
                </div>

                {/* 카드사 선택 - 현대/삼성 */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50 flex items-center justify-center gap-1">
                    현대카드 <span className="w-4 h-4 bg-[#eee] rounded-full text-[10px] flex items-center justify-center">+</span>
                  </button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50 flex items-center justify-center gap-1">
                    삼성카드 <span className="w-4 h-4 bg-[#eee] rounded-full text-[10px] flex items-center justify-center">+</span>
                  </button>
                </div>

                {/* 카드사 4열 */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">비씨카드</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">KB국민</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">신한카드</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">롯데카드</button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">NH농협</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">하나카드</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">씨티카드</button>
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">UnionPay</button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button className="p-2 border border-[#ddd] bg-white text-gray-600 text-[11px] hover:bg-gray-50">그외카드</button>
                </div>
              </div>

              {/* 국기 아이콘 */}
              <div className="flex items-center gap-2 mt-4">
                <div className="w-7 h-5 border border-[#ddd] overflow-hidden flex flex-col">
                  <div className="flex-1 bg-[#bf0a30]"></div>
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-[#bf0a30]"></div>
                </div>
                <div className="w-7 h-5 bg-white border border-[#ddd] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-b from-[#c60c30] via-[#c60c30] to-[#003478]"></div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 결제 정보 */}
            <div className="w-[180px] bg-[#fff8dc] p-4 flex flex-col relative">
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedMentor(null);
                }}
                className="absolute top-2 right-2 text-[#ff6666] hover:text-[#ff3333] text-xl font-bold"
              >
                ×
              </button>

              <div className="mb-4 mt-2">
                <span className="text-[#ff6600] font-bold text-[15px]">KG</span>
                <span className="text-gray-600 text-[15px]"> 이니시스</span>
              </div>

              <div className="space-y-2.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">상품명</span>
                  <span className="text-[#0066cc]">1:1 멘토링</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">상품가격</span>
                  <span className="text-[#ff6600]">13,000 원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">제공기간</span>
                  <span className="text-[#ff6600]">별도제공기간없음</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#eed]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-[11px]">결제금액</span>
                  <span className="text-[#0066cc] font-bold text-[16px]">13,000 원</span>
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    alert('결제가 완료되었습니다!');
                    setShowPaymentModal(false);
                    setSelectedMentor(null);
                  }}
                  className="w-full py-2 bg-gradient-to-b from-[#ffdd55] to-[#ffcc00] hover:from-[#ffcc00] hover:to-[#eebb00] text-gray-700 text-[12px] font-medium rounded-sm border border-[#dda] transition-all flex items-center justify-center gap-1"
                >
                  다 음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarksView;

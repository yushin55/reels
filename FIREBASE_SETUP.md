# Firebase 설정 가이드

## 북마크 기능이 작동하지 않을 때 확인 사항

### 1. Firebase Authentication 활성화
1. Firebase Console 접속: https://console.firebase.google.com
2. 프로젝트 선택: `reels-c097d`
3. 왼쪽 메뉴 → **Authentication** 클릭
4. **Sign-in method** 탭 클릭
5. **Anonymous** 항목 찾기 → **사용 설정** 활성화
6. 저장

### 2. Firestore Database 보안 규칙 설정
1. Firebase Console → **Firestore Database** 클릭
2. **규칙** 탭 클릭
3. 아래 규칙으로 변경 (개발용):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 북마크 컬렉션 - 인증된 사용자만 자신의 북마크 읽기/쓰기
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // 다른 컬렉션들 (기존 규칙 유지)
    match /artifacts/{artifactId}/{document=**} {
      allow read, write: if true;  // 개발용 - 운영에서는 반드시 변경!
    }
    
    match /oneOnOneClicks/{docId} {
      allow read, write: if true;
    }
    
    match /templateQuestions/{docId} {
      allow read, write: if true;
    }
  }
}
```

4. **게시** 버튼 클릭

### 3. 브라우저 콘솔 확인
- F12 키 → Console 탭
- 빨간색 에러 메시지 확인
- 일반적인 에러:
  - `permission-denied`: 보안 규칙 문제
  - `unauthenticated`: Anonymous 인증 비활성화
  - `not-found`: Firestore Database 미생성

### 4. 환경변수 확인
`.env` 파일이 올바른지 확인:
```env
VITE_FIREBASE_API_KEY=AIzaSyD_p56sbYYViIttIMQ69bjl6OKsrJYgHPI
VITE_FIREBASE_AUTH_DOMAIN=reels-c097d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=reels-c097d
VITE_FIREBASE_STORAGE_BUCKET=reels-c097d.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=740793817472
VITE_FIREBASE_APP_ID=1:740793817472:web:2b2569ca18175aed960965
VITE_FIREBASE_MEASUREMENT_ID=G-J2G7G88S6F
VITE_APP_ID=job-reels-app
```

### 5. 개발 서버 재시작
환경변수 변경 후 반드시 재시작:
```powershell
npm run dev
```

## 문제 해결 체크리스트
- [ ] Firebase Authentication → Anonymous 활성화됨
- [ ] Firestore Database 생성됨
- [ ] Firestore 보안 규칙 설정됨
- [ ] `.env` 파일 존재하고 값이 올바름
- [ ] 개발 서버 재시작함
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 브라우저 새로고침함

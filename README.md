# 📝 나만의 블로그

Next.js 14 + Supabase + Vercel로 구축된 개인 블로그입니다.

## ✨ 주요 기능

- 🌓 **라이트/다크 모드** 전환
- 📝 **WYSIWYG + Markdown** 듀얼 에디터
- 🏷️ **해시태그** 필터링
- 📅 **작성일시 / 수정일시** 표시
- 🔐 **Supabase Auth** 로그인
- 📦 **백업 / 마이그레이션** 기능 (JSON)
- 🚀 **Vercel** 원클릭 배포

---

## 🚀 배포 가이드

### 1단계: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → 새 프로젝트 생성
2. **SQL Editor**에서 `supabase/schema.sql` 전체 내용을 복사하여 실행
3. **Authentication > Providers**에서 Email 로그인 활성화
4. 블로그 관리자 계정 생성:
   - Authentication > Users > Add User → 이메일/비밀번호 입력
5. **Project Settings > API**에서 다음 값 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2단계: GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial blog setup"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3단계: Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 저장소 연결
2. **Environment Variables** 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
3. **Deploy** 클릭

### 4단계: Supabase 인증 URL 설정

Vercel 배포 완료 후 발급된 URL (예: `https://my-blog.vercel.app`)을 Supabase에 등록:

- **Authentication > URL Configuration**:
  - Site URL: `https://my-blog.vercel.app`
  - Redirect URLs에 `https://my-blog.vercel.app/**` 추가

---

## 💻 로컬 개발

```bash
# 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 Supabase 키 입력

# 패키지 설치
npm install --legacy-peer-deps

# 개발 서버 실행
npm run dev
```

`http://localhost:3000` 접속

---

## 📁 프로젝트 구조

```
blog-project/
├── app/
│   ├── page.tsx              # 홈 (포스트 목록)
│   ├── login/page.tsx        # 로그인
│   ├── write/page.tsx        # 포스트 작성/수정
│   ├── posts/[slug]/page.tsx # 포스트 상세
│   ├── tags/page.tsx         # 해시태그 목록
│   ├── about/page.tsx        # 소개
│   ├── settings/page.tsx     # 설정 (백업/마이그레이션)
│   └── auth/callback/route.ts
├── components/
│   ├── GNB.tsx               # 상단 내비게이션
│   ├── Sidebar.tsx           # 우측 사이드바 (포스트 목록)
│   ├── PostCard.tsx          # 포스트 카드
│   ├── PostContent.tsx       # 포스트 본문 렌더러
│   ├── WysiwygEditor.tsx     # TipTap WYSIWYG 에디터
│   ├── MarkdownEditor.tsx    # Markdown 에디터
│   └── ThemeProvider.tsx     # 다크모드 Provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # 클라이언트용 Supabase
│   │   └── server.ts         # 서버용 Supabase
│   └── types.ts              # TypeScript 타입
├── supabase/
│   └── schema.sql            # DB 스키마
├── middleware.ts             # 세션 갱신 미들웨어
└── .env.local.example        # 환경변수 템플릿
```

---

## 🗄️ 데이터베이스 스키마

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본 키 |
| user_id | uuid | 작성자 (auth.users 참조) |
| title | text | 제목 |
| content | text | 본문 (HTML 또는 Markdown) |
| content_type | text | 'wysiwyg' \| 'markdown' |
| slug | text | URL 식별자 (unique) |
| excerpt | text | 미리보기 텍스트 |
| tags | text[] | 태그 배열 |
| published | boolean | 공개 여부 |
| created_at | timestamptz | 작성일시 |
| updated_at | timestamptz | 수정일시 (자동 업데이트) |

---

## 📦 백업 & 마이그레이션

1. 로그인 후 **GNB > 설정** 이동
2. **포스트 백업** → JSON 파일 다운로드
3. 새 블로그에서 **포스트 가져오기** → JSON 파일 업로드 → 가져오기 실행

---

## 🛠 사용 기술

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS + CSS Variables
- **WYSIWYG**: TipTap
- **Markdown**: @uiw/react-md-editor + react-markdown
- **Deployment**: Vercel
- **Theme**: next-themes

-- ============================================
-- 블로그 Supabase 스키마 설정
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- posts 테이블
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null default '',
  content_type text not null default 'wysiwyg' check (content_type in ('wysiwyg', 'markdown')),
  slug text unique not null,
  excerpt text,
  tags text[] default '{}',
  published boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- updated_at 자동 업데이트 트리거
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.handle_updated_at();

-- RLS (Row Level Security) 활성화
alter table public.posts enable row level security;

-- 정책: 모든 사용자가 published 포스트 읽기 가능
create policy "Anyone can read published posts"
  on public.posts for select
  using (published = true);

-- 정책: 인증된 사용자가 자신의 모든 포스트 읽기 가능
create policy "Users can read own posts"
  on public.posts for select
  using (auth.uid() = user_id);

-- 정책: 인증된 사용자가 포스트 작성 가능
create policy "Users can insert own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- 정책: 인증된 사용자가 자신의 포스트 수정 가능
create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

-- 정책: 인증된 사용자가 자신의 포스트 삭제 가능
create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- slug 자동 생성 함수
create or replace function public.generate_slug(title text)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- 한글/영문 슬러그 생성 (타임스탬프 기반)
  base_slug := lower(regexp_replace(
    regexp_replace(title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  if length(base_slug) = 0 then
    base_slug := 'post';
  end if;
  
  -- 너무 길면 자르기
  base_slug := left(base_slug, 60);
  
  -- 타임스탬프 추가로 유니크하게
  final_slug := base_slug || '-' || to_char(now(), 'YYYYMMDD-HH24MISS');
  
  return final_slug;
end;
$$ language plpgsql;

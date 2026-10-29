-- The server owns this private schema. No anonymous or browser database access.
create schema if not exists cutdesk;
revoke all on schema cutdesk from public, anon, authenticated;
create table if not exists cutdesk.projects (
 id uuid primary key default gen_random_uuid(), title text not null,
 source_revision integer, source_metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists cutdesk.episodes (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references cutdesk.projects(id),
 code text not null, title text not null, source jsonb not null default '{}', unique(project_id,code)
);
create table if not exists cutdesk.cuts (
 id uuid primary key default gen_random_uuid(), episode_id uuid not null references cutdesk.episodes(id),
 source_id text, code text not null, title text not null default '', scene text not null default '',
 status text not null default '검토', duration numeric not null default 0, story text not null default '',
 dialogue text not null default '', prompt text not null default '', prompt_draft text not null default '',
 notes text not null default '', source jsonb not null default '{}', version integer not null default 1,
 updated_by text not null default '초기 이관', updated_at timestamptz not null default now(), deleted_at timestamptz,
 unique(episode_id,code)
);
create table if not exists cutdesk.assets (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references cutdesk.projects(id),
 name text not null, path text not null, kind text not null default 'image', role text not null default '',
 checksum text, object_key text, preview_key text, mime text, bytes bigint, source jsonb not null default '{}',
 created_at timestamptz not null default now(), unique(project_id,path)
);
create table if not exists cutdesk.cut_assets (
 cut_id uuid not null references cutdesk.cuts(id), asset_id uuid not null references cutdesk.assets(id),
 selected boolean not null default true, note text not null default '', sort_order integer not null default 0,
 primary key(cut_id,asset_id)
);
create table if not exists cutdesk.versions (
 id bigint generated always as identity primary key, cut_id uuid not null references cutdesk.cuts(id),
 version integer not null, actor text not null, action text not null, snapshot jsonb not null,
 created_at timestamptz not null default now(), unique(cut_id,version)
);
create table if not exists cutdesk.imports (
 id uuid primary key default gen_random_uuid(), checksum text unique not null, source_revision integer,
 snapshot jsonb not null, created_at timestamptz not null default now()
);
create table if not exists cutdesk.login_attempts (
 key text primary key, attempts integer not null default 1, expires_at timestamptz not null
);
create index if not exists cutdesk_cuts_episode on cutdesk.cuts(episode_id,code);
create index if not exists cutdesk_versions_cut on cutdesk.versions(cut_id,id desc);
create index if not exists cutdesk_cut_assets_asset on cutdesk.cut_assets(asset_id);
alter table cutdesk.projects enable row level security;
alter table cutdesk.episodes enable row level security;
alter table cutdesk.cuts enable row level security;
alter table cutdesk.assets enable row level security;
alter table cutdesk.cut_assets enable row level security;
alter table cutdesk.versions enable row level security;
alter table cutdesk.imports enable row level security;
alter table cutdesk.login_attempts enable row level security;
revoke all on all tables in schema cutdesk from public,anon,authenticated;
revoke all on all sequences in schema cutdesk from public,anon,authenticated;
alter table cutdesk.cuts add column if not exists work_prompt text not null default '';

create table if not exists cutdesk.chief_reviews (
 cut_id uuid primary key references cutdesk.cuts(id) on delete cascade,
 source_revision integer not null, verified_revision integer not null,
 report_checksum text not null, base_prompt_hash text not null,
 status text not null, application text not null,
 issues jsonb not null default '[]', proposal text not null,
 asset_plan jsonb not null default '[]', imported_at timestamptz not null default now()
);
alter table cutdesk.chief_reviews enable row level security;
revoke all on cutdesk.chief_reviews from public,anon,authenticated;

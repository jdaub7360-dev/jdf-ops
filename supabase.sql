-- Run once in the Supabase SQL editor. Stores failed dashboard logins for the lockout.
create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_ip_at on login_attempts (ip, at desc);
alter table login_attempts enable row level security; -- no policies: only the service key can touch it
-- optional cleanup, safe to run any time
-- delete from login_attempts where at < now() - interval '2 days';

-- Shared "ordered" marks for the Overview to order list. Run once; only the service key can touch it.
create table if not exists order_marks (
  key text primary key,
  marked_at timestamptz not null default now(),
  stock numeric
);
alter table order_marks enable row level security;

-- Run once in this project's Supabase SQL Editor.
begin;
create table if not exists public.fp_time_total (id boolean primary key default true check(id), seconds bigint not null default 0 check(seconds>=0));
insert into public.fp_time_total(id) values(true) on conflict do nothing;
create table if not exists public.fp_time_sessions (id uuid primary key, last_seen timestamptz not null default now());
alter table public.fp_time_total enable row level security;
alter table public.fp_time_sessions enable row level security;
revoke all on public.fp_time_total, public.fp_time_sessions from anon,authenticated;
create or replace function public.fp_read_time() returns bigint language sql security definer set search_path='' as $$ select seconds from public.fp_time_total where id=true $$;
create or replace function public.fp_tick(p_session uuid) returns bigint language plpgsql security definer set search_path='' as $$
declare previous timestamptz; elapsed double precision; total bigint;
begin
 if p_session is null then raise exception 'Session required'; end if;
 insert into public.fp_time_sessions(id) values(p_session) on conflict do nothing;
 select last_seen into previous from public.fp_time_sessions where id=p_session for update;
 elapsed=extract(epoch from (now()-previous));
 if elapsed>=25 then
  update public.fp_time_sessions set last_seen=now() where id=p_session;
  if elapsed<=45 then update public.fp_time_total set seconds=seconds+30 where id=true; end if;
 end if;
 -- Small, probabilistic cleanup avoids storing identifiers indefinitely.
 if random()<0.01 then delete from public.fp_time_sessions where last_seen<now()-interval '1 day'; end if;
 select seconds into total from public.fp_time_total where id=true;
 return total;
end $$;
revoke all on function public.fp_read_time() from public;
revoke all on function public.fp_tick(uuid) from public;
grant execute on function public.fp_read_time() to anon,authenticated;
grant execute on function public.fp_tick(uuid) to anon,authenticated;
commit;

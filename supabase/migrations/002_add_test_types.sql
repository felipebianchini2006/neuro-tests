alter table public.sessions
  drop constraint sessions_test_type_check,
  add constraint sessions_test_type_check
    check (test_type in ('sequence', 'cubes', 'cubes-teen', 'puzzle'));

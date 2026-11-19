CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT '',
  project text NOT NULL DEFAULT '',
  deadline text,
  updated text,
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS portfolio_items (
  id text PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT '',
  lane text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  updated text,
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS tickets (
  id text PRIMARY KEY,
  code text NOT NULL DEFAULT '',
  title text NOT NULL,
  status text NOT NULL DEFAULT '',
  agent text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT '',
  deadline text,
  updated text,
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
  id serial PRIMARY KEY,
  ip_hash text NOT NULL,
  ok boolean NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_ip_at ON login_attempts (ip_hash, at);

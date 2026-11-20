-- ================================================================================
-- SUPABASE MIGRATION SCRIPT - WEDDING PHOTO GALLERY & SLIDESHOW PLATFORM
-- Engine: ZettBOT v4.1 by Zettbos
-- Target: Supabase (PostgreSQL 15+)
-- ================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: events (Pengganti Sheet 'Daftar_Acara')
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,                            -- Slug unik, misal: andre-fayola-281
  name TEXT NOT NULL,                             -- Nama Acara: Andre & Fayola
  date TEXT NOT NULL,                             -- Tanggal: 22 November 2026
  venue TEXT DEFAULT '',                          -- Lokasi Gedung / Ballroom
  home_url TEXT DEFAULT '',                       -- URL Galeri Event
  drive_folder_id TEXT DEFAULT '',                -- ID Folder Google Drive
  all_photos_label TEXT DEFAULT 'Photostage',     -- Label Tab Utama
  photobooth_url TEXT DEFAULT '',                 -- URL Vendor Photobooth
  frame_image_url TEXT DEFAULT '',                -- URL PNG Bingkai Transparan
  logo_url TEXT DEFAULT '',                       -- Monogram / Logo Acara
  custom_categories JSONB DEFAULT '[]'::jsonb,    -- Array JSON Kategori Kustom
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Selesai', 'Draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger otomatis perbarui updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. TABEL: settings (Pengganti Sheet 'Pengaturan')
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. TABEL: admin_users (Pengganti Sheet 'Pengguna_Admin')
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: activity_logs (Pengganti Sheet 'Log_Aktivitas')
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
  admin_user TEXT DEFAULT 'System',
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Events: Publik bebas membaca (SELECT), Modifikasi diizinkan untuk anon (atau service role)
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events" 
  ON public.events FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow anon all on events" ON public.events;
CREATE POLICY "Allow anon all on events" 
  ON public.events FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 2. Settings: Publik bebas membaca (SELECT), Modifikasi diizinkan
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" 
  ON public.settings FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow anon all on settings" ON public.settings;
CREATE POLICY "Allow anon all on settings" 
  ON public.settings FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 3. Admin Users: Akses verifikasi login
DROP POLICY IF EXISTS "Allow anon select admin_users" ON public.admin_users;
CREATE POLICY "Allow anon select admin_users" 
  ON public.admin_users FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow anon mutate admin_users" ON public.admin_users;
CREATE POLICY "Allow anon mutate admin_users" 
  ON public.admin_users FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 4. Activity Logs: Catat log
DROP POLICY IF EXISTS "Allow anon all on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow anon all on activity_logs" 
  ON public.activity_logs FOR ALL 
  USING (true)
  WITH CHECK (true);

-- ================================================================================
-- REALTIME REPLICATION ENABLE
-- ================================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- ================================================================================
-- SEED DATA: 3 EVENT AKTIF DARI GOOGLE SHEETS
-- ================================================================================
INSERT INTO public.events (id, name, date, venue, home_url, drive_folder_id, all_photos_label, photobooth_url, frame_image_url, logo_url, custom_categories, status)
VALUES
  (
    'andre-fayola-281',
    'Andre & Fayola',
    '22 November 2026',
    'UPPERHILLS CONVENTION HALLS',
    'https://gallery.runway.my.id/?event=andre-fayola-281',
    '1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh',
    'Photostage',
    'https://photos.app.goo.gl/QkqewYw4dWfocxfK8',
    '',
    '',
    '[{"name": "Photobooth", "url": "https://photos.app.goo.gl/QkqewYw4dWfocxfK8", "enabled": true, "isPhotobooth": true}]'::jsonb,
    'Aktif'
  ),
  (
    'wilson-felicia-133',
    'Wilson & Felicia',
    '16 November 2026',
    'UpperHills Convention Hall, Makassar',
    'https://gallery.runway.my.id/?event=wilson-felicia-133',
    '1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5',
    'Photostage',
    'https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs',
    '',
    '',
    '[{"name": "Photobooth", "url": "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", "enabled": true, "isPhotobooth": true}]'::jsonb,
    'Aktif'
  ),
  (
    'tommy-natasha-594',
    'Tommy & Natasha',
    'Rabu, 25 November 2026',
    'UpperHills Convention Hall, Makassar',
    'https://gallery.runway.my.id/?event=tommy-natasha-594',
    '1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh',
    'Photostage',
    'https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR',
    '',
    '',
    '[{"id": "special_photobooth", "name": "Photobooth", "url": "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", "enabled": true, "isPhotobooth": true}]'::jsonb,
    'Aktif'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  date = EXCLUDED.date,
  venue = EXCLUDED.venue,
  home_url = EXCLUDED.home_url,
  drive_folder_id = EXCLUDED.drive_folder_id,
  photobooth_url = EXCLUDED.photobooth_url,
  custom_categories = EXCLUDED.custom_categories,
  status = EXCLUDED.status,
  updated_at = NOW();

-- SEED DATA: AKUN ADMIN
INSERT INTO public.admin_users (id, username, name, pin, role)
VALUES
  ('usr_superadmin', 'admin', 'Super Admin', '111111', 'Super Admin'),
  ('usr_mwid2vkz_759', 'ilham', 'ilham', '121212', 'Admin'),
  ('usr_mwii1zmz_598', 'Wanta', 'Wanta', '888888', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- SEED DATA: SETTINGS DEFAULT
INSERT INTO public.settings (key, value, description)
VALUES
  ('SLIDESHOW_INTERVAL_SEC', '4', 'Interval perputaran slideshow dalam detik'),
  ('AUTO_REFRESH_INTERVAL_SEC', '20', 'Interval polling fallback jika websocket terputus'),
  ('NEW_BADGE_MINUTES', '10', 'Durasi penanda foto baru dalam menit'),
  ('ALL_PHOTOS_LABEL', 'Semua Foto', 'Label default tab foto utama')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();


-- =====================================================
-- SCHEMA SQL COMPLETO - ESPORTA/RICREA DATABASE
-- Generato per migrazione a nuovo progetto Lovable
-- =====================================================

-- NOTA: Esegui questo script nel nuovo progetto Lovable
-- usando lo strumento di migrazione (non tutto insieme!)
-- Dividi in sezioni e applica una alla volta.

-- =====================================================
-- PARTE 1: ENUM TYPES
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- =====================================================
-- PARTE 2: TABELLE PRINCIPALI
-- =====================================================

-- Tabella: profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  username text,
  avatar_url text DEFAULT 'robot-1',
  user_code text NOT NULL UNIQUE,
  inviter_code text,
  email_verified boolean DEFAULT false,
  verification_code text,
  verification_expires_at timestamp with time zone,
  wallet_balance numeric DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  referral_earnings numeric DEFAULT 0,
  total_computing_power numeric DEFAULT 0,
  tcoin_balance numeric DEFAULT 0,
  referral_level text DEFAULT 'apprendista',
  saved_wallet_address text,
  transaction_pin_hash text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella: user_roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: invite_codes
CREATE TABLE public.invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  owner_id uuid,
  is_active boolean DEFAULT true,
  uses_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: referral_levels
CREATE TABLE public.referral_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  min_computing_power numeric NOT NULL,
  min_members integer NOT NULL,
  monthly_salary numeric NOT NULL,
  sort_order integer NOT NULL,
  position_title text
);

-- Tabella: mining_devices
CREATE TABLE public.mining_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  computing_power numeric NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  is_promo boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella: device_durations
CREATE TABLE public.device_durations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  days integer NOT NULL,
  bonus_percentage numeric DEFAULT 0,
  is_promo boolean DEFAULT false,
  promo_name text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: user_devices
CREATE TABLE public.user_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  device_id uuid NOT NULL REFERENCES public.mining_devices(id),
  status text DEFAULT 'standby',
  duration_days integer,
  bonus_percentage numeric DEFAULT 0,
  started_at timestamp with time zone,
  ends_at timestamp with time zone,
  earnings numeric DEFAULT 0,
  is_gifted boolean DEFAULT false,
  purchased_at timestamp with time zone DEFAULT now(),
  rental_expires_at timestamp with time zone,
  is_rental_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella: tasks
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  min_computing_power numeric NOT NULL DEFAULT 0,
  min_referral_level text,
  target_region text DEFAULT 'africa',
  base_daily_reward numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabella: user_tasks
CREATE TABLE public.user_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id),
  duration_days integer NOT NULL,
  bonus_percentage numeric DEFAULT 0,
  status text DEFAULT 'processing',
  started_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  earnings numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabella: transactions
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  exact_amount numeric,
  status text DEFAULT 'pending',
  wallet_address text,
  notes text,
  processed_by uuid,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: tcoin_transactions
CREATE TABLE public.tcoin_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: announcements
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: settings
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella: spin_settings
CREATE TABLE public.spin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_spins integer DEFAULT 3,
  spin_cooldown_hours integer DEFAULT 24,
  tcoin_to_usdc_rate numeric DEFAULT 100,
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella: user_spins
CREATE TABLE public.user_spins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  spins_used integer DEFAULT 0,
  last_spin_reset timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella: user_shares
CREATE TABLE public.user_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  share_type text NOT NULL,
  screenshot_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabella: email_verification_tokens
CREATE TABLE public.email_verification_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  email text NOT NULL,
  used boolean DEFAULT false,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabella: pin_reset_tokens
CREATE TABLE public.pin_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  used boolean DEFAULT false,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- PARTE 3: ABILITA RLS SU TUTTE LE TABELLE
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcoin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_reset_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 4: FUNZIONI HELPER
-- =====================================================

-- Funzione: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Funzione: generate_user_code
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'MX' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Funzione: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- PARTE 5: RLS POLICIES
-- =====================================================

-- Policies per profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own non-financial profile fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    (auth.uid() = user_id) AND
    (NOT (wallet_balance IS DISTINCT FROM (SELECT wallet_balance FROM profiles WHERE user_id = auth.uid()))) AND
    (NOT (tcoin_balance IS DISTINCT FROM (SELECT tcoin_balance FROM profiles WHERE user_id = auth.uid()))) AND
    (NOT (referral_earnings IS DISTINCT FROM (SELECT referral_earnings FROM profiles WHERE user_id = auth.uid()))) AND
    (NOT (total_earnings IS DISTINCT FROM (SELECT total_earnings FROM profiles WHERE user_id = auth.uid()))) AND
    (NOT (total_computing_power IS DISTINCT FROM (SELECT total_computing_power FROM profiles WHERE user_id = auth.uid())))
  );

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Policies per user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per invite_codes
CREATE POLICY "Anyone can check invite codes" ON public.invite_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per referral_levels
CREATE POLICY "Anyone can view referral levels" ON public.referral_levels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage referral levels" ON public.referral_levels
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per mining_devices
CREATE POLICY "Anyone can view active devices" ON public.mining_devices
  FOR SELECT USING ((is_active = true) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage devices" ON public.mining_devices
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per device_durations
CREATE POLICY "Anyone can view active durations" ON public.device_durations
  FOR SELECT USING ((is_active = true) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage durations" ON public.device_durations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per user_devices
CREATE POLICY "Users can view own devices" ON public.user_devices
  FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own devices" ON public.user_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices status only" ON public.user_devices
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    (auth.uid() = user_id) AND
    (NOT (earnings IS DISTINCT FROM (SELECT earnings FROM user_devices ud WHERE ud.id = user_devices.id)))
  );

CREATE POLICY "Admins can manage all devices" ON public.user_devices
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per tasks
CREATE POLICY "Anyone can view active tasks" ON public.tasks
  FOR SELECT USING ((is_active = true) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tasks" ON public.tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per user_tasks
CREATE POLICY "Users can view own tasks" ON public.user_tasks
  FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own tasks" ON public.user_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks status only" ON public.user_tasks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    (auth.uid() = user_id) AND
    (NOT (earnings IS DISTINCT FROM (SELECT earnings FROM user_tasks ut WHERE ut.id = user_tasks.id)))
  );

CREATE POLICY "Admins can manage all user tasks" ON public.user_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per tcoin_transactions
CREATE POLICY "Users can view own tcoin transactions" ON public.tcoin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can create tcoin transactions" ON public.tcoin_transactions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all tcoin transactions" ON public.tcoin_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policies per announcements
CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING ((is_active = true) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per settings
CREATE POLICY "Admins can view settings" ON public.settings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per spin_settings
CREATE POLICY "Anyone can view spin settings" ON public.spin_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage spin settings" ON public.spin_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per user_spins
CREATE POLICY "Users can view own spins" ON public.user_spins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spins" ON public.user_spins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spins" ON public.user_spins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all spins" ON public.user_spins
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies per user_shares
CREATE POLICY "Users can view their own shares" ON public.user_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shares" ON public.user_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies per pin_reset_tokens
CREATE POLICY "Only admins can manage pin reset tokens" ON public.pin_reset_tokens
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- PARTE 6: FUNZIONI BUSINESS LOGIC
-- =====================================================

-- Funzione: handle_new_user (TRIGGER per auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_code TEXT;
  inviter TEXT;
BEGIN
  new_user_code := generate_user_code();
  inviter := NEW.raw_user_meta_data ->> 'inviter_code';
  
  INSERT INTO public.profiles (user_id, email, phone, user_code, inviter_code, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    new_user_code,
    inviter,
    NEW.raw_user_meta_data ->> 'username'
  );
  
  INSERT INTO public.invite_codes (code, owner_id)
  VALUES (new_user_code, NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  IF inviter IS NOT NULL THEN
    UPDATE public.invite_codes 
    SET uses_count = uses_count + 1 
    WHERE code = inviter;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Funzione: has_transaction_pin
CREATE OR REPLACE FUNCTION public.has_transaction_pin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_pin boolean;
BEGIN
  SELECT transaction_pin_hash IS NOT NULL INTO has_pin
  FROM profiles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(has_pin, false);
END;
$$;

-- Funzione: set_transaction_pin
CREATE OR REPLACE FUNCTION public.set_transaction_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET transaction_pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf'))
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Funzione: verify_transaction_pin
CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_user_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT transaction_pin_hash INTO stored_hash
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN stored_hash = extensions.crypt(p_pin, stored_hash);
END;
$$;

-- Funzione: reset_pin_with_token
CREATE OR REPLACE FUNCTION public.reset_pin_with_token(p_token text, p_new_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token_record record;
BEGIN
  SELECT * INTO v_token_record
  FROM public.pin_reset_tokens
  WHERE token = p_token
    AND expires_at > now()
    AND used = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token non valido o scaduto');
  END IF;

  UPDATE public.profiles
  SET transaction_pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf'))
  WHERE user_id = v_token_record.user_id;

  UPDATE public.pin_reset_tokens
  SET used = true
  WHERE id = v_token_record.id;

  RETURN json_build_object('success', true);
END;
$$;

-- Funzione: get_deposit_wallet
CREATE OR REPLACE FUNCTION public.get_deposit_wallet()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT value INTO v_wallet
  FROM settings
  WHERE key = 'admin_wallet';
  
  RETURN v_wallet;
END;
$$;

-- Funzione: insert_tcoin_transaction
CREATE OR REPLACE FUNCTION public.insert_tcoin_transaction(p_user_id uuid, p_type text, p_amount numeric, p_notes text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.tcoin_transactions (user_id, type, amount, notes)
  VALUES (p_user_id, p_type, p_amount, p_notes)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Funzione: update_user_device_earnings
CREATE OR REPLACE FUNCTION public.update_user_device_earnings(p_device_id uuid, p_earnings numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_devices
  SET earnings = p_earnings
  WHERE id = p_device_id;
  
  RETURN FOUND;
END;
$$;

-- Funzione: update_user_task_earnings
CREATE OR REPLACE FUNCTION public.update_user_task_earnings(p_task_id uuid, p_earnings numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_tasks
  SET earnings = p_earnings
  WHERE id = p_task_id;
  
  RETURN FOUND;
END;
$$;

-- Funzione: process_device_purchase
CREATE OR REPLACE FUNCTION public.process_device_purchase(p_user_id uuid, p_device_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_device RECORD;
    v_current_balance numeric;
    v_new_balance numeric;
    v_user_device_id uuid;
    v_rental_end timestamp with time zone;
BEGIN
    SELECT id, name, price, computing_power, is_active
    INTO v_device
    FROM mining_devices
    WHERE id = p_device_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Dispositivo non trovato');
    END IF;
    
    IF NOT v_device.is_active THEN
        RETURN json_build_object('success', false, 'error', 'Dispositivo non disponibile');
    END IF;
    
    SELECT wallet_balance INTO v_current_balance
    FROM profiles
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Profilo non trovato');
    END IF;
    
    IF v_current_balance < v_device.price THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insufficiente');
    END IF;
    
    v_new_balance := v_current_balance - v_device.price;
    v_rental_end := now() + interval '365 days';
    
    UPDATE profiles
    SET wallet_balance = v_new_balance, updated_at = now()
    WHERE user_id = p_user_id;
    
    INSERT INTO user_devices (
        user_id, device_id, purchased_at, status, is_rental_active,
        rental_expires_at, duration_days, earnings
    ) VALUES (
        p_user_id, p_device_id, now(), 'active', true,
        v_rental_end, 365, 0
    )
    RETURNING id INTO v_user_device_id;
    
    INSERT INTO transactions (user_id, type, amount, status, notes)
    VALUES (p_user_id, 'purchase', -v_device.price, 'completed', 'Acquisto dispositivo: ' || v_device.name);
    
    INSERT INTO notifications (user_id, title, message)
    VALUES (
        p_user_id,
        'Acquisto completato!',
        'Hai acquistato ' || v_device.name || ' per ' || TO_CHAR(v_device.price, 'FM999990.00') || ' USDC. Il dispositivo è ora attivo.'
    );
    
    UPDATE profiles
    SET total_computing_power = COALESCE(total_computing_power, 0) + v_device.computing_power, updated_at = now()
    WHERE user_id = p_user_id;
    
    PERFORM credit_referral_bonus(p_user_id, v_device.price, v_device.name);
    
    RETURN json_build_object('success', true, 'device_name', v_device.name, 'user_device_id', v_user_device_id);
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Funzione: credit_referral_bonus
CREATE OR REPLACE FUNCTION public.credit_referral_bonus(buyer_user_id uuid, device_price numeric, device_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  buyer_inviter_code text;
  buyer_username text;
  inviter_record record;
  inviter_inviter_code text;
  level2_inviter_record record;
  referral_bonus numeric;
  level2_bonus numeric;
BEGIN
  SELECT inviter_code, COALESCE(username, email) INTO buyer_inviter_code, buyer_username
  FROM public.profiles
  WHERE user_id = buyer_user_id;
  
  IF buyer_inviter_code IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT user_id, wallet_balance, referral_earnings, inviter_code, COALESCE(username, email) as inviter_name
  INTO inviter_record
  FROM public.profiles
  WHERE user_code = buyer_inviter_code;
  
  IF inviter_record IS NULL THEN
    RETURN false;
  END IF;
  
  referral_bonus := device_price * 0.05;
  
  UPDATE public.profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + referral_bonus,
    referral_earnings = COALESCE(referral_earnings, 0) + referral_bonus
  WHERE user_id = inviter_record.user_id;
  
  INSERT INTO public.transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
  VALUES (
    inviter_record.user_id,
    'referral_purchase',
    referral_bonus,
    referral_bonus,
    'completed',
    'Bonus 5% acquisto: ' || device_name,
    now()
  );
  
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (
    inviter_record.user_id,
    'Bonus Referral ricevuto!',
    'Hai ricevuto un bonus di ' || TO_CHAR(referral_bonus, 'FM999990.00') || ' USDC perché ' || buyer_username || ' ha acquistato ' || device_name || '.'
  );
  
  inviter_inviter_code := inviter_record.inviter_code;
  
  IF inviter_inviter_code IS NOT NULL THEN
    SELECT user_id, wallet_balance, referral_earnings
    INTO level2_inviter_record
    FROM public.profiles
    WHERE user_code = inviter_inviter_code;
    
    IF level2_inviter_record IS NOT NULL THEN
      level2_bonus := device_price * 0.03;
      
      UPDATE public.profiles
      SET 
        wallet_balance = COALESCE(wallet_balance, 0) + level2_bonus,
        referral_earnings = COALESCE(referral_earnings, 0) + level2_bonus
      WHERE user_id = level2_inviter_record.user_id;
      
      INSERT INTO public.transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
      VALUES (
        level2_inviter_record.user_id,
        'referral_purchase_l2',
        level2_bonus,
        level2_bonus,
        'completed',
        'Bonus 3% acquisto L2: ' || device_name || ' (da ' || buyer_username || ')',
        now()
      );
      
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        level2_inviter_record.user_id,
        'Bonus Team Livello 2!',
        'Hai ricevuto ' || TO_CHAR(level2_bonus, 'FM999990.00') || ' USDC (3%) perché ' || buyer_username || ' (team di ' || inviter_record.inviter_name || ') ha acquistato ' || device_name || '.'
      );
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Funzione: collect_mining_earnings
CREATE OR REPLACE FUNCTION public.collect_mining_earnings(p_user_id uuid, p_user_device_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_device record;
  v_device record;
  v_profile record;
  v_earnings numeric;
  v_days_elapsed numeric;
  v_daily_earnings numeric;
  v_bonus_multiplier numeric;
  v_referral_bonus numeric;
  v_inviter record;
  v_miner_name text;
BEGIN
  SELECT * INTO v_user_device 
  FROM user_devices 
  WHERE id = p_user_device_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Device not found');
  END IF;
  
  IF v_user_device.status != 'processing' THEN
    RETURN json_build_object('success', false, 'error', 'Device is not mining');
  END IF;
  
  IF v_user_device.ends_at IS NULL OR v_user_device.ends_at > now() THEN
    RETURN json_build_object('success', false, 'error', 'Mining not yet completed');
  END IF;
  
  SELECT * INTO v_device 
  FROM mining_devices 
  WHERE id = v_user_device.device_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Mining device not found');
  END IF;
  
  v_days_elapsed := EXTRACT(EPOCH FROM (v_user_device.ends_at - v_user_device.started_at)) / 86400.0;
  v_days_elapsed := LEAST(v_days_elapsed, COALESCE(v_user_device.duration_days, v_days_elapsed));
  v_daily_earnings := v_device.price * 0.005;
  v_bonus_multiplier := 1 + COALESCE(v_user_device.bonus_percentage, 0) / 100.0;
  v_earnings := v_days_elapsed * v_daily_earnings * v_bonus_multiplier;
  
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  UPDATE profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + v_earnings,
    total_earnings = COALESCE(total_earnings, 0) + v_earnings
  WHERE user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
  VALUES (p_user_id, 'mining', v_earnings, v_earnings, 'completed', 'Rendimento mining: ' || v_device.name, now());
  
  UPDATE user_devices
  SET 
    status = 'standby',
    started_at = NULL,
    ends_at = NULL,
    duration_days = NULL,
    bonus_percentage = 0,
    earnings = 0
  WHERE id = p_user_device_id;
  
  IF v_profile.inviter_code IS NOT NULL THEN
    SELECT user_id, wallet_balance, referral_earnings 
    INTO v_inviter
    FROM profiles 
    WHERE user_code = v_profile.inviter_code;
    
    IF FOUND THEN
      v_referral_bonus := v_earnings * 0.03;
      v_miner_name := COALESCE(v_profile.username, split_part(v_profile.email, '@', 1), 'Un membro del team');
      
      UPDATE profiles
      SET 
        wallet_balance = COALESCE(wallet_balance, 0) + v_referral_bonus,
        referral_earnings = COALESCE(referral_earnings, 0) + v_referral_bonus
      WHERE user_id = v_inviter.user_id;
      
      INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
      VALUES (v_inviter.user_id, 'referral_mining', v_referral_bonus, v_referral_bonus, 'completed', 'Bonus 3% rendimento mining: ' || v_miner_name, now());
      
      INSERT INTO notifications (user_id, title, message)
      VALUES (
        v_inviter.user_id,
        'Bonus Mining ricevuto!',
        'Hai ricevuto ' || ROUND(v_referral_bonus::numeric, 2)::text || ' USDC (3%) perché ' || v_miner_name || ' ha completato un ciclo di mining.'
      );
    END IF;
  END IF;
  
  RETURN json_build_object('success', true, 'earnings', v_earnings, 'device_name', v_device.name);
END;
$$;

-- Funzione: claim_task_earnings
CREATE OR REPLACE FUNCTION public.claim_task_earnings(p_user_id uuid, p_user_task_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_task record;
  v_task record;
  v_profile record;
  v_earnings numeric;
  v_bonus_multiplier numeric;
  v_referral_bonus numeric;
  v_level2_bonus numeric;
  v_inviter record;
  v_level2_inviter record;
  v_user_name text;
BEGIN
  SELECT * INTO v_user_task 
  FROM user_tasks 
  WHERE id = p_user_task_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  IF v_user_task.status != 'processing' THEN
    RETURN json_build_object('success', false, 'error', 'Task is not processing');
  END IF;
  
  IF v_user_task.ends_at IS NULL OR v_user_task.ends_at > now() THEN
    RETURN json_build_object('success', false, 'error', 'Task not yet completed');
  END IF;
  
  SELECT * INTO v_task 
  FROM tasks 
  WHERE id = v_user_task.task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;
  
  v_bonus_multiplier := 1 + COALESCE(v_user_task.bonus_percentage, 0) / 100.0;
  v_earnings := v_task.base_daily_reward * v_user_task.duration_days * v_bonus_multiplier;
  
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  v_user_name := COALESCE(v_profile.username, split_part(v_profile.email, '@', 1), 'Un membro del team');
  
  UPDATE profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + v_earnings,
    total_earnings = COALESCE(total_earnings, 0) + v_earnings
  WHERE user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
  VALUES (p_user_id, 'task_earning', v_earnings, v_earnings, 'completed', 'Guadagno compito: ' || v_task.name, now());
  
  UPDATE user_tasks
  SET status = 'completed', earnings = v_earnings
  WHERE id = p_user_task_id;
  
  IF v_profile.inviter_code IS NOT NULL THEN
    SELECT user_id, wallet_balance, referral_earnings, inviter_code, COALESCE(username, email) as inviter_name
    INTO v_inviter
    FROM profiles 
    WHERE user_code = v_profile.inviter_code;
    
    IF FOUND THEN
      v_referral_bonus := v_earnings * 0.03;
      
      UPDATE profiles
      SET 
        wallet_balance = COALESCE(wallet_balance, 0) + v_referral_bonus,
        referral_earnings = COALESCE(referral_earnings, 0) + v_referral_bonus
      WHERE user_id = v_inviter.user_id;
      
      INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
      VALUES (v_inviter.user_id, 'referral_task', v_referral_bonus, v_referral_bonus, 'completed', 'Bonus 3% compito: ' || v_task.name, now());
      
      INSERT INTO notifications (user_id, title, message)
      VALUES (
        v_inviter.user_id,
        'Bonus Referral ricevuto!',
        'Hai ricevuto un bonus di ' || ROUND(v_referral_bonus::numeric, 2)::text || ' USDC dal completamento compito di ' || v_user_name || '.'
      );
      
      IF v_inviter.inviter_code IS NOT NULL THEN
        SELECT user_id, wallet_balance, referral_earnings
        INTO v_level2_inviter
        FROM profiles 
        WHERE user_code = v_inviter.inviter_code;
        
        IF FOUND THEN
          v_level2_bonus := v_earnings * 0.01;
          
          UPDATE profiles
          SET 
            wallet_balance = COALESCE(wallet_balance, 0) + v_level2_bonus,
            referral_earnings = COALESCE(referral_earnings, 0) + v_level2_bonus
          WHERE user_id = v_level2_inviter.user_id;
          
          INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
          VALUES (v_level2_inviter.user_id, 'referral_task_l2', v_level2_bonus, v_level2_bonus, 'completed', 'Bonus 1% compito L2: ' || v_task.name || ' (da ' || v_user_name || ')', now());
          
          INSERT INTO notifications (user_id, title, message)
          VALUES (
            v_level2_inviter.user_id,
            'Bonus Team Livello 2!',
            'Hai ricevuto ' || ROUND(v_level2_bonus::numeric, 2)::text || ' USDC (1%) dal completamento compito di ' || v_user_name || ' (team di ' || v_inviter.inviter_name || ').'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN json_build_object('success', true, 'earnings', v_earnings, 'task_name', v_task.name);
END;
$$;

-- Funzione: convert_tcoin_to_usdc
CREATE OR REPLACE FUNCTION public.convert_tcoin_to_usdc(p_user_id uuid, p_tcoin_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile record;
  v_conversion_rate numeric;
  v_usdc_amount numeric;
  v_new_tcoin_balance numeric;
  v_new_wallet_balance numeric;
BEGIN
  IF p_tcoin_amount IS NULL OR p_tcoin_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  SELECT tcoin_to_usdc_rate INTO v_conversion_rate
  FROM spin_settings
  LIMIT 1;
  
  IF v_conversion_rate IS NULL THEN
    v_conversion_rate := 100;
  END IF;

  IF p_tcoin_amount < v_conversion_rate THEN
    RETURN json_build_object('success', false, 'error', 'Amount below minimum', 'minimum', v_conversion_rate);
  END IF;

  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF COALESCE(v_profile.tcoin_balance, 0) < p_tcoin_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient T-Coin balance');
  END IF;

  v_usdc_amount := p_tcoin_amount / v_conversion_rate;
  v_new_tcoin_balance := COALESCE(v_profile.tcoin_balance, 0) - p_tcoin_amount;
  v_new_wallet_balance := COALESCE(v_profile.wallet_balance, 0) + v_usdc_amount;

  UPDATE profiles
  SET 
    tcoin_balance = v_new_tcoin_balance,
    wallet_balance = v_new_wallet_balance
  WHERE user_id = p_user_id;

  INSERT INTO tcoin_transactions (user_id, type, amount, notes)
  VALUES (p_user_id, 'conversion', -p_tcoin_amount, 'Convertito ' || p_tcoin_amount || ' T-Coin in ' || ROUND(v_usdc_amount::numeric, 4) || ' USDC');

  INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
  VALUES (p_user_id, 'tcoin_conversion', v_usdc_amount, v_usdc_amount, 'completed', 'Conversione da ' || p_tcoin_amount || ' T-Coin', now());

  RETURN json_build_object(
    'success', true,
    'tcoin_deducted', p_tcoin_amount,
    'usdc_received', v_usdc_amount,
    'new_tcoin_balance', v_new_tcoin_balance,
    'new_wallet_balance', v_new_wallet_balance
  );
END;
$$;

-- Funzione: renew_device_rental
CREATE OR REPLACE FUNCTION public.renew_device_rental(p_user_id uuid, p_user_device_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile record;
  v_user_device record;
  v_device record;
  v_renewal_cost numeric;
  v_new_expiry timestamp with time zone;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  SELECT ud.*, md.price, md.name INTO v_user_device
  FROM user_devices ud
  JOIN mining_devices md ON md.id = ud.device_id
  WHERE ud.id = p_user_device_id AND ud.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Device not found or not owned by user');
  END IF;
  
  v_renewal_cost := v_user_device.price;
  
  IF COALESCE(v_profile.wallet_balance, 0) < v_renewal_cost THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient wallet balance',
      'required', v_renewal_cost,
      'available', COALESCE(v_profile.wallet_balance, 0)
    );
  END IF;
  
  IF v_user_device.rental_expires_at IS NULL OR v_user_device.rental_expires_at <= now() THEN
    v_new_expiry := now() + interval '1 year';
  ELSE
    v_new_expiry := v_user_device.rental_expires_at + interval '1 year';
  END IF;
  
  UPDATE profiles
  SET wallet_balance = wallet_balance - v_renewal_cost, updated_at = now()
  WHERE user_id = p_user_id;
  
  UPDATE user_devices
  SET rental_expires_at = v_new_expiry, is_rental_active = true, updated_at = now()
  WHERE id = p_user_device_id;
  
  INSERT INTO transactions (user_id, type, amount, exact_amount, status, notes, processed_at)
  VALUES (p_user_id, 'rental_renewal', -v_renewal_cost, v_renewal_cost, 'completed', 'Rinnovo noleggio: ' || v_user_device.name, now());
  
  INSERT INTO notifications (user_id, title, message)
  VALUES (p_user_id, 'Noleggio rinnovato!', 'Il noleggio di ' || v_user_device.name || ' è stato rinnovato per un altro anno.');
  
  RETURN json_build_object(
    'success', true,
    'new_expiry', v_new_expiry,
    'cost', v_renewal_cost,
    'new_wallet_balance', (SELECT wallet_balance FROM profiles WHERE user_id = p_user_id)
  );
END;
$$;

-- Funzione: check_and_update_referral_level
CREATE OR REPLACE FUNCTION public.check_and_update_referral_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  team_count integer;
  new_level_record record;
  current_level text;
  computing_power numeric;
BEGIN
  current_level := COALESCE(NEW.referral_level, 'apprendista');
  computing_power := COALESCE(NEW.total_computing_power, 0);
  
  SELECT COUNT(*) INTO team_count
  FROM public.profiles
  WHERE inviter_code = NEW.user_code;
  
  SELECT name INTO new_level_record
  FROM public.referral_levels
  WHERE min_members <= team_count
    AND min_computing_power <= computing_power
  ORDER BY sort_order DESC
  LIMIT 1;
  
  IF new_level_record.name IS NOT NULL AND new_level_record.name != current_level THEN
    IF EXISTS (
      SELECT 1 FROM public.referral_levels nl, public.referral_levels cl
      WHERE nl.name = new_level_record.name
        AND cl.name = current_level
        AND nl.sort_order > cl.sort_order
    ) THEN
      NEW.referral_level := new_level_record.name;
      
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        NEW.user_id,
        'Nuovo livello raggiunto! 🎉',
        'Congratulazioni! Hai raggiunto il livello ' || UPPER(new_level_record.name) || '! Continua così per sbloccare nuovi vantaggi.'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Funzione: check_inviter_referral_level
CREATE OR REPLACE FUNCTION public.check_inviter_referral_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inviter_record record;
  team_count integer;
  new_level_record record;
BEGIN
  IF NEW.inviter_code IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT user_id, user_code, referral_level, total_computing_power
  INTO inviter_record
  FROM public.profiles
  WHERE user_code = NEW.inviter_code;
  
  IF inviter_record IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT COUNT(*) INTO team_count
  FROM public.profiles
  WHERE inviter_code = inviter_record.user_code;
  
  SELECT name INTO new_level_record
  FROM public.referral_levels
  WHERE min_members <= team_count
    AND min_computing_power <= COALESCE(inviter_record.total_computing_power, 0)
  ORDER BY sort_order DESC
  LIMIT 1;
  
  IF new_level_record.name IS NOT NULL AND new_level_record.name != COALESCE(inviter_record.referral_level, 'apprendista') THEN
    IF EXISTS (
      SELECT 1 FROM public.referral_levels nl, public.referral_levels cl
      WHERE nl.name = new_level_record.name
        AND cl.name = COALESCE(inviter_record.referral_level, 'apprendista')
        AND nl.sort_order > cl.sort_order
    ) THEN
      UPDATE public.profiles
      SET referral_level = new_level_record.name
      WHERE user_id = inviter_record.user_id;
      
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (
        inviter_record.user_id,
        'Nuovo livello raggiunto! 🎉',
        'Congratulazioni! Hai raggiunto il livello ' || UPPER(new_level_record.name) || '! Continua così per sbloccare nuovi vantaggi.'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Funzione: set_rental_expiration
CREATE OR REPLACE FUNCTION public.set_rental_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.purchased_at IS NOT NULL AND NEW.rental_expires_at IS NULL THEN
      NEW.rental_expires_at := NEW.purchased_at + INTERVAL '1 year';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.purchased_at IS DISTINCT FROM OLD.purchased_at THEN
      IF NEW.rental_expires_at IS NULL OR NEW.rental_expires_at = OLD.rental_expires_at THEN
        IF OLD.purchased_at IS NOT NULL AND OLD.rental_expires_at = OLD.purchased_at + INTERVAL '1 year' THEN
          NEW.rental_expires_at := NEW.purchased_at + INTERVAL '1 year';
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Funzione: sync_email_verified
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE public.profiles
    SET email_verified = true
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Funzione: sync_profile_email_verified_to_auth
CREATE OR REPLACE FUNCTION public.sync_profile_email_verified_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email_verified = true AND (OLD.email_verified IS NULL OR OLD.email_verified = false) THEN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- PARTE 7: TRIGGERS
-- =====================================================

-- Trigger per nuovo utente (va creato su auth.users)
-- NOTA: Questo trigger va creato manualmente nel dashboard Supabase
-- perché richiede accesso allo schema auth
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger per aggiornamento updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mining_devices_updated_at
  BEFORE UPDATE ON public.mining_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger per rental expiration
CREATE TRIGGER set_rental_expiration_trigger
  BEFORE INSERT OR UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_rental_expiration();

-- Trigger per check referral level on profile update
CREATE TRIGGER check_referral_level_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_and_update_referral_level();

-- Trigger per check inviter referral level on new user
CREATE TRIGGER check_inviter_level_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_inviter_referral_level();

-- Trigger per sync email verified to auth
CREATE TRIGGER sync_profile_email_to_auth_trigger
  AFTER UPDATE OF email_verified ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email_verified_to_auth();

-- =====================================================
-- PARTE 8: STORAGE BUCKETS
-- =====================================================

-- Crea i bucket di storage
INSERT INTO storage.buckets (id, name, public) VALUES ('device-images', 'device-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-images', 'announcement-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('task-images', 'task-images', true);

-- Policies per storage (accesso pubblico in lettura)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('device-images', 'announcement-images', 'task-images'));

CREATE POLICY "Admin Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('device-images', 'announcement-images', 'task-images') AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('device-images', 'announcement-images', 'task-images') AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('device-images', 'announcement-images', 'task-images') AND
    has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- PARTE 9: DATI INIZIALI
-- =====================================================

-- Inserisci i livelli referral di default
INSERT INTO public.referral_levels (name, min_computing_power, min_members, monthly_salary, sort_order, position_title) VALUES
  ('apprendista', 0, 0, 0, 1, 'Apprendista'),
  ('junior', 100, 3, 10, 2, 'Junior Miner'),
  ('senior', 500, 10, 50, 3, 'Senior Miner'),
  ('expert', 1000, 25, 100, 4, 'Expert Miner'),
  ('master', 2500, 50, 250, 5, 'Master Miner'),
  ('elite', 5000, 100, 500, 6, 'Elite Miner');

-- Inserisci le durate mining di default
INSERT INTO public.device_durations (days, bonus_percentage, is_promo, is_active) VALUES
  (7, 0, false, true),
  (14, 5, false, true),
  (30, 10, false, true),
  (60, 15, false, true),
  (90, 20, false, true);

-- Inserisci le impostazioni spin di default
INSERT INTO public.spin_settings (daily_spins, spin_cooldown_hours, tcoin_to_usdc_rate) VALUES
  (3, 24, 100);

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Il trigger on_auth_user_created deve essere creato
-- separatamente nel Supabase Dashboard > Authentication > Hooks
-- oppure tramite SQL con accesso allo schema auth:
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--
-- Anche il trigger per sync_email_verified su auth.users:
-- CREATE TRIGGER on_auth_user_email_confirmed
--   AFTER UPDATE OF email_confirmed_at ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.sync_email_verified();
-- =====================================================

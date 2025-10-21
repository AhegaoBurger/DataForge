-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'contributor' CHECK (role IN ('contributor', 'buyer', 'both')),
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bounties table
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  reward_amount DECIMAL(10, 2) NOT NULL,
  reward_token TEXT DEFAULT 'SOL',
  total_slots INTEGER NOT NULL,
  filled_slots INTEGER DEFAULT 0,
  requirements JSONB NOT NULL,
  guidelines TEXT,
  example_video_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES public.bounties(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_token TEXT DEFAULT 'SOL',
  total_videos INTEGER DEFAULT 0,
  total_size_gb DECIMAL(10, 2) DEFAULT 0,
  license_type TEXT NOT NULL,
  metadata JSONB,
  preview_urls TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  token TEXT DEFAULT 'SOL',
  transaction_signature TEXT,
  download_url TEXT,
  license_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bounties_creator ON public.bounties(creator_id);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON public.bounties(status);
CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON public.submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_contributor ON public.submissions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_datasets_creator ON public.datasets(creator_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON public.datasets(status);
CREATE INDEX IF NOT EXISTS idx_purchases_dataset ON public.purchases(dataset_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON public.purchases(buyer_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for bounties
CREATE POLICY "bounties_select_all" ON public.bounties FOR SELECT USING (true);
CREATE POLICY "bounties_insert_own" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "bounties_update_own" ON public.bounties FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "bounties_delete_own" ON public.bounties FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for submissions
CREATE POLICY "submissions_select_own_or_bounty_creator" ON public.submissions FOR SELECT 
  USING (
    auth.uid() = contributor_id OR 
    auth.uid() IN (SELECT creator_id FROM public.bounties WHERE id = bounty_id)
  );
CREATE POLICY "submissions_insert_own" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = contributor_id);
CREATE POLICY "submissions_update_own" ON public.submissions FOR UPDATE USING (auth.uid() = contributor_id);
CREATE POLICY "submissions_delete_own" ON public.submissions FOR DELETE USING (auth.uid() = contributor_id);

-- RLS Policies for datasets
CREATE POLICY "datasets_select_published" ON public.datasets FOR SELECT USING (status = 'published' OR auth.uid() = creator_id);
CREATE POLICY "datasets_insert_own" ON public.datasets FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "datasets_update_own" ON public.datasets FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "datasets_delete_own" ON public.datasets FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for purchases
CREATE POLICY "purchases_select_own" ON public.purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "purchases_insert_own" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

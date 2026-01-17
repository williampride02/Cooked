-- Auto-create user profiles when auth users are created
-- This prevents duplicate key errors and ensures profiles are always created
-- The trigger will NEVER fail - it handles all conflicts gracefully

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- First, check if a profile with this ID already exists
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE id = NEW.id;
  
  IF existing_user_id IS NOT NULL THEN
    -- Profile already exists for this auth user - just update it
    UPDATE public.users
    SET
      email = COALESCE(NEW.email, users.email),
      phone = COALESCE(NEW.phone, users.phone),
      display_name = COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        users.display_name
      )
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  
  -- Check if email already exists (for a different user)
  IF NEW.email IS NOT NULL THEN
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE email = NEW.email
      AND id != NEW.id
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      -- Email exists for different user - create profile WITHOUT email to avoid conflict
      -- User can link accounts later through settings
      INSERT INTO public.users (id, email, phone, display_name, avatar_url)
      VALUES (
        NEW.id,
        NULL,  -- Don't set email if it conflicts
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
        NULL
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END IF;
  END IF;
  
  -- Check if phone already exists (for a different user)
  IF NEW.phone IS NOT NULL THEN
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE phone = NEW.phone
      AND id != NEW.id
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      -- Phone exists for different user - create profile WITHOUT phone
      INSERT INTO public.users (id, email, phone, display_name, avatar_url)
      VALUES (
        NEW.id,
        NEW.email,
        NULL,  -- Don't set phone if it conflicts
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
        NULL
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END IF;
  END IF;
  
  -- No conflicts - safe to insert with all fields
  INSERT INTO public.users (id, email, phone, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, users.email),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    display_name = COALESCE(EXCLUDED.display_name, users.display_name);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If we still hit a unique violation, create profile without the conflicting field
    BEGIN
      INSERT INTO public.users (id, email, phone, display_name, avatar_url)
      VALUES (
        NEW.id,
        CASE WHEN NEW.email IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.users WHERE email = NEW.email AND id != NEW.id
        ) THEN NULL ELSE NEW.email END,
        CASE WHEN NEW.phone IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.users WHERE phone = NEW.phone AND id != NEW.id
        ) THEN NULL ELSE NEW.phone END,
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
        NULL
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        -- If even this fails, just log and return (don't fail auth user creation)
        RAISE WARNING 'Could not create user profile for auth user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample bounties (these will be associated with real users after they sign up)
-- For now, we'll create placeholder data that can be updated later

-- Note: In production, these would be created by authenticated users
-- This is just sample data to demonstrate the structure
INSERT INTO public.bounties (id, creator_id, title, description, category, difficulty, reward_amount, total_slots, requirements, guidelines, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', -- Placeholder, will be replaced
    'Kitchen Task Videos',
    'Record videos of common kitchen tasks like chopping vegetables, washing dishes, and organizing cabinets.',
    'Household',
    'easy',
    1.50,
    100,
    '{"duration": "30-60 seconds", "resolution": "1080p minimum", "lighting": "Good natural or artificial lighting", "angle": "First-person perspective preferred"}'::jsonb,
    'Focus on clear hand movements and object interactions. Ensure good lighting and stable camera work.',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'Urban Navigation',
    'Capture videos of walking through urban environments, crossing streets, and navigating sidewalks.',
    'Navigation',
    'medium',
    2.00,
    50,
    '{"duration": "60-120 seconds", "resolution": "1080p minimum", "environment": "Urban areas with pedestrians", "time": "Various times of day"}'::jsonb,
    'Include diverse scenarios: crowded areas, quiet streets, different weather conditions.',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'Object Manipulation',
    'Record videos of picking up, moving, and placing various objects of different sizes and materials.',
    'Manipulation',
    'easy',
    1.25,
    150,
    '{"duration": "20-45 seconds", "resolution": "1080p minimum", "objects": "Variety of household items", "background": "Clean, uncluttered"}'::jsonb,
    'Show clear grasping and releasing actions. Include objects of various shapes, sizes, and materials.',
    'active'
  );

-- Note: The creator_id above uses a placeholder UUID. In a real application,
-- these bounties would be created by authenticated users through the UI.

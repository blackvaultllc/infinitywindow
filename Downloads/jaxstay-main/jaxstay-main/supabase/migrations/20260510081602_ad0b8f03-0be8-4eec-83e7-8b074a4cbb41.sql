
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS inactive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_past_pets boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_dogs boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_cats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_pet_weight_lbs integer,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS zip text;

CREATE TABLE IF NOT EXISTS public.pet_intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  sitter_id uuid NOT NULL,
  pet_id uuid,
  pet_name text, breed text, age_years integer, weight_lbs integer, microchip text,
  rabies_current boolean DEFAULT false, dhpp_current boolean DEFAULT false,
  vet_name text, vet_phone text, medications text, emergency_care_authorized boolean DEFAULT false,
  emergency_contact_name text, emergency_contact_phone text, update_frequency text, cleaning_supplies_location text,
  feeding_schedule text, walk_routine text, trigger_notes text, treat_restrictions text,
  cameras_disclosure text, normal_behavior text, red_flags text, prone_to_bolting boolean DEFAULT false,
  house_rules text, parking_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_intake_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own intake"
  ON public.pet_intake_forms FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Sitter views intake for accepted bookings"
  ON public.pet_intake_forms FOR SELECT
  USING (
    auth.uid() = sitter_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = pet_intake_forms.booking_id
        AND b.status IN ('accepted','completed')
    )
  );

CREATE TRIGGER pet_intake_forms_touch
  BEFORE UPDATE ON public.pet_intake_forms
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

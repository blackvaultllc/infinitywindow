import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/bookings/$bookingId/intake")({
  head: () => ({ meta: [{ title: "Pet Intake Form — JaxStay" }] }),
  component: IntakeForm,
});

type Booking = { id: string; owner_id: string; sitter_id: string; pet_id: string | null };

type Form = {
  pet_name: string; breed: string; age_years: string; weight_lbs: string; microchip: string;
  rabies_current: boolean; dhpp_current: boolean;
  vet_name: string; vet_phone: string; medications: string; emergency_care_authorized: boolean;
  emergency_contact_name: string; emergency_contact_phone: string; update_frequency: string; cleaning_supplies_location: string;
  feeding_schedule: string; walk_routine: string; trigger_notes: string; treat_restrictions: string;
  cameras_disclosure: string; normal_behavior: string; red_flags: string; prone_to_bolting: boolean;
  house_rules: string; parking_instructions: string;
};

const empty: Form = {
  pet_name: "", breed: "", age_years: "", weight_lbs: "", microchip: "",
  rabies_current: false, dhpp_current: false,
  vet_name: "", vet_phone: "", medications: "", emergency_care_authorized: false,
  emergency_contact_name: "", emergency_contact_phone: "", update_frequency: "Daily photos", cleaning_supplies_location: "",
  feeding_schedule: "", walk_routine: "", trigger_notes: "", treat_restrictions: "",
  cameras_disclosure: "", normal_behavior: "", red_flags: "", prone_to_bolting: false,
  house_rules: "", parking_instructions: "",
};

function IntakeForm() {
  const { bookingId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: b } = await supabase.from("bookings").select("id, owner_id, sitter_id, pet_id").eq("id", bookingId).maybeSingle();
      if (!b) { toast.error("Booking not found"); nav({ to: "/bookings" }); return; }
      setBooking(b as Booking);
      const { data: existing } = await supabase.from("pet_intake_forms").select("*").eq("booking_id", bookingId).maybeSingle();
      if (existing) {
        setExistingId(existing.id);
        setForm({
          pet_name: existing.pet_name ?? "", breed: existing.breed ?? "",
          age_years: existing.age_years?.toString() ?? "", weight_lbs: existing.weight_lbs?.toString() ?? "",
          microchip: existing.microchip ?? "",
          rabies_current: existing.rabies_current ?? false, dhpp_current: existing.dhpp_current ?? false,
          vet_name: existing.vet_name ?? "", vet_phone: existing.vet_phone ?? "",
          medications: existing.medications ?? "", emergency_care_authorized: existing.emergency_care_authorized ?? false,
          emergency_contact_name: existing.emergency_contact_name ?? "", emergency_contact_phone: existing.emergency_contact_phone ?? "",
          update_frequency: existing.update_frequency ?? "Daily photos", cleaning_supplies_location: existing.cleaning_supplies_location ?? "",
          feeding_schedule: existing.feeding_schedule ?? "", walk_routine: existing.walk_routine ?? "",
          trigger_notes: existing.trigger_notes ?? "", treat_restrictions: existing.treat_restrictions ?? "",
          cameras_disclosure: existing.cameras_disclosure ?? "", normal_behavior: existing.normal_behavior ?? "",
          red_flags: existing.red_flags ?? "", prone_to_bolting: existing.prone_to_bolting ?? false,
          house_rules: existing.house_rules ?? "", parking_instructions: existing.parking_instructions ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user, bookingId, nav]);

  const upd = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !booking) return;
    if (user.id !== booking.owner_id) { toast.error("Only the pet owner can fill this form"); return; }
    setSaving(true);
    const payload = {
      booking_id: booking.id,
      owner_id: booking.owner_id,
      sitter_id: booking.sitter_id,
      pet_id: booking.pet_id,
      pet_name: form.pet_name, breed: form.breed,
      age_years: form.age_years ? Number(form.age_years) : null,
      weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : null,
      microchip: form.microchip,
      rabies_current: form.rabies_current, dhpp_current: form.dhpp_current,
      vet_name: form.vet_name, vet_phone: form.vet_phone,
      medications: form.medications, emergency_care_authorized: form.emergency_care_authorized,
      emergency_contact_name: form.emergency_contact_name, emergency_contact_phone: form.emergency_contact_phone,
      update_frequency: form.update_frequency, cleaning_supplies_location: form.cleaning_supplies_location,
      feeding_schedule: form.feeding_schedule, walk_routine: form.walk_routine,
      trigger_notes: form.trigger_notes, treat_restrictions: form.treat_restrictions,
      cameras_disclosure: form.cameras_disclosure, normal_behavior: form.normal_behavior,
      red_flags: form.red_flags, prone_to_bolting: form.prone_to_bolting,
      house_rules: form.house_rules, parking_instructions: form.parking_instructions,
    };
    const { error } = existingId
      ? await supabase.from("pet_intake_forms").update(payload as never).eq("id", existingId)
      : await supabase.from("pet_intake_forms").insert(payload as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Intake form saved — your sitter will see it once the booking is accepted.");
    nav({ to: "/bookings" });
  };

  if (loading) return <SiteLayout><div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></SiteLayout>;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/bookings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back to bookings</Link>
        <h1 className="mt-4 font-display text-3xl font-700 sm:text-4xl">Pet intake form</h1>
        <p className="mt-1 text-sm text-muted-foreground">Give your sitter everything they need to keep your pet safe and happy. Saved automatically when you submit.</p>

        <form onSubmit={submit} className="mt-8 space-y-8">
          <Section title="Pet profile">
            <Grid>
              <Field label="Pet name" required><input required value={form.pet_name} onChange={(e) => upd("pet_name", e.target.value)} className={inp} /></Field>
              <Field label="Breed"><input value={form.breed} onChange={(e) => upd("breed", e.target.value)} className={inp} /></Field>
              <Field label="Age (years)"><input type="number" min="0" value={form.age_years} onChange={(e) => upd("age_years", e.target.value)} className={inp} /></Field>
              <Field label="Weight (lbs)"><input type="number" min="0" value={form.weight_lbs} onChange={(e) => upd("weight_lbs", e.target.value)} className={inp} /></Field>
              <Field label="Microchip number"><input value={form.microchip} onChange={(e) => upd("microchip", e.target.value)} className={inp} /></Field>
            </Grid>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Check label="Rabies vaccination current" checked={form.rabies_current} onChange={(v) => upd("rabies_current", v)} />
              <Check label="DHPP vaccination current" checked={form.dhpp_current} onChange={(v) => upd("dhpp_current", v)} />
            </div>
          </Section>

          <Section title="Medical">
            <Grid>
              <Field label="Vet clinic name"><input value={form.vet_name} onChange={(e) => upd("vet_name", e.target.value)} className={inp} /></Field>
              <Field label="Vet phone"><input value={form.vet_phone} onChange={(e) => upd("vet_phone", e.target.value)} className={inp} /></Field>
            </Grid>
            <Field label="Medication details (name, dose, timing, where stored)">
              <textarea rows={3} value={form.medications} onChange={(e) => upd("medications", e.target.value)} className={inp} />
            </Field>
            <div className="mt-3"><Check label="I authorize the sitter to seek emergency veterinary care" checked={form.emergency_care_authorized} onChange={(v) => upd("emergency_care_authorized", v)} /></div>
          </Section>

          <Section title="Logistics">
            <Grid>
              <Field label="Emergency contact name (not traveling with you)"><input value={form.emergency_contact_name} onChange={(e) => upd("emergency_contact_name", e.target.value)} className={inp} /></Field>
              <Field label="Emergency contact phone"><input value={form.emergency_contact_phone} onChange={(e) => upd("emergency_contact_phone", e.target.value)} className={inp} /></Field>
            </Grid>
            <Field label="Update frequency preference">
              <select value={form.update_frequency} onChange={(e) => upd("update_frequency", e.target.value)} className={inp}>
                <option>A few times a day</option><option>Daily photos</option><option>Once every 2 days</option><option>Only if there's an issue</option>
              </select>
            </Field>
            <Field label="Cleaning supplies / waste disposal location"><input value={form.cleaning_supplies_location} onChange={(e) => upd("cleaning_supplies_location", e.target.value)} className={inp} /></Field>
          </Section>

          <Section title="Daily care">
            <Field label="Feeding schedule (food, exact portions, times)"><textarea rows={3} value={form.feeding_schedule} onChange={(e) => upd("feeding_schedule", e.target.value)} className={inp} /></Field>
            <Field label="Walk routine"><textarea rows={3} value={form.walk_routine} onChange={(e) => upd("walk_routine", e.target.value)} className={inp} /></Field>
            <Field label="Trigger notes (other dogs, bikes, kids, etc.)"><textarea rows={2} value={form.trigger_notes} onChange={(e) => upd("trigger_notes", e.target.value)} className={inp} /></Field>
            <Field label="Treat restrictions / allergies"><input value={form.treat_restrictions} onChange={(e) => upd("treat_restrictions", e.target.value)} className={inp} /></Field>
          </Section>

          <Section title="Behavior & safety">
            <Field label="Cameras disclosure (locations of any cameras in the home)"><textarea rows={2} value={form.cameras_disclosure} onChange={(e) => upd("cameras_disclosure", e.target.value)} className={inp} /></Field>
            <Field label="What 'normal' behavior looks like"><textarea rows={2} value={form.normal_behavior} onChange={(e) => upd("normal_behavior", e.target.value)} className={inp} /></Field>
            <Field label="Red flags requiring immediate contact"><textarea rows={2} value={form.red_flags} onChange={(e) => upd("red_flags", e.target.value)} className={inp} /></Field>
            <div className="mt-3"><Check label="Pet is prone to escaping / bolting" checked={form.prone_to_bolting} onChange={(v) => upd("prone_to_bolting", v)} /></div>
          </Section>

          <Section title="Home environment">
            <Field label="House rules (off-limit rooms, furniture, crates, alarms)"><textarea rows={3} value={form.house_rules} onChange={(e) => upd("house_rules", e.target.value)} className={inp} /></Field>
            <Field label="Parking instructions for the sitter"><textarea rows={2} value={form.parking_instructions} onChange={(e) => upd("parking_instructions", e.target.value)} className={inp} /></Field>
          </Section>

          <button type="submit" disabled={saving} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground shadow-soft transition hover:scale-[1.01] disabled:opacity-50">
            {saving ? "Saving…" : existingId ? "Update intake form" : "Submit intake form"}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}

const inp = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl font-600">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 sm:grid-cols-2">{children}</div>; }

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-500">
      {label}{required && <span className="text-destructive"> *</span>}
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

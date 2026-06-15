import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { toast } from "sonner";

const OWNER_EMAIL = "blackhatterxvi@gmail.com";
const FROM_ADDRESS = "Juneteenth.Love <hello@notify.juneteenth.love>";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5, "Message is too short").max(5000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Juneteenth.Love" },
      {
        name: "description",
        content:
          "Send a message to the creator of Juneteenth.Love. He reads every message personally and will get back to you.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = ContactSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      subject: fd.get("subject") || undefined,
      message: fd.get("message"),
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[i.path[0] as string] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setBusy(true);

    const { data: sess } = await supabase.auth.getSession();
    const { name, email, subject, message } = parsed.data;

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject: subject || null,
      message,
      user_id: sess.session?.user.id ?? null,
    });

    if (error) {
      setBusy(false);
      toast.error("Couldn't send your message. Please try again.");
      return;
    }

    // Fire-and-forget emails through the queue. If the domain isn't verified
    // yet, these stay queued and send once it is.
    const safeName = name.replace(/[<>&]/g, "");
    const safeSubject = (subject || "New message from juneteenth.love").replace(/[<>&]/g, "");
    const safeMessage = message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

    // Auto-reply to sender
    (supabase.rpc as any)("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: email,
        from: FROM_ADDRESS,
        subject: "Thanks — your message reached Juneteenth.Love",
        label: "contact_auto_reply",
        purpose: "transactional",
        html: `<div style="font-family:Georgia,serif;color:#222;line-height:1.6;max-width:560px">
          <p>Hi ${safeName},</p>
          <p>Thank you for reaching out to Juneteenth.Love. Your message was received and the owner and creator of the page — Domenick Arlon Hall — will definitely see it and personally get back to you as soon as possible.</p>
          <p style="border-left:3px solid #c8a04a;padding-left:14px;color:#555;font-style:italic">${safeMessage.replace(/\n/g, "<br>")}</p>
          <p>With gratitude,<br/>Juneteenth.Love</p>
          <p style="font-size:11px;color:#999;letter-spacing:.18em;text-transform:uppercase;margin-top:24px">One people · One future</p>
        </div>`,
        text: `Hi ${name},\n\nThank you for reaching out to Juneteenth.Love. Your message was received and the owner and creator — Domenick Arlon Hall — will definitely see it and personally get back to you as soon as possible.\n\n"${message}"\n\nWith gratitude,\nJuneteenth.Love`,
      },
    });

    // Notification to owner
    (supabase.rpc as any)("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: OWNER_EMAIL,
        from: FROM_ADDRESS,
        subject: `[juneteenth.love] ${safeSubject}`,
        label: "contact_owner_notification",
        purpose: "transactional",
        html: `<div style="font-family:Georgia,serif;color:#222;line-height:1.6">
          <p><strong>From:</strong> ${safeName} &lt;${email}&gt;</p>
          ${subject ? `<p><strong>Subject:</strong> ${safeSubject}</p>` : ""}
          <p style="white-space:pre-wrap;border-left:3px solid #c8a04a;padding-left:14px">${safeMessage}</p>
        </div>`,
        text: `From: ${name} <${email}>\n${subject ? `Subject: ${subject}\n` : ""}\n${message}`,
      },
    });

    setBusy(false);
    setSent(true);
    toast.success("Message sent. The creator will reply personally.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <SiteNav />
      <section className="px-6 py-20 max-w-2xl mx-auto">
        <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
          Contact
        </span>
        <h1 className="font-serif text-4xl md:text-5xl font-medium mb-4 leading-tight">
          Send a message to the <span className="italic text-gold">creator</span>
        </h1>
        <p className="text-muted-foreground text-pretty leading-relaxed mb-10">
          Every message goes directly to Domenick. Whether it's a hello, a
          story, a question, or feedback — he'll see it and write you back
          personally. You'll receive an automatic confirmation, and a real
          reply will follow.
        </p>

        {sent ? (
          <div className="border border-gold/30 bg-card/40 rounded-sm p-8 text-center">
            <p className="font-serif text-2xl mb-3">Message received.</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A confirmation is on its way to your inbox. The owner and creator
              will personally reply as soon as possible.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 text-gold text-xs uppercase tracking-[0.28em] hover:text-foreground"
            >
              ← Back home
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Your name" name="name" error={errors.name} />
            <Field label="Your email" name="email" type="email" error={errors.email} />
            <Field label="Subject (optional)" name="subject" error={errors.subject} />
            <div>
              <label className="block text-[10px] uppercase tracking-[0.28em] text-foreground/60 mb-2">
                Message
              </label>
              <textarea
                name="message"
                rows={7}
                maxLength={5000}
                className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
              />
              {errors.message && (
                <p className="text-destructive text-xs mt-1">{errors.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm tracking-[0.18em] uppercase hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.28em] text-foreground/60 mb-2">
        {label}
      </label>
      <input
        name={name}
        type={type}
        maxLength={name === "message" ? 5000 : 255}
        className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
      />
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

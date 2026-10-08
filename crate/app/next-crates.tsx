"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { NEXT_CRATE_FORM_URL } from "@/lib/config";

// The "One Crate Today" section: the crate that ships now, the candidates for the
// next one, and a bar that sends the visitor's picks and email to the vote form.
// The form gets them as URL parameters ("email" and "picks", comma separated),
// which Tally fills into hidden fields of the same names.
export function NextCrates({ candidates, preview }: { candidates: [string, string][]; preview: ReactNode }) {
  const [picks, setPicks] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const toggle = (name: string) => setPicks((current) => (current.includes(name) ? current.filter((pick) => pick !== name) : [...current, name]));
  const ordered = candidates.map(([name]) => name).filter((name) => picks.includes(name));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = new URL(NEXT_CRATE_FORM_URL, window.location.href);
    // Until the form exists the URL is a placeholder: say so instead of pretending it was sent.
    if (url.origin === window.location.origin) {
      setNote("The vote form isn't live yet, so nothing was sent. Check back soon.");
      return;
    }
    url.searchParams.set("email", email);
    if (ordered.length) url.searchParams.set("picks", ordered.join(","));
    window.location.assign(url.toString());
  }

  return (
    <section className="coming section" aria-labelledby="coming-title">
      <div className="shell">
        <div className="coming-intro">
          <h2 id="coming-title">One Crate Today. <span>More on the Way.</span></h2>
          <p>Wait States is ready to install. The next crates are candidates, not promises: we build the one people need most, so pick the ones you want.</p>
        </div>

        <article className="crate-featured" aria-labelledby="featured-title">
          <div className="crate-featured-copy">
            <span className="crate-status"><Check size={14} aria-hidden="true" /> Available now</span>
            <h3 id="featured-title">Wait States</h3>
            <p>12 components for the moments while an AI app is working, plus a hook that switches between them for you.</p>
            <div className="crate-featured-links">
              <a className="button primary" href="#install">Install Wait States <ArrowRight size={17} aria-hidden="true" /></a>
              <a className="text-link" href="#crates">See All 12 <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="crate-featured-preview" aria-label="Live preview: File Processing">{preview}</div>
        </article>

        <h3 className="candidates-title">Candidates for the Next Crate</h3>
        <ul className="candidate-grid">
          {candidates.map(([name, line]) => {
            const picked = picks.includes(name);
            return (
              <li key={name} className="candidate" data-picked={picked || undefined}>
                <h4>{name}</h4>
                <p>{line}</p>
                <button type="button" className="want-toggle" aria-pressed={picked} onClick={() => toggle(name)}>
                  {picked ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                  Want This<span className="sr-only">: {name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <form className="pick-bar" onSubmit={submit}>
          <p className="pick-count" aria-live="polite">
            <strong>{ordered.length ? `${ordered.length} picked` : "Nothing picked yet"}</strong>
            <span>{ordered.length ? ordered.join(", ") : "Pick the crates you want, then leave your email."}</span>
          </p>
          <label className="sr-only" htmlFor="notify-email">Email</label>
          <input id="notify-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setNote(""); }} />
          <button className="button primary" type="submit">Notify Me</button>
          <p className="pick-note" role="status">{note}</p>
        </form>
      </div>
    </section>
  );
}

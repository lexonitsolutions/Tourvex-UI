import Image from "next/image";
import Link from "next/link";

const COPY = {
  signin: {
    eyebrow: "Welcome back",
    title: "Your next journey is waiting.",
    text: "Sign in to manage bookings, save favourites, and continue planning without losing your progress.",
    points: ["View and manage bookings", "Keep your wishlist in one place", "Continue securely on any device"],
  },
  signup: {
    eyebrow: "Join Karnish",
    title: "Travel planning, made personal.",
    text: "Create your account for a smoother way to save ideas, organise bookings, and get support from our travel team.",
    points: ["Save experiences for later", "Faster, simpler checkout", "All your travel details together"],
  },
};

export default function AuthShell({ mode, note, children }) {
  const copy = COPY[mode];
  return (
    <section className="auth-page">
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <div className="auth-shell">
        <aside className="auth-story">
          <Link className="auth-brand" href="/" aria-label="Karnish Tourism home">
            <Image src="/images/karnish-logo.png" alt="" width={58} height={58} />
            <span><strong>Karnish</strong><small>Tourism</small></span>
          </Link>
          <div className="auth-story-copy">
            <span className="auth-eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.text}</p>
            <ul>
              {copy.points.map((point) => <li key={point}><i className="fa-solid fa-check" aria-hidden="true" />{point}</li>)}
            </ul>
          </div>
          <div className="auth-story-foot">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            <span><strong>Secure by design</strong><small>Your account and travel details stay protected.</small></span>
          </div>
        </aside>
        <div className="auth-form-side">
          <div className="auth-form-intro">
            <span>{mode === "signin" ? "Account access" : "Create your account"}</span>
            <h2>{mode === "signin" ? "Good to see you again" : "Start planning with us"}</h2>
          </div>
          {note && <p className="mk-clerk-note"><i className="fa-solid fa-circle-info" aria-hidden="true" />{note}</p>}
          <div className="auth-clerk">{children}</div>
          <p className="auth-help">Need help? <Link href="/contact">Talk to our travel team</Link></p>
        </div>
      </div>
    </section>
  );
}

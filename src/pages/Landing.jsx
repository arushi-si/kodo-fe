import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, MapPin, MessageCircle, Rocket } from "lucide-react";
import Logo from "../components/ui/Logo";
import PromptCard from "../components/profile/PromptCard";
import ProjectCard from "../components/profile/ProjectCard";
import { SkillChip } from "../components/profile/Chips";
import api from "../utils/api";
import { APP_NAME } from "../utils/constant";

const SWIPE_EVERY_MS = 2600;
const FAN = [
  { rotate: 0, x: 0, y: 0, scale: 1 },
  { rotate: -7, x: -26, y: 14, scale: 0.94 },
  { rotate: 7, x: 26, y: 22, scale: 0.9 },
];

function ShowcaseCard({ profile }) {
  return (
    <div className="relative size-full rounded-3xl overflow-hidden bg-base-300 shadow-2xl border border-white/10">
      <img src={profile.photoUrl} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
      <div className="absolute inset-x-0 bottom-0 pt-20 pb-4 px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
        <p className="font-display text-2xl font-bold">
          {profile.firstName}
          {profile.age && <span className="font-normal text-white/80">, {profile.age}</span>}
        </p>
        {profile.headline && <p className="text-sm text-white/85 line-clamp-1">{profile.headline}</p>}
        {profile.location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/65">
            <MapPin className="size-3" /> {profile.location}
          </p>
        )}
        {profile.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.skills.map((s) => (
              <SkillChip key={s}>{s}</SkillChip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Fanned stack of demo profiles from GET /meta/showcase that swipes itself.
function LivePreview({ profiles }) {
  const reduceMotion = useReducedMotion();
  const [deck, setDeck] = useState(() => profiles.map((p, i) => ({ key: `${p._id}-0`, profile: p, n: i })));
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (reduceMotion || profiles.length < 2) return;
    const timer = setInterval(() => {
      setDir((d) => -d);
      setDeck(([first, ...rest]) => [...rest, { ...first, key: `${first.profile._id}-${first.n + profiles.length}`, n: first.n + profiles.length }]);
    }, SWIPE_EVERY_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, profiles.length]);

  const visible = deck.slice(0, FAN.length);

  return (
    <div className="relative mx-auto w-[min(17rem,72vw)] aspect-[3/4]" aria-label="Example profiles">
      <AnimatePresence initial={false} custom={dir}>
        {visible
          .map((item, i) => (
            <motion.div
              key={item.key}
              className="absolute inset-0"
              style={{ zIndex: FAN.length - i }}
              initial={{ ...FAN[FAN.length - 1], opacity: 0 }}
              animate={{ ...FAN[i], opacity: 1 }}
              exit={(d) => ({ x: d * 360, rotate: d * 24, opacity: 0, transition: { duration: 0.45 } })}
              custom={dir}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
            >
              <ShowcaseCard profile={item.profile} />
              {i === 0 && !reduceMotion && (
                <motion.span
                  className={`absolute top-6 rounded-xl border-4 px-2 font-display text-2xl font-bold ${
                    dir > 0 ? "left-4 -rotate-12 border-primary text-primary" : "right-4 rotate-12 border-error text-error"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1] }}
                  transition={{ duration: SWIPE_EVERY_MS / 1000, times: [0, 0.75, 1] }}
                >
                  {dir > 0 ? "LIKE" : "NOPE"}
                </motion.span>
              )}
            </motion.div>
          ))
          .reverse()}
      </AnimatePresence>
    </div>
  );
}

function Step({ icon: Icon, n, title, children }) {
  return (
    <li className="flex gap-4 rounded-3xl bg-base-200 border border-white/5 p-5">
      <span className="size-12 shrink-0 rounded-2xl bg-brand grid place-items-center text-white shadow-glow">
        <Icon className="size-6" />
      </span>
      <div>
        <p className="font-mono text-xs text-accent">{`0${n}.`}</p>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted mt-1">{children}</p>
      </div>
    </li>
  );
}

function Ctas() {
  return (
    <div className="flex flex-col gap-3">
      <Link to="/signup" className="btn btn-brand btn-lg h-14 text-lg">
        Get started
      </Link>
      <Link to="/login" className="btn btn-ghost btn-lg h-14 text-lg border border-white/10">
        I have an account
      </Link>
    </div>
  );
}

const SAMPLE_PROMPT = { question: "My most controversial tech opinion", answer: "Most microservices should have stayed a monolith." };
const SAMPLE_PROJECT = {
  title: "Will you be my Valentine?",
  description: "A site where the 'No' button runs away from your cursor. 100% success rate.",
  tags: ["react", "fun"],
};

function Landing() {
  const [showcase, setShowcase] = useState(null);

  useEffect(() => {
    api
      .get("/meta/showcase")
      .then((res) => setShowcase(res.data))
      .catch(() => setShowcase([]));
  }, []);

  const samplePrompt = showcase?.find((p) => p.prompt)?.prompt ?? SAMPLE_PROMPT;

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Logo />
        <Link to="/login" className="btn btn-ghost btn-sm h-11 px-4">
          Log in
        </Link>
      </header>

      {/* 1. Hero */}
      <section className="px-6 pt-10 pb-8">
        <p className="font-mono text-xs text-accent">{"// dating for developers"}</p>
        <h1 className="mt-3 text-[2.75rem] leading-[1.02] font-bold">
          Find someone who gets your{" "}
          <code className="font-mono text-[0.78em] text-brand whitespace-nowrap">git push --force</code>
        </h1>
        <p className="mt-4 text-lg text-muted">
          {APP_NAME} matches you with developers by stack, side projects and the bugs that almost broke you.
        </p>
        <div className="mt-8">
          <Ctas />
        </div>
      </section>

      {/* 2. Live preview */}
      <section className="py-10" aria-label="Live preview">
        {showcase === null ? (
          <div className="mx-auto w-[min(17rem,72vw)] aspect-[3/4] rounded-3xl skeleton bg-base-300" />
        ) : showcase.length > 0 ? (
          <LivePreview profiles={showcase} />
        ) : null}
        <p className="mt-8 text-center font-mono text-xs text-muted">{"// real profiles swipe left and right"}</p>
      </section>

      {/* 3. How it works */}
      <section className="px-6 py-10">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="mt-6 flex flex-col gap-3">
          <Step icon={Heart} n={1} title="Swipe">
            Right if their stack, prompts or side projects spark something. Left if not, and undo if you change your mind.
          </Step>
          <Step icon={MessageCircle} n={2} title="Match">
            When you both swipe right it's a match, and the chat opens up.
          </Step>
          <Step icon={Rocket} n={3} title="Ship together">
            Pair on a weekend project, review each other's PRs, or just grab coffee.
          </Step>
        </ol>
      </section>

      {/* 4. Profiles with personality */}
      <section className="px-6 py-10">
        <h2 className="text-3xl font-bold">Profiles with personality</h2>
        <p className="mt-2 text-muted">More than a headline: prompts to reply to, and the things you built for fun.</p>
        <div className="mt-6 flex flex-col gap-4">
          <PromptCard prompt={samplePrompt} className="-rotate-1" />
          <ProjectCard project={SAMPLE_PROJECT} className="rotate-1" />
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="px-6 pt-10 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="rounded-3xl bg-base-200 border border-white/5 p-6 text-center">
          <p className="font-mono text-xs text-accent">{"$ npm run find-love"}</p>
          <h2 className="mt-2 text-3xl font-bold">Your next commit could be a co-author.</h2>
          <div className="mt-6">
            <Ctas />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;

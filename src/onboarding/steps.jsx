import { ChipInput, ChoicePills, Label, TextArea, TextInput } from "../components/fields/inputs";
import PromptsEditor from "../components/fields/PromptsEditor";
import ProjectsEditor from "../components/fields/ProjectsEditor";
import PhotoGrid from "../components/photos/PhotoGrid";
import { AGE_LIMITS, NAME_LIMITS } from "../utils/constant";
import { capitalize, isHttpUrl, optionLabel } from "../utils/helpers";

// One profile question per step. The same definitions drive /onboarding (one per screen)
// and the sections of the edit-profile screen.
//
//   init(user)              -> draft value for the Field
//   Field({ value, onChange, meta, user })
//   validate(draft, ctx)    -> true | false (silently invalid) | "error message"
//   toPatch(draft)          -> body for PATCH /profile (omit for steps that save themselves)
//   done(user, meta)        -> already answered? Used to resume onboarding.
//   optional                -> shows "Skip"
//   onboardingOnly / editOnly

const str = (v) => v ?? "";
const promptsValid = (prompts) => prompts.length > 0 && prompts.every((p) => p.answer.trim().length > 0);

export const STEPS = [
  {
    id: "name",
    section: "Name",
    title: "What's your first name?",
    subtitle: "Last name is optional and only shows on your full profile.",
    init: (u) => ({ firstName: str(u.firstName), lastName: str(u.lastName) }),
    validate: (d) =>
      d.firstName.trim().length >= NAME_LIMITS.firstNameMin || `At least ${NAME_LIMITS.firstNameMin} characters`,
    toPatch: (d) => ({ firstName: d.firstName.trim(), lastName: d.lastName.trim() }),
    done: (u) => Boolean(u.firstName),
    Field: ({ value, onChange }) => (
      <div className="flex flex-col gap-4">
        <TextInput
          label="First name"
          autoComplete="given-name"
          maxLength={NAME_LIMITS.nameMax}
          value={value.firstName}
          onChange={(e) => onChange({ ...value, firstName: e.target.value })}
        />
        <TextInput
          label="Last name (optional)"
          autoComplete="family-name"
          maxLength={NAME_LIMITS.nameMax}
          value={value.lastName}
          onChange={(e) => onChange({ ...value, lastName: e.target.value })}
        />
      </div>
    ),
  },
  {
    id: "age",
    section: "Age",
    title: "How old are you?",
    subtitle: "Shown next to your name.",
    init: (u) => ({ age: u.age ? String(u.age) : "" }),
    validate: ({ age }) => {
      if (!age) return false;
      const n = Number(age);
      return (Number.isInteger(n) && n >= AGE_LIMITS.min && n <= AGE_LIMITS.max) ||
        `Must be between ${AGE_LIMITS.min} and ${AGE_LIMITS.max}`;
    },
    toPatch: (d) => ({ age: Number(d.age) }),
    done: (u) => Boolean(u.age),
    Field: ({ value, onChange }) => (
      <input
        className="w-full bg-transparent border-0 border-b-2 border-white/15 focus:border-primary outline-none font-display text-7xl font-bold py-2 placeholder:text-white/15"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        placeholder="25"
        aria-label="Age"
        autoFocus
        value={value.age}
        onChange={(e) => onChange({ age: e.target.value.replace(/\D/g, "") })}
      />
    ),
  },
  {
    id: "gender",
    section: "Gender",
    title: "How do you identify?",
    init: (u) => ({ gender: str(u.gender) }),
    validate: (d) => Boolean(d.gender),
    toPatch: (d) => ({ gender: d.gender }),
    done: (u) => Boolean(u.gender),
    Field: ({ value, onChange, meta }) => (
      <ChoicePills
        options={meta.genders}
        value={value.gender}
        label={optionLabel}
        onChange={(gender) => onChange({ gender })}
      />
    ),
  },
  {
    id: "location",
    section: "Location",
    title: "Where are you based?",
    subtitle: "A city is plenty.",
    optional: true,
    init: (u) => ({ location: str(u.location) }),
    validate: () => true,
    toPatch: (d) => ({ location: d.location.trim() }),
    done: (u) => Boolean(u.location),
    Field: ({ value, onChange, meta }) => (
      <TextInput
        placeholder="Bengaluru"
        autoComplete="address-level2"
        maxLength={meta.limits.shortText}
        autoFocus
        value={value.location}
        onChange={(e) => onChange({ location: e.target.value })}
      />
    ),
  },
  {
    id: "photos",
    section: "Photos",
    title: "Show us your face",
    subtitle: "Add at least one photo, up to six. Your first photo is the one people see first.",
    selfSaving: true,
    init: () => null,
    validate: (_, { user, meta }) => !meta.photoUploadsEnabled || (user.photos?.length ?? 0) > 0,
    done: (u, meta) => !meta.photoUploadsEnabled || (u.photos?.length ?? 0) > 0,
    Field: ({ meta }) => <PhotoGrid meta={meta} />,
  },
  {
    id: "work",
    section: "Work",
    title: "What do you do?",
    subtitle: "A one-line headline and how far along you are.",
    optional: true,
    init: (u) => ({ headline: str(u.headline), experienceLevel: str(u.experienceLevel) }),
    validate: () => true,
    toPatch: (d) => ({
      headline: d.headline.trim(),
      ...(d.experienceLevel && { experienceLevel: d.experienceLevel }),
    }),
    done: (u) => Boolean(u.headline),
    Field: ({ value, onChange, meta }) => (
      <div className="flex flex-col gap-6">
        <TextInput
          label="Headline"
          placeholder="Full-stack @ a tiny startup"
          maxLength={meta.limits.shortText}
          value={value.headline}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
        />
        <div>
          <Label>Experience</Label>
          <ChoicePills
            options={meta.experienceLevels}
            value={value.experienceLevel}
            label={capitalize}
            columns={2}
            onChange={(experienceLevel) => onChange({ ...value, experienceLevel })}
          />
        </div>
      </div>
    ),
  },
  {
    id: "skills",
    section: "Skills",
    title: "What's in your stack?",
    subtitle: "Add a few skills. Shared ones get highlighted on your matches' cards.",
    init: (u) => ({ skills: u.skills ?? [] }),
    validate: (d) => d.skills.length > 0,
    toPatch: (d) => ({ skills: d.skills }),
    done: (u) => (u.skills?.length ?? 0) > 0,
    Field: ({ value, onChange, meta }) => (
      <ChipInput
        value={value.skills}
        onChange={(skills) => onChange({ skills })}
        max={meta.limits.skills}
        maxLength={meta.limits.skill}
        placeholder="react, rust, postgres…"
      />
    ),
  },
  {
    id: "about",
    section: "About",
    title: "Tell people about yourself",
    subtitle: "What you're into, what you're building, what you're looking for.",
    optional: true,
    init: (u) => ({ about: str(u.about) }),
    validate: () => true,
    toPatch: (d) => ({ about: d.about.trim() }),
    done: (u) => Boolean(u.about),
    Field: ({ value, onChange, meta }) => (
      <TextArea
        rows={6}
        maxLength={meta.limits.about}
        placeholder="I write Go by day and bad poetry by night…"
        value={value.about}
        onChange={(e) => onChange({ about: e.target.value })}
      />
    ),
  },
  {
    id: "prompts",
    section: "Prompts",
    title: "Give them something to reply to",
    subtitle: "Pick 1 to 3 prompts and answer them.",
    init: (u) => ({ prompts: (u.prompts ?? []).map(({ question, answer }) => ({ question, answer })) }),
    validate: (d) => promptsValid(d.prompts),
    toPatch: (d) => ({ prompts: d.prompts.map((p) => ({ question: p.question, answer: p.answer.trim() })) }),
    done: (u) => (u.prompts?.length ?? 0) > 0,
    Field: ({ value, onChange, meta }) => (
      <PromptsEditor value={value.prompts} onChange={(prompts) => onChange({ prompts })} meta={meta} />
    ),
  },
  {
    id: "projects",
    section: "Hobby projects",
    title: "What have you built for fun?",
    subtitle:
      "Show us something you built for fun: the Valentine's site, the plant-watering bot, the Discord bot your friends hate.",
    optional: true,
    init: (u) => ({ projects: u.projects ?? [] }),
    validate: () => true,
    toPatch: (d) => ({ projects: d.projects }),
    done: (u) => (u.projects?.length ?? 0) > 0,
    Field: ({ value, onChange, meta }) => (
      <ProjectsEditor value={value.projects} onChange={(projects) => onChange({ projects })} meta={meta} />
    ),
  },
  {
    id: "links",
    section: "Links",
    editOnly: true,
    init: (u) => ({ githubUrl: str(u.githubUrl) }),
    validate: (d) => isHttpUrl(d.githubUrl.trim()) || "Must start with http:// or https://",
    toPatch: (d) => ({ githubUrl: d.githubUrl.trim() }),
    Field: ({ value, onChange }) => (
      <TextInput
        label="GitHub"
        type="url"
        inputMode="url"
        placeholder="https://github.com/you"
        value={value.githubUrl}
        onChange={(e) => onChange({ githubUrl: e.target.value })}
      />
    ),
  },
  {
    id: "preview",
    onboardingOnly: true,
    title: "Looking good.",
    subtitle: "This is exactly how others will see you. Tap the card for your full profile.",
    init: () => null,
    validate: () => true,
  },
];

export const ONBOARDING_STEPS = STEPS.filter((s) => !s.editOnly);
export const EDIT_SECTIONS = STEPS.filter((s) => !s.onboardingOnly);

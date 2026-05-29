import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Reveal } from "./Reveal";
import { GoldDivider } from "./ornaments/GoldDivider";
import { cn } from "../lib/utils";

export interface ProcessStep {
  n: string;
  title: string;
  body: string;
  imageSrc: string;
}

interface Props {
  steps: ProcessStep[];
}

/** Sticky-scroll storytelling. Desktop: image sticks while steps scroll. Mobile: simple stack. */
export function ProcessStory({ steps }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const n = steps.length;
  // Map scroll progress to an active step index (0..n-1)
  const activeIdx = useTransform(scrollYProgress, (p) => {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    return idx;
  });

  return (
    <section className="relative bg-cream overflow-hidden">
      {/* Section header */}
      <div className="container-tight pt-16 sm:pt-24 pb-8 sm:pb-12 text-center relative">
        <div className="tag mb-3">Het proces</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl">Van eerste schets tot levering</h2>
        <div className="mt-6"><GoldDivider /></div>
      </div>

      {/* Mobile: simple stack with Reveals */}
      <div className="lg:hidden container-tight pb-16 space-y-6">
        {steps.map((s, i) => (
          <Reveal key={i} delay={i * 80} className="card hairline-gold bg-cream/80 backdrop-blur p-5 sm:p-6">
            <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 ring-1 ring-gold/10">
              <img src={s.imageSrc} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="script-accent text-4xl leading-none mb-2">{s.n}</div>
            <h3 className="text-xl mb-2">{s.title}</h3>
            <p className="text-sm text-charcoal/70 leading-relaxed">{s.body}</p>
          </Reveal>
        ))}
      </div>

      {/* Desktop: sticky image, scrolling steps */}
      <div
        ref={sectionRef}
        className="hidden lg:block container-tight pb-20"
        style={{ height: `${n * 80}vh` }}
      >
        <div className="grid grid-cols-2 gap-12 h-full">
          {/* Sticky image column */}
          <div className="sticky top-24 h-[calc(100vh-8rem)] flex items-center">
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20">
              {steps.map((s, i) => (
                <ProcessImage key={i} idx={i} activeIdx={activeIdx} src={s.imageSrc} alt={s.title} />
              ))}
              <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />
              <ProcessStepLabel activeIdx={activeIdx} steps={steps} />
            </div>
          </div>

          {/* Scrolling steps column */}
          <div className="flex flex-col gap-[60vh] py-[20vh]">
            {steps.map((s, i) => (
              <ProcessStepBlock key={i} step={s} idx={i} activeIdx={activeIdx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessImage({
  idx,
  activeIdx,
  src,
  alt,
}: {
  idx: number;
  activeIdx: ReturnType<typeof useTransform<number, number>>;
  src: string;
  alt: string;
}) {
  const opacity = useTransform(activeIdx, (i) => (Math.round(i) === idx ? 1 : 0));
  return (
    <motion.img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity }}
      loading="lazy"
    />
  );
}

function ProcessStepLabel({
  activeIdx,
  steps,
}: {
  activeIdx: ReturnType<typeof useTransform<number, number>>;
  steps: ProcessStep[];
}) {
  return (
    <div className="absolute top-4 left-4 bg-cream/90 backdrop-blur px-3 py-1 rounded-full">
      <motion.span
        className="tag !text-[10px]"
        style={{
          // Re-render label only — use index to pick step
        }}
      >
        <ProcessLabelText activeIdx={activeIdx} steps={steps} />
      </motion.span>
    </div>
  );
}

function ProcessLabelText({
  activeIdx,
  steps,
}: {
  activeIdx: ReturnType<typeof useTransform<number, number>>;
  steps: ProcessStep[];
}) {
  // Pull current step text via subscribing
  // We just render based on rounded index — Motion will update via re-render when activeIdx changes.
  const idx = Math.round(activeIdx.get());
  return <span>{steps[idx]?.n} · {steps[idx]?.title}</span>;
}

function ProcessStepBlock({
  step,
  idx,
  activeIdx,
}: {
  step: ProcessStep;
  idx: number;
  activeIdx: ReturnType<typeof useTransform<number, number>>;
}) {
  const opacity = useTransform(activeIdx, (i) => {
    const dist = Math.abs(i - idx);
    return Math.max(0.25, 1 - dist * 0.55);
  });
  const scale = useTransform(activeIdx, (i) => (Math.round(i) === idx ? 1 : 0.97));

  return (
    <motion.div
      style={{ opacity, scale }}
      className={cn("relative pl-8 border-l-2 border-gold/30")}
    >
      <div className="script-accent text-5xl leading-none mb-3">{step.n}</div>
      <h3 className="text-3xl mb-3">{step.title}</h3>
      <p className="text-base text-charcoal/70 leading-relaxed max-w-md">{step.body}</p>
    </motion.div>
  );
}

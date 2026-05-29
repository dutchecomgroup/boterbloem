import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from "motion/react";
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
  const [activeIdx, setActiveIdx] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(p * n + 0.0001)));
    setActiveIdx(idx);
  });

  return (
    <section className="relative bg-cream">
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
        style={{ height: `${n * 90}vh` }}
      >
        <div className="grid grid-cols-2 gap-12 relative">
          {/* Sticky image column */}
          <div className="sticky top-24 h-[calc(100vh-8rem)] flex items-center self-start">
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/20">
              {steps.map((s, i) => (
                <ProcessImage
                  key={i}
                  idx={i}
                  total={n}
                  scrollYProgress={scrollYProgress}
                  src={s.imageSrc}
                  alt={s.title}
                />
              ))}
              <div className="pointer-events-none absolute inset-3 border border-cream/30 rounded-xl" />
              <div className="absolute top-4 left-4 bg-cream/90 backdrop-blur px-3 py-1 rounded-full">
                <span className="tag !text-[10px]">{steps[activeIdx]?.n} · {steps[activeIdx]?.title}</span>
              </div>
            </div>
          </div>

          {/* Scrolling steps column */}
          <div className="flex flex-col gap-[55vh] py-[20vh]">
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
  total,
  scrollYProgress,
  src,
  alt,
}: {
  idx: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  src: string;
  alt: string;
}) {
  // First image visible at start; last image stays visible at end.
  // Each image crossfades through its slot.
  const slot = 1 / total;
  const start = idx === 0 ? -1 : idx * slot - slot * 0.3;
  const inLeft = idx === 0 ? -1 : idx * slot + slot * 0.1;
  const inRight = idx === total - 1 ? 2 : (idx + 1) * slot - slot * 0.3;
  const end = idx === total - 1 ? 2 : (idx + 1) * slot + slot * 0.1;

  const opacity = useTransform(scrollYProgress, [start, inLeft, inRight, end], [0, 1, 1, 0]);

  return (
    <motion.img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity }}
      loading={idx === 0 ? "eager" : "lazy"}
    />
  );
}

function ProcessStepBlock({
  step,
  idx,
  activeIdx,
}: {
  step: ProcessStep;
  idx: number;
  activeIdx: number;
}) {
  const isActive = idx === activeIdx;
  const dist = Math.abs(idx - activeIdx);
  return (
    <motion.div
      animate={{
        opacity: Math.max(0.25, 1 - dist * 0.4),
        scale: isActive ? 1 : 0.97,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative pl-8 border-l-2", isActive ? "border-gold" : "border-gold/30")}
    >
      <div className="script-accent text-5xl leading-none mb-3">{step.n}</div>
      <h3 className="text-3xl mb-3">{step.title}</h3>
      <p className="text-base text-charcoal/70 leading-relaxed max-w-md">{step.body}</p>
    </motion.div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";

/* ── 1. Page Entrance Transition Wrapper ─────────────────────────── */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.995 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // Ultra smooth cubic-bezier
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/* ── 2. Directional Fade-In Component ────────────────────────────── */
export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className = "",
  distance = 25,
  once = true,
}: {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
  once?: boolean;
}) {
  const directions = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── 3. Scroll Reveal Section Wrapper ────────────────────────────── */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── 4. Staggered Container & Children ───────────────────────────── */
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.08,
  delayChildren = 0,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  distance = 20,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: distance, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── 5. Scroll Progress Top Bar ──────────────────────────────────── */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="scroll-progress"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}

/* ── 6. Animated Number Counter ──────────────────────────────────── */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const startValue = 0;
          const durMs = duration * 1000;

          function step(timestamp: number) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / durMs, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (value - startValue) * easeProgress;
            setDisplayValue(current);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setDisplayValue(value);
            }
          }

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  const formatted = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="font-mono">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ── 7. Enhanced 3D Tilt Card with Framer Motion Spring & Spotlight ─ */
export function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  scale = 1.02,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glow?: boolean;
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), { stiffness: 300, damping: 25 });
  const cardScale = useSpring(1, { stiffness: 300, damping: 25 });

  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50, opacity: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    x.set(px);
    y.set(py);
    cardScale.set(scale);

    if (glow) {
      setSpotlightPos({
        x: px * 100,
        y: py * 100,
        opacity: 1,
      });
    }
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
    cardScale.set(1);
    if (glow) {
      setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
    }
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale: cardScale,
        transformStyle: "preserve-3d",
      }}
      className={`relative perspective-1000 will-change-transform ${className}`}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -inset-px rounded-inherit opacity-0 transition-opacity duration-300 z-10 overflow-hidden"
          style={{
            opacity: spotlightPos.opacity,
            background: `radial-gradient(400px circle at ${spotlightPos.x}% ${spotlightPos.y}%, rgba(169, 199, 206, 0.18), transparent 60%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

/* ── 8. Magnetic Button Wrapper ──────────────────────────────────── */
export function MagneticButton({
  children,
  className = "",
  strength = 14,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 200, damping: 15 };
  const dx = useSpring(x, springConfig);
  const dy = useSpring(y, springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set(((e.clientX - centerX) / (rect.width / 2)) * strength);
    y.set(((e.clientY - centerY) / (rect.height / 2)) * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: dx, y: dy }}
      whileTap={{ scale: 0.96 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ── 9. Split Text Reveal Component ───────────────────────────────── */
export function SplitTextReveal({
  text,
  serifItalicWord,
  className = "",
}: {
  text: string;
  serifItalicWord?: string;
  className?: string;
}) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.06 },
        },
      }}
      className={`inline-block ${className}`}
    >
      {words.map((word, idx) => {
        const isEmphasized =
          serifItalicWord && word.toLowerCase().includes(serifItalicWord.toLowerCase());
        return (
          <span key={idx} className="inline-block overflow-hidden mr-[0.25em] vertical-bottom">
            <motion.span
              variants={{
                hidden: { y: "100%", opacity: 0 },
                visible: {
                  y: 0,
                  opacity: 1,
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="inline-block"
            >
              {isEmphasized ? (
                <em className="font-serif italic font-medium text-ring">{word}</em>
              ) : (
                word
              )}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );
}

/* ── 10. Cursor Spotlight Layer ────────────────────────────────────── */
export function CursorSpotlight({
  children,
  className = "",
  contentClassName = "",
}: {
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlight({ x, y });
  }

  return (
    <div onMouseMove={handleMouseMove} className={`relative overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: `radial-gradient(600px circle at ${spotlight.x}% ${spotlight.y}%, rgba(169, 199, 206, 0.15), transparent 40%)`,
        }}
      />
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
}

/* ── 11. Gentle 3D Floating Element Wrapper ─────────────────────── */
export function FloatingElement({
  children,
  duration = 4,
  yDistance = 8,
  className = "",
}: {
  children: React.ReactNode;
  duration?: number;
  yDistance?: number;
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        y: [-yDistance, yDistance, -yDistance],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── 12. Pulsing Glow Badge Component ───────────────────────────── */
export function PulseGlowBadge({
  text,
  color = "emerald",
}: {
  text: string;
  color?: "emerald" | "amber" | "cyan" | "ring";
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-800 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-900 border-amber-500/30",
    cyan: "bg-cyan-500/10 text-cyan-900 border-cyan-500/30",
    ring: "bg-ring/10 text-ring border-ring/30",
  };

  const dots = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-400",
    ring: "bg-ring",
  };

  return (
    <motion.span
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.6875rem] font-mono font-semibold border ${colors[color]}`}
    >
      <span className={`w-2 h-2 rounded-full ${dots[color]} animate-pulse`} />
      <span>{text}</span>
    </motion.span>
  );
}

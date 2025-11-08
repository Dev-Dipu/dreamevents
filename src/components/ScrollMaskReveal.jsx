"use client";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollMaskReveal({
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-heights-in-a-sunset-26070-large.mp4",
  maskSvg = null,
  initialMaskSize = 0.8,
  targetMaskSize = 30,
  scrollHeight = "300vh",
  backgroundColor = "white",
}) {
  const container = useRef(null);
  const stickyMask = useRef(null);
  const textRef = useRef(null);

  // --- Mask Scale Animation (GSAP ScrollTrigger) ---
  useEffect(() => {
    const maskEl = stickyMask.current;
    const containerEl = container.current;

    if (maskEl && containerEl) {
      gsap.set(maskEl, {
        WebkitMaskSize: `${initialMaskSize * 100}%`,
        maskSize: `${initialMaskSize * 100}%`,
      });

      gsap.to(maskEl, {
        WebkitMaskSize: `${targetMaskSize * 100}%`,
        maskSize: `${targetMaskSize * 100}%`,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerEl,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }
  }, [initialMaskSize, targetMaskSize]);

  // --- Text Reveal + Scroll Hide ---
  useEffect(() => {
    const lines = textRef.current.querySelectorAll(".reveal-line");

    // Initial reveal animation
    gsap.set(lines, { yPercent: 100, opacity: 0 });

    const tl = gsap.timeline({
      defaults: { duration: 0.8, ease: "power4.inOut" },
    });

    lines.forEach((line, i) => {
      tl.to(line, { yPercent: 0, opacity: 1, delay: i * 0.1 }, "<");
    });

    // Scroll-based hide animation (smooth + instant response)
    const hideTL = gsap.timeline({
      scrollTrigger: {
        start: 0, // as soon as 20px scroll
        end: 16,
        scrub: true,
      },
    });

    hideTL.to(textRef.current, {
      y: 60,
      opacity: 0,
      ease: "power3.inOut",
      duration: 0.4,
    });
  }, []);

  return (
    <main>
      <div
        ref={container}
        className="relative"
        style={{ height: scrollHeight, backgroundColor }}
      >
        {/* Masked Video Section */}
        <div
          ref={stickyMask}
          className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
          style={{
            maskImage: maskSvg
              ? `url(${maskSvg})`
              : "radial-gradient(circle, black 50%, transparent 50%)",
            WebkitMaskImage: maskSvg
              ? `url(${maskSvg})`
              : "radial-gradient(circle, black 50%, transparent 50%)",
            maskPosition: "center center",
            WebkitMaskPosition: "center center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskSize: `${initialMaskSize * 100}%`,
            WebkitMaskSize: `${initialMaskSize * 100}%`,
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Text Reveal */}
      <h3
        ref={textRef}
        className="fixed left-[10.5%] top-3/5 text-black text-sm overflow-hidden leading-[1.6] font-medium"
      >
        <span className="block reveal-line">
          Crafting unforgettable, innovative and impactful
        </span>
        <span className="block reveal-line">
          corporate experiences across India.
        </span>
      </h3>
    </main>
  );
}

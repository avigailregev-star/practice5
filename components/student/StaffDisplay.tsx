"use client";

import { useEffect, useRef } from "react";

interface StaffDisplayProps {
  abcSymbol: string; // "C" | "D" | "E" | "F" | "G" | "A" | "B"
  animClass?: string;
}

export default function StaffDisplay({ abcSymbol, animClass = "" }: StaffDisplayProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    // Single note in treble clef, middle octave
    const abcString = `X:1\nT:\nM:4/4\nL:1/1\nK:C treble\n|${abcSymbol}4|`;

    import("abcjs").then((abcjs) => {
      abcjs.renderAbc(divRef.current!, abcString, {
        responsive: "resize",
        staffwidth: 220,
        scale: 2.2,
        paddingtop: 20,
        paddingbottom: 20,
        paddingleft: 30,
        paddingright: 30,
        add_classes: true,
      });
    });
  }, [abcSymbol]);

  return (
    <div className={`bg-white rounded-2xl border-2 border-brand-border shadow-sm overflow-hidden ${animClass}`}>
      <div ref={divRef} className="w-full" />
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

interface RhythmNotationProps {
  pattern: string;
}

export default function RhythmNotation({ pattern }: RhythmNotationProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || !pattern) return;
    const abcString = `X:1\nT:\nM:4/4\nL:1/4\nK:C\n|${pattern}|`;
    // @ts-ignore
    import("abcjs").then((abcjs) => {
      abcjs.renderAbc(divRef.current!, abcString, {
        responsive: "resize",
        add_classes: true,
        staffwidth: 280,
        scale: 1.5,
        paddingtop: 10,
        paddingbottom: 10,
        paddingleft: 10,
        paddingright: 10,
      });
    });
  }, [pattern]);

  return (
    <div className="bg-white rounded-xl p-3 border border-brand-border">
      <p className="text-xs text-brand-muted text-center mb-2">נגן את המקצב</p>
      <div ref={divRef} className="w-full" />
    </div>
  );
}

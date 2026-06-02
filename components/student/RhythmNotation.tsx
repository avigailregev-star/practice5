"use client";
import { useEffect, useRef } from "react";

interface RhythmNotationProps {
  pattern: string; // ABC notation rhythm pattern e.g. "B B B/B/ B"
}

export default function RhythmNotation({ pattern }: RhythmNotationProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    // Build ABC string with percussion clef look (using treble clef with B notes on middle line)
    const abcString = `X:1\nT:\nM:4/4\nL:1/4\nK:C perc\n|${pattern}|`;

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
    <div className="bg-white rounded-2xl p-3 border border-gray-100">
      <p className="text-xs text-gray-400 mb-1 text-center">הקש את המקצב</p>
      <div ref={divRef} className="w-full" />
      <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
        <span>♩ = פעימה</span>
        <span>♪♪ = שתי שמיניות</span>
        <span>𝅗𝅥 = חצי</span>
      </div>
    </div>
  );
}

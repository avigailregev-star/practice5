"use client";
import { useEffect, useRef } from "react";

interface MusicNotationProps {
  notes: string[];
  label?: string;
}

function toAbcNote(note: string): string {
  const nameMap: Record<string, string> = {
    C: "C", D: "D", E: "E", F: "F",
    G: "G", A: "A", B: "B",
  };
  const name = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));
  let abc = nameMap[name] ?? "C";
  if (octave >= 5) abc = abc.toLowerCase();
  else if (octave <= 3) abc = abc + ",";
  return abc;
}

export default function MusicNotation({ notes, label = "קרא את התווים" }: MusicNotationProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || notes.length === 0) return;
    const abcNotes = notes.map(toAbcNote).join(" ");
    const abcString = `X:1\nT:\nM:4/4\nL:1/4\nK:C treble\n|${abcNotes}|`;
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
  }, [notes]);

  return (
    <div className="bg-white rounded-xl p-3 border border-brand-border">
      <p className="text-xs text-brand-muted text-center mb-2">{label}</p>
      <div ref={divRef} className="w-full" />
    </div>
  );
}

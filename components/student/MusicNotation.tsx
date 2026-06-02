"use client";
import { useEffect, useRef } from "react";

interface MusicNotationProps {
  notes: string[]; // e.g. ["C4", "E4", "G4"]
}

// Convert scientific notation to ABC notation
function toAbcNote(note: string): string {
  const nameMap: Record<string, string> = {
    C: "C", D: "D", E: "E", F: "F",
    G: "G", A: "A", B: "B",
  };
  const name = note.slice(0, -1); // "C" from "C4"
  const octave = parseInt(note.slice(-1)); // 4 from "C4"

  let abc = nameMap[name] ?? "C";

  // In ABC notation: C4=C, C5=c, C3=C,
  if (octave >= 5) {
    abc = abc.toLowerCase(); // octave 5 = lowercase
  } else if (octave <= 3) {
    abc = abc + ","; // octave 3 = comma suffix
  }

  return abc;
}

export default function MusicNotation({ notes }: MusicNotationProps) {
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
    <div className="bg-white rounded-2xl p-3 border border-gray-100">
      <p className="text-xs text-gray-400 mb-1 text-center">קרא את התווים</p>
      <div ref={divRef} className="w-full" />
    </div>
  );
}

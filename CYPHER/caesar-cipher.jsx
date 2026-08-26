import { useState, useMemo } from "react";
import { Lock, Unlock, Copy, Check, RefreshCw } from "lucide-react";

const shiftChar = (char, shift) => {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
  }
  return char;
};

const caesar = (text, shift) => [...text].map((c) => shiftChar(c, shift)).join("");

const vigenere = (text, key, decrypt) => {
  const cleanKey = key.replace(/[^a-z]/gi, "").toLowerCase();
  if (!cleanKey) return text;
  let ki = 0;
  return [...text]
    .map((c) => {
      if (!/[a-z]/i.test(c)) return c;
      const shift = cleanKey.charCodeAt(ki++ % cleanKey.length) - 97;
      return shiftChar(c, decrypt ? -shift : shift);
    })
    .join("");
};

// Atbash: mirrors the alphabet (A↔Z, B↔Y...). Self-inverse, no key needed.
const atbash = (text) =>
  [...text]
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(90 - (code - 65));
      if (code >= 97 && code <= 122) return String.fromCharCode(122 - (code - 97));
      return c;
    })
    .join("");

// Repeat rule: if a letter is the same as the previous letter (case-insensitive),
// shift it by an extra amount before encrypting. The shift cycles through
// +2, +3, +4, -2, -3, -4 for each successive repeat found in the text,
// so decryption can recompute the same sequence. e.g. "hello" → "helno".
// The shift for each repeat is drawn pseudo-randomly from ±2, ±3, ±4 using a
// PRNG seeded by the cipher settings (shift + keyword). That makes the sequence
// look patternless while still being reproducible, so decryption can recompute
// the exact same sequence. True randomness would make decryption impossible.
const REPEAT_MAGNITUDES = [2, 3, 4, -2, -3, -4];

const hashSeed = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Returns s(k): the pseudo-random shift for the k-th repeat, memoized so
// encrypt and decrypt walk the identical sequence.
const makeShiftStream = (seedStr) => {
  const rng = mulberry32(hashSeed(seedStr));
  const cache = [];
  return (k) => {
    while (cache.length <= k) {
      cache.push(REPEAT_MAGNITUDES[Math.floor(rng() * REPEAT_MAGNITUDES.length)]);
    }
    return cache[k];
  };
};

// Implemented as a swap (prev ↔ prev+shift) so it's fully reversible:
// a repeated letter becomes prev+shift, and a letter that already WAS
// prev+shift becomes prev. Everything else passes through.
const applyRepeatRule = (text, seedStr) => {
  const shiftAt = makeShiftStream(seedStr);
  let prev = "";
  let k = 0; // number of repeats handled so far
  return [...text]
    .map((c) => {
      const isLetter = /[a-z]/i.test(c);
      let out = c;
      if (isLetter && prev) {
        const s = shiftAt(k);
        const lower = c.toLowerCase();
        if (lower === prev) {
          out = shiftChar(c, s); // repeat → shifted
          k++;
        } else if (lower === shiftChar(prev, s)) {
          out = shiftChar(c, -s); // occupies the repeat slot → swap back
        }
      }
      if (isLetter) prev = c.toLowerCase();
      return out;
    })
    .join("");
};

// Inverse: recompute the same shift sequence and reverse the swap.
const undoRepeatRule = (text, seedStr) => {
  const shiftAt = makeShiftStream(seedStr);
  let prev = "";
  let k = 0;
  return [...text]
    .map((c) => {
      const isLetter = /[a-z]/i.test(c);
      let out = c;
      if (isLetter && prev) {
        const s = shiftAt(k);
        const lower = c.toLowerCase();
        if (lower === shiftChar(prev, s)) {
          out = shiftChar(c, -s); // was a repeat
          k++;
        } else if (lower === prev) {
          out = shiftChar(c, s); // was swapped down, restore
        }
      }
      if (isLetter) prev = out.toLowerCase();
      return out;
    })
    .join("");
};

// Combo pipeline: Atbash → Caesar → Vigenère.
// Decryption reverses the stages: Vigenère undo → Caesar undo → Atbash.
const combo = (text, shift, key, decrypt) =>
  decrypt
    ? atbash(caesar(vigenere(text, key, true), -shift))
    : vigenere(caesar(atbash(text), shift), key, false);

const CipherTool = () => {
  const [text, setText] = useState("");
  const [cipher, setCipher] = useState("caesar");
  const [shift, setShift] = useState(3);
  const [keyword, setKeyword] = useState("KEY");
  const [mode, setMode] = useState("encrypt");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const decrypt = mode === "decrypt";
    // Seed ties the pseudo-random repeat shifts to the cipher settings, so
    // decrypting with the same settings reproduces the same sequence.
    const seed = `${cipher}:${shift}:${keyword}`;
    // Encrypt: apply repeat rule to plaintext first, then the cipher.
    // Decrypt: undo the cipher first, then undo the repeat rule.
    const input = decrypt ? text : applyRepeatRule(text, seed);
    let result;
    if (cipher === "caesar") result = caesar(input, decrypt ? -shift : shift);
    else if (cipher === "vigenere") result = vigenere(input, keyword, decrypt);
    else if (cipher === "atbash") result = atbash(input);
    else result = combo(input, shift, keyword, decrypt);
    return decrypt ? undoRepeatRule(result, seed) : result;
  }, [text, cipher, shift, keyword, mode]);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const swap = () => {
    setText(output);
    setMode(mode === "encrypt" ? "decrypt" : "encrypt");
  };

  const showShift = cipher === "caesar" || cipher === "combo";
  const showKeyword = cipher === "vigenere" || cipher === "combo";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            {mode === "encrypt" ? (
              <Lock className="w-5 h-5 text-white" />
            ) : (
              <Unlock className="w-5 h-5 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">Cipher Tool</h1>
        </div>

        {/* Cipher selector */}
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          {[
            { id: "caesar", label: "Caesar" },
            { id: "vigenere", label: "Vigenère" },
            { id: "atbash", label: "Atbash" },
            { id: "combo", label: "Combo" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCipher(c.id)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${cipher === c.id
                ? "bg-emerald-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {cipher === "atbash" && (
          <p className="text-xs text-slate-400 -mt-3">
            Atbash mirrors the alphabet (A↔Z). It's self-inverse — encrypt and decrypt are the same.
          </p>
        )}
        {cipher === "combo" && (
          <p className="text-xs text-slate-400 -mt-3">
            Three-stage pipeline: Atbash → Caesar → Vigenère. Decryption reverses all three steps.
          </p>
        )}

        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          {["encrypt", "decrypt"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${mode === m
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Cipher settings */}
        {showShift && (
          <div>
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Shift amount</span>
              <span className="font-mono text-indigo-400">{shift}</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={shift}
              onChange={(e) => setShift(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        )}
        {showKeyword && (
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword (letters only)"
              className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-indigo-500 focus:outline-none font-mono text-sm"
            />
            {!keyword.replace(/[^a-z]/gi, "") && (
              <p className="text-xs text-amber-400 mt-1">
                A keyword is required — the Vigenère step passes text through unchanged.
              </p>
            )}
          </div>
        )}

        {/* Input */}
        <div>
          <label className="text-sm text-slate-300 mb-1 block">
            {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Type your message..."
            className="w-full bg-slate-900 text-white rounded-lg p-3 border border-slate-600 focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-slate-300">
              {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={swap}
                title="Use output as input"
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={copyOutput}
                title="Copy output"
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="w-full min-h-[6rem] bg-slate-900 text-indigo-300 rounded-lg p-3 border border-slate-700 font-mono text-sm whitespace-pre-wrap break-words">
            {output || <span className="text-slate-600">Output appears here...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CipherTool
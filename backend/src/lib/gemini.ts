import { env } from "../config/env.js";

// gemini-2.5-flash-lite a été retiré pour les nouvelles clés (déc. 2026) au profit
// de la série 3.5 — vérifié en direct avec une vraie clé avant de coder en dur.
const MODEL = "gemini-3.5-flash-lite";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Appel minimal à l'API Gemini (bonus — voir docs/TECH_CHOICES.md) : un prompt, un texte en retour. */
export async function generateText(prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return text.trim();
}

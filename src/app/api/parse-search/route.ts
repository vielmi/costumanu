import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ params: "" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured", params: "" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const supabase = await createClient();
  const { data: terms } = await supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de")
    .in("vocabulary", ["color", "clothing_type", "gender"]);

  const byVocab = (terms ?? []).reduce<Record<string, { id: string; label: string }[]>>(
    (acc, t) => {
      (acc[t.vocabulary] ??= []).push({ id: t.id, label: t.label_de });
      return acc;
    },
    {}
  );

  const list = (v: string) => byVocab[v]?.map((t) => t.label).join(", ") ?? "";

  const system = `Du bist ein Assistent für eine Theaterkostüm-Datenbank.
Analysiere die Suchanfrage auf Deutsch und extrahiere strukturierte Suchparameter.

Verfügbare Farben: ${list("color")}
Verfügbare Kleidungsarten: ${list("clothing_type")}
Verfügbare Gender/Typen: ${list("gender")}

Antworte NUR mit einem JSON-Objekt (kein Markdown, keine Erklärung):
{
  "farbe": "exakter Begriff aus der Farbliste oder null",
  "kleidungsart": "exakter Begriff aus der Kleidungsartliste oder null",
  "gender": "exakter Begriff aus der Gender-Liste oder null",
  "darsteller": "Name des Darstellers/der Darstellerin oder null",
  "rolle": "Name der Rolle oder null",
  "stueck": "Stücktitel oder null",
  "jahr": "Jahreszahl als vierstelliger String oder null",
  "regie": "Name der Regie oder null"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system,
      messages: [{ role: "user", content: text }],
    });

    const block = message.content[0];
    if (block.type !== "text") return NextResponse.json({ params: "" });

    let parsed: Record<string, string | null>;
    try {
      parsed = JSON.parse(block.text);
    } catch {
      return NextResponse.json({ params: "" });
    }

    const params = new URLSearchParams();

    const findId = (vocab: string, label: string | null) =>
      label
        ? (byVocab[vocab]?.find((t) => t.label.toLowerCase() === label.toLowerCase())?.id ?? null)
        : null;

    const farbeId = findId("color", parsed.farbe);
    const clothingId = findId("clothing_type", parsed.kleidungsart);
    const genderId = findId("gender", parsed.gender);

    if (farbeId) params.set("farbe", farbeId);
    if (clothingId) params.set("clothing_type", clothingId);
    if (genderId) params.set("gender", genderId);
    if (parsed.darsteller) params.set("actor", parsed.darsteller);
    if (parsed.rolle) params.set("role", parsed.rolle);
    if (parsed.stueck) params.set("title", parsed.stueck);
    if (parsed.jahr) params.set("year", parsed.jahr);
    if (parsed.regie) params.set("director", parsed.regie);

    return NextResponse.json({ params: params.toString() });
  } catch (err) {
    console.error("[parse-search] Claude API error:", err);
    return NextResponse.json({ error: "Claude API failed", params: "" }, { status: 500 });
  }
}

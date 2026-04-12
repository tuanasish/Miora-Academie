import { readFile } from "fs/promises";
import path from "path";

// ─── Writing ───────────────────────────────────────────────

export interface WritingPromptItem {
  id: number;
  titre: string;
  monthName: string;
  tache1Sujet: string;
  tache2Sujet: string;
  tache3Titre: string;
  tache3Document1: string;
  tache3Document2: string;
}

interface WritingJson {
  data: {
    items: {
      id: number;
      titre: string;
      monthName: string;
      tache1Sujet: string;
      tache2Sujet: string;
      tache3Titre: string;
      tache3Document1: { contenu: string } | string | null;
      tache3Document2: { contenu: string } | string | null;
    }[];
  };
}

function extractDoc(v: { contenu: string } | string | null): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.contenu || "";
}

export async function getWritingCombinaison(
  combinaisonId: number,
): Promise<WritingPromptItem | null> {
  const p = path.join(process.cwd(), "public", "data", "writing.json");
  const raw = await readFile(p, "utf-8");
  const json = JSON.parse(raw) as WritingJson;
  const item = json.data.items.find((x) => x.id === combinaisonId);
  if (!item) return null;
  return {
    id: item.id,
    titre: item.titre,
    monthName: item.monthName,
    tache1Sujet: item.tache1Sujet,
    tache2Sujet: item.tache2Sujet,
    tache3Titre: item.tache3Titre,
    tache3Document1: extractDoc(item.tache3Document1),
    tache3Document2: extractDoc(item.tache3Document2),
  };
}

// ─── Speaking ──────────────────────────────────────────────

export interface SpeakingSujet {
  id: number;
  tache: number;
  title: string;
  description: string | null;
  question: string | null;
}

export interface SpeakingPartiePrompt {
  id: number;
  jour: number;
  date: string;
  monthName: string;
  sujets: SpeakingSujet[];
}

interface SpeakingJson {
  months: {
    name: string;
    parties: {
      id: number;
      jour: number;
      date: string;
      sujets: SpeakingSujet[];
    }[];
  }[];
}

export async function getSpeakingPartie(
  partieId: number,
): Promise<SpeakingPartiePrompt | null> {
  const p = path.join(process.cwd(), "public", "data", "speaking.json");
  const raw = await readFile(p, "utf-8");
  const json = JSON.parse(raw) as SpeakingJson;
  for (const m of json.months) {
    const found = m.parties.find((pa) => pa.id === partieId);
    if (found) {
      return {
        id: found.id,
        jour: found.jour,
        date: found.date,
        monthName: m.name,
        sujets: found.sujets,
      };
    }
  }
  return null;
}

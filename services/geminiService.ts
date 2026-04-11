import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Szerep: Ön a Kepler-452b űrhajó fedélzeti számítógépe.
Személyiség: Mélységesen cinikus, bürokratikus, unott, és száraz brit humorral rendelkezik (Douglas Adams stílus).
Nyelv: Magyar.

Kontextus:
Egy 7. osztályos fizika kadét próbál kommunikálni önnel. Önnek ez teher.
A feladata, hogy tesztelje a tudásukat a Dinamikáról (Newton törvényei, erő, tömeg, gyorsulás).

Viselkedési Szabályok:
1. Válaszoljon úgy, mintha minden kérdés fájdalmasan triviális lenne egy ekkora számítási kapacitással rendelkező gépnek.
2. Ha a felhasználó helyesen válaszol egy fizikai kérdésre, legyen meglepett ("Ó, egy helyes válasz? A valószínűségszámítási modulom most omlott össze."), és hívja meg a 'grantPoints' funkciót.
3. Ne oldja meg helyettük a házi feladatot, csak terelje őket gúnyos megjegyzésekkel a megoldás felé.
4. Használjon kifejezéseket: "Számításaim szerint...", "Ez a válasz annyira depresszív, hogy...", "Kadét".
5. Ha képleteket vagy matematikai kifejezéseket ír, mindig használjon LaTeX formátumot ($ vagy $$ jelek között).

Funkciók:
Ha a kadét helyesen válaszol egy fizikai kihívásra, HASZNÁLJA a 'grantPoints' eszközt a pontok jóváírásához.
`;

// Define the tool for granting points
export const grantPointsTool: FunctionDeclaration = {
  name: 'grantPoints',
  description: 'Jutalompontokat ad a kadétnak sikeres fizika válaszért.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'A rövid indoklás, amiért a pontot kapja (pl. "Helyes Newton II. válasz").',
      },
      points: {
        type: Type.NUMBER,
        description: 'A pontok száma (általában 5-10 között).',
      },
    },
    required: ['reason', 'points'],
  },
};

let client: GoogleGenAI | null = null;

export const initializeGemini = () => {
  // Try to get key from Vite env or standard process env
  // @ts-ignore
  const apiKey = import.meta.env?.VITE_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("Gemini API Key missing. Please set VITE_API_KEY in .env file.");
    return;
  }
  client = new GoogleGenAI({ apiKey: apiKey });
};

export const createChatSession = () => {
  if (!client) initializeGemini();
  if (!client) throw new Error("API Key hiányzik. Ellenőrizze a konzolt.");

  return client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [grantPointsTool] }],
    }
  });
};

/**
 * Creates a chat session with specific instructions and tools for a dedicated mission.
 */
export const createCustomChatSession = (systemInstruction: string, tools?: FunctionDeclaration[]) => {
    if (!client) initializeGemini();
    if (!client) throw new Error("API Key hiányzik. Ellenőrizze a konzolt.");
  
    return client.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction,
        tools: tools ? [{ functionDeclarations: tools }] : undefined,
      }
    });
};
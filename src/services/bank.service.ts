import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";

export interface Bank {
  name: string;
  type: string;
  website: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    // En navegador normalmente no existe `process.env`. Evitamos romper el runtime.
    const maybeProcessEnvApiKey =
      (globalThis as any)?.process?.env?.API_KEY ??
      (globalThis as any)?.process?.env?.['API_KEY'];

    this.apiKey =
      (typeof maybeProcessEnvApiKey === 'string' ? maybeProcessEnvApiKey : '') ||
      (typeof (globalThis as any)?.API_KEY === 'string' ? (globalThis as any)?.API_KEY : '') ||
      '';

    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async getBanks(): Promise<Bank[]> {
    // Sin API Key, devolvemos un fallback para que el proyecto levante sin configuración.
    if (!this.apiKey) {
      return [
        { name: 'Banco de la Nación', type: 'Estatal', website: 'https://www.bn.com.pe', description: 'Banco estatal con cobertura nacional.' },
        { name: 'BCP', type: 'Banca Múltiple', website: 'https://www.viabcp.com', description: 'Banco privado líder en Perú.' },
        { name: 'BBVA Perú', type: 'Banca Múltiple', website: 'https://www.bbva.pe', description: 'Banco privado con oferta digital.' },
        { name: 'Interbank', type: 'Banca Múltiple', website: 'https://interbank.pe', description: 'Banco privado con foco retail.' },
        { name: 'Scotiabank Perú', type: 'Banca Múltiple', website: 'https://www.scotiabank.com.pe', description: 'Banco privado de alcance global.' }
      ];
    }

    const model = 'gemini-2.5-flash';
    const prompt = 'Genera una lista de 10 a 15 de los bancos más importantes que operan actualmente en Perú (Nacionales y Privados importantes). Incluye el Banco de la Nación.';

    const response = await this.ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre oficial del banco" },
              type: { type: Type.STRING, description: "Tipo de banco (e.g., Banca Múltiple, Estatal, Microfinanzas)" },
              website: { type: Type.STRING, description: "URL del sitio web oficial (ejemplo: https://www.bcp.com.pe)" },
              description: { type: Type.STRING, description: "Una descripción muy breve (máximo 15 palabras) de su enfoque." }
            },
            required: ["name", "type", "website", "description"]
          }
        }
      }
    });

    const jsonText = response.text || '[]';
    try {
      return JSON.parse(jsonText) as Bank[];
    } catch (e) {
      console.error("Error parsing Gemini response", e);
      return [];
    }
  }
}
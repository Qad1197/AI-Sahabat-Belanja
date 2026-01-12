
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, GenerationResult, SourceLink } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const nutritionSchema = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.NUMBER, description: "Energi (Kkal)" },
    protein: { type: Type.NUMBER, description: "Protein (Gram)" },
    carbs: { type: Type.NUMBER, description: "Karbohidrat (Gram)" }
  },
  required: ["calories", "protein", "carbs"]
};

const ingredientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    quantity: { type: Type.STRING },
    unitPrice: { type: Type.NUMBER },
    totalPrice: { type: Type.NUMBER }
  },
  required: ["name", "quantity", "unitPrice", "totalPrice"]
};

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: ingredientSchema },
    nutrition: nutritionSchema
  },
  required: ["title", "ingredients", "nutrition"]
};

export const generateMealPlan = async (prefs: UserPreferences, localOverrides?: Record<string, number>): Promise<GenerationResult> => {
  const localPriceContext = localOverrides && Object.keys(localOverrides).length > 0 
    ? `Daftar HARGA PASAR LOKAL terbaru di ${prefs.city} (HASIL KONTRIBUSI WARGA): 
       ${Object.entries(localOverrides).map(([name, price]) => `- ${name}: Rp ${price}`).join('\n')}`
    : "Belum ada kontribusi harga warga untuk kota ini.";

  const prompt = `
    Halo Gemini! Kamu sekarang adalah "AI Sahabat Belanja".
    
    TUGAS: Susun rencana menu makan keluarga di ${prefs.city} dengan gaya hidup "${prefs.lifestyle}".
    
    DATABASE MENU (INTERNAL): 
    Gunakan referensi struktur menu dan variasi masakan dari khazanah kuliner Indonesia (seperti yang ada di cookpad.com/id). Pastikan menu yang kamu buat adalah masakan rumahan yang nyata, praktis, dan populer di Indonesia. Jangan sebutkan nama website "Cookpad" di dalam hasil teks atau analisis budget, gunakan hanya sebagai basis pengetahuan resepmu.

    ATURAN GAYA HIDUP (${prefs.lifestyle}):
    - Sederhana: Fokus pada protein nabati (tahu, tempe, telur), sayuran musiman yang murah, dan porsi yang efisien. Jarang daging hewani (maks 1-2x seminggu).
    - Normal: Seimbang antara protein hewani (ayam, ikan) dan nabati. Sayuran bervariasi.
    - Mewah: Gunakan protein premium (daging sapi, seafood), buah-buahan setiap hari, bumbu yang lebih kaya, dan variasi menu internasional/lokal yang kompleks.

    ATURAN PRIORITAS HARGA:
    1. PRIORITAS UTAMA: Gunakan data "${localPriceContext}".
    2. PRIORITAS KEDUA: Referensi real-time dari pencarian web (Search Grounding) untuk harga pangan terbaru di daerah tersebut.

    KONFIGURASI:
    - Budget Total: Rp ${prefs.budget}
    - Durasi: ${prefs.durationDays} Hari
    - Target: ${prefs.numberOfPeople} Orang (${prefs.portionsPerMeal}x makan/hari)

    Pastikan total estimasi belanja dalam JSON output TIDAK MELEBIHI Budget Total.
    Berikan respon JSON murni sesuai schema. Berikan budgetAnalysis yang ramah dalam bahasa Indonesia.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      temperature: 0.2,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dailyPlans: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                breakfast: mealSchema,
                lunch: mealSchema,
                dinner: mealSchema,
                dailyTotal: nutritionSchema
              },
              required: ["day", "breakfast", "lunch", "dinner", "dailyTotal"]
            }
          },
          shoppingList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.STRING },
                category: { type: Type.STRING },
                estimatedPrice: { type: Type.NUMBER }
              },
              required: ["name", "quantity", "category", "estimatedPrice"]
            }
          },
          totalEstimatedCost: { type: Type.NUMBER },
          budgetAnalysis: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["dailyPlans", "shoppingList", "totalEstimatedCost", "budgetAnalysis", "tips"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    const data = JSON.parse(text);
    
    // Correctly extract search grounding chunks to provide source links as per guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      data.sourceLinks = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title
        }));
    }
    
    return data;
  } catch (error) {
    console.error("JSON Parsing Error:", error);
    throw new Error("Gagal mengolah data belanja.");
  }
};

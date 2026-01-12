
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, GenerationResult, Lifestyle } from "../types";
import { getMinRationalPrice } from "../constants";

declare var process: {
  env: {
    API_KEY: string;
  };
};

// Database Menu Lokal Variatif (Fallback)
const FALLBACK_RECIPES = {
  [Lifestyle.SEDERHANA]: [
    { title: "Tempe Orek & Sayur Bening", protein: "Tempe", veg: "Bayam", cost: 15000 },
    { title: "Tahu Bacem & Cah Kangkung", protein: "Tahu", veg: "Kangkung", cost: 12000 },
    { title: "Telur Dadar & Sop Sayur", protein: "Telur", veg: "Wortel/Kol", cost: 18000 },
    { title: "Pecel Sayur & Bakwan Tahu", protein: "Tahu", veg: "Aneka Sayur", cost: 14000 }
  ],
  [Lifestyle.NORMAL]: [
    { title: "Ayam Goreng & Sayur Asem", protein: "Ayam", veg: "Labu/Kacang", cost: 35000 },
    { title: "Ikan Kembung & Sop Kimlo", protein: "Ikan", veg: "Jamur/Wortel", cost: 40000 },
    { title: "Semur Telur & Capcay", protein: "Telur", veg: "Aneka Sayur", cost: 30000 },
    { title: "Ayam Kecap & Tumis Buncis", protein: "Ayam", veg: "Buncis", cost: 38000 }
  ],
  [Lifestyle.MEWAH]: [
    { title: "Rendang Sapi & Gulai Daun Singkong", protein: "Daging Sapi", veg: "Daun Singkong", cost: 85000 },
    { title: "Ikan Nila Bakar & Cah Kailan", protein: "Ikan Nila", veg: "Kailan", cost: 65000 },
    { title: "Soto Betawi & Perkedel", protein: "Daging Sapi", veg: "Kentang", cost: 75000 },
    { title: "Daging Balado & Terong Balado", protein: "Daging Sapi", veg: "Terong", cost: 80000 }
  ]
};

const generateLocalFallback = (prefs: UserPreferences): GenerationResult => {
  const dailyPlans = [];
  const recipes = FALLBACK_RECIPES[prefs.lifestyle] || FALLBACK_RECIPES[Lifestyle.NORMAL];
  const minPrice = getMinRationalPrice(prefs.city, prefs.lifestyle);
  
  for (let d = 1; d <= prefs.durationDays; d++) {
    const mealIdx = (d - 1) % recipes.length;
    const recipe = recipes[mealIdx];
    
    const mealTemplate = {
      title: recipe.title,
      ingredients: [
        { name: recipe.protein, quantity: "Porsi Keluarga", unitPrice: Math.round(recipe.cost * 0.7), totalPrice: Math.round(recipe.cost * 0.7) },
        { name: recipe.veg, quantity: "1 Ikat/Bks", unitPrice: Math.round(recipe.cost * 0.3), totalPrice: Math.round(recipe.cost * 0.3) }
      ],
      nutrition: { 
        calories: prefs.lifestyle === Lifestyle.SEDERHANA ? 600 : 850, 
        protein: prefs.lifestyle === Lifestyle.SEDERHANA ? 20 : 35, 
        carbs: 100 
      }
    };

    dailyPlans.push({
      day: d,
      breakfast: { ...mealTemplate, title: "Sarapan " + recipe.protein },
      lunch: mealTemplate,
      dinner: { ...mealTemplate, title: "Makan Malam " + recipe.protein },
      dailyTotal: { calories: mealTemplate.nutrition.calories * 3, protein: mealTemplate.nutrition.protein * 3, carbs: 300 }
    });
  }

  return {
    dailyPlans,
    shoppingList: recipes.map(r => ({
      name: r.protein,
      quantity: prefs.durationDays + " porsi",
      category: 'Protein',
      estimatedPrice: r.cost
    })),
    totalEstimatedCost: minPrice * prefs.durationDays * prefs.numberOfPeople,
    budgetAnalysis: "AI sedang sibuk atau API Key belum dipasang di Vercel. Menu ini disusun otomatis oleh database lokal Sahabat Belanja agar Bunda tetap bisa belanja hari ini.",
    tips: ["Gunakan bahan musiman untuk harga lebih hemat.", "Belanja di pasar tradisional pagi hari."],
    isFallback: true
  };
};

export const checkApiStatus = async (): Promise<{ status: 'ok' | 'error', message: string, model: string }> => {
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    return { status: 'error', message: 'API_KEY belum dipasang di Vercel Bunda', model: 'N/A' };
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Ping',
      config: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text ? { status: 'ok', message: 'Koneksi Aktif!', model: modelName } : { status: 'error', message: 'API Respon Kosong', model: modelName };
  } catch (error: any) {
    return { status: 'error', message: 'API Offline/Limited', model: modelName };
  }
};

export const generateMealPlan = async (prefs: UserPreferences, localOverrides?: Record<string, number>): Promise<GenerationResult> => {
  // Cek apakah API_KEY ada sebelum inisialisasi
  if (!process.env.API_KEY || process.env.API_KEY === "undefined" || process.env.API_KEY.length < 10) {
    console.warn("API_KEY missing, using local fallback...");
    return generateLocalFallback(prefs);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const localPriceContext = localOverrides && Object.keys(localOverrides).length > 0 
    ? `Konteks Harga: ${Object.entries(localOverrides).map(([n, p]) => `${n}: ${p}`).join(', ')}` : "";

  const prompt = `AI Sahabat Belanja. Menu ${prefs.durationDays} hari, kota ${prefs.city}, gaya ${prefs.lifestyle}, budget ${prefs.budget}, keluarga ${prefs.numberOfPeople} orang. ${localPriceContext}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyPlans: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.INTEGER }, breakfast: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unitPrice: { type: Type.NUMBER }, totalPrice: { type: Type.NUMBER } } } }, nutrition: { type: Type.OBJECT, properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } } } } }, lunch: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unitPrice: { type: Type.NUMBER }, totalPrice: { type: Type.NUMBER } } } }, nutrition: { type: Type.OBJECT, properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } } } } }, dinner: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unitPrice: { type: Type.NUMBER }, totalPrice: { type: Type.NUMBER } } } }, nutrition: { type: Type.OBJECT, properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } } } } }, dailyTotal: { type: Type.OBJECT, properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } } } } } },
            shoppingList: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, category: { type: Type.STRING }, estimatedPrice: { type: Type.NUMBER } } } },
            totalEstimatedCost: { type: Type.NUMBER },
            budgetAnalysis: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("API Empty");
    return { ...JSON.parse(text), isFallback: false };
    
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return generateLocalFallback(prefs);
  }
};

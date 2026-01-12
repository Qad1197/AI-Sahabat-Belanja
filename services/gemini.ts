
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, GenerationResult } from "../types";

// Pastikan TypeScript mengenali process.env di environment browser/build
declare var process: {
  env: {
    API_KEY: string;
  };
};

export const checkApiStatus = async (): Promise<{ status: 'ok' | 'error', message: string, model: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';
  try {
    // Test panggilan ringan untuk cek API & Billing
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Ping',
      config: { 
        maxOutputTokens: 10,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    if (response.text) {
      return { status: 'ok', message: 'Koneksi Aktif & Billing Aman!', model: modelName };
    }
    return { status: 'error', message: 'API Terhubung tapi respon kosong.', model: modelName };
  } catch (error: any) {
    let msg = 'Gagal terhubung.';
    if (error.message?.includes('402')) msg = 'Billing belum aktif / saldo habis.';
    if (error.message?.includes('403')) msg = 'API Key tidak valid atau dilarang.';
    if (error.message?.includes('429')) msg = 'Limit penggunaan terlampaui.';
    return { status: 'error', message: msg, model: modelName };
  }
};

export const generateMealPlan = async (prefs: UserPreferences, localOverrides?: Record<string, number>): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const localPriceContext = localOverrides && Object.keys(localOverrides).length > 0 
    ? `Daftar HARGA PASAR LOKAL terbaru di ${prefs.city} (HASIL KONTRIBUSI WARGA): 
       ${Object.entries(localOverrides).map(([name, price]) => `- ${name}: Rp ${price}`).join('\n')}`
    : "Belum ada kontribusi harga warga untuk kota ini.";

  const prompt = `
    Halo! Kamu adalah asisten cerdas "AI Sahabat Belanja".
    TUGAS UTAMA: Susun rencana menu makan keluarga di ${prefs.city} dengan gaya hidup "${prefs.lifestyle}".
    ATURAN GAYA HIDUP (${prefs.lifestyle}):
    - Sederhana: Fokus pada protein nabati, sayuran musiman.
    - Normal: Seimbang protein hewani dan nabati.
    - Mewah: Protein premium, buah harian.
    PARAMETER KELUARGA:
    - Budget Total: Rp ${prefs.budget}
    - Durasi: ${prefs.durationDays} Hari
    - Target: ${prefs.numberOfPeople} Orang (${prefs.portionsPerMeal}x makan/hari)
    KONTEKS HARGA LOKAL:
    ${localPriceContext}
    1. Hitung biaya sangat teliti. 2. Berikan analisis jujur. 3. Nutrisi seimbang.
  `;

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
            dailyPlans: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      ingredients: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.STRING },
                            unitPrice: { type: Type.NUMBER },
                            totalPrice: { type: Type.NUMBER }
                          },
                          required: ["name", "quantity", "unitPrice", "totalPrice"]
                        }
                      },
                      nutrition: {
                        type: Type.OBJECT,
                        properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } },
                        required: ["calories", "protein", "carbs"]
                      }
                    },
                    required: ["title", "ingredients", "nutrition"]
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      ingredients: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.STRING },
                            unitPrice: { type: Type.NUMBER },
                            totalPrice: { type: Type.NUMBER }
                          },
                          required: ["name", "quantity", "unitPrice", "totalPrice"]
                        }
                      },
                      nutrition: {
                        type: Type.OBJECT,
                        properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } },
                        required: ["calories", "protein", "carbs"]
                      }
                    },
                    required: ["title", "ingredients", "nutrition"]
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      ingredients: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.STRING },
                            unitPrice: { type: Type.NUMBER },
                            totalPrice: { type: Type.NUMBER }
                          },
                          required: ["name", "quantity", "unitPrice", "totalPrice"]
                        }
                      },
                      nutrition: {
                        type: Type.OBJECT,
                        properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER } },
                        required: ["calories", "protein", "carbs"]
                      }
                    },
                    required: ["title", "ingredients", "nutrition"]
                  },
                  dailyTotal: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER }
                    },
                    required: ["calories", "protein", "carbs"]
                  }
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

    const text = response.text;
    if (!text) throw new Error("AI tidak memberikan respon teks.");
    return JSON.parse(text) as GenerationResult;
    
  } catch (error) {
    console.error("AI Sahabat Belanja Error:", error);
    throw new Error("Duh Bund, asisten AI lagi istirahat sebentar. Pastikan koneksi lancar lalu coba klik 'Susun Menu' lagi ya!");
  }
};

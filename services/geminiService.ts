import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Initialize Gemini safely
// We use a lazy getter to ensure env vars are ready and to catch initialization errors gracefully.
let ai: GoogleGenAI | null = null;
const MODEL_NAME = 'gemini-2.5-flash';

const getAi = () => {
    if (!ai) {
        // Safely check for process to avoid ReferenceError in browser environments that don't shim it immediately
        const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
        
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
        } else {
            console.warn("API_KEY is missing.");
        }
    }
    return ai;
};

export const generateSalesInsight = async (totalRevenue: number, transactionCount: number): Promise<string> => {
  try {
    const client = getAi();
    if (!client) return "مفتاح API غير متوفر.";

    const prompt = `
      You are an AI business analyst for a luxury cafe called "Cafe Sun".
      Current Session Data:
      - Total Revenue: $${totalRevenue}
      - Transaction Count: ${transactionCount}
      
      Provide a very short, encouraging, and professional insight or tip (max 2 sentences) in Arabic about this performance. 
      Focus on growth or efficiency.
    `;

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "لا توجد بيانات كافية للتحليل حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "خدمة الذكاء الاصطناعي غير متاحة حالياً.";
  }
};

export const suggestUpsell = async (currentItems: string[]): Promise<string> => {
  try {
    const client = getAi();
    if (!client) return "";

    const prompt = `
      You are a cashier assistant at "Cafe Sun".
      The customer has ordered: ${currentItems.join(', ')}.
      Suggest ONE single complementary item to upsell (e.g., a specific dessert if they bought coffee) in Arabic.
      Keep it short (e.g., "Would you like to try our [Item]?").
    `;

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    return "";
  }
}

export const generateDailyReport = async (transactions: Transaction[]): Promise<string> => {
  try {
    const client = getAi();
    if (!client) return "خدمة التقارير غير متوفرة (مفتاح API مفقود).";

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalItems = transactions.reduce((sum, t) => sum + t.items.length, 0);
    const itemCount = transactions.length;

    const prompt = `
      Analyze the following sales data for today at "Cafe Sun" and generate a professional daily report in Arabic (Markdown format).
      
      Data:
      - Total Transactions: ${itemCount}
      - Total Revenue: $${totalRevenue.toFixed(2)}
      - Total Items Sold: ${totalItems}
      - Sample Transactions: ${JSON.stringify(transactions.slice(0, 5).map(t => ({ total: t.total, items: t.items.map(i => i.name) })))}

      Structure:
      1. Executive Summary (ملخص تنفيذي)
      2. Top Selling Items Analysis (تحليل الأصناف الأكثر مبيعاً)
      3. Recommendations for Tomorrow (توصيات للغد)

      Keep it concise, professional, and formatted with bullet points.
    `;

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "لم يتم إنشاء التقرير.";
  } catch (error) {
    console.error(error);
    return "حدث خطأ أثناء إنشاء التقرير.";
  }
}
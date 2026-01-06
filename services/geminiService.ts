
import { GoogleGenAI, Type } from "@google/genai";
import { LandingAnalysis } from "../types";

// Initialize the Google GenAI client with the required parameter format.
// @ts-ignore
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// System instruction for the drone AI
const DRONE_SYSTEM_INSTRUCTION = `
You are the AI navigation brain of "Rakshak", a disaster relief drone. 
Your job is to analyze images of potential landing zones.
Assess the safety for landing a drone carrying medical supplies.
Consider: Slope, Debris (water, rubble), Surface Stability, and overhead obstructions.
Return strict JSON.
`;

/**
 * Analyzes a terrain image for landing safety using Gemini 3 Flash.
 * @param base64Image The raw base64 string of the landing zone image.
 */
export const analyzeLandingZone = async (base64Image: string): Promise<LandingAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Analyze this terrain for a drone landing. Is it safe?"
          }
        ]
      },
      config: {
        systemInstruction: DRONE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER, description: "Safety score 0-100" },
            hazards: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendation: { type: Type.STRING },
            slope: { type: Type.STRING, description: "Estimated slope (Flat, Moderate, Steep)" }
          },
          required: ["safe", "score", "hazards", "recommendation", "slope"],
          propertyOrdering: ["safe", "score", "hazards", "recommendation", "slope"]
        }
      }
    });

    // Access the text property directly (not a method) as per guidelines.
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text.trim()) as LandingAnalysis;

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Fallback safe default
    return {
      safe: false,
      score: 0,
      hazards: ["AI Connection Failed", "Unknown Terrain"],
      recommendation: "Abort landing. Maintain altitude.",
      slope: "Unknown"
    };
  }
};

/**
 * Generates a tactical post-mission report from logs.
 */
export const generateMissionReport = async (logs: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate a brief, tactical post-mission summary based on these logs: ${logs}. Focus on efficiency and anomalies.`
        });
        // Access the text property directly.
        return response.text || "No report generated.";
    } catch (e) {
        return "Failed to generate report.";
    }
}

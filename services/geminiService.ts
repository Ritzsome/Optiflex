
import { GoogleGenAI, Type } from "@google/genai";
import { Machine, PredictiveAlert, ChatResponse, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFactoryData = async (machines: Machine[], context: string = "general"): Promise<string> => {
  try {
    // Create a lightweight summary to save tokens and focus on anomalies
    const summary = machines.map(m => ({
      id: m.id,
      status: m.status,
      oee: m.oee.toFixed(1),
      defects: m.defectParts,
      temp: m.temperature.toFixed(1),
      energy: m.energyConsumptionKw.toFixed(1)
    }));

    const prompt = `
      You are an expert Manufacturing Engineer and Data Scientist. 
      Analyze the following live snapshot of 10 CNC machines.
      
      Context: ${context}
      
      Data Summary:
      ${JSON.stringify(summary, null, 2)}
      
      Provide a concise, actionable report in Markdown format.
      1. Identify the top critical bottleneck or issue.
      2. Suggest one specific optimization.
      3. Comment on Energy efficiency.
      
      Keep it professional, technical, and brief (under 200 words).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Unable to generate AI analysis at this time. Please check API configuration.";
  }
};

export const getMachineRecommendations = async (machine: Machine): Promise<string> => {
    try {
        const prompt = `
          Analyze this specific CNC machine performance:
          ID: ${machine.name}
          Status: ${machine.status}
          OEE: ${machine.oee.toFixed(1)}% (Avail: ${machine.availability}%, Perf: ${machine.performance}%, Qual: ${machine.quality}%)
          Temp: ${machine.temperature}C
          Vibration: ${machine.vibration}mm/s
          Defect Rate: ${((machine.defectParts/machine.totalParts)*100).toFixed(2)}%

          Provide 3 bullet points of maintenance or operational advice.
        `;
    
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
    
        return response.text || "No specific recommendations.";
      } catch (error) {
        console.error("Gemini Machine Analysis Error:", error);
        return "Analysis unavailable.";
      }
}

export const generatePredictiveAlerts = async (machines: Machine[]): Promise<PredictiveAlert[]> => {
  try {
    const dataSnapshot = machines.map(m => ({
      id: m.id,
      name: m.name,
      temp: m.temperature,
      vib: m.vibration,
      oee: m.oee,
      status: m.status
    }));

    const prompt = `
      Analyze these CNC machines for predictive maintenance risks.
      
      Thresholds for concern:
      - Temperature: >65°C (Warning), >80°C (Critical)
      - Vibration: >1.5 mm/s (Warning), >2.5 mm/s (Critical)
      - Status: DOWN (Immediate attention)
      
      Return a JSON list of machines that require attention. 
      If a machine is running normally within limits, do NOT include it.
      Focus on the top 3-4 most critical assets.
    `;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          machineId: { type: Type.STRING },
          machineName: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
          probability: { type: Type.NUMBER, description: "Probability of failure 0-100" },
          issue: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ['machineId', 'machineName', 'riskLevel', 'probability', 'issue', 'recommendation']
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt + "\nData: " + JSON.stringify(dataSnapshot),
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Predictive Analysis Error:", error);
    return [];
  }
};

export const generateReportInsight = async (machines: Machine[], reportType: 'production' | 'downtime' | 'quality'): Promise<string> => {
  try {
    // Filter data relevant to the report type to save tokens
    let dataContext = [];
    let instructions = "";

    if (reportType === 'production') {
      dataContext = machines.map(m => ({
        name: m.name,
        produced: m.totalParts,
        target: m.targetParts,
        efficiency: (m.totalParts / m.targetParts).toFixed(2),
        ppm: m.partsPerMinute.toFixed(1)
      }));
      instructions = "Analyze production output. Identify high performers and machines lagging behind targets. Suggest throughput improvements.";
    } else if (reportType === 'downtime') {
      dataContext = machines.map(m => ({
        name: m.name,
        status: m.status,
        downtimeEvents: m.downtimeLog.length,
        totalDowntimeMin: m.downtimeLog.reduce((acc, l) => acc + l.durationMinutes, 0)
      }));
      instructions = "Analyze downtime patterns. Identify the most unreliable machines and suggest maintenance strategies to improve availability.";
    } else {
      dataContext = machines.map(m => ({
        name: m.name,
        total: m.totalParts,
        defects: m.defectParts,
        qualityScore: m.quality.toFixed(1)
      }));
      instructions = "Analyze quality control metrics. Highlight machines with high scrap rates/defects and suggest calibration or process changes.";
    }

    const prompt = `
      You are generating an Executive Summary for a Manufacturing ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report.
      
      Instructions: ${instructions}
      
      Data:
      ${JSON.stringify(dataContext, null, 2)}
      
      Output Format:
      Provide a professional summary (approx 150 words) in Markdown.
      Use bullet points for key findings.
      Bold machine names.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini Report Generation Error:", error);
    return "Unable to generate report insight.";
  }
};

export const chatWithFactory = async (
  currentMessage: string, 
  machines: Machine[], 
  history: ChatMessage[] = []
): Promise<ChatResponse> => {
  try {
    // Create a compact snapshot of all machines for the AI
    const snapshot = machines.map(m => ({
      name: m.name,
      status: m.status,
      oee: Math.round(m.oee),
      availability: Math.round(m.availability),
      performance: Math.round(m.performance),
      quality: Math.round(m.quality),
      prod: m.totalParts,
      target: m.targetParts,
      defects: m.defectParts,
      temp: Math.round(m.temperature),
      energy: Math.round(m.energyConsumptionKw)
    }));

    // Format previous conversation context
    const conversationContext = history.slice(-6).map(msg => 
      `${msg.role === 'user' ? 'Operator' : 'AI Engineer'}: ${msg.content}`
    ).join('\n');

    const systemInstruction = `
      You are "FactoryBot", a Senior Manufacturing Engineer and Data Scientist assisting the shop floor operator.
      You have access to real-time data for 10 CNC machines.
      
      Your Role:
      - Analyze machine performance (OEE, Availability, Performance, Quality).
      - Provide DETAILED, technical, and actionable insights. Do not just state numbers; explain WHY they matter.
      - If OEE is low, investigate if it's due to Downtime (Availability), Slow Cycles (Performance), or Scraps (Quality).
      - Maintain context from the previous conversation.
      
      Response Rules:
      1. Only answer manufacturing/factory related questions.
      2. If the user asks for a comparison, ranking, or distribution, ALWAYS return a 'barChart' or 'table' type.
      3. For 'barChart', use simple labels (e.g., 'M1', 'M2') and a single numeric value.
      4. For 'table', provide clear headers and rows.
      5. Provide 3-4 "suggestedQuestions" that the user might ask next, based on your answer and the current data anomalies (e.g., "Why is Machine 3 down?", "Show energy trends").
      
      Data Snapshot: ${JSON.stringify(snapshot)}
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        answer: { type: Type.STRING, description: "The conversational answer. Be elaborate and technical." },
        type: { type: Type.STRING, enum: ['text', 'table', 'barChart'] },
        tableData: {
          type: Type.OBJECT,
          properties: {
            headers: { type: Type.ARRAY, items: { type: Type.STRING } },
            rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
          }
        },
        chartData: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.NUMBER }
            }
          }
        },
        chartTitle: { type: Type.STRING },
        chartColor: { type: Type.STRING },
        suggestedQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3-4 contextual follow-up questions for the operator."
        }
      },
      required: ['answer', 'type', 'suggestedQuestions']
    };

    const prompt = `
      History:
      ${conversationContext}

      Current Question:
      ${currentMessage}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ChatResponse;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Chat Error:", error);
    return {
      answer: "I'm having trouble connecting to the factory data stream right now. Please try again.",
      type: 'text',
      suggestedQuestions: ["Show Machine Status", "Overall OEE"]
    };
  }
};

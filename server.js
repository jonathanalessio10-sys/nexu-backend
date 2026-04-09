import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

// 🔥 FUNCIÓN PARA EXTRAER TEXTO SEGURO
function extractText(data) {
  try {
    return data.candidates[0].content.parts
      .map(p => p.text)
      .join("");
  } catch {
    return null;
  }
}

// 🔥 RUTA PRINCIPAL
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `
Eres un asistente médico inteligente.

Analiza los síntomas del usuario y responde en JSON EXACTO con esta estructura:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "Explicación clara y profesional del posible problema",
  "posible_causa": "Posibles causas médicas realistas",
  "recomendacion": "Qué debe hacer el paciente",
  "preguntas": "Una pregunta de seguimiento útil"
}

IMPORTANTE:
- Responde SOLO JSON
- No agregues texto extra
- Sé específico y profesional

Síntomas:
${text}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("🔥 RAW GEMINI:", JSON.stringify(data, null, 2));

    const rawText = extractText(data);

    if (!rawText) {
      throw new Error("Gemini no devolvió texto");
    }

    // 🔥 LIMPIAR TEXTO (por si viene con ```json)
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let json;

    try {
      json = JSON.parse(cleaned);
    } catch (err) {
      console.log("❌ Error parseando JSON:", cleaned);
      throw err;
    }

    res.json(json);

  } catch (error) {
    console.error("❌ ERROR:", error);

    res.json({
      riesgo: "medio",
      descripcion: "No se pudo generar un análisis detallado",
      posible_causa: "Información insuficiente",
      recomendacion: "Consulta médica recomendada",
      preguntas: "¿Puedes describir mejor tus síntomas?"
    });
  }
});

// 🔥 TEST
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});

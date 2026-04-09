import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ruta base
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

// 🧠 IA MÉDICA (GEMINI)
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  const prompt = `
Actúa como un médico clínico con experiencia en diagnóstico inicial.

Un paciente reporta los siguientes síntomas:

"${text}"

Tu tarea es hacer un PRE-DIAGNÓSTICO clínico inicial.

Evalúa:

1. Nivel de riesgo (bajo, medio, alto)
2. Explicación médica clara (no genérica)
3. Posible causa basada en síntomas
4. Recomendación concreta (qué hacer realmente)
5. UNA pregunta clave para continuar diagnóstico

IMPORTANTE:
- NO des respuestas genéricas
- NO digas "consulta médica recomendada" sin contexto
- Sé específico y realista
- Usa lenguaje médico simple pero profesional

Responde SOLO en JSON válido:

{
  "riesgo": "",
  "descripcion": "",
  "posible_causa": "",
  "recomendacion": "",
  "preguntas": ""
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    let textResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 🔥 Limpieza por si Gemini mete ```json
    textResponse = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result;

    try {
      result = JSON.parse(textResponse);
    } catch (err) {
      console.log("⚠️ JSON inválido, usando fallback");

      result = {
        riesgo: "medio",
        descripcion: textResponse || "No se pudo generar descripción",
        posible_causa: "No especificado",
        recomendacion: "Consulta médica recomendada",
        preguntas: "¿Desde cuándo tienes los síntomas?"
      };
    }

    res.json(result);

  } catch (error) {
    console.error("❌ Error en servidor:", error);

    res.status(500).json({
      error: "Error en el análisis",
      detalle: error.message
    });
  }
});

// 🚀 Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

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

// 🧠 Ruta de análisis con Gemini
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  const prompt = `
Eres un médico profesional.

Analiza los siguientes síntomas del paciente:

${text}

IMPORTANTE:
- Responde ÚNICAMENTE en JSON válido
- NO agregues texto fuera del JSON
- NO uses markdown
- NO uses backticks

El JSON debe tener EXACTAMENTE esta estructura:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "explicación clara del problema",
  "posible_causa": "causa probable",
  "recomendacion": "qué debe hacer el paciente",
  "preguntas": "una sola pregunta para continuar diagnóstico"
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

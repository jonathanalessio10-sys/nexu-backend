import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.json({ error: "No se recibió texto" });
    }

    const prompt = `
Eres un asistente médico inteligente.

Analiza los síntomas del usuario y responde SOLO en JSON.

REGLAS:
- NO digas "no se pudo"
- SIEMPRE da un posible diagnóstico
- Sé claro y útil
- Usa lenguaje médico simple

Formato:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "explicación clara",
  "posible_causa": "causa probable",
  "recomendacion": "qué hacer",
  "preguntas": "pregunta de seguimiento"
}

Síntomas:
${text}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    // 🔥 Obtener texto completo de Gemini
    const rawText =
      data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";

    console.log("🧠 Gemini RAW:", rawText);

    let json;

    try {
      // 🔥 limpiar basura tipo ```json
      const cleaned = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      json = JSON.parse(cleaned);

    } catch (e) {
      console.log("❌ Error parsing JSON:", rawText);

      // 🔥 fallback INTELIGENTE (usa lo que dijo Gemini)
      json = {
        riesgo: "medio",
        descripcion: rawText || "Posible condición médica detectada",
        posible_causa: "Análisis basado en síntomas proporcionados",
        recomendacion: "Se recomienda consultar a un médico",
        preguntas: "¿Tienes otros síntomas adicionales?"
      };
    }

    res.json(json);

  } catch (error) {
    console.error(error);

    res.json({
      error: "Error en el análisis",
      detalle: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});

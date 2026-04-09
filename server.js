import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    console.log("INPUT:", text);

    const prompt = `
Eres un asistente médico inteligente.

Analiza los siguientes síntomas:
"${text}"

Devuelve un JSON con este formato:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "posible diagnóstico claro y breve",
  "posible_causa": "causa probable",
  "recomendacion": "qué hacer",
  "preguntas": "pregunta de seguimiento útil"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
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

    console.log("GEMINI RAW:", JSON.stringify(data, null, 2));

    const textResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!textResponse) {
      throw new Error("Sin respuesta de Gemini");
    }

    // limpiar respuesta (por si viene con ```json)
    const cleanText = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(cleanText);

    res.json(json);

  } catch (error) {
    console.error("ERROR:", error.message);

    res.json({
      riesgo: "medio",
      descripcion: "Error al obtener respuesta de IA",
      posible_causa: "Modelo mal configurado o API falló",
      recomendacion: "Revisar servidor",
      preguntas: "¿Puedes intentar nuevamente?"
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Endpoint principal
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Falta el texto"
      });
    }

    const prompt = `
Eres un médico profesional.

Analiza los siguientes síntomas del paciente:
"${text}"

Da un prediagnóstico claro y útil.

Responde SOLO en JSON válido con este formato:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "explicación médica clara y detallada",
  "posible_causa": "posibles enfermedades o causas",
  "recomendacion": "qué debe hacer el paciente",
  "preguntas": "pregunta de seguimiento"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    // 🔍 LOG PARA DEBUG (muy importante)
    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    const textResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // ❌ Si Gemini no respondió bien
    if (!textResponse) {
      return res.json({
        riesgo: "medio",
        descripcion: "No se pudo generar respuesta de IA",
        posible_causa: "Error en Gemini o API KEY",
        recomendacion: "Verifica configuración del servidor",
        preguntas: "¿Puedes intentar nuevamente?"
      });
    }

    // 🧹 Limpia formato (quita ```json)
    const cleanText = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanText);
    } catch (err) {
      console.error("ERROR PARSE:", err);

      return res.json({
        riesgo: "medio",
        descripcion: cleanText, // muestra lo que dijo Gemini
        posible_causa: "Respuesta no estructurada",
        recomendacion: "Revisar formato JSON",
        preguntas: "¿Puedes intentar nuevamente?"
      });
    }

    res.json(parsed);

  } catch (error) {
    console.error("ERROR GENERAL:", error);

    res.status(500).json({
      riesgo: "medio",
      descripcion: "Error interno del servidor",
      posible_causa: "Fallo en backend",
      recomendacion: "Intentar más tarde",
      preguntas: "¿Puedes describir mejor los síntomas?"
    });
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

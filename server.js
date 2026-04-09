import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

// 🧠 RUTA DE IA (GEMINI)
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  const prompt = `
Eres un médico profesional.

Analiza estos síntomas:

${text}

Responde SOLO en JSON:

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

    const textResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let result;

    try {
      result = JSON.parse(textResponse);
    } catch {
      result = {
        riesgo: "medio",
        descripcion: textResponse,
        posible_causa: "No especificado",
        recomendacion: "Consulta médica recomendada",
        preguntas: "¿Desde cuándo tienes los síntomas?"
      };
    }

    res.json(result);

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: "Error en el análisis",
      detalle: error.message
    });
  }
});

// 🚀 PUERTO
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

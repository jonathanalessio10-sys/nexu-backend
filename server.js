import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `
Eres un médico profesional.

Analiza estos síntomas: "${text}"

Responde SOLO en JSON así:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "explicación médica clara",
  "posible_causa": "posibles enfermedades",
  "recomendacion": "qué hacer",
  "preguntas": "pregunta para el paciente"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return res.json({
        riesgo: "medio",
        descripcion: "Error al obtener respuesta de IA",
        posible_causa: "API no respondió correctamente",
        recomendacion: "Revisar servidor",
        preguntas: "¿Puedes intentar nuevamente?"
      });
    }

    // Limpia texto (por si viene con ```json)
    const clean = textResponse.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(clean);

    res.json(parsed);

  } catch (error) {
    console.error("ERROR:", error);

    res.json({
      riesgo: "medio",
      descripcion: "Error interno del servidor",
      posible_causa: "Fallo en backend",
      recomendacion: "Intentar de nuevo",
      preguntas: "¿Puedes describir mejor los síntomas?"
    });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));

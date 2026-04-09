import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 CONFIGURA TU API KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ RUTA PRINCIPAL (YA NO SALE ERROR)
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

// 🧠 RUTA DE IA
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  const prompt = `
Eres un médico profesional en una consulta interactiva.

Estás hablando con un paciente.

Debes:
1. Analizar síntomas
2. Evaluar riesgo (bajo, medio, alto)
3. Dar una breve explicación
4. Hacer UNA pregunta para continuar el diagnóstico

Reglas:
- Si detectas peligro → riesgo alto
- Sé claro y humano
- Haz solo UNA pregunta a la vez

Responde SOLO en JSON:

{
  "riesgo": "",
  "descripcion": "",
  "preguntas": ""
}

Síntomas:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt }
      ]
    });

    const content = response.choices[0].message.content;

    let result;

    try {
      result = JSON.parse(content);
    } catch {
      // 🔥 Si la IA responde mal, fallback seguro
      result = {
        riesgo: "medio",
        descripcion: "No se pudo interpretar completamente la respuesta.",
        posible_causa: "Síntomas no claros.",
        recomendacion: "Consulta a un profesional de salud."
      };
    }

    res.json(result);

  } catch (error) {
    console.error("Error IA:", error);

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

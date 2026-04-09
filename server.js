import express from "express";
import cors from "cors";
import OpenAI from "openai";

// ✅ Crear app PRIMERO
const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Ruta raíz
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

// 🧠 Ruta IA
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  // 🔴 REGLAS MÉDICAS CRÍTICAS
  const dangerKeywords = [
    "hemorragia",
    "sangrado fuerte",
    "no para de sangrar",
    "convulsiones",
    "no puede respirar",
    "dolor en el pecho",
    "desmayo",
    "perdida de conciencia",
    "mareo con sangrado"
  ];

  const isHighRisk = dangerKeywords.some(k =>
    text.toLowerCase().includes(k)
  );

  if (isHighRisk) {
    return res.json({
      riesgo: "alto",
      descripcion: "Los síntomas indican una posible urgencia médica.",
      preguntas: "¿Desde cuándo ocurre y cuánto sangrado has tenido?"
    });
  }

  // 🧠 IA
  const prompt = `
Eres un médico experto en urgencias.

Evalúa los síntomas.

Reglas:
- Sangrado + mareo = ALTO
- No minimizar síntomas

Responde SOLO en JSON:

{
  "riesgo": "",
  "descripcion": "",
  "preguntas": ""
}

Paciente:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;

    let result;

    try {
      result = JSON.parse(content);
    } catch {
      result = {
        riesgo: "medio",
        descripcion: "No se pudo interpretar.",
        preguntas: "¿Puedes dar más detalles?"
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

// 🚀 Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});

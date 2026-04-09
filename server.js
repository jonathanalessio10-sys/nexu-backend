import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

// 🔑 API KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Ruta de prueba
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

// 🧠 IA MÉDICA
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  // 🔴 REGLAS DE EMERGENCIA (MUY IMPORTANTE)
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
      posible_causa: "Posible hemorragia o condición crítica.",
      recomendacion: "Acude inmediatamente a un hospital o llama a emergencias.",
      preguntas: "¿Desde cuándo ocurre el sangrado y es continuo?"
    });
  }

  // 🧠 PROMPT MÉDICO COMPLETO
  const prompt = `
Eres un médico profesional experto en diagnóstico clínico.

Analiza los síntomas del paciente.

Clasificación:
- alto → urgencia médica
- medio → requiere atención médica
- bajo → leve

IMPORTANTE:
- No minimizar síntomas
- Sé claro y profesional

Responde SOLO en JSON válido:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "explicación médica clara",
  "posible_causa": "causa probable",
  "recomendacion": "qué debe hacer el paciente",
  "preguntas": "una sola pregunta para continuar el diagnóstico"
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
        descripcion: "No se pudo interpretar correctamente la respuesta.",
        posible_causa: "Información insuficiente.",
        recomendacion: "Consulta a un médico.",
        preguntas: "¿Puedes describir mejor tus síntomas?"
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
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});

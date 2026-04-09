import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

// 🔥 EXTRAER TEXTO SEGURO DE GEMINI
function extractText(data) {
  try {
    return data.candidates[0].content.parts
      .map(p => p.text)
      .join("");
  } catch {
    return null;
  }
}

// 🔥 RUTA PRINCIPAL
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.json({
        riesgo: "bajo",
        descripcion: "No se proporcionaron síntomas",
        posible_causa: "Información insuficiente",
        recomendacion: "Describe tus síntomas para obtener un análisis",
        preguntas: "¿Qué síntomas tienes?"
      });
    }

    const prompt = `
Responde ÚNICAMENTE en JSON válido.

NO uses texto fuera del JSON.
NO uses markdown.
NO uses comillas triples.

Formato exacto:

{
  "riesgo": "bajo | medio | alto",
  "descripcion": "Explicación médica clara y profesional",
  "posible_causa": "Posibles causas médicas realistas",
  "recomendacion": "Qué debe hacer el paciente",
  "preguntas": "Una pregunta de seguimiento útil"
}

Analiza estos síntomas:
${text}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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

    console.log("🔥 RAW GEMINI:", JSON.stringify(data, null, 2));

    const rawText = extractText(data);

    console.log("🧠 TEXTO:", rawText);

    if (!rawText) {
      throw new Error("Gemini no devolvió texto");
    }

    // 🔥 LIMPIAR RESPUESTA
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let json;

    try {
      json = JSON.parse(cleaned);
    } catch (err) {
      console.log("❌ JSON inválido, usando fallback inteligente");

      // 🔥 USAR RESPUESTA DE GEMINI AUNQUE NO SEA JSON
      json = {
        riesgo: "medio",
        descripcion: cleaned.slice(0, 300),
        posible_causa: "Posible condición basada en los síntomas descritos",
        recomendacion: "Se recomienda acudir a un profesional de salud",
        preguntas: "¿Desde cuándo presentas estos síntomas?"
      };
    }

    res.json(json);

  } catch (error) {
    console.error("❌ ERROR:", error);

    res.json({
      riesgo: "medio",
      descripcion: "No se pudo generar un análisis detallado",
      posible_causa: "Información insuficiente",
      recomendacion: "Consulta médica recomendada",
      preguntas: "¿Puedes describir mejor tus síntomas?"
    });
  }
});

// 🔥 TEST
app.get("/", (req, res) => {
  res.send("✅ Backend Nexu funcionando correctamente");
});

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en puerto 3000");
});

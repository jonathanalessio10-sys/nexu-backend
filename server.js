app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta el texto" });
  }

  // 🔴 REGLAS MÉDICAS CRÍTICAS (ANTES DE IA)
  const dangerKeywords = [
    "hemorragia",
    "sangrado fuerte",
    "no para de sangrar",
    "convulsiones",
    "no puede respirar",
    "dolor en el pecho",
    "desmayo",
    "perdida de conciencia"
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

  // 🧠 PROMPT MÉDICO PROFESIONAL
  const prompt = `
Eres un médico clínico experto en triage.

Evalúa los síntomas como en urgencias reales.

Clasificación:
- alto → riesgo vital o urgente
- medio → requiere atención médica
- bajo → leve

IMPORTANTE:
- Sangrado abundante = ALTO
- Mareo + sangrado = ALTO
- No minimizar síntomas

Responde SOLO en JSON:

{
  "riesgo": "alto | medio | bajo",
  "descripcion": "explicación médica clara",
  "preguntas": "una pregunta clave para continuar"
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
        descripcion: "No se pudo interpretar correctamente.",
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

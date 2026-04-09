app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  const prompt = `
Eres un médico profesional.

Analiza los síntomas del paciente.

Clasifica:
- riesgo: bajo, medio, alto
- descripcion clara
- posible causa médica
- recomendacion

Reglas:
- Sangrado, dolor en el pecho, dificultad para respirar → ALTO
- Fiebre, dolor intenso → MEDIO
- Sé conservador

Responde SOLO en JSON:

{
  "riesgo": "",
  "descripcion": "",
  "posible_causa": "",
  "recomendacion": ""
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

    const result = JSON.parse(response.choices[0].message.content);

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en IA" });
  }
});

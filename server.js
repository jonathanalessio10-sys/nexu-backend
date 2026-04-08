import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
    const { text } = req.body;

    // IA mejorada simulando lógica avanzada
    let riesgo = "bajo";

    if (text.includes("fiebre") || text.includes("dolor fuerte")) {
        riesgo = "alto";
    } else if (text.includes("dolor") || text.includes("mareo")) {
        riesgo = "medio";
    }

    const respuesta = {
        riesgo,
        descripcion: `Análisis inteligente de síntomas: ${text}`,
        recomendacion: riesgo === "alto"
            ? "Acudir inmediatamente a urgencias"
            : "Se recomienda consulta médica",
        posible_causa: "Evaluación preliminar automatizada"
    };

    res.json(respuesta);
});

app.listen(3000, () => console.log("Servidor IA activo"));

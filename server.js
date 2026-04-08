import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
    const { text } = req.body;

    let respuesta = {
        riesgo: "medio",
        descripcion: "Análisis básico de síntomas",
        recomendacion: "Se recomienda consultar médico",
        posible_causa: text
    };

    res.json(respuesta);
});

app.listen(3000, () => console.log("Servidor activo"));

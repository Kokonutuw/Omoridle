const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/characters", async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, "data", "characters.json"), "utf8");
    const characters = JSON.parse(data);
    res.json(characters);
  } catch (err) {
    console.error("Erreur lors de la lecture du fichier :", err);
    res.status(500).json({ error: "Error reading characters data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/proxy", async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).json({ error: "Keine URL angegeben" });
  }
  try {
    const response = await fetch(feedUrl); // auch hier nativ
    const text = await response.text();
    res.set("Access-Control-Allow-Origin", "*");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy läuft auf http://localhost:${PORT}`);
});


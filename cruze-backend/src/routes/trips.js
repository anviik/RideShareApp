app.post("/api/trips", async (req, res) => {
  const { origin, destination, date, time, seats, price } = req.body;
  const { data, error } = await supabase.from("trips").insert([{ origin, destination, date, time, seats, price }]);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

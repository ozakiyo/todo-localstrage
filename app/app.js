const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ------------------- タスクAPI -------------------
// すべてのタスク取得
app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// タスク追加
app.post("/api/tasks", (req, res) => {
  const { text, description, dueDate, priority, category } = req.body;
  const createdAt = new Date().toISOString();
  db.run(
    "INSERT INTO tasks (text, description, dueDate, priority, category, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [text, description, dueDate, priority, category, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// タスク更新
app.put("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { text, description, dueDate, priority, category } = req.body;
  const updatedAt = new Date().toISOString();
  db.run(
    "UPDATE tasks SET text=?, description=?, dueDate=?, priority=?, category=?, updatedAt=? WHERE id=?",
    [text, description, dueDate, priority, category, updatedAt, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// タスク削除
app.delete("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM tasks WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ------------------- カテゴリAPI -------------------
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categories", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO categories (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.delete("/api/categories/:name", (req, res) => {
  const name = req.params.name;
  db.run("DELETE FROM categories WHERE name=?", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ---------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

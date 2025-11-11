// ================================
// app.js（統合版）
// ================================
import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 現在のディレクトリ解決（ESM対応）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- 基本設定 --------------------
const app = express();
const PORT = 3001;
const DB_PATH = "./tasks.db";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // フロント配信用

// -------------------- SQLite接続 --------------------
const db = new sqlite3.Database(DB_PATH);

// -------------------- テーブル初期化 --------------------
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      description TEXT,
      dueDate TEXT,
      priority TEXT,
      category TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);
});

// =================== タスクAPI ===================

// 全タスク取得
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
    `INSERT INTO tasks (text, description, dueDate, priority, category, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [text, description, dueDate, priority, category, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// タスク更新
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { text, description, dueDate, priority, category } = req.body;
  const updatedAt = new Date().toISOString();
  db.run(
    `UPDATE tasks
     SET text=?, description=?, dueDate=?, priority=?, category=?, updatedAt=?
     WHERE id=?`,
    [text, description, dueDate, priority, category, updatedAt, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// タスク削除
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM tasks WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// =================== カテゴリAPI ===================

// 全カテゴリ取得
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categories ORDER BY id DES*


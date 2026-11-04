const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// Servir os ficheiros do frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../frontend")));

// Caminho para o db.json dentro da pasta backend
const DB_FILE = path.join(__dirname, "../backend/db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv: { chamada: null, historico: [] }
    };
  }

  const data = JSON.parse(fs.readFileSync(DB_FILE));
  if (!data.tv) {
    data.tv = { chamada: null, historico: [] };
  }
  return data;
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ... mantém o restante das tuas rotas (login, atendimento, triagem, tv, etc.) ...

module.exports = app;

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  const vazio = {
    usuarios: [],
    pacientes: [],
    triagens: [],
    consultas: [],
    chamadas: []
  };

  if (!fs.existsSync(DB_FILE)) {
    return vazio;
  }

  // Garante que todas as listas existam, mesmo se o db.json for antigo
  return { ...vazio, ...JSON.parse(fs.readFileSync(DB_FILE)) };
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// LOGIN
app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(u =>
    u.usuario === req.body.usuario &&
    u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// CADASTRAR USUÁRIO (usado pelo admin.html)
app.post("/usuario", (req, res) => {
  const { usuario, senha, tipo } = req.body;

  if (!usuario || !senha || !tipo) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const db = readDB();

  const jaExiste = db.usuarios.some(u => u.usuario === usuario);
  if (jaExiste) {
    return res.status(400).json({ erro: "Esse usuário já existe" });
  }

  const novo = {
    id: Date.now(),
    usuario,
    senha,
    tipo
  };

  db.usuarios.push(novo);
  writeDB(db);

  res.json({ sucesso: true, id: novo.id });
});

// LISTAR USUÁRIOS (sem enviar a senha)
app.get("/usuarios", (req, res) => {
  const db = readDB();

  const lista = db.usuarios.map(u => ({
    id: u.id,
    usuario: u.usuario,
    tipo: u.tipo
  }));

  res.json(lista);
});

// ATENDIMENTO (cria o paciente e já chama na TV)
app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
    status: "triagem",
    createdAt: new Date()
  };

  db.pacientes.push(paciente);

  // registra a chamada para a TV
  db.chamadas.push({
    id: paciente.id,
    paciente: paciente.nome,
    localTipo: req.body.localTipo || "GUICHÊ",
    localNumero: req.body.localNumero || "1",
    createdAt: new Date()
  });

  writeDB(db);

  res.json(paciente);
});

// TRIAGEM
app.post("/triagem", (req, res) => {
  const db = readDB();

  let risco = req.body.risco;

  if (req.body.temperatura >= 39) {
    risco = "vermelho";
  } else if (req.body.temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: req.body.temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco,
    status: "aguardando_medico",
    createdAt: new Date()
  };

  db.triagens.push(triagem);
  writeDB(db);

  res.json(triagem);
});

// LISTAR TRIAGENS
app.get("/triagens", (req, res) => {
  const db = readDB();
  res.json(db.triagens);
});

// LISTA FIXA DE MEDICAÇÕES
app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// CONSULTA
app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date()
  };

  db.consultas.push(consulta);
  writeDB(db);

  res.json(consulta);
});

// MEDICAÇÕES
app.get("/medicacoes", (req, res) => {
  const db = readDB();
  res.json(db.consultas);
});

// CHAMAR PACIENTE (qualquer tela pode chamar esta rota)
app.post("/chamar", (req, res) => {
  const { paciente, localTipo, localNumero } = req.body;

  if (!paciente) {
    return res.status(400).json({ erro: "Informe o paciente" });
  }

  const db = readDB();

  const chamada = {
    id: Date.now(),
    paciente,
    localTipo: localTipo || "GUICHÊ",
    localNumero: localNumero || "--",
    createdAt: new Date()
  };

  db.chamadas.push(chamada);
  writeDB(db);

  res.json(chamada);
});

// TV: última chamada + histórico (mais recentes primeiro)
app.get("/tv/chamada", (req, res) => {
  const db = readDB();
  const ordenadas = [...db.chamadas].reverse();

  res.json({
    chamada: ordenadas[0] || null,
    historico: ordenadas.slice(1, 5)
  });
});

// START
app.listen(3000, () => {
  console.log("🏥 Hospital Pro rodando em http://localhost:3000");
});

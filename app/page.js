"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import jsPDF from "jspdf";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  Users,
  BookOpen,
  DollarSign,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck
} from "lucide-react";

export default function Home() {
  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [nome, setNome] = useState("");
  const [turmaAluno, setTurmaAluno] = useState("");
  const [alunos, setAlunos] = useState([]);

  const [nomeTurma, setNomeTurma] = useState("");
  const [turmas, setTurmas] = useState([]);

  const [presencas, setPresencas] = useState([]);
  const [mensalidades, setMensalidades] = useState([]);

  const [editandoId, setEditandoId] = useState(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [turmaEditada, setTurmaEditada] = useState("");

  async function criarConta() {
    await createUserWithEmailAndPassword(auth, email, senha);
  }

  async function entrar() {
    await signInWithEmailAndPassword(auth, email, senha);
  }

  async function sair() {
    await signOut(auth);
  }

  async function salvarAluno() {
    if (!nome || !turmaAluno) {
      alert("Digite o nome e escolha uma turma");
      return;
    }

    await addDoc(collection(db, "alunos"), {
      nome,
      turma: turmaAluno
    });

    setNome("");
    setTurmaAluno("");
    carregarAlunos();
  }

  async function excluirAluno(id) {
    await deleteDoc(doc(db, "alunos", id));
    carregarAlunos();
  }

  async function salvarEdicao(id) {
    if (!nomeEditado || !turmaEditada) return;

    await updateDoc(doc(db, "alunos", id), {
      nome: nomeEditado,
      turma: turmaEditada
    });

    setEditandoId(null);
    setNomeEditado("");
    setTurmaEditada("");
    carregarAlunos();
  }

  async function carregarAlunos() {
    const querySnapshot = await getDocs(collection(db, "alunos"));
    const lista = [];

    querySnapshot.forEach((documento) => {
      lista.push({
        id: documento.id,
        ...documento.data()
      });
    });

    setAlunos(lista);
  }

  async function salvarTurma() {
    if (!nomeTurma) {
      alert("Digite o nome da turma");
      return;
    }

    await addDoc(collection(db, "turmas"), {
      nome: nomeTurma
    });

    setNomeTurma("");
    carregarTurmas();
  }

  async function carregarTurmas() {
    const querySnapshot = await getDocs(collection(db, "turmas"));
    const lista = [];

    querySnapshot.forEach((documento) => {
      lista.push({
        id: documento.id,
        ...documento.data()
      });
    });

    setTurmas(lista);
  }

  async function excluirTurma(id) {
    await deleteDoc(doc(db, "turmas", id));
    carregarTurmas();
  }

  async function marcarPresenca(aluno, status) {
    await addDoc(collection(db, "presencas"), {
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      turma: aluno.turma || "Sem turma",
      status,
      data: new Date().toLocaleDateString("pt-BR")
    });

    carregarPresencas();
  }

  async function carregarPresencas() {
    const querySnapshot = await getDocs(collection(db, "presencas"));
    const lista = [];

    querySnapshot.forEach((documento) => {
      lista.push({
        id: documento.id,
        ...documento.data()
      });
    });

    setPresencas(lista);
  }

  async function excluirPresenca(id) {
    await deleteDoc(doc(db, "presencas", id));
    carregarPresencas();
  }

  async function gerarMensalidade(aluno) {
    await addDoc(collection(db, "mensalidades"), {
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      turma: aluno.turma || "Sem turma",
      valor: 150,
      status: "Pendente",
      data: new Date().toLocaleDateString("pt-BR")
    });

    carregarMensalidades();
  }

  async function carregarMensalidades() {
    const querySnapshot = await getDocs(collection(db, "mensalidades"));
    const lista = [];

    querySnapshot.forEach((documento) => {
      lista.push({
        id: documento.id,
        ...documento.data()
      });
    });

    setMensalidades(lista);
  }

  async function marcarComoPago(id) {
    await updateDoc(doc(db, "mensalidades", id), {
      status: "Pago"
    });

    carregarMensalidades();
  }

  async function excluirMensalidade(id) {
    await deleteDoc(doc(db, "mensalidades", id));
    carregarMensalidades();
  }

  function gerarRecibo(mensalidade) {
    const docPDF = new jsPDF();

    docPDF.setFontSize(18);
    docPDF.text("Recibo de Pagamento", 20, 20);

    docPDF.setFontSize(12);
    docPDF.text(`Aluno: ${mensalidade.alunoNome}`, 20, 40);
    docPDF.text(`Turma: ${mensalidade.turma}`, 20, 50);
    docPDF.text(`Valor: R$ ${mensalidade.valor}`, 20, 60);
    docPDF.text(`Status: ${mensalidade.status}`, 20, 70);
    docPDF.text(`Data: ${mensalidade.data}`, 20, 80);

    docPDF.text("Escolinha de Natação & Hidro", 20, 110);
    docPDF.text("Documento gerado automaticamente pelo sistema.", 20, 120);

    docPDF.save(`recibo-${mensalidade.alunoNome}.pdf`);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (user) {
        carregarAlunos();
        carregarTurmas();
        carregarPresencas();
        carregarMensalidades();
      }
    });

    return () => unsubscribe();
  }, []);

  const dadosFinanceiros = [
    {
      name: "Pagos",
      value: mensalidades.filter((m) => m.status === "Pago").length
    },
    {
      name: "Pendentes",
      value: mensalidades.filter((m) => m.status === "Pendente").length
    }
  ];

  const COLORS = ["#16a34a", "#dc2626"];

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Escolinha App
          </h1>

          <input
            className="border border-gray-300 p-3 rounded-lg w-full text-black bg-white mb-3"
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border border-gray-300 p-3 rounded-lg w-full text-black bg-white mb-4"
            type="password"
            placeholder="Senha"
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white w-full p-3 rounded-lg mb-3"
            onClick={entrar}
          >
            Entrar
          </button>

          <button
            className="bg-green-600 hover:bg-green-700 text-white w-full p-3 rounded-lg"
            onClick={criarConta}
          >
            Criar Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex">
      <aside className="w-64 bg-white shadow-xl p-6 hidden md:flex flex-col fixed h-screen">
        <h2 className="text-2xl font-bold text-blue-700 mb-10">
          Escolinha
        </h2>

        <nav className="flex flex-col gap-4">
          <a href="#dashboard" className="flex items-center gap-3 text-gray-700 font-medium hover:text-blue-600">
            <LayoutDashboard />
            Dashboard
          </a>

          <a href="#alunos" className="flex items-center gap-3 text-gray-700 font-medium hover:text-blue-600">
            <Users />
            Alunos
          </a>

          <a href="#turmas" className="flex items-center gap-3 text-gray-700 font-medium hover:text-blue-600">
            <GraduationCap />
            Turmas
          </a>

          <a href="#presencas" className="flex items-center gap-3 text-gray-700 font-medium hover:text-blue-600">
            <ClipboardCheck />
            Presenças
          </a>

          <a href="#financeiro" className="flex items-center gap-3 text-gray-700 font-medium hover:text-blue-600">
            <DollarSign />
            Financeiro
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8 md:ml-64">
        <section id="dashboard">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Dashboard Escolinha
            </h1>

            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              onClick={sair}
            >
              Sair
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <Users size={36} className="text-blue-600" />
                <div>
                  <p className="text-gray-500 font-medium">Total de Alunos</p>
                  <h2 className="text-4xl font-bold text-gray-900">
                    {alunos.length}
                  </h2>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <BookOpen size={36} className="text-green-600" />
                <div>
                  <p className="text-gray-500 font-medium">Turmas</p>
                  <h2 className="text-4xl font-bold text-gray-900">
                    {turmas.length}
                  </h2>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <DollarSign size={36} className="text-yellow-600" />
                <div>
                  <p className="text-gray-500 font-medium">Pendências</p>
                  <h2 className="text-4xl font-bold text-gray-900">
                    {mensalidades.filter((m) => m.status === "Pendente").length}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Resumo Financeiro
            </h2>

            <div className="w-full h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={dadosFinanceiros}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label
                  >
                    {dadosFinanceiros.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section id="alunos" className="bg-white p-8 rounded-2xl shadow-lg scroll-mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Cadastro de Alunos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
            <input
              className="border border-gray-300 p-3 rounded-lg w-full text-black bg-white"
              type="text"
              placeholder="Nome do aluno"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <select
              className="border border-gray-300 p-3 rounded-lg w-full text-black bg-white"
              value={turmaAluno}
              onChange={(e) => setTurmaAluno(e.target.value)}
            >
              <option value="">Selecione a turma</option>

              {turmas.map((turma) => (
                <option key={turma.id} value={turma.nome}>
                  {turma.nome}
                </option>
              ))}
            </select>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium"
              onClick={salvarAluno}
            >
              Salvar
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {alunos.map((aluno) => (
              <div
                key={aluno.id}
                className="border border-gray-200 bg-gray-50 p-4 rounded-xl flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                {editandoId === aluno.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                    <input
                      className="border border-gray-300 p-2 rounded-lg w-full text-black bg-white"
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                    />

                    <select
                      className="border border-gray-300 p-2 rounded-lg w-full text-black bg-white"
                      value={turmaEditada}
                      onChange={(e) => setTurmaEditada(e.target.value)}
                    >
                      <option value="">Selecione a turma</option>

                      {turmas.map((turma) => (
                        <option key={turma.id} value={turma.nome}>
                          {turma.nome}
                        </option>
                      ))}
                    </select>

                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg"
                      onClick={() => salvarEdicao(aluno.id)}
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-gray-800 block">
                      {aluno.nome}
                    </span>

                    <span className="text-sm text-gray-600">
                      Turma: {aluno.turma || "Sem turma"}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => {
                      setEditandoId(aluno.id);
                      setNomeEditado(aluno.nome);
                      setTurmaEditada(aluno.turma || "");
                    }}
                  >
                    Editar
                  </button>

                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    onClick={() => marcarPresenca(aluno, "Presente")}
                  >
                    Presente
                  </button>

                  <button
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => marcarPresenca(aluno, "Faltou")}
                  >
                    Faltou
                  </button>

                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    onClick={() => gerarMensalidade(aluno)}
                  >
                    Mensalidade
                  </button>

                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => excluirAluno(aluno.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="turmas" className="bg-white p-8 rounded-2xl shadow-lg mt-8 scroll-mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Cadastro de Turmas
          </h2>

          <div className="flex gap-2 mb-6">
            <input
              className="border border-gray-300 p-3 rounded-lg w-full text-black bg-white"
              type="text"
              placeholder="Nome da turma"
              value={nomeTurma}
              onChange={(e) => setNomeTurma(e.target.value)}
            />

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium"
              onClick={salvarTurma}
            >
              Salvar
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                className="border border-gray-200 bg-gray-50 p-4 rounded-xl flex justify-between items-center"
              >
                <span className="font-semibold text-gray-800">
                  {turma.nome}
                </span>

                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => excluirTurma(turma.id)}
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="presencas" className="bg-white p-8 rounded-2xl shadow-lg mt-8 scroll-mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Histórico de Presenças
          </h2>

          <div className="flex flex-col gap-3">
            {presencas.map((presenca) => (
              <div
                key={presenca.id}
                className="border border-gray-200 bg-gray-50 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <span className="font-semibold text-gray-800 block">
                    {presenca.alunoNome}
                  </span>

                  <span className="text-sm text-gray-600">
                    Turma: {presenca.turma || "Sem turma"}
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  <span className={`font-bold ${presenca.status === "Presente" ? "text-green-700" : "text-red-700"}`}>
                    {presenca.status}
                  </span>

                  <span className="text-gray-600">
                    {presenca.data}
                  </span>

                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                    onClick={() => excluirPresenca(presenca.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="financeiro" className="bg-white p-8 rounded-2xl shadow-lg mt-8 scroll-mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Financeiro
          </h2>

          <div className="flex flex-col gap-3">
            {mensalidades.map((mensalidade) => (
              <div
                key={mensalidade.id}
                className="border border-gray-200 bg-gray-50 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <span className="font-semibold text-gray-800 block">
                    {mensalidade.alunoNome}
                  </span>

                  <span className="text-sm text-gray-600 block">
                    Turma: {mensalidade.turma}
                  </span>

                  <span className="text-sm text-gray-600">
                    Valor: R$ {mensalidade.valor}
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  <span className={`font-bold ${mensalidade.status === "Pago" ? "text-green-700" : "text-red-700"}`}>
                    {mensalidade.status}
                  </span>

                  {mensalidade.status === "Pendente" && (
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      onClick={() => marcarComoPago(mensalidade.id)}
                    >
                      Marcar Pago
                    </button>
                  )}

                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                    onClick={() => gerarRecibo(mensalidade)}
                  >
                    Recibo PDF
                  </button>

                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                    onClick={() => excluirMensalidade(mensalidade.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
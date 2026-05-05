import { useEffect, useState } from "react"

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEBAPP_URL
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

console.log("SENHA:", ADMIN_PASSWORD)

const unidades = [
  "Todas",
  "Quintal da Tia Sandra",
  "Abençoado Bar Sudoeste",
  "Abençoado Bar Asa Norte",
]

type Cadastro = {
  linha: number
  brinquedoteca: string
  responsavel: string
  telefone: string | number
  criancas: string
  quantidadeCriancas: number
  statusPresenca: string
  dataEntrada: string
  dataSaida: string
}

function limparTelefone(valor: string | number) {
  return String(valor).replace(/\D/g, "")
}

function abrirWhatsapp(telefone: string | number) {
  const numero = limparTelefone(telefone)

  const mensagem = encodeURIComponent(
    "Olá! Sua criança está pronta para ser chamada na brinquedoteca."
  )

  window.open(`https://wa.me/55${numero}?text=${mensagem}`, "_blank")
}

function jsonp<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const callback = "cb_" + Date.now()

    ;(window as any)[callback] = (data: T) => {
      resolve(data)
      delete (window as any)[callback]
      script.remove()
    }

    const script = document.createElement("script")
    script.src = `${url}&callback=${callback}`
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export default function Admin() {
  const [senha, setSenha] = useState("")
  const [logado, setLogado] = useState(false)
  const [unidade, setUnidade] = useState("Todas")
  const [cadastros, setCadastros] = useState<Cadastro[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")

  async function carregar() {
    setCarregando(true)
    setErro("")

    try {
      const dados = await jsonp<Cadastro[]>(`${SHEETS_URL}?acao=listar`)
      setCadastros(dados)
    } catch {
      setErro("Não foi possível carregar o painel.")
    } finally {
      setCarregando(false)
    }
  }

  async function marcarSaida(linha: number) {
    const confirmar = confirm("Confirmar saída deste responsável/criança(s)?")

    if (!confirmar) return

    setCarregando(true)

    try {
      await jsonp(`${SHEETS_URL}?acao=saida&linha=${linha}`)
      await carregar()
    } catch {
      setErro("Não foi possível marcar a saída.")
      setCarregando(false)
    }
  }

  function entrar() {
    if (senha === ADMIN_PASSWORD) {
      setLogado(true)
      return
    }

    setErro("Senha incorreta.")
  }

  useEffect(() => {
    if (logado) carregar()
  }, [logado])

  const presentes = cadastros.filter((cadastro) => {
    const unidadeOk =
      unidade === "Todas" || cadastro.brinquedoteca === unidade

    const presente = cadastro.statusPresenca !== "Foi embora"

    return unidadeOk && presente
  })

  if (!logado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-purple-950 px-4 text-white">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-purple-950 shadow-2xl">
          <h1 className="text-2xl font-extrabold">Painel da Equipe</h1>

          <p className="mt-2 text-sm text-purple-700">
            Acesso exclusivo das cuidadoras.
          </p>

          {erro && (
            <div className="mt-4 rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-700">
              {erro}
            </div>
          )}

          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Senha de acesso"
            className="mt-5 w-full rounded-2xl border border-purple-200 px-4 py-4 outline-none focus:border-purple-700"
          />

          <button
            type="button"
            onClick={entrar}
            className="mt-4 w-full rounded-2xl bg-yellow-300 px-4 py-4 font-extrabold text-purple-950"
          >
            Entrar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-purple-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-md">
        <header>
          <h1 className="text-3xl font-extrabold">Painel da Equipe</h1>

          <p className="mt-1 text-sm text-purple-100">
            Crianças presentes na brinquedoteca.
          </p>
        </header>

        <section className="mt-5 rounded-3xl bg-white p-5 text-purple-950 shadow-xl">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Filtrar unidade</span>

            <select
              value={unidade}
              onChange={(event) => setUnidade(event.target.value)}
              className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-4 outline-none"
            >
              {unidades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={carregar}
            className="mt-4 w-full rounded-2xl bg-purple-100 px-4 py-3 font-bold text-purple-800"
          >
            Atualizar painel
          </button>
        </section>

        <div className="mt-5 rounded-2xl bg-yellow-300 p-4 text-center text-lg font-extrabold text-purple-950">
          {presentes.length} cadastro(s) presente(s)
        </div>

        {erro && (
          <div className="mt-4 rounded-2xl bg-red-100 p-4 text-center text-sm font-bold text-red-700">
            {erro}
          </div>
        )}

        {carregando && (
          <p className="mt-4 text-center text-sm text-purple-100">
            Carregando...
          </p>
        )}

        <section className="mt-5 space-y-4">
          {presentes.map((cadastro) => (
            <article
              key={cadastro.linha}
              className="rounded-3xl bg-white p-5 text-purple-950 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">
                    {cadastro.responsavel}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-purple-700">
                    {cadastro.brinquedoteca}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Presente
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-purple-50 p-4">
                <p className="text-sm font-bold">Criança(s):</p>
                <p className="mt-1 text-sm">{cadastro.criancas}</p>
              </div>

              <p className="mt-3 text-sm">
                Responsável: <strong>{cadastro.responsavel}</strong>
              </p>

              <p className="mt-1 text-sm">
                WhatsApp: <strong>{cadastro.telefone}</strong>
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => abrirWhatsapp(cadastro.telefone)}
                  className="w-full rounded-2xl bg-green-500 px-4 py-4 font-extrabold text-white"
                >
                  Chamar no WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => marcarSaida(cadastro.linha)}
                  className="w-full rounded-2xl bg-red-500 px-4 py-4 font-extrabold text-white"
                >
                  Informar hora da saída
                </button>
              </div>
            </article>
          ))}

          {!carregando && presentes.length === 0 && (
            <div className="rounded-3xl bg-white p-6 text-center text-purple-950">
              Nenhuma criança presente nessa unidade.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
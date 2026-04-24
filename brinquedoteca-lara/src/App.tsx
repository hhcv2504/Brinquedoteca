import { useState } from "react"
import logo from "./assets/logo.png"

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEBAPP_URL

const brinquedotecas = [
  "Quintal da Tia Sandra",
  "Abençoado Bar Sudoeste",
  "Abençoado Bar Asa Norte",
]

type Crianca = {
  nome: string
  idade: string
}

type Responsavel = {
  brinquedoteca: string
  nome: string
  telefone: string
  nascimento: string
}

function limparTelefone(valor: string) {
  return valor.replace(/\D/g, "")
}

function formatarTelefone(valor: string) {
  const numeros = limparTelefone(valor).slice(0, 11)

  if (numeros.length <= 2) return numeros
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
}

export default function App() {
  const [responsavel, setResponsavel] = useState<Responsavel>({
    brinquedoteca: "",
    nome: "",
    telefone: "",
    nascimento: "",
  })

  const [criancas, setCriancas] = useState<Crianca[]>([
    { nome: "", idade: "" },
  ])

  const [visualizouTermo, setVisualizouTermo] = useState(false)
  const [aceitouTermo, setAceitouTermo] = useState(false)
  const [aceitouPromocoes, setAceitouPromocoes] = useState(false)

  const [erro, setErro] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  function abrirTermo() {
    setVisualizouTermo(true)
    window.open("/termo-brinquedoteca.pdf", "_blank")
  }

  function atualizarCrianca(index: number, campo: keyof Crianca, valor: string) {
    const novasCriancas = [...criancas]

    novasCriancas[index][campo] =
      campo === "idade" ? valor.replace(/\D/g, "").slice(0, 2) : valor

    setCriancas(novasCriancas)
  }

  function adicionarCrianca() {
    setCriancas([...criancas, { nome: "", idade: "" }])
  }

  function removerCrianca(index: number) {
    if (criancas.length === 1) return
    setCriancas(criancas.filter((_, i) => i !== index))
  }

  function validarFormulario() {
    const telefone = limparTelefone(responsavel.telefone)

    const criancasValidas = criancas.filter(
      (crianca) => crianca.nome.trim() && crianca.idade.trim()
    )

    const algumaCriancaIncompleta = criancas.some(
      (crianca) =>
        (crianca.nome.trim() && !crianca.idade.trim()) ||
        (!crianca.nome.trim() && crianca.idade.trim())
    )

    if (!responsavel.brinquedoteca) return "Selecione a brinquedoteca."
    if (!responsavel.nome.trim()) return "Informe o nome do responsável."
    if (telefone.length < 10 || telefone.length > 11) {
      return "Informe um WhatsApp válido com DDD."
    }
    if (!responsavel.nascimento) {
      return "Informe a data de nascimento do responsável."
    }
    if (criancasValidas.length === 0) {
      return "Adicione pelo menos uma criança."
    }
    if (algumaCriancaIncompleta) {
      return "Complete nome e idade de todas as crianças preenchidas."
    }
    if (!visualizouTermo) {
      return "Abra o termo de autorização antes de continuar."
    }
    if (!aceitouTermo) {
      return "Você precisa aceitar o termo de autorização."
    }
    if (!navigator.onLine) {
      return "Você está sem internet. Conecte-se e tente novamente."
    }

    return ""
  }

  async function enviarCadastro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const mensagemErro = validarFormulario()

    if (mensagemErro) {
      setErro(mensagemErro)
      return
    }

    setErro("")
    setEnviando(true)

    const criancasValidas = criancas.filter(
      (crianca) => crianca.nome.trim() && crianca.idade.trim()
    )

    const dados = {
      responsavel: {
        ...responsavel,
        telefone: limparTelefone(responsavel.telefone),
      },
      criancas: criancasValidas,
      dataCadastro: new Date().toISOString(),
      origem: "App Brinquedoteca",
      status: "Novo",
      visualizouTermo: "Sim",
      aceitouTermo: "Sim",
      aceitouWhatsapp: "Desativado",
      aceitouPromocoes: aceitouPromocoes ? "Sim" : "Não",
      dataConsentimento: new Date().toISOString(),
    }

    try {
      await fetch(SHEETS_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(dados),
      })

      setEnviado(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setErro("Não foi possível enviar. Tente novamente.")
    } finally {
      setEnviando(false)
    }
  }

  function novoCadastro() {
    setResponsavel({
      brinquedoteca: "",
      nome: "",
      telefone: "",
      nascimento: "",
    })

    setCriancas([{ nome: "", idade: "" }])
    setVisualizouTermo(false)
    setAceitouTermo(false)
    setAceitouPromocoes(false)
    setErro("")
    setEnviado(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-fuchsia-900 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 text-center">
          <img
            src={logo}
            alt="Mundo Encantado de Lara"
            className="mx-auto mb-4 h-32 w-32 rounded-full object-cover shadow-2xl"
          />

          <p className="mb-2 inline-flex rounded-full bg-yellow-300 px-4 py-1 text-xs font-bold uppercase tracking-wide text-purple-950">
            Cadastro da Brinquedoteca
          </p>

          <h1 className="text-3xl font-extrabold leading-tight">
            Mundo Encantado de Lara
          </h1>

          <p className="mt-2 text-sm text-purple-100">
            Preencha seus dados para agilizar o atendimento.
          </p>
        </header>

        {enviado && (
          <section className="mb-4 rounded-3xl bg-green-100 p-5 text-center text-green-900 shadow-xl">
            <p className="text-2xl">✅</p>
            <h2 className="mt-2 text-xl font-extrabold">
              Cadastro enviado com sucesso!
            </h2>
            <p className="mt-1 text-sm">
              Nossa equipe recebeu as informações.
            </p>

            <button
              type="button"
              onClick={novoCadastro}
              className="mt-4 w-full rounded-2xl bg-green-500 px-6 py-4 font-extrabold text-white"
            >
              Fazer novo cadastro
            </button>
          </section>
        )}

        {erro && (
          <div className="mb-4 rounded-2xl bg-red-100 p-4 text-center text-sm font-bold text-red-700">
            {erro}
          </div>
        )}

        {!enviado && (
          <form
            onSubmit={enviarCadastro}
            className="rounded-3xl bg-white p-5 text-purple-950 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold">Dados do responsável</h2>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-bold">
                Qual brinquedoteca você está?
              </span>

              <select
                value={responsavel.brinquedoteca}
                onChange={(event) =>
                  setResponsavel({
                    ...responsavel,
                    brinquedoteca: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-4 outline-none focus:border-purple-700"
              >
                <option value="">Selecione uma opção</option>
                {brinquedotecas.map((brinquedoteca) => (
                  <option key={brinquedoteca} value={brinquedoteca}>
                    {brinquedoteca}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-bold">
                Nome do responsável
              </span>

              <input
                value={responsavel.nome}
                onChange={(event) =>
                  setResponsavel({
                    ...responsavel,
                    nome: event.target.value,
                  })
                }
                placeholder="Ex: Maria Silva"
                autoComplete="name"
                className="w-full rounded-2xl border border-purple-200 px-4 py-4 outline-none focus:border-purple-700"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-bold">WhatsApp</span>

              <input
                value={responsavel.telefone}
                onChange={(event) =>
                  setResponsavel({
                    ...responsavel,
                    telefone: formatarTelefone(event.target.value),
                  })
                }
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
                className="w-full rounded-2xl border border-purple-200 px-4 py-4 outline-none focus:border-purple-700"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-bold">
                Data de nascimento do responsável
              </span>

              <input
                type="date"
                value={responsavel.nascimento}
                onChange={(event) =>
                  setResponsavel({
                    ...responsavel,
                    nascimento: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-purple-200 px-4 py-4 outline-none focus:border-purple-700"
              />
            </label>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Dados das crianças
                  </h2>
                  <p className="mt-1 text-sm text-purple-700">
                    Adicione quantas crianças precisar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={adicionarCrianca}
                  className="shrink-0 rounded-full bg-purple-100 px-4 py-2 text-sm font-extrabold text-purple-800"
                >
                  + Adicionar
                </button>
              </div>

              <div className="space-y-4">
                {criancas.map((crianca, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-purple-100 bg-purple-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <strong>Criança {index + 1}</strong>

                      {criancas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerCrianca(index)}
                          className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-sm font-bold">
                        Nome da criança
                      </span>

                      <input
                        value={crianca.nome}
                        onChange={(event) =>
                          atualizarCrianca(index, "nome", event.target.value)
                        }
                        placeholder="Ex: Lara"
                        className="w-full rounded-2xl border border-purple-200 px-4 py-4 outline-none focus:border-purple-700"
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="mb-1 block text-sm font-bold">
                        Idade
                      </span>

                      <input
                        value={crianca.idade}
                        onChange={(event) =>
                          atualizarCrianca(index, "idade", event.target.value)
                        }
                        placeholder="Ex: 5"
                        inputMode="numeric"
                        className="w-full rounded-2xl border border-purple-200 px-4 py-4 outline-none focus:border-purple-700"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 space-y-4 rounded-3xl bg-purple-50 p-4">
              <button
                type="button"
                onClick={abrirTermo}
                className="w-full rounded-2xl border border-purple-300 bg-white px-4 py-3 text-sm font-extrabold text-purple-800"
              >
                Ver termo de autorização
              </button>

              {visualizouTermo && (
                <p className="text-center text-xs font-bold text-green-700">
                  Termo aberto para leitura.
                </p>
              )}

              <label className="flex items-start gap-3 text-sm text-purple-900">
                <input
                  type="checkbox"
                  checked={aceitouTermo}
                  onChange={(event) => setAceitouTermo(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0"
                />

                <span>
                  Declaro que li ou tive acesso ao Termo de Autorização da
                  Brinquedoteca e autorizo a participação da(s) criança(s) nas
                  atividades.
                  <strong className="mt-1 block">Obrigatório.</strong>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-purple-900">
                <input
                  type="checkbox"
                  checked={aceitouPromocoes}
                  onChange={(event) =>
                    setAceitouPromocoes(event.target.checked)
                  }
                  className="mt-1 h-5 w-5 shrink-0"
                />

                <span>
                  Autorizo receber novidades e promoções da brinquedoteca via
                  WhatsApp.
                  <strong className="mt-1 block">
                    Opcional. Você pode negar e ainda finalizar o cadastro.
                  </strong>
                </span>
              </label>
            </section>

            <button
              type="submit"
              disabled={enviando}
              className="mt-6 w-full rounded-2xl bg-yellow-300 px-6 py-4 text-lg font-extrabold text-purple-950 shadow-lg disabled:opacity-60"
            >
              {enviando ? "Enviando cadastro..." : "Finalizar cadastro"}
            </button>

            {enviando && (
              <p className="mt-3 text-center text-sm font-semibold text-purple-700">
                Aguarde alguns segundos. Estamos salvando seus dados.
              </p>
            )}
          </form>
        )}

        <footer className="mt-5 rounded-2xl bg-white/10 p-4 text-center text-xs leading-relaxed text-purple-100">
          Ao enviar, você confirma que as informações estão corretas.
        </footer>
      </div>
    </main>
  )
}
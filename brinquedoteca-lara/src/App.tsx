import { useState } from "react"
import logo from "./assets/logo.png"

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

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEBAPP_URL

const brinquedotecas = [
  "Quintal da Tia Sandra",
  "Abençoado Bar Sudoeste",
  "Abençoado Bar Asa Norte",
]

function limparTelefone(valor: string) {
  return valor.replace(/\D/g, "")
}

function formatarTelefone(valor: string) {
  const numeros = limparTelefone(valor).slice(0, 11)

  if (numeros.length <= 2) return numeros
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
}

function App() {
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
  const [aceitouWhatsapp, setAceitouWhatsapp] = useState(false)
  const [aceitouPromocoes, setAceitouPromocoes] = useState(false)

  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")

  function abrirTermo() {
    setVisualizouTermo(true)
    window.open("/termo-brinquedoteca.pdf", "_blank")
  }

  function atualizarCrianca(index: number, campo: keyof Crianca, valor: string) {
    const novasCriancas = [...criancas]

    if (campo === "idade") {
      novasCriancas[index][campo] = valor.replace(/\D/g, "").slice(0, 2)
    } else {
      novasCriancas[index][campo] = valor
    }

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
    setErro("")

    const telefoneLimpo = limparTelefone(responsavel.telefone)

    if (!responsavel.brinquedoteca) {
      setErro("Selecione em qual brinquedoteca você está.")
      return false
    }

    if (!responsavel.nome.trim()) {
      setErro("Informe o nome do responsável.")
      return false
    }

    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      setErro("Informe um WhatsApp válido com DDD.")
      return false
    }

    if (!responsavel.nascimento) {
      setErro("Informe a data de nascimento do responsável.")
      return false
    }

    const criancasValidas = criancas.filter(
      (crianca) => crianca.nome.trim() && crianca.idade.trim()
    )

    if (criancasValidas.length === 0) {
      setErro("Adicione pelo menos uma criança.")
      return false
    }

    const algumaCriancaIncompleta = criancas.some(
      (crianca) =>
        (crianca.nome.trim() && !crianca.idade.trim()) ||
        (!crianca.nome.trim() && crianca.idade.trim())
    )

    if (algumaCriancaIncompleta) {
      setErro("Complete nome e idade de todas as crianças preenchidas.")
      return false
    }

    if (!visualizouTermo) {
      setErro("Abra o termo de autorização antes de continuar.")
      return false
    }

    if (!aceitouTermo) {
      setErro("Você precisa aceitar o termo de autorização para continuar.")
      return false
    }

    if (!aceitouWhatsapp) {
      setErro("Você precisa autorizar o contato pelo WhatsApp para continuarmos o atendimento.")
      return false
    }

    if (!navigator.onLine) {
      setErro("Você está sem internet. Conecte-se e tente novamente.")
      return false
    }

    return true
  }

  async function enviarCadastro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (enviando) return
    if (!validarFormulario()) return

    setEnviando(true)
    setEnviado(false)
    setErro("")

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
      visualizouTermo: visualizouTermo ? "Sim" : "Não",
      aceitouTermo: aceitouTermo ? "Sim" : "Não",
      aceitouWhatsapp: aceitouWhatsapp ? "Sim" : "Não",
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
    } catch (error) {
      console.error(error)
      setErro("Não foi possível enviar. Verifique sua conexão e tente novamente.")
    } finally {
      setEnviando(false)
    }
  }

  function abrirWhatsapp() {
    const telefoneLimpo = limparTelefone(responsavel.telefone)
    const mensagem = encodeURIComponent(
      "Acabei de Cadastrar, estou verificando meu número"
    )

    window.open(`https://wa.me/55${telefoneLimpo}?text=${mensagem}`, "_blank")
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
    setAceitouWhatsapp(false)
    setAceitouPromocoes(false)
    setEnviado(false)
    setErro("")
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

          <p className="mt-2 text-sm leading-relaxed text-purple-100">
            Preencha seus dados para agilizar seu atendimento.
          </p>
        </header>

        {enviado && (
          <section className="mb-4 rounded-3xl bg-green-100 p-5 text-center text-green-900 shadow-xl">
            <p className="text-2xl">✅</p>
            <h2 className="mt-2 text-xl font-extrabold">
              Cadastro enviado com sucesso!
            </h2>
            <p className="mt-1 text-sm">
              Agora envie a confirmação pelo WhatsApp.
            </p>

            <button
              type="button"
              onClick={abrirWhatsapp}
              className="mt-4 w-full rounded-2xl bg-green-500 px-6 py-4 text-lg font-extrabold text-white shadow-lg active:scale-95"
            >
              Enviar mensagem no WhatsApp
            </button>

            <button
              type="button"
              onClick={novoCadastro}
              className="mt-3 w-full rounded-2xl border border-green-400 px-6 py-3 font-bold text-green-800"
            >
              Fazer novo cadastro
            </button>
          </section>
        )}

        {erro && (
          <div className="mb-4 rounded-2xl bg-red-100 p-4 text-center text-sm font-bold text-red-700 shadow-lg">
            {erro}
          </div>
        )}

        <form
          onSubmit={enviarCadastro}
          className="rounded-3xl bg-white p-5 text-purple-950 shadow-2xl"
        >
          <section>
            <h2 className="text-xl font-extrabold">Dados do responsável</h2>
            <p className="mb-4 mt-1 text-sm text-purple-700">
              Usaremos esses dados para cadastro, atendimento e segurança.
            </p>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-bold">
                Qual brinquedoteca você está?
              </span>
              <select
                className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-4 text-base outline-none focus:border-purple-700"
                value={responsavel.brinquedoteca}
                onChange={(e) =>
                  setResponsavel({
                    ...responsavel,
                    brinquedoteca: e.target.value,
                  })
                }
              >
                <option value="">Selecione uma opção</option>
                {brinquedotecas.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-bold">Nome completo</span>
              <input
                className="w-full rounded-2xl border border-purple-200 px-4 py-4 text-base outline-none focus:border-purple-700"
                placeholder="Ex: Maria Silva"
                autoComplete="name"
                value={responsavel.nome}
                onChange={(e) =>
                  setResponsavel({ ...responsavel, nome: e.target.value })
                }
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-bold">WhatsApp</span>
              <input
                className="w-full rounded-2xl border border-purple-200 px-4 py-4 text-base outline-none focus:border-purple-700"
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
                value={responsavel.telefone}
                onChange={(e) =>
                  setResponsavel({
                    ...responsavel,
                    telefone: formatarTelefone(e.target.value),
                  })
                }
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-1 block text-sm font-bold">
                Data de nascimento
              </span>
              <input
                type="date"
                className="w-full rounded-2xl border border-purple-200 px-4 py-4 text-base outline-none focus:border-purple-700"
                value={responsavel.nascimento}
                onChange={(e) =>
                  setResponsavel({
                    ...responsavel,
                    nascimento: e.target.value,
                  })
                }
              />
            </label>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Crianças</h2>
                <p className="mt-1 text-sm text-purple-700">
                  Adicione quantas crianças precisar.
                </p>
              </div>

              <button
                type="button"
                onClick={adicionarCrianca}
                className="shrink-0 rounded-full bg-purple-100 px-4 py-2 text-sm font-extrabold text-purple-800 active:scale-95"
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

                  <label className="mb-3 block">
                    <span className="mb-1 block text-sm font-bold">
                      Nome da criança
                    </span>
                    <input
                      className="w-full rounded-2xl border border-purple-200 px-4 py-4 text-base outline-none focus:border-purple-700"
                      placeholder="Ex: Lara"
                      value={crianca.nome}
                      onChange={(e) =>
                        atualizarCrianca(index, "nome", e.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Idade</span>
                    <input
                      className="w-full rounded-2xl border border-purple-200 px-4 py-4 text-base outline-none focus:border-purple-700"
                      placeholder="Ex: 5"
                      inputMode="numeric"
                      value={crianca.idade}
                      onChange={(e) =>
                        atualizarCrianca(index, "idade", e.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 space-y-4 rounded-3xl bg-purple-50 p-4">
            <button
              type="button"
              onClick={abrirTermo}
              className="w-full rounded-2xl border border-purple-300 bg-white px-4 py-3 text-sm font-extrabold text-purple-800 active:scale-95"
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
                onChange={(e) => setAceitouTermo(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span>
                Declaro que li ou tive acesso ao Termo de Autorização da
                Brinquedoteca e autorizo a participação da criança nas
                atividades.
                <strong className="mt-1 block">Obrigatório.</strong>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-purple-900">
              <input
                type="checkbox"
                checked={aceitouWhatsapp}
                onChange={(e) => setAceitouWhatsapp(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span>
                Autorizo o uso do meu WhatsApp para comunicações necessárias ao
                atendimento, identificação e chamada da criança.
                <strong className="mt-1 block">Obrigatório.</strong>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-purple-900">
              <input
                type="checkbox"
                checked={aceitouPromocoes}
                onChange={(e) => setAceitouPromocoes(e.target.checked)}
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
          </div>

          <button
            type="submit"
            disabled={enviando || enviado}
            className="mt-6 w-full rounded-2xl bg-yellow-300 px-6 py-4 text-lg font-extrabold text-purple-950 shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Enviando cadastro..."
              : enviado
              ? "Cadastro já enviado"
              : "Finalizar cadastro"}
          </button>

          {enviando && (
            <p className="mt-3 text-center text-sm font-semibold text-purple-700">
              Aguarde alguns segundos. Estamos salvando seus dados.
            </p>
          )}
        </form>

        <footer className="mt-5 rounded-2xl bg-white/10 p-4 text-center text-xs leading-relaxed text-purple-100">
          Ao enviar, você confirma que as informações estão corretas.
          <br />
          O WhatsApp informado será usado para atendimento da criança.
        </footer>
      </div>
    </main>
  )
}

export default App
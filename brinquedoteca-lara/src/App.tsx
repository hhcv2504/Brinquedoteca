import { useState } from "react"
import logo from "./assets/logo.png"

const WHATSAPP_ATIVO = false

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
      setErro("Selecione a brinquedoteca.")
      return false
    }

    if (!responsavel.nome.trim()) {
      setErro("Informe o nome.")
      return false
    }

    if (telefoneLimpo.length < 10) {
      setErro("Telefone inválido.")
      return false
    }

    if (!responsavel.nascimento) {
      setErro("Informe a data de nascimento.")
      return false
    }

    const criancasValidas = criancas.filter(
      (c) => c.nome.trim() && c.idade.trim()
    )

    if (criancasValidas.length === 0) {
      setErro("Adicione pelo menos uma criança.")
      return false
    }

    if (!visualizouTermo) {
      setErro("Abra o termo antes de continuar.")
      return false
    }

    if (!aceitouTermo) {
      setErro("Aceite o termo.")
      return false
    }

    if (WHATSAPP_ATIVO && !aceitouWhatsapp) {
      setErro("Autorize o WhatsApp.")
      return false
    }

    return true
  }

  async function enviarCadastro(e: React.FormEvent) {
    e.preventDefault()

    if (!validarFormulario()) return

    setEnviando(true)

    const dados = {
      responsavel: {
        ...responsavel,
        telefone: limparTelefone(responsavel.telefone),
      },
      criancas,
      aceitouTermo,
      aceitouWhatsapp: WHATSAPP_ATIVO ? aceitouWhatsapp : "Desativado",
      aceitouPromocoes,
      visualizouTermo,
      dataConsentimento: new Date().toISOString(),
    }

    await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(dados),
    })

    setEnviado(true)
    setEnviando(false)
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <img src={logo} className="w-24 mx-auto mb-4" />

      {erro && <p className="text-red-500">{erro}</p>}

      {enviado && <p className="text-green-600">Cadastro enviado!</p>}

      <form onSubmit={enviarCadastro}>
        <select
          value={responsavel.brinquedoteca}
          onChange={(e) =>
            setResponsavel({ ...responsavel, brinquedoteca: e.target.value })
          }
        >
          <option value="">Selecione</option>
          {brinquedotecas.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>

        <input
          placeholder="Nome"
          value={responsavel.nome}
          onChange={(e) =>
            setResponsavel({ ...responsavel, nome: e.target.value })
          }
        />

        <input
          placeholder="Telefone"
          value={responsavel.telefone}
          onChange={(e) =>
            setResponsavel({
              ...responsavel,
              telefone: formatarTelefone(e.target.value),
            })
          }
        />

        <input
          type="date"
          value={responsavel.nascimento}
          onChange={(e) =>
            setResponsavel({ ...responsavel, nascimento: e.target.value })
          }
        />

        <button type="button" onClick={abrirTermo}>
          Ver termo
        </button>

        <label>
          <input
            type="checkbox"
            checked={aceitouTermo}
            onChange={(e) => setAceitouTermo(e.target.checked)}
          />
          Aceito o termo
        </label>

        {WHATSAPP_ATIVO && (
          <label>
            <input
              type="checkbox"
              checked={aceitouWhatsapp}
              onChange={(e) => setAceitouWhatsapp(e.target.checked)}
            />
            Aceito WhatsApp
          </label>
        )}

        <label>
          <input
            type="checkbox"
            checked={aceitouPromocoes}
            onChange={(e) => setAceitouPromocoes(e.target.checked)}
          />
          Promoções (opcional)
        </label>

        <button disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </main>
  )
}

export default App
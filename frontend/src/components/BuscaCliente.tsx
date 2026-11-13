import { useEffect, useMemo, useRef, useState } from 'react'
import { ClienteCadastro } from '../types'
import SeloEstabelecimento from './SeloEstabelecimento'
import { Search, X, UserPlus } from 'lucide-react'

/** sem acento e minusculo: "João" acha "joao" */
export const normaliza = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

interface Props {
  clientes: ClienteCadastro[]
  value: number | null
  onChange: (id: number | null) => void
  /** cadastra um cliente direto com o nome digitado e ja escolhe ele */
  onCreate?: (nome: string) => Promise<void> | void
  /** texto que ja vem na busca (ex.: o nome digitado numa venda antiga) */
  buscaInicial?: string
  placeholder?: string
}

/**
 * Busca no cadastro unico: clientes diretos e do fiado juntos. O do fiado
 * aparece com o selo do estabelecimento, para nao confundir duas pessoas de
 * mesmo nome em lugares diferentes.
 */
export default function BuscaCliente({
  clientes, value, onChange, onCreate, buscaInicial = '',
  placeholder = 'para quem (buscar cliente)',
}: Props) {
  const [busca, setBusca] = useState(buscaInicial)
  const [aberto, setAberto] = useState(false)
  const [criando, setCriando] = useState(false)
  const caixaRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setBusca(buscaInicial) }, [buscaInicial])

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false)
    }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla) }
  }, [aberto])

  const filtrados = useMemo(() => {
    const q = normaliza(busca)
    if (!q) return clientes.slice(0, 60)
    // cada palavra digitada precisa aparecer no nome, em qualquer ordem
    const partes = q.split(' ')
    return clientes.filter((c) => {
      const n = normaliza(c.name)
      return partes.every((p) => n.includes(p))
    }).slice(0, 60)
  }, [busca, clientes])

  const selecionado = clientes.find((c) => c.id === value)
  const nomeNovo = busca.trim()
  const podeCriar = !!onCreate && nomeNovo.length > 1 &&
    !clientes.some((c) => normaliza(c.name) === normaliza(nomeNovo))

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 bg-brand-soft border border-brand rounded-lg px-3 h-10 min-w-0">
        <SeloEstabelecimento nome={selecionado.estabelecimento ?? undefined} titulo="Cliente do fiado" />
        <span className="flex-1 text-sm font-semibold text-ink truncate">{selecionado.name}</span>
        <button onClick={() => { onChange(null); setBusca(''); setAberto(true) }}
          aria-label="Trocar cliente" title="Trocar cliente"
          className="w-6 h-6 rounded-full hover:bg-brand-line flex items-center justify-center flex-shrink-0">
          <X size={14} className="text-ink-2" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-w-0" ref={caixaRef}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
      <input value={busca}
        onChange={(e) => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        placeholder={placeholder}
        className="w-full text-sm border border-line rounded-lg pl-9 pr-3 h-10 bg-surface text-ink focus:outline-none focus:border-brand" />

      {aberto && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-surface rounded-lg border border-line shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto divide-y divide-line-soft">
            {filtrados.map((c) => (
              <button key={c.id}
                onClick={() => { onChange(c.id); setAberto(false) }}
                className="w-full px-3 py-2 hover:bg-brand-soft text-left text-sm text-ink flex items-center gap-2 transition-colors">
                <span className="truncate flex-1">{c.name}</span>
                <SeloEstabelecimento nome={c.estabelecimento ?? undefined} titulo="Cliente do fiado" />
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-ink-3">Ninguém com esse nome no cadastro.</p>
            )}
          </div>
          {podeCriar && (
            <button disabled={criando}
              onClick={async () => {
                setCriando(true)
                try { await onCreate!(nomeNovo); setAberto(false) } finally { setCriando(false) }
              }}
              className="w-full flex items-center gap-1.5 border-t border-line px-3 py-2.5 text-xs font-semibold text-brand hover:bg-brand-soft transition-colors disabled:opacity-50">
              <UserPlus size={13} /> {criando ? 'Cadastrando...' : `Cadastrar "${nomeNovo}" como cliente`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { dataBR } from '../../data'
import { getClientesPainel, salvarCliente, excluirCliente, ligarVendasCliente } from '../../api/api'
import { PainelClientes, ClienteCadastro, GrupoSemCliente } from '../../types'
import BuscaCliente, { normaliza } from '../../components/BuscaCliente'
import SeloEstabelecimento from '../../components/SeloEstabelecimento'
import {
  UserPlus, Pencil, Trash2, Search, Loader2, Users, ChevronRight, Link2, Wand2, Check,
} from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/** 5514912345678 -> (14) 91234-5678 */
const fone = (v?: string | null) => {
  if (!v) return ''
  const d = v.replace(/[^0-9]/g, '').replace(/^55/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

/**
 * Nome antigo que traz o comeco de uma palavra do nome de um estabelecimento
 * e de cliente daquele fiado. Devolve o estabelecimento e o nome sem a palavra.
 * So sugere: quem decide e o dono, venda a venda.
 */
function pista(nome: string, estabs: PainelClientes['estabelecimentos']) {
  const palavras = normaliza(nome).split(' ')
  for (const e of estabs) {
    if (e.principal) continue
    const doLugar = normaliza(e.nome).split(' ').filter((w) => w.length >= 4)
    const achou = palavras.find((p) => p.length >= 4 && doLugar.some((w) => w.startsWith(p)))
    if (achou) {
      const limpo = nome.trim().split(/\s+/).filter((w) => normaliza(w) !== achou).join(' ')
      return { estab: e, nome: limpo ? limpo[0].toUpperCase() + limpo.slice(1) : '' }
    }
  }
  return null
}

/**
 * Clientes que compram direto (sem fiado). O cadastro e o mesmo do fiado: na
 * venda da para escolher qualquer um, e o do fiado aparece com o selo.
 * Embaixo, as vendas antigas sem cliente, para ligar a mao, venda a venda.
 */
export default function ClientesDiretos() {
  const [d, setD] = useState<PainelClientes | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)

  const carregar = async () => {
    try { setD(await getClientesPainel()) }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao carregar clientes') }
    finally { setCarregando(false) }
  }
  useEffect(() => { carregar() }, [])

  const diretos = useMemo(() => (d?.clientes ?? []).filter((c) => c.estabelecimentoId === null), [d])
  const filtrados = useMemo(() => {
    const q = normaliza(busca)
    return q ? diretos.filter((c) => normaliza(c.name).includes(q)) : diretos
  }, [busca, diretos])
  const vendasSemCliente = (d?.semCliente ?? []).reduce((s, g) => s + g.quantas, 0)

  const adicionar = async () => {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      await salvarCliente({ name: nome.trim(), phone: telefone.trim() || null, estabelecimentoId: null })
      setNome(''); setTelefone(''); await carregar()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao cadastrar') }
    finally { setSalvando(false) }
  }

  const editar = async (c: ClienteCadastro) => {
    const n = prompt('Nome:', c.name)
    if (n === null || !n.trim()) return
    const f = prompt(`WhatsApp de ${n.trim()} (com DDD, pode deixar vazio):`, fone(c.phone))
    if (f === null) return
    try { await salvarCliente({ id: c.id, name: n.trim(), phone: f.trim() || null }); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao salvar') }
  }

  const excluir = async (c: ClienteCadastro) => {
    if (!confirm(`Excluir ${c.name} do cadastro?`)) return
    try { await excluirCliente(c.id); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao excluir') }
  }

  return (
    <div className="space-y-4">
      {/* Cadastrar */}
      <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
        <h3 className="font-display font-bold text-ink mb-1">Cadastrar cliente</h3>
        <p className="text-xs text-ink-2 mb-3">
          Quem compra direto, sem fiado. Na venda, você escolhe da lista: daqui e do fiado
          (esses com o selo). Clientes do fiado se cadastram em Clientes fiado.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={nome} onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
            placeholder="Nome e sobrenome"
            className="flex-1 min-w-0 border border-line rounded-lg px-3 h-10 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
            placeholder="WhatsApp" inputMode="tel"
            className="sm:w-44 min-w-0 border border-line rounded-lg px-3 h-10 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
          <button onClick={adicionar} disabled={salvando || !nome.trim()}
            className="flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-ink font-bold px-4 h-10 rounded-lg text-sm transition-colors disabled:opacity-40 flex-shrink-0">
            <UserPlus size={15} /> Adicionar
          </button>
        </div>
      </div>

      {/* Vendas antigas sem cliente */}
      {vendasSemCliente > 0 && d && (
        <div className="bg-surface rounded-xl border border-line shadow-card">
          <div className="px-4 py-3 border-b border-line">
            <h3 className="font-display font-bold text-ink flex items-center gap-2">
              <Link2 size={16} className="text-brand" />
              Vendas sem cliente
              <span className="text-xs font-semibold text-ink-3 tabular-nums">
                {vendasSemCliente} vendas · {d.semCliente.length} nomes
              </span>
            </h3>
            <p className="text-xs text-ink-2 mt-1">
              Vendas antigas, com o nome digitado à mão. Abra um nome, marque as vendas que são da
              mesma pessoa e ligue ao cliente. Nome igual pode ser gente diferente: ligue só o que tiver certeza.
            </p>
          </div>
          <div className="divide-y divide-line-soft">
            {d.semCliente.map((g) => (
              // a chave muda quando parte das vendas e ligada: o grupo recomeca do zero,
              // sem levar a selecao velha (que religaria vendas ja ligadas)
              <GrupoAntigo key={g.chave + ':' + g.vendas.map((v) => v.id).join(',')} g={g} painel={d}
                aberto={aberto === g.chave}
                onAbrir={() => setAberto(aberto === g.chave ? null : g.chave)}
                onMudou={carregar} />
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-surface rounded-xl border border-line shadow-card">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
          <h3 className="font-display font-bold text-ink flex items-center gap-2">
            <Users size={16} className="text-brand" />
            {diretos.length} cliente{diretos.length === 1 ? '' : 's'}
          </h3>
        </div>
        <div className="p-3 border-b border-line-soft">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..."
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
          </div>
        </div>
        {carregando ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-brand" /></div>
        ) : (
          <div className="divide-y divide-line-soft">
            {filtrados.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 px-4 py-2.5 group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{c.name}</p>
                  <p className="text-[11px] text-ink-3 truncate tabular-nums">
                    {[fone(c.phone),
                      c.vendas ? `${c.vendas} compra${c.vendas === 1 ? '' : 's'}` : 'sem compras',
                      c.ultima && `última ${dataBR(c.ultima)}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {c.vendas > 0 && (
                  <span className="text-sm font-bold text-ink tabular-nums flex-shrink-0">{brl(c.total)}</span>
                )}
                <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editar(c)} title="Editar nome e WhatsApp" aria-label="Editar"
                    className="text-ink-3 hover:text-brand transition-colors p-1"><Pencil size={13} /></button>
                  <button onClick={() => excluir(c)} title="Excluir" aria-label="Excluir"
                    className="text-ink-3 hover:text-danger transition-colors p-1"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {filtrados.length === 0 && (
              <p className="text-sm text-ink-3 text-center py-8">
                {busca ? 'Ninguém com esse nome.' : 'Nenhum cliente direto ainda.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Um nome antigo: abre com as vendas dele para ligar a um cliente. */
function GrupoAntigo({ g, painel, aberto, onAbrir, onMudou }: {
  g: GrupoSemCliente; painel: PainelClientes; aberto: boolean
  onAbrir: () => void; onMudou: () => Promise<void>
}) {
  const dica = useMemo(() => pista(g.nome, painel.estabelecimentos), [g.nome, painel.estabelecimentos])
  const [marcadas, setMarcadas] = useState<Set<number>>(() => new Set(g.vendas.map((v) => v.id)))
  const [cliente, setCliente] = useState<number | null>(null)
  const [ligando, setLigando] = useState(false)

  // abre ja sugerindo: o cliente com o mesmo nome (no fiado da pista, se houver)
  useEffect(() => {
    if (!aberto || cliente !== null) return
    const alvo = normaliza(dica?.nome || g.nome)
    // sem pista do fiado no nome, so sugere cliente direto: o do fiado com o mesmo
    // nome costuma ser outra pessoa (venda geral nao e fiado)
    const iguais = painel.clientes.filter((c) => normaliza(c.name) === alvo &&
      (dica ? c.estabelecimentoId === dica.estab.id : c.estabelecimentoId === null))
    if (iguais.length === 1) setCliente(iguais[0].id)
  }, [aberto])

  /** so as vendas que ainda estao neste grupo (sem cliente) */
  const idsMarcados = () => g.vendas.map((v) => v.id).filter((id) => marcadas.has(id))

  const marcar = (id: number) => {
    const s = new Set(marcadas)
    if (s.has(id)) s.delete(id); else s.add(id)
    setMarcadas(s)
  }

  const ligar = async (id: number) => {
    if (!marcadas.size) return alert('Marque ao menos uma venda')
    setLigando(true)
    try { await ligarVendasCliente(idsMarcados(), id); await onMudou() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao ligar') }
    finally { setLigando(false) }
  }

  /** cadastra e ja liga: direto, ou no fiado da pista */
  const criarELigar = async (nome: string, estabelecimentoId: number | null) => {
    if (!marcadas.size) return alert('Marque ao menos uma venda')
    setLigando(true)
    try {
      const c = await salvarCliente({ name: nome, estabelecimentoId })
      await ligarVendasCliente(idsMarcados(), c.id)
      await onMudou()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao cadastrar') }
    finally { setLigando(false) }
  }

  const escolhido = painel.clientes.find((c) => c.id === cliente)

  return (
    <div>
      <button onClick={onAbrir} aria-expanded={aberto}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-surface-2 transition-colors group">
        <ChevronRight size={14}
          className={`flex-shrink-0 text-ink-3 transition-transform duration-200 ${aberto ? 'rotate-90 text-brand' : ''}`} />
        <span className="text-sm text-ink truncate flex-1 min-w-0 group-hover:text-brand transition-colors">{g.nome}</span>
        {dica && <SeloEstabelecimento nome={dica.estab.nome} titulo="Parece do fiado" />}
        <span className="text-xs text-ink-2 tabular-nums flex-shrink-0">{g.quantas}x</span>
        <span className="text-sm font-bold text-ink tabular-nums flex-shrink-0 w-20 text-right">{brl(g.total)}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-3 pt-1 bg-surface-2 border-t border-line-soft space-y-3 animate-fade-up">
          <div className="space-y-1">
            {g.vendas.map((v) => (
              <label key={v.id} className="flex items-center gap-2.5 text-sm py-1 cursor-pointer">
                <input type="checkbox" checked={marcadas.has(v.id)} onChange={() => marcar(v.id)}
                  className="w-4 h-4 accent-brand flex-shrink-0" />
                <span className="text-[11px] text-ink-3 tabular-nums w-[68px] flex-shrink-0">{dataBR(v.soldAt ?? undefined)}</span>
                <span className="text-ink-2 truncate flex-1 min-w-0">{v.customerName}</span>
                <span className="text-ink font-semibold tabular-nums flex-shrink-0">{brl(v.amount)}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 min-w-0">
              <BuscaCliente clientes={painel.clientes} value={cliente} onChange={setCliente}
                buscaInicial={dica?.nome || g.nome} placeholder="ligar a qual cliente?" />
            </div>
            <button onClick={() => cliente && ligar(cliente)} disabled={!cliente || ligando || !marcadas.size}
              className="flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-ink font-bold px-4 h-10 rounded-lg text-sm transition-colors disabled:opacity-40 flex-shrink-0">
              {ligando ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
              Ligar {marcadas.size} venda{marcadas.size === 1 ? '' : 's'}
              {escolhido ? ` a ${escolhido.name.split(' ')[0]}` : ''}
            </button>
          </div>

          {/* Ninguem no cadastro ainda: cadastra com o nome da venda e ja liga */}
          {!cliente && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {dica && dica.nome && (
                <button onClick={() => criarELigar(dica.nome, dica.estab.id)} disabled={ligando}
                  className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 disabled:opacity-50">
                  <Wand2 size={12} /> Cadastrar "{dica.nome}" no fiado {dica.estab.nome} e ligar
                </button>
              )}
              <button onClick={() => criarELigar((dica?.nome || g.nome).trim(), null)} disabled={ligando}
                className="text-xs font-semibold text-ink-2 hover:text-brand hover:underline inline-flex items-center gap-1 disabled:opacity-50">
                <UserPlus size={12} /> Cadastrar "{(dica?.nome || g.nome).trim()}" como cliente direto e ligar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

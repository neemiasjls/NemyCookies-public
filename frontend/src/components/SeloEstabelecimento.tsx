import { Store } from 'lucide-react'

/**
 * Selo do estabelecimento de fiado: numa venda quitada, diz de onde ela veio;
 * num cliente, diz que ele e do fiado daquele lugar.
 * O nome chega do banco — o codigo nunca guarda nome de estabelecimento.
 */
export default function SeloEstabelecimento({ nome, titulo }: { nome?: string; titulo?: string }) {
  if (!nome) return null
  return (
    <span
      title={titulo ? `${titulo} (${nome})` : `Venda de fiado (${nome}), já quitada`}
      className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-fiado-line bg-fiado-bg text-fiado inline-flex items-center gap-1">
      <Store size={10} strokeWidth={2.5} />
      {nome}
    </span>
  )
}

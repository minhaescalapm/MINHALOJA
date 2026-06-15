import React, { useState, useMemo } from 'react';
import { 
  Package, Search, PlusCircle, Trash2, Edit, CheckSquare, 
  TrendingUp, ArrowDownCircle, Library, HelpCircle, Calendar, DollarSign
} from 'lucide-react';
import { Produto, Pedido, HistoricoEstoque } from '../types';

interface StockManagementProps {
  produtos: Produto[];
  pedidos: Pedido[];
  onUpdateProduto: (id: string, p: Partial<Produto>) => void;
  onAddHistoricoEstoque?: (h: Omit<HistoricoEstoque, 'id' | 'data'>) => void;
}

export default function StockManagement({
  produtos,
  pedidos,
  onUpdateProduto,
}: StockManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nova Entrada form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [novaEntradaQty, setNovaEntradaQty] = useState('');
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [motivoEntrada, setMotivoEntrada] = useState('Compra de Reposição');

  // Inline modification and editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editMin, setEditMin] = useState('');

  // Calculate sold qty for each product dynamically from concluded orders
  const soldQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    pedidos.forEach(p => {
      // Concluded and delivered count as sold
      if (p.status === 'concluido' || p.status === 'entregue') {
        p.itens?.forEach(item => {
          map[item.produto_id] = (map[item.produto_id] || 0) + item.quantidade;
        });
      }
    });
    return map;
  }, [pedidos]);

  // Overall stock analytics
  const totalStockItems = useMemo(() => {
    return produtos.reduce((sum, p) => sum + p.estoque_atual, 0);
  }, [produtos]);

  const totalStockFinancialValue = useMemo(() => {
    return produtos.reduce((sum, p) => sum + (p.estoque_atual * p.preco_custo), 0);
  }, [produtos]);

  const criticalStockCount = useMemo(() => {
    return produtos.filter(p => p.estoque_atual <= p.estoque_minimo).length;
  }, [produtos]);

  // Handle Nova Entrada submission
  const handleAddNewStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Por favor, selecione um produto para a nova entrada!');
      return;
    }
    const qtyToAdd = parseFloat(novaEntradaQty);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      alert('Informe uma quantidade válida e maior que zero para entrada!');
      return;
    }

    const matchedProd = produtos.find(p => p.id === selectedProductId);
    if (!matchedProd) return;

    const updatedQty = matchedProd.estoque_atual + qtyToAdd;
    onUpdateProduto(selectedProductId, {
      estoque_atual: updatedQty
    });

    alert(`Estoque do produto "${matchedProd.nome}" atualizado! Nova quantidade: ${updatedQty} ${matchedProd.unidade_medida}`);
    
    // Reset wizard
    setSelectedProductId('');
    setNovaEntradaQty('');
    setMotivoEntrada('Compra de Reposição');
  };

  // Save inline edit
  const handleSaveInlineEdit = (id: string) => {
    const qtyVal = parseFloat(editQty);
    const minVal = parseFloat(editMin);

    if (isNaN(qtyVal) || qtyVal < 0) {
      alert('Quantidade inválida!');
      return;
    }
    if (isNaN(minVal) || minVal < 0) {
      alert('Mínimo crítico inválido!');
      return;
    }

    onUpdateProduto(id, {
      estoque_atual: qtyVal,
      estoque_minimo: minVal
    });

    setEditingId(null);
    alert('Níveis de estoque e teto atualizados com sucesso!');
  };

  const filteredProdutos = useMemo(() => {
    return produtos.filter(p => {
      const nomeSafe = p.nome || '';
      const catSafe = p.categoria || '';
      return nomeSafe.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
             catSafe.toLowerCase().includes((searchQuery || '').toLowerCase());
    });
  }, [produtos, searchQuery]);

  return (
    <div className="space-y-6" id="stock-module-container">
      {/* Title Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            <span>Painel do Estoque Real Sincronizado</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Valoração em tempo real do estoque baseado em ficha técnica de custos e teto de reposições automatizado.
          </p>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stock-kpis">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-405 font-bold uppercase tracking-wider">Valor Financeiro Total do Estoque</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
              R$ {totalStockFinancialValue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 rounded-xl shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-405 font-bold uppercase tracking-wider">Volume de Itens Cadastrados</span>
            <span className="text-xl font-black text-slate-800 dark:text-white block mt-0.5 font-mono">
              {totalStockItems} unidades
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
          <div className={`p-3 rounded-xl shrink-0 ${criticalStockCount > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-400' : 'bg-emerald-50 text-emerald-650 dark:bg-emerald-955/20'}`}>
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-405 font-bold uppercase tracking-wider">Alerta de Reposição Crítica</span>
            <span className={`text-xl font-black block mt-0.5 ${criticalStockCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600'}`}>
              {criticalStockCount} SKUs Críticos
            </span>
          </div>
        </div>
      </div>

      {/* Stock Replenishment Action wizard (Nova Entrada) */}
      <div className="bg-emerald-50/40 dark:bg-slate-900/40 border border-emerald-100 dark:border-slate-805 rounded-xl p-4 md:p-5 shadow-xs">
        <h3 className="text-xs font-black text-slate-700 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5 mb-4 border-b border-emerald-100/50 dark:border-slate-800/50 pb-2">
          <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
          <span>Fazer Reposição de Estoque (Registrar Nova Entrada)</span>
        </h3>

        <form onSubmit={handleAddNewStock} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Produto para Repositar</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-bold"
            >
              <option value="">-- Selecione o item --</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Atual: {p.estoque_atual} {p.unidade_medida})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Quantidade p/ Adicionar</label>
            <input
              type="number"
              step="any"
              placeholder="Ex: 50"
              value={novaEntradaQty}
              onChange={e => setNovaEntradaQty(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Data de Entrada</label>
            <input
              type="date"
              value={dataEntrada}
              onChange={e => setDataEntrada(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-emerald-500/15 cursor-pointer h-9 shrink-0 flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span>REGISTRAR ENTRADA</span>
          </button>
        </form>
      </div>

      {/* Filter and Table Listing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 shadow-xs">
        <Search className="w-4 h-4 text-slate-405" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por nome do item ou categoria do cardápio..."
          className="w-full text-xs bg-transparent focus:outline-none dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider select-none">
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-right">Data de Entrada</th>
                <th className="p-4 text-right">Quantidade Vendida</th>
                <th className="p-4 text-right">Quantidade Atual</th>
                <th className="p-4 text-right header-financial">Custo Unitório</th>
                <th className="p-4 text-right header-financial">Valor do Estoque</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
              {filteredProdutos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum item do Mix comercial encontrado.
                  </td>
                </tr>
              ) : (
                filteredProdutos.map(p => {
                  const vendida = soldQtyMap[p.id] || 0;
                  const valorEstoque = p.estoque_atual * p.preco_custo;
                  const isCritical = p.estoque_atual <= p.estoque_minimo;
                  const isEditing = editingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                      <td className="p-4 font-bold text-slate-800 dark:text-white">
                        {p.nome}
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.categoria || 'Sem Categoria'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-450 leading-none">
                        {dataEntrada}
                      </td>
                      <td className="p-4 text-right font-mono font-extrabold text-slate-650 dark:text-slate-300">
                        {vendida} {p.unidade_medida}
                      </td>

                      {/* Quantidade Atual Column (Inline Editable) */}
                      <td className="p-4 text-right font-mono">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 items-end">
                            <input
                              type="number"
                              value={editQty}
                              onChange={e => setEditQty(e.target.value)}
                              className="w-16 text-xs text-right bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-900 font-bold"
                            />
                            <span className="text-[8px] text-slate-400 lowercase">Alerta Mínimo:</span>
                            <input
                              type="number"
                              value={editMin}
                              onChange={e => setEditMin(e.target.value)}
                              className="w-16 text-xs text-right bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-900"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className={`font-black ${isCritical ? 'text-red-500 font-extrabold' : 'text-slate-800 dark:text-slate-205'}`}>
                              {p.estoque_atual} {p.unidade_medida}
                            </span>
                            {isCritical && (
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest leading-none mt-0.5 animate-pulse">REPOSITAR</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-350">
                        R$ {p.preco_custo.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono font-extrabold text-slate-800 dark:text-emerald-450">
                        R$ {valorEstoque.toFixed(2)}
                      </td>

                      {/* Management actions (visible buttons) */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveInlineEdit(p.id)}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(p.id);
                                setEditQty(p.estoque_atual.toString());
                                setEditMin(p.estoque_minimo.toString());
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-750 font-bold rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer hover:scale-[1.03]"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Zerar o estoque do produto "${p.nome}"?`)) {
                                onUpdateProduto(p.id, { estoque_atual: 0 });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-955/20 dark:text-rose-450 dark:hover:bg-rose-900/40 font-bold rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer hover:scale-[1.03]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Zerar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

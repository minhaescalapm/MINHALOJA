/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Tag, Search, PlusCircle, Trash2, Edit, Check, HelpCircle, 
  TrendingUp, Activity, Package, AlertTriangle 
} from 'lucide-react';
import { Produto } from '../types';

interface ProductsRegistrationProps {
  produtos: Produto[];
  onAddProduto: (p: Omit<Produto, 'id'>) => void;
  onUpdateProduto: (id: string, p: Partial<Produto>) => void;
  onDeleteProduto: (id: string) => void;
}

export default function ProductsRegistration({
  produtos,
  onAddProduto,
  onUpdateProduto,
  onDeleteProduto,
}: ProductsRegistrationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Editing and Inserting states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);

  // Form field states
  const [pNome, setpNome] = useState('');
  const [pCat, setpCat] = useState('');
  const [pPrecoVenda, setpPrecoVenda] = useState('');
  const [pPrecoCusto, setpPrecoCusto] = useState('');
  const [pEstoque, setpEstoque] = useState('');
  const [pEstoqueMin, setpEstoqueMin] = useState('');
  const [pUnidade, setpUnidade] = useState('un');

  // Live Calculations helper
  const liveLucroCusto = useMemo(() => {
    const venda = parseFloat(pPrecoVenda) || 0;
    const custo = parseFloat(pPrecoCusto) || 0;
    return Math.max(0, venda - custo);
  }, [pPrecoVenda, pPrecoCusto]);

  const liveMargemLucro = useMemo(() => {
    const venda = parseFloat(pPrecoVenda) || 0;
    const custo = parseFloat(pPrecoCusto) || 0;
    if (venda <= 0) return 0;
    return ((venda - custo) / venda) * 100;
  }, [pPrecoVenda, pPrecoCusto]);

  const liveMarkup = useMemo(() => {
    const venda = parseFloat(pPrecoVenda) || 0;
    const custo = parseFloat(pPrecoCusto) || 0;
    if (custo <= 0) return 0;
    return ((venda - custo) / custo) * 100;
  }, [pPrecoVenda, pPrecoCusto]);

  // Reset form helper
  const resetFormValues = () => {
    setEditingId(null);
    setIsInserting(false);
    setpNome('');
    setpCat('');
    setpPrecoVenda('');
    setpPrecoCusto('');
    setpEstoque('');
    setpEstoqueMin('');
    setpUnidade('un');
  };

  const handleEditTrigger = (p: Produto) => {
    setEditingId(p.id);
    setIsInserting(false);
    setpNome(p.nome);
    setpCat(p.categoria);
    setpPrecoVenda(p.preco_venda.toString());
    setpPrecoCusto(p.preco_custo.toString());
    setpEstoque(p.estoque_atual.toString());
    setpEstoqueMin(p.estoque_minimo.toString());
    setpUnidade(p.unidade_medida);
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nome: pNome.trim(),
      categoria: pCat.trim() || 'Outros',
      preco_venda: parseFloat(pPrecoVenda) || 0,
      preco_custo: parseFloat(pPrecoCusto) || 0,
      estoque_atual: parseInt(pEstoque) || 0,
      estoque_minimo: parseInt(pEstoqueMin) || 0,
      unidade_medida: pUnidade
    };

    if (!payload.nome) {
      alert("Informe o nome do produto!");
      return;
    }

    if (payload.preco_venda < 0 || payload.preco_custo < 0) {
      alert("Os preços não podem ser negativos!");
      return;
    }

    if (editingId) {
      onUpdateProduto(editingId, payload);
    } else {
      onAddProduto(payload);
    }

    resetFormValues();
    alert("Produto salvo com sucesso!");
  };

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    const list = produtos.map(p => p.categoria);
    return Array.from(new Set(list)).filter(Boolean);
  }, [produtos]);

  // Filter list of products
  const filteredProducts = useMemo(() => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.categoria.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || p.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [produtos, searchQuery, categoryFilter]);

  // General Statistics helpers
  const totalSkuCount = produtos.length;
  const lowStockCount = useMemo(() => {
    return produtos.filter(p => p.estoque_atual <= p.estoque_minimo).length;
  }, [produtos]);

  const avgProfitMargin = useMemo(() => {
    const validProds = produtos.filter(p => p.preco_venda > 0);
    if (validProds.length === 0) return 0;
    const sumMargins = validProds.reduce((sum, p) => {
      const margin = ((p.preco_venda - p.preco_custo) / p.preco_venda) * 100;
      return sum + margin;
    }, 0);
    return sumMargins / validProds.length;
  }, [produtos]);

  return (
    <div className="space-y-6" id="produtos-dashboard-container">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            <span>Cadastro do Mix de Produtos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão inteligente de compras, margem de markup na venda, regras de teto e controlador de estoque crítico.
          </p>
        </div>

        <button 
          onClick={() => {
            resetFormValues();
            setIsInserting(true);
          }}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Stats Board Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total de Itens (SKUs)</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white block mt-0.5">{totalSkuCount} produtos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Estoque Crítico / Baixo</span>
            <span className={`text-xl font-extrabold block mt-0.5 ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {lowStockCount} Alertas Ativos
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Margem de Lucro Média</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-405 block mt-0.5">{avgProfitMargin.toFixed(1)}% / item</span>
          </div>
        </div>
      </div>

      {/* Editing / Inserting Dynamic Inline Panel */}
      {(editingId || isInserting) && (
        <div className="bg-emerald-50/40 dark:bg-slate-900/40 border border-emerald-100 dark:border-slate-850 rounded-2xl p-4 md:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-3 mb-5">
            <h4 className="font-extrabold text-emerald-900 dark:text-emerald-405 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>{editingId ? '🖊️ Editar Ficha Técnica do Produto' : '✨ Cadastrar Novo Produto Comercial'}</span>
            </h4>
            <button 
              onClick={resetFormValues}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-305 font-bold px-3 py-1 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-750"
            >
              Cancelar Edição
            </button>
          </div>

          <form onSubmit={handleOnSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Product Basic Info */}
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome Comercial do Produto</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Cerveja Original 600ml, Frango à Passarinho" 
                  value={pNome} 
                  onChange={e => setpNome(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Categoria</label>
                <input 
                  type="text" 
                  placeholder="Ex: Bebidas, Salgados, Porções" 
                  value={pCat} 
                  onChange={e => setpCat(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Unidade de Medida</label>
                <select 
                  value={pUnidade} 
                  onChange={e => setpUnidade(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-semibold"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="lt">Litro (lt)</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="dose">Dose (dose)</option>
                </select>
              </div>

              {/* Financial Inputs: Cost & Sale pricing */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Preço de Custo (Compra) R$</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0,00" 
                  value={pPrecoCusto} 
                  onChange={e => setpPrecoCusto(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono font-bold text-slate-800 dark:text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Preço de Venda R$</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0,00" 
                  value={pPrecoVenda} 
                  onChange={e => setpPrecoVenda(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono font-bold text-emerald-600 dark:text-emerald-400" 
                />
              </div>

              {/* Stock settings */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Estoque Inicial Atual</label>
                <input 
                  type="number" 
                  required 
                  placeholder="Ex: 50" 
                  value={pEstoque} 
                  onChange={e => setpEstoque(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono" 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Estoque Mínimo (Alerta)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="Ex: 10" 
                  value={pEstoqueMin} 
                  onChange={e => setpEstoqueMin(e.target.value)} 
                  className="w-full text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono" 
                />
              </div>
            </div>

            {/* LIVE CALCULATED FEEDBACK AREA */}
            <div className="bg-slate-100/60 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-850 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Retorno de Custos e Margens (Indicador Dinâmico)</span>
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Custo do Produto:</span>
                    <strong className="font-mono text-slate-800 dark:text-white">R$ {(parseFloat(pPrecoCusto) || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Preço de Venda Balcão:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">R$ {(parseFloat(pPrecoVenda) || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:border-l border-slate-200 dark:border-slate-800 sm:pl-4 justify-center gap-1.5">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                  <span className="text-slate-500">Valor do Lucro Líquido:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    R$ {liveLucroCusto.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                  <span className="text-slate-500">Margem Comercial:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {liveMargemLucro.toFixed(1)}% <span className="text-[10px] text-slate-400 font-medium">L/V</span>
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                  <span className="text-slate-500">Markup (Sobre o Custo):</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +{liveMarkup.toFixed(1)}% <span className="text-[10px] text-slate-400 font-medium">M/C</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3.5 border-t border-slate-200 dark:border-slate-800 pt-3.5">
              <button 
                type="button" 
                onClick={resetFormValues} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Descartar Mudanças
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10"
              >
                Gravar Configuração Técnica
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product List filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Buscar por nome do produto ou categoria..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:outline-emerald-500 dark:text-white font-semibold"
            >
              <option value="">Filtrar: Todas Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabular data listing of commercial products */}
        <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-sans">
                <tr>
                  <th className="text-left p-3.5">Ficha / Identificação</th>
                  <th className="text-right p-3.5">Preço Custo (R$)</th>
                  <th className="text-right p-3.5">Preço Venda (R$)</th>
                  <th className="text-center p-3.5">Lucro Unitário</th>
                  <th className="text-center p-3.5">Margem (LV)</th>
                  <th className="text-center p-3.5">Markup (MC)</th>
                  <th className="text-center p-3.5">Status Estoque</th>
                  <th className="text-right p-3.5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-110 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredProducts.map(p => {
                  const lucroUnitario = p.preco_venda - p.preco_custo;
                  const marginLv = p.preco_venda > 0 ? (lucroUnitario / p.preco_venda) * 100 : 0;
                  const markupMc = p.preco_custo > 0 ? (lucroUnitario / p.preco_custo) * 100 : 0;
                  const isLow = p.estoque_atual <= p.estoque_minimo;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-800 dark:text-white block text-sm">{p.nome}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium block mt-0.5 uppercase tracking-wider">{p.categoria}</span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-500 dark:text-slate-400 font-mono">R$ {p.preco_custo.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white font-mono">R$ {p.preco_venda.toFixed(2)}</td>
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          R$ {lucroUnitario.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {marginLv.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-605 dark:text-emerald-450 font-mono">
                        +{markupMc.toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                          p.estoque_atual <= 0 
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-black animate-pulse' 
                            : isLow 
                              ? 'bg-amber-50 text-amber-705 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-black' 
                              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30'
                        }`}>
                          {p.estoque_atual} {p.unidade_medida}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleEditTrigger(p)} 
                            className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[10px]"
                            title="Editar especificações"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Editar</span>
                          </button>
                          <button 
                            onClick={() => { 
                              if (confirm(`Deseja realmente deletar o produto: ${p.nome}?`)) {
                                onDeleteProduto(p.id);
                              } 
                            }} 
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-lg transition-all inline-flex items-center gap-1 font-bold text-[10px]"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Deletar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-400 italic">
                      Nenhum produto cadastrado coincide com a pesquisa/filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

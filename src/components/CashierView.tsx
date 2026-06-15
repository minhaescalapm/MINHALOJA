/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, ShoppingCart, User, Plus, Minus, Trash2, Search, 
  Printer, Coins, ArrowUpRight, ArrowDownLeft, AlertCircle, FileText, 
  Check, Calendar, RefreshCcw, Tag
} from 'lucide-react';
import { Funcionario, Cliente, Produto, CaixaDiario, MovimentacaoCaixa, Pedido } from '../types';

interface CashierViewProps {
  produtos: Produto[];
  clientes: Cliente[];
  funcionarios: Funcionario[];
  caixas: CaixaDiario[];
  movimentacoes: MovimentacaoCaixa[];
  onOpenCaixa: (valorInicial: number, fId: string) => void;
  onCloseCaixa: (valorFinal: number) => void;
  onAddMovimentacao: (mov: Omit<MovimentacaoCaixa, 'id' | 'data'>) => void;
  onRegisterSale: (
    tipoPedido: 'balcao' | 'entrega' | 'mesa',
    funcionarioId: string,
    clienteId: string | undefined,
    itens: { produtoId: string; quantidade: number; precoUnitario: number }[],
    formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado',
    dataPrometidaFiado?: string
  ) => { success: boolean; error?: string; receiptData?: any };
  activeCaixa: CaixaDiario | undefined;
  tenantName: string;
  onAddClientQuick: (newClient: Omit<Cliente, 'id' | 'data_cadastro'>) => string;
}

export default function CashierView({
  produtos,
  clientes,
  funcionarios,
  caixas,
  movimentacoes,
  onOpenCaixa,
  onCloseCaixa,
  onAddMovimentacao,
  onRegisterSale,
  activeCaixa,
  tenantName,
  onAddClientQuick,
}: CashierViewProps) {
  // Cashier opening/closing modal states
  const [openRegisterStartingCash, setOpenRegisterStartingCash] = useState<number>(200);
  const [selectedCashierEmployee, setSelectedCashierEmployee] = useState<string>(
    funcionarios.find(f => f.cargo === 'caixa' || f.cargo === 'admin')?.id || ''
  );
  
  // Suprimento/Sangria states
  const [showFlowModal, setShowFlowModal] = useState<'suprimento' | 'sangria' | null>(null);
  const [flowValue, setFlowValue] = useState<string>('');
  const [flowDesc, setFlowDesc] = useState<string>('');

  // Cart/Sale states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cartItems, setCartItems] = useState<{ produto: Produto; quantidade: number }[]>([]);
  const [selectedClientForSale, setSelectedClientForSale] = useState<string>('');
  const [selectedSellerForSale, setSelectedSellerForSale] = useState<string>(
    funcionarios.find(f => f.cargo === 'caixa' || f.cargo === 'admin')?.id || ''
  );
  
  // For Fiado checkout
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado'>('dinheiro');
  const [fiadoDueDate, setFiadoDueDate] = useState<string>(() => {
    // Current date + 15 days
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // Printer view mockup
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Quick Client modal states
  const [showQuickClientModal, setShowQuickClientModal] = useState<boolean>(false);
  const [quickClientNome, setQuickClientNome] = useState('');
  const [quickClientTelefone, setQuickClientTelefone] = useState('');
  const [quickClientEndereco, setQuickClientEndereco] = useState('');
  const [quickClientReferencia, setQuickClientReferencia] = useState('');
  const [quickClientPaymentPref, setQuickClientPaymentPref] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado'>('dinheiro');

  // Brazil phone format utility
  const formatBrazilPhone = (v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
  };

  // Filter products
  const categories = useMemo(() => {
    const list = Array.from(new Set(produtos.map(p => p.categoria)));
    return ['Todos', ...list];
  }, [produtos]);

  const filteredProducts = useMemo(() => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [produtos, searchTerm, selectedCategory]);

  // Sums for active register
  const activeCaixaMovements = useMemo(() => {
    if (!activeCaixa) return [];
    return movimentacoes.filter(m => m.caixa_id === activeCaixa.id);
  }, [movimentacoes, activeCaixa]);

  const stats = useMemo(() => {
    if (!activeCaixa) return { totalEntradas: 0, totalSaidas: 0, saldoFinalEst: 0 };
    let entradas = activeCaixa.valor_inicial;
    let saidas = 0;

    activeCaixaMovements.forEach(m => {
      if (m.id === 'mov-1') return; // ignore initial open transaction as we added it to start
      if (m.tipo === 'entrada' && m.status_pagamento === 'pago') {
        entradas += m.valor;
      } else if (m.tipo === 'saida') {
        saidas += m.valor;
      }
    });

    return {
      totalEntradas: entradas,
      totalSaidas: saidas,
      saldoFinalEst: entradas - saidas
    };
  }, [activeCaixa, activeCaixaMovements]);

  // Cart operations
  const addToCart = (product: Produto) => {
    if (product.estoque_atual <= 0) {
      alert(`Produto ${product.nome} está sem estoque! Cadastre uma entrada antes.`);
      return;
    }
    const existing = cartItems.find(item => item.produto.id === product.id);
    if (existing) {
      if (existing.quantidade >= product.estoque_atual) {
        alert(`Estoque máximo atingido (${product.estoque_atual} un)!`);
        return;
      }
      setCartItems(cartItems.map(item => 
        item.produto.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { produto: product, quantidade: 1 }]);
    }
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.produto.id === productId) {
          const newQty = item.quantidade + delta;
          if (newQty <= 0) return null;
          if (newQty > item.produto.estoque_atual) {
            alert(`Estoque máximo atingido (${item.produto.estoque_atual} un)!`);
            return item;
          }
          return { ...item, quantidade: newQty };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.produto.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.produto.preco_venda * item.quantidade), 0);
  }, [cartItems]);

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Adicione itens ao carrinho primeiro!");
      return;
    }

    if (paymentMethod === 'fiado' && !selectedClientForSale) {
      alert("ERRO: Venda na modalidade FIADO exige a seleção de um Cliente cadastrado!");
      return;
    }

    const itemPayload = cartItems.map(item => ({
      produtoId: item.produto.id,
      quantidade: item.quantidade,
      precoUnitario: item.produto.preco_venda
    }));

    const result = onRegisterSale(
      'balcao',
      selectedSellerForSale,
      selectedClientForSale || undefined,
      itemPayload,
      paymentMethod,
      paymentMethod === 'fiado' ? fiadoDueDate : undefined
    );

    if (result.success) {
      setReceiptData(result.receiptData);
      setCartItems([]);
      setSelectedClientForSale('');
      setShowReceiptModal(true);
    } else {
      alert(result.error || "Erro ao registrar venda");
    }
  };

  // Suprimento/Sangria
  const triggerFlow = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(flowValue);
    if (isNaN(val) || val <= 0) {
      alert("Informe um valor numérico válido maior que zero!");
      return;
    }
    if (!activeCaixa) return;

    onAddMovimentacao({
      caixa_id: activeCaixa.id,
      tipo: showFlowModal === 'suprimento' ? 'entrada' : 'saida',
      valor: val,
      forma_pagamento: 'dinheiro',
      status_pagamento: 'pago',
      descricao: flowDesc || `${showFlowModal === 'suprimento' ? 'Suprimento manual' : 'Sangria de caixa'}`
    });

    setFlowValue('');
    setFlowDesc('');
    setShowFlowModal(null);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="cashier-view-dashboard">
      
      {/* 1. CAIXA DIÁRIO STATE - TOP BAR CONTAINER */}
      <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${activeCaixa ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-lg">Caixa Diário de Operações</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeCaixa ? 'bg-emerald-150 text-emerald-700' : 'bg-rose-150 text-rose-700'
              }`}>
                {activeCaixa ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCaixa 
                ? `Aberto em ${new Date(activeCaixa.data_abertura).toLocaleDateString()} às ${new Date(activeCaixa.data_abertura).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})} por Carlos Souza` 
                : 'Abra o caixa para habilitar as vendas PDV de balcão, entregas e fechamentos.'}
            </p>
          </div>
        </div>

        {activeCaixa ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 mr-2">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">SALDO EM CAIXA (ESTIMADO)</span>
                <span className="text-sm font-bold text-slate-800">R$ {stats.saldoFinalEst.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowFlowModal('suprimento')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Suprimento (+ Troco)</span>
            </button>

            <button 
              onClick={() => setShowFlowModal('sangria')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
              <span>Sangria (- Retirada)</span>
            </button>

            <button 
              onClick={() => {
                if(confirm(`Confirmar o Fechamento do Caixa?\nSaldo Final Estimado: R$ ${stats.saldoFinalEst.toFixed(2)}`)) {
                  onCloseCaixa(stats.saldoFinalEst);
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              Fechar Caixa
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-rose-50/50 border border-rose-100 rounded-lg p-2.5 md:p-1.5 pl-4 flex-col sm:flex-row w-full md:w-auto">
            <div className="text-left w-full sm:w-auto">
              <span className="text-xs font-semibold text-rose-800 block">Iniciar Dia de Trabalho</span>
              <div className="flex items-center gap-2 mt-1">
                <label className="text-[10px] text-slate-500 whitespace-nowrap">Troco Inicial: R$</label>
                <input 
                  type="number" 
                  value={openRegisterStartingCash} 
                  onChange={e => setOpenRegisterStartingCash(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono font-semibold focus:outline-indigo-500"
                />
              </div>
            </div>
            <button 
              onClick={() => {
                if (openRegisterStartingCash < 0) {
                  alert("O troco inicial não pode ser negativo.");
                  return;
                }
                const testEmp = funcionarios.find(f => f.cargo === 'caixa' || f.cargo === 'admin');
                onOpenCaixa(openRegisterStartingCash, testEmp?.id || 'f-1');
              }}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              Abrir Caixa Diário
            </button>
          </div>
        )}
      </div>

      {activeCaixa ? (
        <>
          {/* 2. CATALOGUE & PRODUCT SELECTOR - LEFT COLUMN */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-[680px]">
            {/* Search and category filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  placeholder="Buscar por cerveja, pastel, porção, refrigerante..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pb-1 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-slate-105 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredProducts.map(prod => {
                const isLowEstoque = prod.estoque_atual <= prod.estoque_minimo;
                const isOutOfStock = prod.estoque_atual <= 0;
                
                return (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    disabled={isOutOfStock}
                    className={`group text-left border rounded-xl p-3.5 transition-all flex flex-col justify-between h-36 ${
                      isOutOfStock 
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50' 
                        : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md hover:translate-y-[-1px]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">{prod.categoria}</span>
                        {isOutOfStock ? (
                          <span className="text-[9px] font-extrabold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">SEM ESTOQUE</span>
                        ) : isLowEstoque ? (
                          <span className="text-[9px] font-extrabold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ESTOQUE BAIXO</span>
                        ) : null}
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-1.5 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {prod.nome}
                      </h4>
                    </div>

                    <div className="flex items-end justify-between mt-2.5 pt-2 border-t border-slate-55">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">Preço</span>
                        <span className="text-sm font-black text-slate-900">R$ {prod.preco_venda.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {prod.estoque_atual} {prod.unidade_medida}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                  <Tag className="w-10 h-10 mb-2 stroke-1" />
                  <p className="text-sm font-semibold">Nenhum produto correspondente</p>
                  <p className="text-xs text-slate-400 mt-1">Experimente buscar por outros termos ou limpe o filtro.</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. PDV SHOPPING CART & FEES - RIGHT COLUMN */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-[680px]">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Carrinho PDV Balcão</h3>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-mono font-bold px-2.5 py-0.5 rounded-full">
                {cartItems.reduce((acc, item) => acc + item.quantidade, 0)} itens
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {cartItems.map(item => (
                <div key={item.produto.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.produto.nome}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      R$ {item.produto.preco_venda.toFixed(2)} un x {item.quantidade}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Controls quantity */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-xs">
                      <button 
                        onClick={() => updateCartQuantity(item.produto.id, -1)}
                        className="p-1 hover:bg-slate-50 text-slate-500 rounded-l-md transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 py-0.5 text-xs font-bold text-slate-800 font-mono text-center min-w-[24px]">
                        {item.quantidade}
                      </span>
                      <button 
                        onClick={() => updateCartQuantity(item.produto.id, 1)}
                        className="p-1 hover:bg-slate-50 text-slate-500 rounded-r-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.produto.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <ShoppingCart className="w-12 h-12 mb-3 text-slate-300 stroke-1" />
                  <p className="text-xs font-bold text-slate-500">O carrinho está vazio</p>
                  <p className="text-[11px] text-slate-400 text-center max-w-[200px] mt-1">Toque nos produtos ao lado para iniciar um fechamento de venda.</p>
                </div>
              )}
            </div>

            {/* Sale customization & properties */}
            <div className="border-t border-slate-100 pt-3.5 space-y-3 bg-slate-50/55 p-3 rounded-xl border border-slate-150 mb-3 text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. SELLER (vendedor) */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Operador / Vendedor</label>
                  <select
                    value={selectedSellerForSale}
                    onChange={e => setSelectedSellerForSale(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 font-semibold focus:outline-indigo-500"
                  >
                    {funcionarios.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>

                {/* 2. CLIENT (cliente) + QUICK REGISTER BUTTON */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Cliente Consumidor</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickClientModal(true)}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 bg-indigo-50 hover:bg-indigo-105 px-2 py-0.5 rounded-md transition-all border border-indigo-100 shrink-0 select-none cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-indigo-600" />
                      <span>+ Cliente Rápido</span>
                    </button>
                  </div>
                  <select
                    value={selectedClientForSale}
                    onChange={e => setSelectedClientForSale(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 font-semibold focus:outline-indigo-500"
                  >
                    <option value="">-- Consumidor Padrão --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} (Limite: R${c.limite_fiado.toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PAYMENT TYPE CHANGER */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Meio de Recebimento</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'dinheiro', label: 'Dinheiro' },
                    { id: 'pix', label: 'PIX (Instant)' },
                    { id: 'debito', label: 'Débito 💳' },
                    { id: 'credito', label: 'Crédito' },
                    { id: 'fiado', label: 'Fazer Fiado 🔴' },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`py-1.5 border rounded-lg text-xs font-bold text-center transition-all ${
                        paymentMethod === method.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IF FIADO SELECTED, REQUIRE PROMISED DATE & VALIDATION */}
              {paymentMethod === 'fiado' && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Regra de Segurança de Fiado Ativa:</p>
                      <p className="text-[10px] text-rose-700 mt-0.5">
                        Esta fatura NÃO entrará no caixa imediato. Será gerado um débito em <strong>Contas a Receber</strong> vinculado ao cliente.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-rose-900 block mb-1">Prometido Pagamento até:</label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute left-2 top-2 text-rose-600" />
                      <input 
                        type="date"
                        value={fiadoDueDate}
                        onChange={e => setFiadoDueDate(e.target.value)}
                        className="w-full bg-white border border-rose-300 rounded px-2 py-1 pl-7 text-xs text-slate-800 font-semibold font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total breakdown */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Subtotal dos itens</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Taxa sobre venda (0%)</span>
                <span>R$ 0.00</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                <span>VALOR TOTAL</span>
                <span className="text-xl">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Venda Button */}
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 ${
                cartItems.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-indigo-650 hover:bg-indigo-600 text-white hover:shadow-md'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirmar e Registrar Venda (R$ {cartTotal.toFixed(2)})</span>
            </button>
          </div>
        </>
      ) : (
        <div className="lg:col-span-12 bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
          <AlertCircle className="w-12 h-12 text-indigo-500/80 mx-auto stroke-1 mb-3" />
          <h4 className="font-bold text-slate-800 text-base">Módulo de PDV e Checkout Bloqueado</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Por regras de compliance financeiro, as funcionalidades de fechamento de venda rápida, sangria, suprimento e recibos térmicos só são liberadas após a <strong>Abertura Oficial de Caixa Diário</strong>.
          </p>
          <button 
            onClick={() => {
              const testEmp = funcionarios.find(f => f.cargo === 'caixa' || f.cargo === 'admin');
              onOpenCaixa(200, testEmp?.id || 'f-1');
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
          >
            Abrir Caixa com R$ 200,00 padrão
          </button>
        </div>
      )}

      {/* 4. MODALS FOR FLOW COINS & THERMAL RECEIPT DISPLAY */}
      {showFlowModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-2xl text-slate-800">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-3">
              {showFlowModal === 'suprimento' ? (
                <>
                  <Coins className="text-emerald-500 w-5 h-5 animate-bounce" />
                  <span>Registrar Suprimento (Entrada de Troco)</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="text-rose-500 w-5 h-5 animate-pulse" />
                  <span>Registrar Sangria (Retirada Física)</span>
                </>
              )}
            </h3>
            
            <form onSubmit={triggerFlow} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Qual o valor monetário? (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={flowValue}
                    onChange={e => setFlowValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 pl-8 text-slate-800 font-mono font-bold focus:outline-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Motivo / Descrição detalhada</label>
                <textarea
                  required
                  rows={2}
                  placeholder={showFlowModal === 'suprimento' ? 'Ex: Troco para moedas e notas de 2 reais' : 'Ex: Pagamento urgente de motoboy autônomo'}
                  value={flowDesc}
                  onChange={e => setFlowDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFlowValue('');
                    setFlowDesc('');
                    setShowFlowModal(null);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 font-bold text-xs rounded-lg text-white transition-colors shadow-sm ${
                    showFlowModal === 'suprimento' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {showFlowModal === 'suprimento' ? 'Adicionar Saldo' : 'Confirmar Retirada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THERMAL PRINT MOCKUP MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-md w-full shadow-2xl text-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-500" />
                Emulador de Impressora Térmica
              </h4>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1 rounded"
              >
                Voltar
              </button>
            </div>

            {/* Recibo Térmico Real layout */}
            <div className="flex-1 overflow-y-auto bg-amber-50/20 p-4 border border-dashed border-amber-200 rounded-xl font-mono text-xs text-slate-800 flex flex-col items-center">
              <div id="print-thermal-content" className="w-[280px] p-2 leading-relaxed bg-white">
                {/* 1. TOPO: EXCLUSIVAMENTE O NOME DO COMERCIO */}
                <p className="text-center font-black text-sm uppercase tracking-wider">{tenantName || 'CANTINA & BAR'}</p>
                
                {/* 2. ABAIXO DO NOME: ENDEREÇO E TELEFONE */}
                <p className="text-center text-[10px] text-slate-600 mt-0.5">Rua das Flores, 125, Centro, SP | Tel: (11) 99999-9999</p>
                
                <p className="border-b border-dashed border-slate-350 my-1.5"></p>
                
                {/* 3. ABAIXO DO TELEFONE: NOME DO CLIENTE */}
                <p className="text-left text-[10px] text-slate-800">
                  <span className="font-bold">CLIENTE:</span> {receiptData.cliente_id ? (clientes.find(c => c.id === receiptData.cliente_id)?.nome) : 'Consumidor Final Padrão'}
                </p>
                
                {/* 4. ABAIXO DO CLIENTE: DATA E HORA */}
                <p className="text-left text-[10px] text-slate-800">
                  <span className="font-bold">DATA & HORA:</span> {new Date(receiptData.data_pedido).toLocaleDateString()} às {new Date(receiptData.data_pedido).toLocaleTimeString()}
                </p>
                
                <p className="border-b border-dashed border-slate-350 my-1.5"></p>
                
                {/* ITENS DO PEDIDO */}
                <table className="w-full text-[10px] text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-0.5">PROD</th>
                      <th className="text-center py-0.5">QTD</th>
                      <th className="text-right py-0.5 font-bold">STOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.itens?.map((item: any) => {
                      const prodName = produtos.find(p => p.id === item.produto_id)?.nome || 'Item Desconhecido';
                      return (
                        <tr key={item.id}>
                          <td className="py-1 pr-1 truncate max-w-[120px]">{prodName}</td>
                          <td className="py-1 text-center font-bold">{item.quantidade}x</td>
                          <td className="py-1 text-right font-semibold">R$ {item.subtotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* TOTAL */}
                <p className="border-b border-dashed border-slate-350 my-1.5"></p>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between font-semibold">
                    <span>FORMA DE PAGTO:</span>
                    <span className="uppercase">{receiptData.formaPagamento}</span>
                  </div>
                  {receiptData.formaPagamento === 'fiado' && receiptData.dataPrometidaFiado && (
                    <div className="text-[10px] bg-yellow-50 text-amber-800 p-1 border border-yellow-250 rounded font-bold text-center">
                      Vence em: {new Date(receiptData.dataPrometidaFiado + 'T12:00:00').toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-[11px] pt-1">
                    <span>VALOR PAGO TOTAL:</span>
                    <span>R$ {receiptData.valor_total?.toFixed(2)}</span>
                  </div>
                </div>

                <p className="border-b border-dashed border-slate-350 my-1.5"></p>
                
                {/* ATENDENTE */}
                <p className="text-center text-[10px] text-slate-650">
                  Vendedor/Atendente: {funcionarios.find(f => f.id === receiptData.funcionario_id)?.nome || 'Caixa Central'}
                </p>
                
                {/* FINAL DO RECIBO: TEXTO OBRIGATORIO */}
                <p className="text-center text-[10px] font-bold text-slate-850 mt-2 font-sans italic leading-tight">
                  OBRIGADO PELA PREFERENCIA, ESTAREMOS SEMPRE A DISPOSIÇÃO.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200"
              >
                Retornar ao PDV
              </button>
              <button
                type="button"
                onClick={printReceipt}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo (80mm)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CLIENT REGISTRATION MODAL */}
      {showQuickClientModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-md w-full shadow-2xl text-slate-850">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span>+ Cadastrar Cliente Rápido</span>
              </h4>
              <button 
                onClick={() => setShowQuickClientModal(false)}
                className="text-xs bg-slate-100 hover:bg-slate-250 font-bold px-2 py-1 rounded"
              >
                Fechar
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickClientNome.trim() || !quickClientTelefone.trim()) {
                  alert("Nome e Telefone são obrigatórios!");
                  return;
                }
                const newId = onAddClientQuick({
                  nome: quickClientNome,
                  telefone: quickClientTelefone,
                  endereco: quickClientEndereco || 'Não informado',
                  referencia: quickClientReferencia || 'Não informado',
                  forma_pagamento_preferida: quickClientPaymentPref,
                  limite_fiado: 300, // Safe default limits
                });
                
                // Select newly registered client
                setSelectedClientForSale(newId);
                
                // Reset form & close
                setQuickClientNome('');
                setQuickClientTelefone('');
                setQuickClientEndereco('');
                setQuickClientReferencia('');
                setQuickClientPaymentPref('dinheiro');
                setShowQuickClientModal(false);
              }}
              className="space-y-4 text-xs text-slate-700 font-sans"
            >
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={quickClientNome}
                  onChange={e => setQuickClientNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (11) 99999-9999"
                  value={quickClientTelefone}
                  onChange={e => setQuickClientTelefone(formatBrazilPhone(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-semibold focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Endereço de Entrega</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro"
                  value={quickClientEndereco}
                  onChange={e => setQuickClientEndereco(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Ponto de Referência</label>
                <input
                  type="text"
                  placeholder="Perto do mercado, portão azul"
                  value={quickClientReferencia}
                  onChange={e => setQuickClientReferencia(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Forma de Pagamento Preferida</label>
                <select
                  value={quickClientPaymentPref}
                  onChange={e => setQuickClientPaymentPref(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-800 font-semibold focus:outline-indigo-500 hover:bg-slate-100"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="fiado">Fiado</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold rounded-lg transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 font-black rounded-lg text-white transition-colors shadow-sm"
                >
                  Salvar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

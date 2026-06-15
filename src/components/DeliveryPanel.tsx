/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Truck, ArrowRight, User, MapPin, CheckCircle, Clock, 
  PlusCircle, Search, Sparkles, Coins, Trash2, Plus, Minus,
  DollarSign, AlertTriangle, Check
} from 'lucide-react';
import { Pedido, Cliente, Produto } from '../types';

interface DeliveryPanelProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  produtos: Produto[];
  onUpdatePedidoStatus: (pedidoId: string, status: Pedido['status']) => void;
  onDispatchDelivery: (pedidoId: string, driverName: string) => void;
  
  // Caixa Delivery
  caixaDeliveryStatus: 'aberto' | 'fechado';
  caixaDeliveryValorInicial: number;
  caixaDeliveryVendasConcluidas: number;
  onOpenCaixaDelivery: (valorInicial: number) => void;
  onCloseCaixaDelivery: () => void;
  onAddDeliveryPedido: (clienteId: string, items: { produtoId: string; quantidade: number }[]) => void;
}

export default function DeliveryPanel({
  pedidos,
  clientes,
  produtos,
  onUpdatePedidoStatus,
  onDispatchDelivery,
  caixaDeliveryStatus,
  caixaDeliveryValorInicial,
  caixaDeliveryVendasConcluidas,
  onOpenCaixaDelivery,
  onCloseCaixaDelivery,
  onAddDeliveryPedido,
}: DeliveryPanelProps) {
  // Navigation between list of orders and creating a new order
  const [activeSubTab, setActiveSubTab] = useState<'entregas' | 'novo_pedido'>('entregas');
  
  // Status filter for current deliveries list
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  
  // Motoboy assignment inputs
  const [newDriverMap, setNewDriverMap] = useState<{ [pedId: string]: string }>({});

  // Inline iframe-safe confirmation states for concluding sales
  const [confirmingSaleId, setConfirmingSaleId] = useState<string | null>(null);

  // Opening Daily Caixa Delivery states
  const [openingInput, setOpeningInput] = useState<string>('50');

  // --- NEW ORDER FORM STATES ---
  const [clientSearch, setClientSearch] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [cart, setCart] = useState<{ produto: Produto; quantidade: number }[]>([]);

  // Calculate totals currently in Delivery Drawer
  const totalInDrawer = caixaDeliveryValorInicial + caixaDeliveryVendasConcluidas;

  const deliveryPedidos = pedidos.filter(p => p.tipo_pedido === 'entrega');

  const filteredDeliveries = deliveryPedidos.filter(p => {
    if (filterStatus === 'Todos') return true;
    return p.status === filterStatus.toLowerCase();
  });

  const getStatusBadge = (status: Pedido['status']) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-amber-800 border-yellow-250 animate-pulse';
      case 'preparo': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'entregue': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'concluido': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusTranslation = (status: Pedido['status']) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'preparo': return 'Em Preparo';
      case 'entregue': return 'Saiu p/ Entrega';
      case 'concluido': return 'Concluído';
    }
  };

  // Filter clients and products for the new order form
  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.telefone.includes(clientSearch)
    );
  }, [clientes, clientSearch]);

  const filteredCartProducts = useMemo(() => {
    if (!productSearch) return produtos.slice(0, 5); // show first 5 products initially
    return produtos.filter(p => 
      p.nome.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoria.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [produtos, productSearch]);

  // Handle adding an item to the cart
  const handleAddToCart = (prod: Produto) => {
    const existing = cart.find(item => item.produto.id === prod.id);
    if (existing) {
      setCart(cart.map(item => 
        item.produto.id === prod.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCart([...cart, { produto: prod, quantidade: 1 }]);
    }
  };

  // Adjust cart item quantity
  const handleUpdateCartQty = (prodId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.produto.id === prodId) {
        const nextQty = item.quantidade + delta;
        return { ...item, quantidade: nextQty > 0 ? nextQty : 1 };
      }
      return item;
    }));
  };

  // Remove item from cart
  const handleRemoveFromCart = (prodId: string) => {
    setCart(cart.filter(item => item.produto.id !== prodId));
  };

  // Calculate cart sums
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.produto.preco_venda * item.quantidade), 0);
  const deliveryFee = 5.00;
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;

  // Submit delivery order
  const handleLaunchDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("ERRO: Selecione um cliente para o seu pedido de delivery!");
      return;
    }
    if (cart.length === 0) {
      alert("ERRO: Adicione pelo menos 1 item/produto para poder lançar o pedido!");
      return;
    }

    const payload = cart.map(item => ({
      produtoId: item.produto.id,
      quantidade: item.quantidade
    }));

    onAddDeliveryPedido(selectedClientId, payload);
    
    // Reset state & show nice inline notice
    setCart([]);
    setSelectedClientId('');
    setClientSearch('');
    setProductSearch('');
    
    // Go back to deliveries dashboard, so user sees the newly added pending order in list!
    setActiveSubTab('entregas');
    setFilterStatus('Todos');
  };

  const handleOpenCaixaClick = () => {
    const val = parseFloat(openingInput);
    if (isNaN(val) || val < 0) {
      alert("Informe um valor de troco inicial válido.");
      return;
    }
    onOpenCaixaDelivery(val);
  };

  return (
    <div className="space-y-6" id="delivery-tab-container">
      
      {/* 1. SEPARATE DELIVERY CASHIER CARD WIDGET */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Controle Caixa Exclusivo</span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                caixaDeliveryStatus === 'aberto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {caixaDeliveryStatus === 'aberto' ? 'CAIXA DELIVERY: ABERTO' : 'CAIXA DELIVERY: FECHADO'}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight mt-0.5">Caixa de Delivery Independente</h3>
            <p className="text-xs text-slate-400">Todos os recebimentos deste painel consolidam aqui e também são enviados ao Caixa Geral.</p>
          </div>
        </div>

        {caixaDeliveryStatus === 'aberto' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            <div className="grid grid-cols-3 gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
              <div className="text-center px-2">
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Fundo Inicial</span>
                <span className="text-xs font-mono font-black text-slate-100">R$ {caixaDeliveryValorInicial.toFixed(2)}</span>
              </div>
              <div className="text-center px-2 border-l border-slate-700/50">
                <span className="text-[8px] uppercase font-bold text-slate-400 block">Faturamento</span>
                <span className="text-xs font-mono font-black text-emerald-400">+ R$ {caixaDeliveryVendasConcluidas.toFixed(2)}</span>
              </div>
              <div className="text-center px-2 border-l border-slate-700/50">
                <span className="text-[8px] uppercase font-bold text-indigo-400 block">Em Caixa</span>
                <span className="text-xs font-mono font-black text-indigo-300">R$ {totalInDrawer.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Deseja realmente FECHAR o Caixa de Delivery?\n\nSaldo Acumulado das Entregas: R$ ${caixaDeliveryVendasConcluidas.toFixed(2)}`)) {
                  onCloseCaixaDelivery();
                }
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all font-sans tracking-wide shrink-0"
            >
              Fechar Caixa Delivery
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-800/55 p-3 rounded-xl border border-slate-700/40 w-full lg:w-auto">
            <div className="flex-1 lg:w-40">
              <label className="text-[8px] uppercase font-black text-slate-400 block mb-1">Troco Inicial (R$)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono font-bold">R$</span>
                <input
                  type="number"
                  value={openingInput}
                  onChange={e => setOpeningInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="50"
                />
              </div>
            </div>
            <button
              onClick={handleOpenCaixaClick}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all tracking-wide self-end h-9 font-sans"
            >
              Abrir Caixa Delivery
            </button>
          </div>
        )}
      </div>

      {/* 2. SUBTABS NAVIGATION & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('entregas')}
            className={`px-4 py-2 border-b-2 text-xs font-black transition-all ${
              activeSubTab === 'entregas'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🚚 DESPACHO DE ENTREGAS
          </button>
          <button
            onClick={() => {
              if (caixaDeliveryStatus !== 'aberto') {
                alert("⚠️ ATENÇÃO: Abra o Caixa de Delivery antes de lançar novos pedidos!");
                return;
              }
              setActiveSubTab('novo_pedido');
            }}
            className={`px-4 py-2 border-b-2 text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubTab === 'novo_pedido'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            } ${caixaDeliveryStatus !== 'aberto' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            NOVO PEDIDO DE DELIVERY
          </button>
        </div>

        {activeSubTab === 'entregas' && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['Todos', 'Pendente', 'Preparo', 'Entregue', 'Concluido'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 font-extrabold text-[10px] rounded-lg transition-colors border ${
                  filterStatus === st 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {st === 'Entregue' ? 'Saiu p/ Entrega' : st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. SHIFT CONTENT ACCORDING TO PRIMARY SUBTABS */}
      {activeSubTab === 'entregas' ? (
        /* DISPATCH AND QUEUE DASHBOARD */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeliveries.map(p => {
            const client = clientes.find(c => c.id === p.cliente_id);
            const orderTotal = p.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
            const absoluteTotal = orderTotal + deliveryFee;

            return (
              <div 
                key={p.id}
                className="border border-slate-200 bg-white rounded-xl p-4 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">ID: {p.id.substring(0, 8).toUpperCase()}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${getStatusBadge(p.status)}`}>
                      {getStatusTranslation(p.status)}
                    </span>
                  </div>

                  {/* Client / Location */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{client?.nome || 'Consumidor sem Nome'}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{client?.telefone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-500 leading-snug">{client?.endereco || 'Não cadastrado'}</p>
                    </div>
                  </div>

                  {/* Item summaries on receipt */}
                  <div className="mt-3 bg-slate-55 p-2.5 rounded-lg border border-slate-150">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Itens do Pedido</span>
                    <div className="space-y-1">
                      {p.itens?.map(item => {
                        const prod = produtos.find(item_p => item_p.id === item.produto_id);
                        return (
                          <div key={item.id} className="flex justify-between text-xs text-slate-600 font-mono">
                            <span className="truncate max-w-[150px]">{prod?.nome}</span>
                            <span>{item.quantidade}x R$ {item.preco_unitario.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-200 mt-2 pt-1.5 flex justify-between text-[11px] font-bold text-slate-600 font-mono">
                      <span>Taxa Entrega Sim.</span>
                      <span className="text-emerald-600">R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-slate-900 font-mono mt-1 pt-1 border-t border-dashed border-slate-200">
                      <span>TOTAL GERAL RECOLHER</span>
                      <span>R$ {absoluteTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Operations & Dispatching block */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {p.driver_name ? (
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-indigo-50/50 p-2 border border-indigo-100 rounded-lg">
                      <span>Motoboy escalado: <strong>{p.driver_name}</strong></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse animate-duration-1000"></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Nome do Motoboy..."
                        disabled={caixaDeliveryStatus !== 'aberto'}
                        value={newDriverMap[p.id] || ''}
                        onChange={e => setNewDriverMap({ ...newDriverMap, [p.id]: e.target.value })}
                        className="flex-1 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-500 disabled:opacity-50"
                      />
                      <button 
                        onClick={() => {
                          const name = newDriverMap[p.id];
                          if (!name) {
                            alert("Digite o nome do motoboy que irá realizar esta entrega!");
                            return;
                          }
                          onDispatchDelivery(p.id, name);
                        }}
                        disabled={caixaDeliveryStatus !== 'aberto'}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Despachar
                      </button>
                    </div>
                  )}

                  {/* Actions according to status */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {p.status === 'pendente' && (
                      <button 
                        onClick={() => onUpdatePedidoStatus(p.id, 'preparo')}
                        disabled={caixaDeliveryStatus !== 'aberto'}
                        className="px-3 py-1.5 bg-blue-105 hover:bg-blue-150 text-blue-700 font-extrabold text-[10px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Iniciar Preparo
                      </button>
                    )}
                    {p.status === 'preparo' && (
                      <button 
                        onClick={() => onUpdatePedidoStatus(p.id, 'entregue')}
                        disabled={caixaDeliveryStatus !== 'aberto'}
                        className="px-3 py-1.5 bg-purple-105 hover:bg-purple-150 text-purple-750 font-extrabold text-[10px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Despachar Motoboy
                      </button>
                    )}
                    {p.status === 'entregue' && (
                      <div className="w-full">
                        {caixaDeliveryStatus !== 'aberto' ? (
                          <div className="text-center text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Abra o Caixa Delivery para concluir esta venda!</span>
                          </div>
                        ) : confirmingSaleId === p.id ? (
                          /* Non-blocking iframe safe local confirm popup buttons */
                          <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex flex-col items-stretch space-y-2 animate-fadeIn">
                            <span className="text-[10px] text-center font-bold text-emerald-800 leading-snug">
                              Deseja receber R$ {absoluteTotal.toFixed(2)} centralizado no Caixa Geral?
                            </span>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  onUpdatePedidoStatus(p.id, 'concluido');
                                  setConfirmingSaleId(null);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] rounded transition-all flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Sim, Confirmar</span>
                              </button>
                              <button
                                onClick={() => setConfirmingSaleId(null)}
                                className="px-3 py-1 bg-slate-205 hover:bg-slate-300 text-slate-700 font-bold text-[9px] rounded transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmingSaleId(p.id)}
                            className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4 animate-bounce" />
                            <span>Concluir Venda (+ R$ {absoluteTotal.toFixed(2)})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDeliveries.length === 0 && (
            <div className="col-span-full border border-slate-100 bg-slate-50 rounded-xl py-12 text-center text-slate-400">
              <Truck className="w-10 h-10 mx-auto stroke-1 text-slate-350 mb-2" />
              <p className="text-xs font-bold text-slate-500">Nenhuma entrega neste status</p>
              <p className="text-[10px] text-slate-400 mt-1">Sempre que uma venda de Delivery é gerada, ela aparece neste painel de despacho.</p>
            </div>
          )}
        </div>
      ) : (
        /* NEW DELIVERY ORDER LAUNCH SECTION */
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 md:p-6 shadow-xs animate-fadeIn">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                Lançador Central - Pedidos Delivery
              </h3>
              <p className="text-xs text-slate-500">Monte o carrinho de compras, selecione o cliente cadastrado com endereço e lance na fila de entregas.</p>
            </div>

            <form onSubmit={handleLaunchDelivery} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Client, Address, details */}
              <div className="space-y-4">
                <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-100 pb-1.5">
                    Etapa 1: Identificar Cliente
                  </span>
                  
                  {/* Client search */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pesquisar ou Filtrar Clientes</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={e => {
                          setClientSearch(e.target.value);
                          if (selectedClientId) {
                            setSelectedClientId(''); // Clear selected if searching again
                          }
                        }}
                        placeholder="Busque por nome ou telefone..."
                        className="w-full text-xs bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Display Client List to select */}
                  {clientSearch && !selectedClientId && (
                    <div className="max-h-40 overflow-y-auto border border-slate-150 rounded-lg bg-slate-50 p-1.5 divide-y divide-slate-150 shadow-inner">
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setClientSearch(c.nome);
                          }}
                          className="w-full text-left py-2 px-2 hover:bg-indigo-55 text-xs flex flex-col gap-0.5 rounded"
                        >
                          <span className="font-bold text-slate-800">{c.nome}</span>
                          <span className="text-[10px] text-slate-500 font-mono">📞 {c.telefone} | 📍 {c.endereco || 'Sem endereço'}</span>
                        </button>
                      ))}
                      {filteredClients.length === 0 && (
                        <p className="text-center py-3 text-[10px] text-slate-400 font-bold">Nenhum cliente correspondente encontrado</p>
                      )}
                    </div>
                  )}

                  {/* Selected Client details preview */}
                  {selectedClientId ? (
                    <div className="bg-indigo-50/50 border border-indigo-120 p-3 rounded-lg flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-indigo-550 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-indigo-900">
                          {clientes.find(c => c.id === selectedClientId)?.nome}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">{clientes.find(c => c.id === selectedClientId)?.telefone}</p>
                        <p className="text-[11px] text-slate-700 leading-snug mt-1 font-semibold">
                          Entregar em: {clientes.find(c => c.id === selectedClientId)?.endereco || 'Endereço não cadastrado! Cadastre o endereço para entregar.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 font-bold flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Clientes com cadastro incompleto ou sem endereço deverão ser atualizados na aba "Cadastros" do sistema principal.</span>
                    </div>
                  )}
                </div>

                {/* Submitting Card action */}
                <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-100 pb-1.5">
                    Resumo do Pedido / Checkout
                  </span>
                  <div className="space-y-2 text-xs text-slate-650 font-mono">
                    <div className="flex justify-between">
                      <span>Valor dos Pastéis/Bebidas:</span>
                      <span>R$ {cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Entrega Fixa:</span>
                      <span className="text-emerald-600">R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <hr className="border-dashed border-slate-200" />
                    <div className="flex justify-between text-base font-black text-slate-900">
                      <span>TOTAL GERAL RECOLHER:</span>
                      <span className="text-indigo-600">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedClientId || cart.length === 0}
                    className="w-full bg-slate-900 hover:bg-indigo-600 font-black text-white py-3 px-4 rounded-xl transition-all tracking-wider text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    🚀 Lançar Pedidos de Delivery na Fila
                  </button>
                </div>
              </div>

              {/* Right Column: Cart, Products List */}
              <div className="space-y-4">
                <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-4 flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-100 pb-1.5">
                    Etapa 2: Produtos / Lançar Itens
                  </span>

                  {/* Search products input */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pesquisar Pastéis, Bebidas & Adicionais</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Pesquise por nome de pastel, refrigerante..."
                        className="w-full text-xs bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Filtered list of products */}
                  <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredCartProducts.map(p => {
                      const isOutOfStock = p.estoque_atual <= 0;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 border border-slate-150 rounded-lg hover:bg-slate-50 transition-all gap-1 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{p.nome}</p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              Cat: {p.categoria} | R$ {p.preco_venda.toFixed(2)} | Estoque: {p.estoque_atual}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            disabled={isOutOfStock}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-md text-white transition-all ${
                              isOutOfStock 
                                ? 'bg-slate-300 cursor-not-allowed' 
                                : 'bg-indigo-650 hover:bg-indigo-500 hover:scale-105 active:scale-95'
                            }`}
                          >
                            {isOutOfStock ? 'Sem Estoque' : 'Adicionar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Cart Items view */}
                  <div className="border-t border-slate-150 pt-3 flex-1 min-h-[160px] flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 block mb-2">Cart / Itens Selecionados</span>
                      {cart.length === 0 ? (
                        <div className="text-center py-6 text-[10px] text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-lg">
                          Carrinho de Delivery Vazio
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {cart.map(item => (
                            <div 
                              key={item.produto.id} 
                              className="flex items-center justify-between bg-slate-50 p-2 border border-slate-150 rounded-lg gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 truncate block">{item.produto.nome}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  R$ {item.produto.preco_venda.toFixed(2)} x {item.quantidade} = R$ {(item.produto.preco_venda * item.quantidade).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.produto.id, -1)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-mono font-bold w-5 text-center">{item.quantidade}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.produto.id, 1)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(item.produto.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

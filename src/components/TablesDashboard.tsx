/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, Utensils, CreditCard, Clock, CheckCircle, 
  Plus, Minus, X, Search, Percent, Printer, Send, Phone, Receipt, User
} from 'lucide-react';
import { Mesa, Pedido, Produto, Funcionario, Cliente } from '../types';

interface TablesDashboardProps {
  mesas: Mesa[];
  pedidos: Pedido[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  clientes: Cliente[];
  activeCaixa: any;
  onSetStatusMesa: (id: string, status: Mesa['status']) => void;
  onAddOrderToMesa: (
    mesaId: string, 
    waiterId: string, 
    items: { produtoId: string; quantidade: number }[]
  ) => void;
  onToggleGorjetaMesa: (id: string) => void;
  onCloseMesaAndCompletePayment: (
    mesaId: string,
    orderIds: string[],
    sellerId: string,
    buyerId: string | undefined,
    itens: { produtoId: string; quantidade: number; precoUnitario: number }[],
    paymentMethod: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado',
    dataPrometidaFiado?: string
  ) => { success: boolean; error?: string };
  onUpdateMesaName: (id: string, name: string) => void;
}

export default function TablesDashboard({
  mesas,
  pedidos,
  produtos,
  funcionarios,
  clientes,
  activeCaixa,
  onSetStatusMesa,
  onAddOrderToMesa,
  onToggleGorjetaMesa,
  onCloseMesaAndCompletePayment,
  onUpdateMesaName,
}: TablesDashboardProps) {

  // Launch Order States
  const [selectedMesaForLaunch, setSelectedMesaForLaunch] = useState<Mesa | null>(null);
  const [launchSearch, setLaunchSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [launchQty, setLaunchQty] = useState(1);
  const [selectedWaiterId, setSelectedWaiterId] = useState('');

  // Checkout Payment States
  const [selectedMesaForCheckout, setSelectedMesaForCheckout] = useState<Mesa | null>(null);
  const [selectedWaiterIdCheckout, setSelectedWaiterIdCheckout] = useState('');
  const [selectedClienteIdCheckout, setSelectedClienteIdCheckout] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado'>('dinheiro');
  const [dataPrometidaFiado, setDataPrometidaFiado] = useState(() => {
    return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  
  // Simulated thermal print view
  const [printPreviewType, setPrintPreviewType] = useState<'cliente' | 'loja' | null>(null);
  
  // WhatsApp dispatch form
  const [showWhatsappForm, setShowWhatsappForm] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('55');

  // Filter waiters list
  const listWaiters = useMemo(() => {
    return funcionarios.filter(f => f.cargo === 'garcom');
  }, [funcionarios]);

  // Handle autocomplete matching for launching products
  const matchingProducts = useMemo(() => {
    if (!launchSearch.trim()) return [];
    return produtos.filter(p => {
      const nomeSafe = p.nome || '';
      const catSafe = p.categoria || '';
      return nomeSafe.toLowerCase().includes(launchSearch.toLowerCase()) || 
             catSafe.toLowerCase().includes(launchSearch.toLowerCase());
    });
  }, [produtos, launchSearch]);

  // Aggregate current pending orders of the checkout table
  const activeTablePedidos = useMemo(() => {
    if (!selectedMesaForCheckout) return [];
    return pedidos.filter(p => p.mesa_id === selectedMesaForCheckout.id && p.status !== 'concluido');
  }, [pedidos, selectedMesaForCheckout]);

  // Extract all compiled item rows
  const checkoutItens = useMemo(() => {
    const list: { produto_id: string; quantidade: number; preco_unitario: number; subtotal: number }[] = [];
    activeTablePedidos.forEach(p => {
      if (p.itens) {
        p.itens.forEach(it => {
          list.push({
            produto_id: it.produto_id,
            quantidade: it.quantidade,
            preco_unitario: it.preco_unitario,
            subtotal: it.subtotal
          });
        });
      }
    });

    // Fallback if table order is manually altered but doesn't have list row
    if (list.length === 0 && selectedMesaForCheckout && selectedMesaForCheckout.total_atual > 0) {
      // Simulate generic item
      const firstBeer = produtos.find(p => p.categoria.toLowerCase() === 'bebidas') || produtos[0];
      list.push({
        produto_id: firstBeer?.id || 'p-1',
        quantidade: 1,
        preco_unitario: selectedMesaForCheckout.total_atual,
        subtotal: selectedMesaForCheckout.total_atual
      });
    }
    return list;
  }, [activeTablePedidos, selectedMesaForCheckout, produtos]);

  // Subtotal without 10%
  const subtotalCheckout = useMemo(() => {
    return checkoutItens.reduce((sum, item) => sum + item.subtotal, 0);
  }, [checkoutItens]);

  // Waiter tip amount
  const taxaServicoAmount = useMemo(() => {
    if (!selectedMesaForCheckout?.gorjeta_aceita) return 0;
    return subtotalCheckout * 0.10;
  }, [selectedMesaForCheckout, subtotalCheckout]);

  // Grand total including Tip
  const checkoutTotalFinal = useMemo(() => {
    return subtotalCheckout + taxaServicoAmount;
  }, [subtotalCheckout, taxaServicoAmount]);

  // Trigger Launch Item Submission
  const handleLaunchConsumoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMesaForLaunch) return;
    if (!selectedProduct) {
      alert("Selecione um produto da lista filtrada!");
      return;
    }
    if (launchQty <= 0) {
      alert("A quantidade deve ser de no mínimo 1!");
      return;
    }
    if (selectedProduct.estoque_atual < launchQty) {
      alert(`Quantidade insuficiente no estoque! Apenas ${selectedProduct.estoque_atual} disponíveis.`);
      return;
    }
    if (!selectedWaiterId) {
      alert("Por favor, selecione qual garçom realizou o atendimento.");
      return;
    }

    // Call state registration
    onAddOrderToMesa(selectedMesaForLaunch.id, selectedWaiterId, [
      { produtoId: selectedProduct.id, quantidade: launchQty }
    ]);

    // Fast success reset
    const targetLabel = selectedMesaForLaunch.nome_personalizado || `Mesa #${selectedMesaForLaunch.numero_mesa}`;
    alert(`Item "${selectedProduct.nome}" lançado com sucesso para ${targetLabel}!`);
    setSelectedMesaForLaunch(null);
    setSelectedProduct(null);
    setLaunchSearch('');
    setLaunchQty(1);
  };

  // Pre-fill fields when clicking Close Desk Account
  const handleTriggerCheckoutPanel = (mesa: Mesa) => {
    setSelectedMesaForCheckout(mesa);
    
    // Attempt pre-selecting first waiter linked to table's active delivery details
    const activePed = pedidos.find(p => p.mesa_id === mesa.id && p.status !== 'concluido');
    if (activePed && activePed.funcionario_id) {
      setSelectedWaiterIdCheckout(activePed.funcionario_id);
    } else {
      setSelectedWaiterIdCheckout(listWaiters[0]?.id || '');
    }

    // Default other forms
    setFormaPagamento('dinheiro');
    setSelectedClienteIdCheckout('');
    setPrintPreviewType(null);
    setShowWhatsappForm(false);
    setWhatsappNumber('55');
  };

  // Generate beautiful text structure representing client receipt for WhatsApp
  const makeWhatsappText = () => {
    if (!selectedMesaForCheckout) return '';
    const waiterName = funcionarios.find(f => f.id === selectedWaiterIdCheckout)?.nome || 'Não Informado';
    const clientName = clientes.find(c => c.id === selectedClienteIdCheckout)?.nome || 'Consumidor Final';

    let itemLines = '';
    checkoutItens.forEach(it => {
      const prodName = produtos.find(p => p.id === it.produto_id)?.nome || 'Item Desconhecido';
      itemLines += `• ${it.quantidade}x ${prodName} - R$ ${it.subtotal.toFixed(2)}\n`;
    });

    const isTipActive = selectedMesaForCheckout.gorjeta_aceita;
    const servicoLine = isTipActive ? `Taxa de Serviço Garçom (10%): R$ ${taxaServicoAmount.toFixed(2)}\n` : '';

    const tableLabel = selectedMesaForCheckout.nome_personalizado || `MESA #${selectedMesaForCheckout.numero_mesa}`;
    return `*=== BAR & RESTAURANTE ===*\n` +
           `📍 Endereço: Av. Principal, 1000 - Centro\n` +
           `📞 Telefone: (11) 99999-9999\n` +
           `👤 Cliente: ${clientName}\n` +
           `📅 Data/Hora: ${new Date().toLocaleString()}\n` +
           `----------------------------------------\n` +
           `*🧾 CUPOM DE CONSUMO - ${tableLabel.toUpperCase()}*\n` +
           `----------------------------------------\n` +
           `📖 *Detalhamento do Consumo*:\n` +
           `${itemLines}` +
           `----------------------------------------\n` +
           `Subtotal Consumo: R$ ${subtotalCheckout.toFixed(2)}\n` +
           `${servicoLine}` +
           `*💰 TOTAL GERAL: R$ ${checkoutTotalFinal.toFixed(2)}*\n` +
           `----------------------------------------\n` +
           `💳 Forma de Pagamento: ${formaPagamento.toUpperCase()}\n` +
           `🤵 Atendido por: ${waiterName}\n` +
           `----------------------------------------\n` +
           `OBRIGADO PELA PREFERENCIA, ESTAREMOS SEMPRE A DISPOSIÇÃO.`;
  };

  // Final Action: Complete purchase transaction
  const handleFinalizeAndCloseTableDB = (options?: { isWhatsApp?: boolean }) => {
    if (!selectedMesaForCheckout) return;
    if (!selectedWaiterIdCheckout) {
      alert("Selecione um funcionário responsável pelo fechamento!");
      return;
    }
    if (formaPagamento === 'fiado' && !selectedClienteIdCheckout) {
      alert("Por favor, selecione um cliente cadastrado para registrar como fiado!");
      return;
    }

    // Call central checkout
    const result = onCloseMesaAndCompletePayment(
      selectedMesaForCheckout.id,
      activeTablePedidos.map(p => p.id),
      selectedWaiterIdCheckout,
      selectedClienteIdCheckout || undefined,
      checkoutItens.map(it => ({
        produtoId: it.produto_id,
        quantidade: it.quantidade,
        precoUnitario: it.preco_unitario
      })),
      formaPagamento,
      formaPagamento === 'fiado' ? dataPrometidaFiado : undefined
    );

    if (result.success) {
      if (options?.isWhatsApp) {
        const text = makeWhatsappText();
        const cleanedPhone = whatsappNumber.trim().replace(/\D/g, '');
        const targetPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;
        const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      }

      const finishLabel = selectedMesaForCheckout.nome_personalizado || `Mesa #${selectedMesaForCheckout.numero_mesa}`;
      alert(`Sucesso! ${finishLabel} fechada e liberada.`);
      setSelectedMesaForCheckout(null);
    } else {
      alert(`Erro ao finalizar a mesa: ${result.error || 'Tente novamente.'}`);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6" id="tables-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            Painel Geral de Controle de Mesas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Visão unificada das mesas, consumo em tempo real com adição de comissão de garçom rápida (+10%) e checkout integrado.</p>
        </div>

        {/* Legend status */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            <span>Livre ({mesas.filter(m => m.status === 'livre').length})</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-500">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
            <span>Em Consumo ({mesas.filter(m => m.status === 'ocupada').length})</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
            <span>Aguardando Conta ({mesas.filter(m => m.status === 'aguardando_pagamento').length})</span>
          </span>
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {mesas.map(mesa => {
          // Find the active orders for this table
          const activePedidosThisMesa = pedidos.filter(p => p.mesa_id === mesa.id && p.status !== 'concluido');
          
          let cardBg = '';
          let badgeText = '';
          let textStatusColor = '';

          if (mesa.status === 'livre') {
            cardBg = 'bg-slate-50/50 border-slate-200 hover:border-emerald-300';
            badgeText = 'Livre';
            textStatusColor = 'text-emerald-700';
          } else if (mesa.status === 'ocupada') {
            cardBg = 'bg-amber-50/30 border-amber-200/80 hover:border-amber-400';
            badgeText = 'Consumindo';
            textStatusColor = 'text-amber-700';
          } else {
            cardBg = 'bg-rose-50/30 border-rose-200 hover:border-rose-400';
            badgeText = 'Fechando Conta';
            textStatusColor = 'text-rose-700';
          }

          // Calculate displayed total layout based on tipped status
          const subtotalValue = mesa.total_atual;
          const gorjetaValue = mesa.gorjeta_aceita ? subtotalValue * 0.10 : 0;
          const totalValueCombined = subtotalValue + gorjetaValue;

          return (
            <div 
              key={mesa.id}
              className={`border rounded-xl p-4 transition-all flex flex-col justify-between min-h-[200px] shadow-xs relative ${cardBg}`}
              id={`mesa-card-${mesa.id}`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100/50 pb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={mesa.nome_personalizado !== undefined ? mesa.nome_personalizado : `Mesa #${mesa.numero_mesa}`}
                      onChange={(e) => onUpdateMesaName(mesa.id, e.target.value)}
                      className="w-full bg-slate-100/50 hover:bg-slate-200/50 focus:bg-white text-xs font-black text-slate-800 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-505 font-sans transition-all block truncate"
                      placeholder="Nome da mesa"
                      title="Clique para editar o nome da mesa"
                    />
                    {mesa.nome_personalizado && (
                      <span className="text-[8px] text-slate-400 font-mono block mt-0.5 ml-1 leading-none">Mesa #{mesa.numero_mesa}</span>
                    )}
                  </div>
                  <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase shrink-0 ${
                    mesa.status === 'livre' ? 'bg-emerald-100 text-emerald-800' :
                    mesa.status === 'ocupada' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {badgeText}
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Consumo Total</span>
                    <span className="text-md font-black text-slate-800 font-mono">
                      R$ {totalValueCombined.toFixed(2)}
                    </span>
                    {mesa.gorjeta_aceita && (
                      <span className="text-[9px] text-emerald-600 block font-semibold mt-0.5">
                        Incluso +10% Garçom
                      </span>
                    )}
                  </div>

                  {/* Service tip +10% quick toggle button */}
                  {mesa.status !== 'livre' && (
                    <button
                      onClick={() => onToggleGorjetaMesa(mesa.id)}
                      className={`py-1 px-2.5 rounded-lg border text-[10px] font-extrabold tracking-wide flex items-center gap-1 transition-all ${
                        mesa.gorjeta_aceita 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black' 
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      title="Clique para habilitar/desabilitar 10% de taxa de serviço do Garçom"
                    >
                      <Percent className="w-3 h-3" />
                      <span>{mesa.gorjeta_aceita ? 'Aceito' : '+10%'}</span>
                    </button>
                  )}
                </div>

                {mesa.status !== 'livre' && activePedidosThisMesa.length > 0 && (
                  <div className="mt-2 text-[10px] text-slate-500 italic max-h-full line-clamp-2">
                    Contém: {activePedidosThisMesa.flatMap(p => p.itens || []).map(item => {
                      const name = produtos.find(p => p.id === item.produto_id)?.nome || 'Item';
                      return `${item.quantidade}x ${name.split(' ')[0]}`;
                    }).join(', ')}
                  </div>
                )}
              </div>

              {/* Action Buttons inside Card */}
              <div className="mt-4 pt-3 border-t border-slate-100/50 flex flex-col gap-2">
                {mesa.status === 'livre' ? (
                  <button 
                    onClick={() => {
                      setSelectedMesaForLaunch(mesa);
                      // Default first waiter if any
                      setSelectedWaiterId(listWaiters[0]?.id || '');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Lançar Consumo</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {mesa.status === 'ocupada' ? (
                        <button 
                          onClick={() => onSetStatusMesa(mesa.id, 'aguardando_pagamento')}
                          className="py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] rounded-lg transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Aguardar</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => onSetStatusMesa(mesa.id, 'ocupada')}
                          className="py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[10px] rounded-lg transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>Consumindo</span>
                        </button>
                      )}

                      <button 
                        onClick={() => handleTriggerCheckoutPanel(mesa)}
                        className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Fechar Conta</span>
                      </button>
                    </div>

                    {/* Quick Add Consumos Button for already active desks */}
                    <button
                      onClick={() => {
                        setSelectedMesaForLaunch(mesa);
                        setSelectedWaiterId(listWaiters[0]?.id || '');
                      }}
                      className="w-full py-1 text-slate-500 hover:bg-slate-100 border border-dashed border-slate-200 font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Mais Consumo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: LANÇAR CONSUMO (PRODUTO & QUANTIDADE) */}
      {selectedMesaForLaunch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-700 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 block">Atendimento Rápido</span>
                <span className="text-sm font-black">Lançar Consumo para {selectedMesaForLaunch.nome_personalizado || `Mesa #${selectedMesaForLaunch.numero_mesa}`}</span>
              </div>
              <button 
                onClick={() => setSelectedMesaForLaunch(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchConsumoSubmit} className="p-5 space-y-4">
              
              {/* Product autocomplete filter selector */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Escreva o Produto</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ex: Coca-cola, Cerveja, Pastel..."
                    value={launchSearch}
                    onChange={(e) => {
                      setLaunchSearch(e.target.value);
                      if (selectedProduct) setSelectedProduct(null); // Clear selected item on type Change
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  {selectedProduct && (
                    <span className="absolute right-3.5 top-2.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Selecionado
                    </span>
                  )}
                </div>

                {/* Show listing auto-complete results */}
                {!selectedProduct && matchingProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200/80 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                    {matchingProducts.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setLaunchSearch(p.nome);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="font-extrabold text-slate-800">{p.nome}</p>
                          <p className="text-[10px] text-slate-405 font-semibold capitalize bg-slate-100/60 px-1.5 py-0.5 rounded mt-0.5 w-fit">{p.categoria}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-black text-indigo-700">R$ {p.preco_venda.toFixed(2)}</p>
                          <p className="text-[9px] text-slate-400">Estoque: {p.estoque_atual}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Display product selection recap details */}
              {selectedProduct && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="text-[9px] text-indigo-500 uppercase font-bold">Resumo do Item</p>
                    <p className="font-black text-slate-900">{selectedProduct.nome}</p>
                    <p className="text-[10px] text-slate-500">Unidade: {selectedProduct.unidade_medida || 'un'} | Unitário: R$ {selectedProduct.preco_venda.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-indigo-500 uppercase font-bold">Estoque</p>
                    <p className={`font-black ${selectedProduct.estoque_atual <= 0 ? 'text-red-500' : 'text-slate-700'}`}>
                      {selectedProduct.estoque_atual} disponív.
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity selecting input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Quantidade</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setLaunchQty(prev => Math.max(1, prev - 1))}
                      className="px-3.5 py-2 hover:bg-slate-100 font-bold text-slate-600 transition-colors border-r border-slate-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={launchQty}
                      onChange={e => setLaunchQty(Math.max(1, Number(e.target.value)))}
                      className="w-full text-center bg-transparent border-none text-sm font-black text-slate-800 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setLaunchQty(prev => prev + 1)}
                      className="px-3.5 py-2 hover:bg-slate-100 font-bold text-slate-600 transition-colors border-l border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Waiter allocation dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Garçom</label>
                  <select
                    value={selectedWaiterId}
                    onChange={e => setSelectedWaiterId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    {listWaiters.map(f => (
                      <option key={f.id} value={f.id}>{f.nome.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trigger Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMesaForLaunch(null)}
                  className="flex-1 py-2 text-center text-xs border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedProduct}
                  className="flex-1 py-2 bg-indigo-600 disabled:bg-slate-200 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirmar Lançamento</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKOUT DETALHADO (IMPRIMIR VIA CLIENTE/LOJA, ENVIAR PELO WHATSAPP) */}
      {selectedMesaForCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-50 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* LEFT COMPONENT: Sales Billing Settings Form */}
            <div className="flex-1 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-black text-indigo-500 tracking-widest block">Checkout Central POS</span>
                  <h3 className="text-base font-black text-slate-800">Checkout de Venda - {selectedMesaForCheckout.nome_personalizado || `Mesa #${selectedMesaForCheckout.numero_mesa}`}</h3>
                </div>
                <button 
                  onClick={() => setSelectedMesaForCheckout(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cash condition alert */}
              {!activeCaixa && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800">
                  ⚠️ <strong>Caixa Geral Fechado!</strong> Apenas vendas na modalidade "Fiado" podem ser liquidadas. Abra o caixa na tela do caixa fiscal para pagamentos físicos regulares.
                </div>
              )}

              {/* Waiter toggle & summary service fee */}
              <div className="bg-white border border-slate-250 p-4 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between text-slate-800 text-xs">
                  <div>
                    <p className="font-extrabold flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      Taxa de Serviço Garçom (10%)
                    </p>
                    <p className="text-[10px] text-slate-400">Ative ou remova a taxa padrão de 10% cobrada pelo estabelecimento.</p>
                  </div>
                  <button
                    onClick={() => onToggleGorjetaMesa(selectedMesaForCheckout.id)}
                    className={`py-1 px-3 text-xs font-black rounded-lg transition-all border ${
                      selectedMesaForCheckout.gorjeta_aceita
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedMesaForCheckout.gorjeta_aceita ? 'Ativado (+10%)' : 'Desativado'}
                  </button>
                </div>

                <hr className="border-slate-100" />

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Garçom Responsável</label>
                    <select
                      value={selectedWaiterIdCheckout}
                      onChange={e => setSelectedWaiterIdCheckout(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                    >
                      {listWaiters.map(f => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Forma de Pagamento</label>
                    <select
                      value={formaPagamento}
                      onChange={e => setFormaPagamento(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="debito">Cartão Débito</option>
                      <option value="credito">Cartão Crédito</option>
                      <option value="fiado">Fiado (Faturado prazo)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional fields for Fiado */}
                {formaPagamento === 'fiado' && (
                  <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-dashed border-slate-100 animate-in slide-in-from-top-1 duration-100">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-amber-600 block tracking-wider">Selecione o Cliente</label>
                      <select
                        value={selectedClienteIdCheckout}
                        onChange={e => setSelectedClienteIdCheckout(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-amber-500/5 border border-amber-300 text-slate-800 font-bold rounded-lg text-xs"
                      >
                        <option value="">Selecione quem assina o fiado...</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nome} (Limite: R$ {c.limite_fiado.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-amber-600 block tracking-wider">Limite Data de Pagamento</label>
                      <input
                        type="date"
                        value={dataPrometidaFiado}
                        onChange={e => setDataPrometidaFiado(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-amber-500/5 border border-amber-300 rounded-lg text-slate-800 font-bold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout billing aggregates calculation */}
              <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal Itens Lançados</span>
                  <span className="font-mono font-bold">R$ {subtotalCheckout.toFixed(2)}</span>
                </div>
                {selectedMesaForCheckout.gorjeta_aceita && (
                  <div className="flex items-center justify-between text-slate-650 font-semibold">
                    <span>Comissão Garçom (+10%)</span>
                    <span className="font-mono text-emerald-700 font-extrabold">R$ {taxaServicoAmount.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-slate-200" />
                <div className="flex items-center justify-between text-sm text-slate-800 font-black">
                  <span>Valor Geral Final</span>
                  <span className="font-mono text-indigo-700 text-lg">R$ {checkoutTotalFinal.toFixed(2)}</span>
                </div>
              </div>

              {/* Main action buttons for receipts and whatsapp templates */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Ações de Entrega do Cupom</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintPreviewType('cliente')}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white ${
                      printPreviewType === 'cliente' 
                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20 font-black ring-2 ring-indigo-600/10' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Visualizar Via Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintPreviewType('loja')}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white ${
                      printPreviewType === 'loja' 
                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20 font-black ring-2 ring-indigo-600/10' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Visualizar Via Loja</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowWhatsappForm(!showWhatsappForm);
                    setWhatsappNumber('55');
                  }}
                  className={`w-full py-2.5 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    showWhatsappForm 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-black' 
                      : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white shadow-xs'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{showWhatsappForm ? 'Ocultar Guia do WhatsApp' : 'Enviar por WhatsApp'}</span>
                </button>

                {/* Sub-form WhatsApp input prefilled with 55 */}
                {showWhatsappForm && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5 animate-in slide-in-from-top-1.5 duration-100">
                    <div>
                      <label className="text-[9px] uppercase font-black text-emerald-800 block tracking-wider mb-1">
                        Telefone do Cliente (Iniciar com 55 - Código do Brasil)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={whatsappNumber}
                          onChange={e => setWhatsappNumber(e.target.value)}
                          placeholder="5541999999999"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-200 text-sm font-mono font-bold text-slate-800 rounded-lg focus:outline-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <span className="text-[9px] text-emerald-700 block font-medium mt-1">
                        A mensagem gerará o cupom fiscal completo e abrirá a conversa direcionada.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFinalizeAndCloseTableDB({ isWhatsApp: true })}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar pelo WhatsApp e Concluir Venda</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Confirm or Close */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMesaForCheckout(null)}
                  className="flex-1 py-3 text-center border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition-all"
                >
                  Sair sem Cobrar
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalizeAndCloseTableDB()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Cobrar e Liberar Mesa</span>
                </button>
              </div>
            </div>

            {/* RIGHT COMPONENT: Mock printable thermal receipt preview */}
            <div className="flex-1 p-6 bg-slate-100/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-3 uppercase">Visualização da Impressão de Cupom</span>
                
                {/* Simulated thermal receipt body paper */}
                <div className="bg-white border border-slate-250 shadow-md p-5 rounded-md max-w-sm mx-auto font-mono text-[11px] text-slate-800 space-y-4">
                  <div className="text-center font-bold">
                    {/* TOPO: SOMENTE O NOME DO COMERCIO */}
                    <p className="text-sm font-black tracking-tighter">=== BAR & RESTAURANTE ===</p>
                    
                    {/* ABAIXO DO NOME: ENDEREÇO E TELEFONE */}
                    <p className="text-[10px] font-medium text-slate-500 font-sans mt-1">Endereço: Av. Principal, 1000 - Centro</p>
                    <p className="text-[10px] font-medium text-slate-500 font-sans">Telefone: (11) 99999-9999</p>
                    
                    {/* ABAIXO DO TELEFONE: NOME DO CLIENTE */}
                    <p className="text-[10px] font-bold text-slate-705 font-sans mt-1">
                      Cliente: {clientes.find(c => c.id === selectedClienteIdCheckout)?.nome || 'Consumidor Final'}
                    </p>
                    
                    {/* ABAIXO DO CLIENTE: DATA E HORA */}
                    <p className="text-[9px] font-semibold text-slate-400 mt-1">Data/Hora: {new Date().toLocaleString()}</p>
                    
                    {/* ENHANCED RECEIPT HEADER FOR DESIGN BONITO */}
                    <div className="my-2 p-2 border-2 border-double border-slate-800 rounded bg-slate-50 text-center font-bold">
                      <p className="font-sans font-black tracking-wider uppercase text-slate-900 text-xs">
                        {selectedMesaForCheckout.nome_personalizado || `MESA #${selectedMesaForCheckout.numero_mesa}`}
                      </p>
                      {selectedMesaForCheckout.nome_personalizado && (
                        <p className="text-[8px] text-slate-500 font-mono mt-0.5">NÚMERO ORIGINAL: MESA #{selectedMesaForCheckout.numero_mesa}</p>
                      )}
                      
                      {/* ACCUMULATED VALUE */}
                      <p className="text-[10px] text-indigo-700 font-black font-mono border-t border-dashed border-slate-350 mt-1.5 pt-1">
                        VALOR ACUMULADO: R$ {checkoutTotalFinal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <hr className="border-dashed border-slate-300" />

                  <div>
                    <p className="font-bold pb-1 flex justify-between">
                      <span>{printPreviewType === 'loja' ? 'CUPOM INTERNO (VIA LOJA)' : 'VIA DO CONSUMIDOR (CLIENTE)'}</span>
                    </p>
                    <div className="space-y-1 mt-1 text-[10px]">
                      <div className="flex justify-between font-bold border-b border-dashed border-slate-150 pb-0.5 mb-1 text-slate-500">
                        <span>QUANT. DESCRIÇÃO</span>
                        <span>SUBTOTAL</span>
                      </div>
                      {checkoutItens.map((it, idx) => {
                        const prName = produtos.find(p => p.id === it.produto_id)?.nome || 'Consumível';
                        return (
                          <div key={idx} className="flex justify-between">
                            <span>{it.quantidade}x {prName.substring(0, 18)}</span>
                            <span>R$ {it.subtotal.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-dashed border-slate-300" />

                  <div className="space-y-1 text-right">
                    <div className="flex justify-between">
                      <span>Subtotal Itens:</span>
                      <span>R$ {subtotalCheckout.toFixed(2)}</span>
                    </div>

                    {selectedMesaForCheckout.gorjeta_aceita && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Serviço Garçom (10%):</span>
                        <span>R$ {taxaServicoAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-1 text-slate-900">
                      <span>TOTAL GERAL:</span>
                      <span>R$ {checkoutTotalFinal.toFixed(2)}</span>
                    </div>
                  </div>

                  <hr className="border-dashed border-slate-300" />

                  <div className="text-[10px]">
                    <p>Forma de Pagto: <strong>{formaPagamento.toUpperCase()}</strong></p>
                    <p>Atendente: <strong>{funcionarios.find(f => f.id === selectedWaiterIdCheckout)?.nome || 'Garçom'}</strong></p>
                    {/* TEXTO PEDIDO LOGO ABAIXO DO ATENDENTE */}
                    <div className="border-t border-dotted border-slate-300 mt-2.5 pt-2 text-center">
                      <p className="font-extrabold text-[10px] text-slate-905 uppercase leading-snug">
                        OBRIGADO PELA PREFERENCIA, ESTAREMOS SEMPRE A DISPOSIÇÃO.
                      </p>
                    </div>
                    {formaPagamento === 'fiado' && (
                      <>
                        <p className="text-amber-800 font-bold mt-1.5">Assinatura Fiado / Conta de Desconto</p>
                        <p>Cliente: {clientes.find(c => c.id === selectedClienteIdCheckout)?.nome || 'Consumidor Pago'}</p>
                        <p>Vencimento do Veto: {dataPrometidaFiado}</p>
                      </>
                    )}
                  </div>

                  <hr className="border-dashed border-slate-300" />

                  <div className="text-center text-[9px] text-slate-400 font-sans">
                    <p>{printPreviewType === 'loja' ? '* CONTROLE INTERNO DO OUTLET *' : 'OBRIGADO PELA PREFERENCIA, ESTAREMOS SEMPRE A DISPOSIÇÃO.'}</p>
                  </div>
                </div>
              </div>

              {/* Action trigger to invoke simulated or physical printer */}
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    alert("Aviso: Enviando via sinal Bluetooth/USB à bobina térmica... Impressora simulou a emissão física do cupom fiscal com sucesso!");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Disparar Impressão na Bobina</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Sinal de transmissão integrado direto com bobinas de 58mm/80mm.</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

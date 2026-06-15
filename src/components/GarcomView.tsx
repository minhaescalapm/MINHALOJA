/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Smartphone, User, Coffee, Plus, CheckCircle, RefreshCcw, 
  Search, ArrowLeft, Send, Utensils, ClipboardList, LogOut
} from 'lucide-react';
import { Funcionario, Mesa, Produto } from '../types';

interface GarcomViewProps {
  mesas: Mesa[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  onOpenMesa: (mesaId: string) => void;
  onAddOrderToMesa: (
    mesaId: string, 
    waiterId: string, 
    items: { produtoId: string; quantidade: number }[]
  ) => void;
  onUpdateMesaName: (id: string, name: string) => void;
}

export default function GarcomView({
  mesas,
  produtos,
  funcionarios,
  onOpenMesa,
  onAddOrderToMesa,
  onUpdateMesaName,
}: GarcomViewProps) {
  // Waiter login state
  const [loggedWaiter, setLoggedWaiter] = useState<Funcionario | null>(null);
  const [selectWaiterId, setSelectWaiterId] = useState('');

  // Selected desk/table state
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  
  // Pending items adding state (cart for the table)
  const [tableCart, setTableCart] = useState<{ [productId: string]: number }>({});
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Active waiters we can simulate
  const listWaiters = useMemo(() => {
    return funcionarios.filter(f => f.cargo === 'garcom');
  }, [funcionarios]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(produtos.map(p => p.categoria)));
    return ['Todos', ...list];
  }, [produtos]);

  const filteredProducts = useMemo(() => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [p_value => produtos, productSearch, selectedCategory]);

  // Handle entering a waiter account
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = listWaiters.find(w => w.id === selectWaiterId);
    if (found) {
      setLoggedWaiter(found);
    } else {
      alert("Selecione um garçom cadastrado para acessar.");
    }
  };

  // Reset order cart
  const selectMesaToEdit = (mesa: Mesa) => {
    onOpenMesa(mesa.id);
    setSelectedMesa(mesa);
    setTableCart({});
  };

  const adjustQtyInTableCart = (productId: string, delta: number, maxStock: number) => {
    const current = tableCart[productId] || 0;
    const nextVal = current + delta;
    
    if (nextVal <= 0) {
      const copy = { ...tableCart };
      delete copy[productId];
      setTableCart(copy);
    } else {
      if (nextVal > maxStock) {
        alert(`Estoque insuficiente! (${maxStock} disponíveis)`);
        return;
      }
      setTableCart({
        ...tableCart,
        [productId]: nextVal
      });
    }
  };

  const handleSendOrder = () => {
    if (!selectedMesa || !loggedWaiter) return;

    const itemsToSend = Object.entries(tableCart).map(([pId, qty]) => ({
      produtoId: pId,
      quantidade: Number(qty)
    }));

    if (itemsToSend.length === 0) {
      alert("Adicione pelo menos um item ao pedido!");
      return;
    }

    onAddOrderToMesa(selectedMesa.id, loggedWaiter.id, itemsToSend);
    alert(`Pedido enviado para a cozinha! Mesa ${selectedMesa.numero_mesa} atualizada com Sucesso.`);
    
    // reset states
    setSelectedMesa(null);
    setTableCart({});
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-6 bg-slate-100 min-h-[600px] rounded-2xl border border-slate-200" id="garcom-mobile-first-simulator">
      
      {/* Visual Marker */}
      <div className="mb-4 text-center">
        <span className="text-[10px] bg-indigo-150 text-indigo-700 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 mx-auto w-fit border border-indigo-200">
          <Smartphone className="w-3.5 h-3.5" />
          MÓDULO DO GARÇOM (SIMULADOR MOBILE)
        </span>
        <p className="text-xs text-slate-500 mt-1">Este simulador possui proporção e comportamento ideal para telas verticais de smartphones.</p>
      </div>

      {/* Realistic Mobile Shell wrapper */}
      <div className="w-full max-w-sm bg-slate-900 rounded-[40px] border-[12px] border-slate-950 shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative text-slate-800">
        
        {/* Device Top Speaker Camera bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-5 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-slate-850 rounded-full ml-3 border border-slate-900"></div>
        </div>

        {/* Mobile screen container */}
        <div className="flex-1 bg-slate-50 pt-5 flex flex-col overflow-hidden relative">
          
          {/* Internal App Navbar */}
          <div className="bg-indigo-650 h-14 px-3 flex items-center justify-between text-white shrink-0 shadow-sm">
            {selectedMesa ? (
              <button 
                onClick={() => setSelectedMesa(null)}
                className="p-1 hover:bg-white/10 rounded-lg flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-300" />
                <span className="font-extrabold text-sm tracking-wide">Garçom Fácil</span>
              </div>
            )}

            {loggedWaiter && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-[9px] text-indigo-200 block">Olá, Garçom</span>
                  <span className="text-xs font-bold truncate max-w-[80px] block">{loggedWaiter.nome.split(' ')[0]}</span>
                </div>
                <button 
                  onClick={() => setLoggedWaiter(null)} 
                  title="Sair"
                  className="p-1.5 hover:bg-white/15 rounded-md text-red-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Core mobile screens view routing */}
          {!loggedWaiter ? (
            /* WAITERS LOGIN */
            <div className="flex-1 p-6 flex flex-col justify-center bg-white">
              <div className="text-center mb-6">
                <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2.5">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Faça Login Simulado</h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">Selecione seu nome de garçom para ativar a comissao de 10% padrão de vendas.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Selecione seu Perfil</label>
                  <select
                    value={selectWaiterId}
                    onChange={e => setSelectWaiterId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2.5 bg-slate-50 text-slate-800 font-bold focus:outline-indigo-500"
                  >
                    <option value="">Selecione um garçom...</option>
                    {listWaiters.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md transition-colors"
                >
                  Entrar no Sistema Mobile
                </button>
              </form>

              <div className="mt-8 text-center bg-amber-50 p-3 rounded-lg border border-amber-100 text-[10px] text-amber-800">
                ⚠️ Se não houver garçons registrados, adicione novos funcionários com o cargo <strong>Garçom</strong> na aba Cadastros Gerais do painel central.
              </div>
            </div>
          ) : !selectedMesa ? (
            /* TABLE STATUS MAP VIEW */
            <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Painel de Mesas</h3>
                <p className="text-[11px] text-slate-500">Selecione uma mesa para lançar consumos.</p>
              </div>

              {/* Grid de mesas */}
              <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
                {mesas.map(mesa => {
                  const colorClass = mesa.status === 'livre' 
                    ? 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10' 
                    : mesa.status === 'ocupada' 
                    ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-400/20' 
                    : 'bg-rose-50 border-rose-200 ring-2 ring-rose-400/20';

                  const badgeColor = mesa.status === 'livre'
                    ? 'bg-emerald-100 text-emerald-800'
                    : mesa.status === 'ocupada'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800';

                  return (
                    <button
                      key={mesa.id}
                      onClick={() => selectMesaToEdit(mesa)}
                      className={`p-3 border rounded-2xl text-left flex flex-col justify-between transition-all aspect-square min-h-[110px] ${colorClass}`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-slate-900 font-sans tracking-tight leading-tight block truncate">
                            {mesa.nome_personalizado || `Mesa #${mesa.numero_mesa}`}
                          </span>
                          {mesa.nome_personalizado && (
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Mesa #{mesa.numero_mesa}</span>
                          )}
                        </div>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-normal uppercase shrink-0 ${badgeColor}`}>
                          {mesa.status === 'aguardando_pagamento' ? 'Conta' : mesa.status === 'ocupada' ? 'Ocupada' : 'Livre'}
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-[9px] text-slate-400 block font-medium">Consumo Atual</span>
                        <span className="text-xs font-black text-slate-800 font-mono">
                          R$ {mesa.total_atual.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ADD ITEMS TO TABLE VIEW (CART SUB-PAGE) */
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              
              {/* Header inside selected table */}
              <div className="bg-slate-50 p-3 border-b border-slate-150 flex items-center justify-between shrink-0">
                <div className="flex-1 mr-3">
                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Identificação da Mesa</span>
                  <input
                    type="text"
                    value={selectedMesa.nome_personalizado !== undefined ? selectedMesa.nome_personalizado : `Mesa #${selectedMesa.numero_mesa}`}
                    onChange={(e) => {
                      const newName = e.target.value;
                      onUpdateMesaName(selectedMesa.id, newName);
                      setSelectedMesa(prev => prev ? { ...prev, nome_personalizado: newName } : null);
                    }}
                    className="w-full bg-white border border-slate-250 text-xs font-black text-slate-800 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 transition-all font-sans font-medium"
                    placeholder="Nome da mesa"
                    title="Altere o nome da mesa para aparecer no cupom"
                  />
                  <span className="text-[8px] text-indigo-650 font-bold block mt-1">
                    📝 Toque acima para editar o nome da mesa
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-slate-400 block">Acumulado</span>
                  <span className="text-xs font-black text-slate-800 font-mono">R$ {selectedMesa.total_atual.toFixed(2)}</span>
                </div>
              </div>

              {/* Simple Search bar */}
              <div className="p-2 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Filtrar por nome"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredProducts.map(prod => {
                  const qtyInCart = tableCart[prod.id] || 0;
                  const isOutOfStock = prod.estoque_atual <= 0;
                  return (
                    <div 
                      key={prod.id} 
                      className={`p-2 border border-slate-150 rounded-xl flex items-center justify-between text-slate-800 ${
                        isOutOfStock ? 'opacity-40 bg-slate-50 cursor-not-allowed' : 'bg-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-[8px] uppercase font-bold text-slate-400 font-sans">{prod.categoria}</span>
                        <h5 className="text-xs font-bold text-slate-800 truncate leading-tight mt-0.5">{prod.nome}</h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-indigo-605">R$ {prod.preco_venda.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">Estoque: {prod.estoque_atual}</span>
                        </div>
                      </div>

                      {qtyInCart > 0 ? (
                        <div className="flex items-center bg-indigo-50 border border-indigo-250 rounded-lg shadow-xs shrink-0">
                          <button 
                            onClick={() => adjustQtyInTableCart(prod.id, -1, prod.estoque_atual)}
                            className="px-2 py-1 text-indigo-700 font-extrabold hover:bg-indigo-100/50 rounded-l-lg transition-colors text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-black text-indigo-900 font-mono">
                            {qtyInCart}
                          </span>
                          <button 
                            onClick={() => adjustQtyInTableCart(prod.id, 1, prod.estoque_atual)}
                            className="px-2 py-1 text-indigo-700 font-extrabold hover:bg-indigo-100/50 rounded-r-lg transition-colors text-xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => adjustQtyInTableCart(prod.id, 1, prod.estoque_atual)}
                          disabled={isOutOfStock}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer bar with dispatch triggers */}
              <div className="border-t border-slate-150 p-3 bg-slate-50 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Adicionados neste lote:</span>
                  <span className="font-mono text-indigo-700 bg-indigo-100/40 px-2.5 py-0.5 rounded-full">
                    {Object.values(tableCart).reduce((a, b) => Number(a) + Number(b), 0)} itens
                  </span>
                </div>

                <div className="flex gap-2.5 text-xs font-bold">
                  <button
                    onClick={() => {
                      setTableCart({});
                      setSelectedMesa(null);
                    }}
                    className="flex-1 py-2 text-center border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                  >
                    Sair / Descartar
                  </button>
                  <button
                    onClick={handleSendOrder}
                    disabled={Object.keys(tableCart).length === 0}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Lançar Pedido</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Bottom simulated navigation bar of the device */}
          <div className="bg-white border-t border-slate-200 h-10 flex items-center justify-around shrink-0 pb-1.5 text-slate-400">
            <button 
              onClick={() => { if(loggedWaiter) setSelectedMesa(null); }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${
                loggedWaiter && !selectedMesa ? 'text-indigo-600 font-bold' : ''
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span className="text-[8px]">Mesas</span>
            </button>
            <div className="w-12 h-12 bg-slate-200 rounded-full border border-slate-350 shadow-inner -mt-4 flex items-center justify-center font-bold text-[18px] text-slate-500 font-mono tracking-tighter">
              •
            </div>
            <button 
              onClick={() => { if(loggedWaiter) { setSelectedMesa(null); alert("O garçom não tem acesso ao painel financeiro ou de fechamentos por regra de compliance!"); } }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-[8px]">Ver Comissões</span>
            </button>
          </div>

        </div>

        {/* Visual Hardware bottom white pill bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-400/30 rounded-full"></div>
      </div>
    </div>
  );
}

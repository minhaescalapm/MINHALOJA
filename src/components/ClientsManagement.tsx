import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, PlusCircle, Trash2, Edit, CheckCircle, 
  MapPin, Phone, CreditCard, ShieldAlert, Loader2,
  Clock, Award, ShoppingBag, X
} from 'lucide-react';
import { Cliente, Pedido, Produto } from '../types';

interface ClientsManagementProps {
  clientes: Cliente[];
  onAddCliente: (c: Omit<Cliente, 'id' | 'data_cadastro'>) => void;
  onUpdateCliente: (id: string, c: Partial<Cliente>) => void;
  onDeleteCliente: (id: string) => void;
  pedidos?: Pedido[];
  produtos?: Produto[];
}

export default function ClientsManagement({
  clientes = [],
  onAddCliente,
  onUpdateCliente,
  onDeleteCliente,
  pedidos = [],
  produtos = [],
}: ClientsManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Cliente | null>(null);

  // Form field states
  const [cNome, setcNome] = useState('');
  const [cTel, setcTel] = useState('');
  const [cCep, setcCep] = useState('');
  const [cEnd, setcEnd] = useState('');
  const [cNumero, setcNumero] = useState('');
  const [cBairro, setcBairro] = useState('');
  const [cCidade, setcCidade] = useState('');
  const [cReferencia, setcReferencia] = useState('');
  const [cLimite, setcLimite] = useState('');
  const [cFormaPgto, setcFormaPgto] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado'>('dinheiro');

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);

  // Auto-lookup CEP on change
  useEffect(() => {
    const cleanCep = cCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      setCepSuccess(false);
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setcEnd(data.logradouro || '');
            setcBairro(data.bairro || '');
            setcCidade(`${data.localidade || ''} - ${data.uf || ''}`);
            setCepSuccess(true);
            // Auto focus number
            setTimeout(() => {
              const numInput = document.getElementById('cNumeroInput');
              if (numInput) numInput.focus();
            }, 100);
          } else {
            alert('CEP não encontrado no ViaCEP!');
          }
        })
        .catch(err => {
          console.error('Erro ao buscar CEP:', err);
        })
        .finally(() => {
          setLoadingCep(false);
        });
    }
  }, [cCep]);

  const resetFormValues = () => {
    setEditingId(null);
    setIsInserting(false);
    setcNome('');
    setcTel('');
    setcCep('');
    setcEnd('');
    setcNumero('');
    setcBairro('');
    setcCidade('');
    setcReferencia('');
    setcLimite('');
    setcFormaPgto('dinheiro');
    setCepSuccess(false);
  };

  const handleEditTrigger = (c: Cliente) => {
    setEditingId(c.id);
    setIsInserting(false);
    setcNome(c.nome);
    setcTel(c.telefone || '');
    setcCep(c.cep || '');
    setcEnd(c.endereco || '');
    setcNumero(c.numero || '');
    setcBairro(c.bairro || '');
    setcCidade(c.cidade || '');
    setcReferencia(c.referencia || '');
    setcLimite(c.limite_fiado?.toString() || '0');
    setcFormaPgto(c.forma_pagamento_preferida || 'dinheiro');
    setCepSuccess(!!c.cep);
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cNome.trim()) {
      alert('O campo Nome Completo é obrigatório!');
      return;
    }
    if (!cTel.trim()) {
      alert('O campo Telefone é obrigatório!');
      return;
    }
    if (!cCep.trim()) {
      alert('O campo CEP é obrigatório!');
      return;
    }
    if (!cEnd.trim()) {
      alert('O campo Rua (Logradouro/Endereço) é obrigatório!');
      return;
    }
    if (!cNumero.trim()) {
      alert('O campo Número é obrigatório!');
      return;
    }
    if (!cBairro.trim()) {
      alert('O campo Bairro é obrigatório!');
      return;
    }
    if (!cCidade.trim()) {
      alert('O campo Cidade é obrigatório!');
      return;
    }
    if (!cReferencia.trim()) {
      alert('O campo Referência / Complemento de Entrega é obrigatório!');
      return;
    }

    const payload = {
      nome: cNome.trim(),
      telefone: cTel.trim(),
      cep: cCep.trim(),
      endereco: cEnd.trim(),
      numero: cNumero.trim(),
      bairro: cBairro.trim(),
      cidade: cCidade.trim(),
      referencia: cReferencia.trim(),
      limite_fiado: parseFloat(cLimite) || 0,
      forma_pagamento_preferida: cFormaPgto,
    };

    if (editingId) {
      onUpdateCliente(editingId, payload);
      alert('Cadastro do cliente atualizado com sucesso!');
    } else {
      onAddCliente(payload);
      alert('Cliente cadastrado com sucesso!');
    }

    resetFormValues();
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.telefone && c.telefone.includes(searchQuery)) ||
      (c.endereco && c.endereco.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clientes, searchQuery]);

  // Specific client intelligence selectors
  const { currentClientOrders, currentClientFavProducts } = useMemo(() => {
    if (!selectedClientDetails) return { currentClientOrders: [], currentClientFavProducts: [] };

    // Get direct orders
    const clientOrders = pedidos.filter(p => p.cliente_id === selectedClientDetails.id);

    // Calculate product rank
    const favCountMap: Record<string, { id: string; nome: string; categoria: string; totalQtd: number }> = {};
    clientOrders.forEach(ord => {
      ord.itens?.forEach(it => {
        const pId = it.produto_id;
        const matchingProd = produtos.find(p => p.id === pId);
        const prodName = matchingProd ? matchingProd.nome : 'Produto Editado/Antigo';
        const prodCat = matchingProd ? matchingProd.categoria : 'Restaurante';

        if (!favCountMap[pId]) {
          favCountMap[pId] = { id: pId, nome: prodName, categoria: prodCat, totalQtd: 0 };
        }
        favCountMap[pId].totalQtd += it.quantidade;
      });
    });

    const sortedFavs = Object.values(favCountMap).sort((a, b) => b.totalQtd - a.totalQtd);

    return {
      currentClientOrders: clientOrders,
      currentClientFavProducts: sortedFavs
    };
  }, [selectedClientDetails, pedidos, produtos]);

  return (
    <div className="space-y-6" id="clients-module-container">
      {/* Title Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>Módulo de Gestão de Clientes</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Histórico avançado de pedidos, relação de consumo/produtos favoritos e gerenciamento automático de endereço via CEP.
          </p>
        </div>

        <button 
          onClick={() => {
            resetFormValues();
            setIsInserting(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Editor Panel Modal with Overlay */}
      {(editingId || isInserting) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl relative animate-scaleIn">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3 mb-5">
              <h4 className="font-extrabold text-indigo-900 dark:text-indigo-450 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>{editingId ? '🖊️ Alterar Ficha Cadastral do Cliente' : '✨ Criar Nova Conta de Cliente'}</span>
              </h4>
              <button 
                type="button"
                onClick={resetFormValues}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleOnSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Basic Customer Data */}
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: João da Silva Lima" 
                    value={cNome} 
                    onChange={e => setcNome(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Telefone Principal *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: (11) 99999-8888" 
                    value={cTel} 
                    onChange={e => setcTel(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white" 
                  />
                </div>

                {/* CEP field initiates the autofill rule */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-1 flex items-center gap-1">
                    <span>CEP *</span>
                    {loadingCep && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: 01311-200" 
                    value={cCep} 
                    onChange={e => setcCep(e.target.value)} 
                    className={`w-full text-xs bg-white dark:bg-slate-950 border rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white font-semibold font-mono ${
                      cepSuccess ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'
                    }`} 
                  />
                </div>

                {/* Address detail fields */}
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Logradouro / Rua *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Avenida Paulista" 
                    value={cEnd} 
                    onChange={e => setcEnd(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Número *</label>
                  <input 
                    id="cNumeroInput"
                    type="text" 
                    required
                    placeholder="Ex: 1000, Ap 54" 
                    value={cNumero} 
                    onChange={e => setcNumero(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono font-bold" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Bairro *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Bela Vista" 
                    value={cBairro} 
                    onChange={e => setcBairro(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cidade / Estado *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: São Paulo - SP" 
                    value={cCidade} 
                    onChange={e => setcCidade(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white" 
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Ponto de Referência / Complemento *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Próximo à padaria central, portão verde" 
                    value={cReferencia} 
                    onChange={e => setcReferencia(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white" 
                  />
                </div>

                {/* Financial preferences */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Limite Máximo p/ Fiado R$</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 500.00" 
                    value={cLimite} 
                    onChange={e => setcLimite(e.target.value)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono font-bold text-red-650" 
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pagamento Preferido</label>
                  <select 
                    value={cFormaPgto} 
                    onChange={e => setcFormaPgto(e.target.value as any)} 
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white font-semibold"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="fiado">Fiado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  {editingId ? 'Salvar Alterações de Ficha' : 'Completar Cadastro de Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTELLIGENCE DRAWER / MODAL FOR CLIENT ADVANCED HISTORY */}
      {selectedClientDetails && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-2xl w-full max-w-3xl relative animate-scaleIn">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Fidelidade & Histórico: {selectedClientDetails.nome}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">
                    Resumo do comportamento de consumo e estatísticas dinâmicas de fidelidade.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedClientDetails(null)}
                className="p-1 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                X Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-slate-705 dark:text-slate-300">
              
              {/* Box 1: Histórico de Pedidos anteriores */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-xs font-black uppercase text-indigo-700 dark:text-indigo-400 border-b pb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pedidos Anteriores ({currentClientOrders.length})</span>
                </div>

                {currentClientOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum pedido anterior registrado para esse cliente.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {currentClientOrders.map(ord => (
                      <div key={ord.id} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-800 dark:text-white">Pedido #{ord.id.substring(2,6)}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              ord.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {new Date(ord.data_pedido).toLocaleDateString('pt-BR')} às {new Date(ord.data_pedido).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <strong className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">
                            R$ {(ord.total || 0).toFixed(2)}
                          </strong>
                          <span className="block text-[8px] text-slate-400 capitalize mt-0.5">{ord.tipo_pedido}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 2: Ranking Produtos mais comprados */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-xs font-black uppercase text-indigo-700 dark:text-indigo-400 border-b pb-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Produtos Preferidos (Ranking)</span>
                </div>

                {currentClientFavProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum produto consumido registrado até o momento.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {currentClientFavProducts.map((fav, index) => (
                      <div key={fav.id} className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-850 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>
                          <div className="truncate">
                            <strong className="text-slate-800 dark:text-zinc-200 block truncate font-bold">{fav.nome}</strong>
                            <span className="text-[9px] text-slate-400 uppercase font-medium">{fav.categoria}</span>
                          </div>
                        </div>
                        <strong className="font-mono text-slate-800 dark:text-zinc-200 text-xs shrink-0 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {fav.totalQtd} unid.
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Address Summary Block */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ficha de Endereçamento de Entrega</span>
              <div className="bg-indigo-50/30 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 text-xs flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-950 dark:text-indigo-400 block font-bold leading-none mb-1">Endereço Principal</strong>
                  <span className="text-slate-505 dark:text-slate-350">
                    {selectedClientDetails.endereco}, {selectedClientDetails.numero ? `Nº ${selectedClientDetails.numero}` : ''} - {selectedClientDetails.bairro}, {selectedClientDetails.cidade} (CEP: {selectedClientDetails.cep || 'Sem CEP'})
                  </span>
                  {selectedClientDetails.referencia && (
                    <p className="text-slate-400 italic text-[11px] mt-1.5">
                      Ponto de Referência: {selectedClientDetails.referencia}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Lookup Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 shadow-3xs">
        <Search className="w-4 h-4 text-slate-450 dark:text-slate-500 shrink-0" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filtrar por nome do consumidor, telefone de contato ou logradouro..." 
          className="w-full text-xs bg-transparent focus:outline-none dark:text-white"
        />
      </div>

      {/* Main Registries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-3xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-slate-400 uppercase text-[9px] font-black tracking-wider select-none">
                <th className="p-4">Consumidor</th>
                <th className="p-4">Telefone</th>
                <th className="p-4">Endereço de Entrega Completo</th>
                <th className="p-4">Pagamento Favorito</th>
                <th className="p-4 text-right">Limite Fiado</th>
                <th className="p-4 text-center">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans text-xs">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    Nenhum cliente encontrado com os critérios digitados no filtro.
                  </td>
                </tr>
              ) : (
                filteredClientes.map(c => {
                  const formattedAddress = [
                    c.endereco, 
                    c.numero ? `Nº ${c.numero}` : '', 
                    c.bairro, 
                    c.cidade,
                    c.cep ? `CEP: ${c.cep}` : '',
                    c.referencia ? `(Ref: ${c.referencia})` : ''
                  ].filter(Boolean).join(', ');

                  return (
                    <tr key={c.id} className="hover:bg-slate-55/60 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-white">
                        {c.nome}
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-355">
                        {c.telefone || 'Não Informado'}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs truncate" title={formattedAddress}>
                        {formattedAddress || <span className="text-red-400">Sem endereço de entrega cadastrado</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          c.forma_pagamento_preferida === 'fiado' 
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                        }`}>
                          {c.forma_pagamento_preferida || 'Não definido'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.limite_fiado > 0 ? (
                          <span className="text-red-500">R$ {c.limite_fiado.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">R$ 0,00</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedClientDetails(c)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-405 dark:hover:bg-slate-750 font-black rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                          >
                            <Award className="w-3 h-3 text-indigo-500" />
                            <span>Fidelidade & Histórico</span>
                          </button>
                          {formattedAddress && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-755 font-bold rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                              title="Visualizar endereço no Google Maps"
                            >
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              <span>Mapa</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleEditTrigger(c)}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-750 font-bold rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o cliente "${c.nome}"?`)) {
                                onDeleteCliente(c.id);
                              }
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-955/20 dark:text-rose-450 dark:hover:bg-rose-900/40 font-bold rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
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

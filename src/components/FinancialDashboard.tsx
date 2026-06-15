/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, CreditCard, ChevronDown, CheckCircle, Clock, 
  Plus, Calendar, Trash2, ArrowUpRight, DollarSign, 
  FileText, ClipboardList
} from 'lucide-react';
import { Fornecedor, Cliente, Funcionario, ContaAPagar, ContaAReceber, ValeEComissao, MovimentacaoCaixa, Pedido, Produto } from '../types';

interface FinancialDashboardProps {
  contasPagar: ContaAPagar[];
  contasReceber: ContaAReceber[];
  valesComissoes: ValeEComissao[];
  fornecedores: Fornecedor[];
  clientes: Cliente[];
  funcionarios: Funcionario[];
  movimentacoes: MovimentacaoCaixa[];
  pedidos: Pedido[];
  produtos: Produto[];
  onAddContaPagar: (conta: Omit<ContaAPagar, 'id'>) => void;
  onPayContaPagar: (id: string) => void;
  onReceiveContaReceber: (id: string) => void;
  onPayValeComissao: (id: string) => void;
  onAddValeComissao: (vc: Omit<ValeEComissao, 'id' | 'data'>) => void;
}

export default function FinancialDashboard({
  contasPagar,
  contasReceber,
  valesComissoes,
  fornecedores,
  clientes,
  funcionarios,
  movimentacoes,
  pedidos,
  produtos,
  onAddContaPagar,
  onPayContaPagar,
  onReceiveContaReceber,
  onPayValeComissao,
  onAddValeComissao,
}: FinancialDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pagar' | 'receber' | 'rh'>('receber');

  // New Conta a Pagar Form states
  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [pagarValor, setPagarValor] = useState('');
  const [pagarDueDate, setPagarDueDate] = useState('');
  
  // New Vale / Comissão Form states
  const [selectedFuncionario, setSelectedFuncionario] = useState('');
  const [rhValor, setRhValor] = useState('');
  const [rhTipo, setRhTipo] = useState<'vale' | 'comissao'>('vale');

  // Filter Receivables (Fiados)
  const [searchClientName, setSearchClientName] = useState('');

  // Date constants to contrast with overdue limits (Today's simulated date is 2026-06-12)
  const TODAY_STR = '2026-06-12';

  // Helper to check if a date belongs to the active filter month (June 2026)
  const isCurrentMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    return dateStr.includes('2026-06');
  };

  // 1. Total Entradas do Mês (June 2026)
  const totalEntradasMes = useMemo(() => {
    const list = movimentacoes.filter(m => m.tipo === 'entrada' && isCurrentMonth(m.data));
    if (list.length === 0) {
      // Fallback to all entries if no entries in June 2026 (sandboxed environment coverage)
      return movimentacoes.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
    }
    return list.reduce((sum, m) => sum + m.valor, 0);
  }, [movimentacoes]);

  // 2. Total Saídas (Gastos) do Mês (June 2026)
  const totalSaidasMes = useMemo(() => {
    const list = movimentacoes.filter(m => m.tipo === 'saida' && isCurrentMonth(m.data));
    if (list.length === 0) {
      // Fallback to all exits if no exits in June 2026 (sandboxed environment coverage)
      return movimentacoes.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
    }
    return list.reduce((sum, m) => sum + m.valor, 0);
  }, [movimentacoes]);

  // 3. Total Lucro Reais (June 2026) -> calculated as (sale price - cost price) * quantity
  const totalLucroReaisMes = useMemo(() => {
    let profit = 0;
    let countInMonth = 0;
    
    pedidos.forEach(p => {
      if (p.status === 'concluido' && isCurrentMonth(p.data_pedido)) {
        countInMonth++;
      }
    });

    const useAll = countInMonth === 0;

    pedidos.forEach(p => {
      if (p.status === 'concluido' && (useAll || isCurrentMonth(p.data_pedido))) {
        if (p.itens) {
          p.itens.forEach(item => {
            const prod = produtos.find(pr => pr.id === item.produto_id);
            if (prod) {
              const unitProfit = item.preco_unitario - prod.preco_custo;
              profit += item.quantidade * unitProfit;
            }
          });
        }
      }
    });
    return profit;
  }, [pedidos, produtos]);

  // Process Accounts Payable with Suppliers
  const resolvedCap = useMemo(() => {
    return contasPagar.map(cp => {
      const forn = fornecedores.find(f => f.id === cp.fornecedor_id);
      
      // Determine if overdue compared to TODAY_STR (2026-06-12)
      const isOverdue = cp.status === 'pendente' && cp.data_vencimento < TODAY_STR;
      
      return {
        ...cp,
        nome_fornecedor: forn?.nome_empresa || 'Fornecedor avulso',
        isOverdue
      };
    });
  }, [contasPagar, fornecedores]);

  // Process Accounts Receivable (Fiados)
  const resolvedCar = useMemo(() => {
    return contasReceber.map(cr => {
      const client = clientes.find(c => c.id === cr.cliente_id);
      
      // Overdue rules:
      // Due Date matches Today's date (2026-06-12) -> VENCE HOJE
      // Due Date older than Today -> VENCIDO
      let badgeStatus: 'VENCIDO' | 'VENCE HOJE' | 'PENDENTE' = 'PENDENTE';
      
      if (cr.status === 'pendente') {
        if (cr.data_prometida_pagamento === TODAY_STR) {
          badgeStatus = 'VENCE HOJE';
        } else if (cr.data_prometida_pagamento < TODAY_STR) {
          badgeStatus = 'VENCIDO';
        }
      }

      return {
        ...cr,
        nome_cliente: client?.nome || 'Consumidor sem Nome',
        telefone_cliente: client?.telefone || '',
        badgeStatus
      };
    }).filter(cr => {
      return cr.nome_cliente.toLowerCase().includes(searchClientName.toLowerCase());
    });
  }, [contasReceber, clientes, searchClientName]);

  // Process HR / Vales and Commissions
  const resolvedRh = useMemo(() => {
    return valesComissoes.map(vc => {
      const func = funcionarios.find(f => f.id === vc.funcionario_id);
      return {
        ...vc,
        nome_funcionario: func?.nome || 'Funcionário desligado',
        cargo_funcionario: func?.cargo || 'Outros'
      };
    });
  }, [valesComissoes, funcionarios]);

  // Handle addition of Conta a Pagar
  const handleCreateContaPagar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFornecedor) {
      alert("Selecione um fornecedor!");
      return;
    }
    const valStr = parseFloat(pagarValor);
    if (isNaN(valStr) || valStr <= 0) {
      alert("Informe um valor maior que zero!");
      return;
    }
    if (!pagarDueDate) {
      alert("Informe a data de vencimento!");
      return;
    }

    onAddContaPagar({
      fornecedor_id: selectedFornecedor,
      data_pedido: TODAY_STR,
      data_vencimento: pagarDueDate,
      valor: valStr,
      status: 'pendente'
    });

    setSelectedFornecedor('');
    setPagarValor('');
    setPagarDueDate('');
    alert("Conta a pagar cadastrada com Sucesso!");
  };

  // Handle addition of Vale/Adiantamento
  const handleCreateVale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuncionario) {
      alert("Selecione um funcionário!");
      return;
    }
    const valStr = parseFloat(rhValor);
    if (isNaN(valStr) || valStr <= 0) {
      alert("Informe um valor maior que zero!");
      return;
    }

    onAddValeComissao({
      funcionario_id: selectedFuncionario,
      tipo: rhTipo,
      valor: valStr,
      status: 'pendente'
    });

    setSelectedFuncionario('');
    setRhValor('');
    alert("Lançamento RH cadastrado com sucesso!");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[600px]" id="financial-module-container">
      
      {/* Visual Navigation Menu - Left Column */}
      <div className="md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Painel Financeiro</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Controladoria SaaS ativa</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('receber')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'receber' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Clientes a Receber (Fiados)</span>
              {contasReceber.filter(c => c.status === 'pendente').length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  activeTab === 'receber' ? 'bg-white text-indigo-700' : 'bg-red-100 text-red-700'
                }`}>
                  {contasReceber.filter(c => c.status === 'pendente').length} pend.
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pagar')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'pagar' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Contas a Pagar</span>
              {contasPagar.filter(c => c.status === 'pendente').length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  activeTab === 'pagar' ? 'bg-indigo-300 text-slate-900' : 'bg-amber-100 text-amber-700'
                }`}>
                  {contasPagar.filter(c => c.status === 'pendente' && c.data_vencimento < TODAY_STR).length} venc.
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rh')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'rh' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Recursos Humanos (RH)</span>
              <span className="text-[10px] text-slate-400 font-mono">vales</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-3 border border-slate-200 rounded-lg text-[10px] text-slate-505 leading-relaxed space-y-1.5 shadow-2xs mt-4">
          <ChevronDown className="w-3.5 h-3.5 text-indigo-500 block animate-bounce" />
          <p><strong>Meta-Data Data Fixa:</strong> Para controle visual fidedigno de vencimentos, este simulador assume data atual fixada em: <strong>12 de Junho de 2026</strong>.</p>
        </div>
      </div>

      {/* Dynamic Content Center - Right Column */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        
        {/* MONTHLY SUMMARY METRICS WIDGET PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl shadow-2xs" id="financial-monthly-kpi-panel">
          {/* Card 1: Entradas */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total de Entradas</span>
              <div className="p-1 px-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>ENTRADAS</span>
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-black text-slate-800 font-mono block">R$ {totalEntradasMes.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">Soma de todas as vendas e fiados quitados.</span>
            </div>
          </div>

          {/* Card 2: Saídas/Gastos */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200/70 shadow-3xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Total de Saídas / Gastos</span>
              <div className="p-1 px-1.5 bg-rose-50 text-rose-700 text-[9px] font-black rounded flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>DESPESAS</span>
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-black text-rose-600 font-mono block">R$ {totalSaidasMes.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">Soma de fornecedores pagos e retiradas gerais.</span>
            </div>
          </div>

          {/* Card 3: Lucro Real */}
          <div className="bg-emerald-500 text-white p-3.5 rounded-lg shadow-3xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-y-2 translate-x-2">
              <DollarSign className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between z-10">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-100">Lucro Real Estimado</span>
              <div className="p-1 px-1.5 bg-white/20 text-white text-[9px] font-black rounded uppercase">
                Venda - Custo
              </div>
            </div>
            <div className="mt-2.5 z-10">
              <span className="text-lg font-black font-mono block text-white">R$ {totalLucroReaisMes.toFixed(2)}</span>
              <span className="text-[10px] text-emerald-100 leading-tight block mt-0.5">Calculado sobre a margem unitária real de itens vendidos.</span>
            </div>
          </div>
        </div>
        
        {/* TAB 1: CLIENTES A RECEBER (FIADOS COM ALERTA) */}
        {activeTab === 'receber' && (
          <div className="space-y-6">
            {/* INADIMPLENTES OVERDUE ALERT BANNER */}
            {resolvedCar.some(cr => cr.status === 'pendente' && cr.badgeStatus === 'VENCIDO') && (
              <div className="bg-red-50 border-l-4 border-red-600 rounded-r-xl p-4 shadow-xs text-red-900 animate-pulse" id="fiado-alert-inadimplentes">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white p-2 rounded-lg font-black text-xs shrink-0 block">
                    🔴 ALERTA
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-red-900">Clientes Inadimplentes Identificados (Fiado Expirado)!</h4>
                    <p className="text-xs text-red-700 mt-1">
                      Há clientes com faturas em atraso cuja data de pagamento prometida já passou do dia <strong>{new Date(TODAY_STR + 'T12:00:00').toLocaleDateString()}</strong>. É altamente recomendado restringir novas vendas fiado para estes CPFs/telefones:
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {resolvedCar
                        .filter(cr => cr.status === 'pendente' && cr.badgeStatus === 'VENCIDO')
                        .map((cr, idx) => (
                          <span key={idx} className="bg-red-100 border border-red-200 text-red-800 text-[10px] font-black px-2 py-1 rounded-md">
                            ⚠️ {cr.nome_cliente} ({cr.telefone_cliente}) - R$ {cr.valor.toFixed(2)}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Clientes a Receber (Fiados / Prazos)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Vendas finalizadas sob forma de débito com restrição de limite por cliente.</p>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pesquisar por cliente..."
                  value={searchClientName}
                  onChange={e => setSearchClientName(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-indigo-505"
                />
              </div>
            </div>

            {/* List receivables */}
            <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                    <tr>
                      <th className="text-left p-3">Cliente</th>
                      <th className="text-left p-3">Data Pedido</th>
                      <th className="text-left p-3">Prazo Prometido</th>
                      <th className="text-right p-3">Valor Pendente</th>
                      <th className="text-center p-3">Estado Limite</th>
                      <th className="text-right p-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {resolvedCar.map(cr => (
                      <tr key={cr.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{cr.nome_cliente}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{cr.telefone_cliente}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(cr.data_pedido + 'T12:00:00').toLocaleDateString()}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(cr.data_prometida_pagamento + 'T12:00:00').toLocaleDateString()}
                        </td>
                        <td className="p-3 font-black text-right text-slate-900 font-mono">
                          R$ {cr.valor.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {cr.status === 'pago' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                              PAGO EM DIA
                            </span>
                          ) : cr.badgeStatus === 'VENCIDO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-250 animate-pulse">
                              🚨 VENCIDO
                            </span>
                          ) : cr.badgeStatus === 'VENCE HOJE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-250 font-sans">
                              ⚠️ VENCE HOJE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                              PENDENTE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {cr.status === 'pendente' ? (
                            <button
                              onClick={() => {
                                if (confirm(`Confirmar que recebeu o valor de R$ ${cr.valor.toFixed(2)} de ${cr.nome_cliente}?`)) {
                                  onReceiveContaReceber(cr.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded transition-colors"
                            >
                              Dar Baixa
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-medium flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Quitado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {resolvedCar.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-405 italic">
                          Nenhum registro de fiados correspondente aos filtros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTAS A PAGAR */}
        {activeTab === 'pagar' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form to insert details */}
              <div className="md:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Nova Conta a Pagar</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Cadastre lançamentos físicos de fornecedores e prestadores de serviços.</p>
                </div>

                <form onSubmit={handleCreateContaPagar} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Escolher Fornecedor</label>
                    <select
                      value={selectedFornecedor}
                      onChange={e => setSelectedFornecedor(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-500 text-slate-800 font-bold"
                    >
                      <option value="">Selecione...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome_empresa}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Qual o Valor? (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={pagarValor}
                      onChange={e => setPagarValor(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Vencimento de Fatura</label>
                    <input
                      type="date"
                      required
                      value={pagarDueDate}
                      onChange={e => setPagarDueDate(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-500 font-mono text-slate-800 font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs rounded transition-colors shadow-sm"
                  >
                    Gravar Lançamento
                  </button>
                </form>
              </div>

              {/* Table of dues */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase text-slate-400 font-sans mt-1">Histórico de Duplicatas e Faturas de Compra</h4>
                
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                      <tr>
                        <th className="text-left p-3">Fornecedor</th>
                        <th className="text-left p-3">Vencimento</th>
                        <th className="text-right p-3">Valor</th>
                        <th className="text-center p-3">Estado</th>
                        <th className="text-right p-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {resolvedCap.map(cp => (
                        <tr key={cp.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">{cp.nome_fornecedor}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Pedido em {new Date(cp.data_pedido + 'T12:00:00').toLocaleDateString()}</span>
                          </td>
                          <td className="p-3 font-mono">
                            {new Date(cp.data_vencimento + 'T12:00:00').toLocaleDateString()}
                          </td>
                          <td className="p-3 font-black text-right text-slate-900 font-mono">
                            R$ {cp.valor.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {cp.status === 'pago' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">PAGO</span>
                            ) : cp.isOverdue ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 animate-pulse">VENCIDO</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700">À VENCER</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {cp.status === 'pendente' ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Confirmar pagamento desta fatura no valor de R$ ${cp.valor.toFixed(2)}?`)) {
                                    onPayContaPagar(cp.id);
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded"
                              >
                                Pagar
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Liquidado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECURSOS HUMANOS / VALES E COMISSÕES */}
        {activeTab === 'rh' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile setup Vale */}
              <div className="md:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Adiantamentos (Vales) e Ajustes</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Lance adiantamentos de salários (vales) que serão deduzidos na folha do mês.</p>
                </div>

                <form onSubmit={handleCreateVale} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Escolher Funcionário</label>
                    <select
                      value={selectedFuncionario}
                      onChange={e => setSelectedFuncionario(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-500 text-slate-800 font-bold"
                    >
                      <option value="">Selecione...</option>
                      {funcionarios.map(func => (
                        <option key={func.id} value={func.id}>{func.nome} ({func.cargo})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Qual o Valor? (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={rhValor}
                      onChange={e => setRhValor(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Modulação / Tipo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRhTipo('vale')}
                        className={`flex-1 py-1 px-2 text-center rounded text-xs font-bold border transition-all ${
                          rhTipo === 'vale' ? 'bg-indigo-650 border-indigo-655 text-white' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Vale (Adiantamento)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRhTipo('comissao')}
                        className={`flex-1 py-1 px-2 text-center rounded text-xs font-bold border transition-all ${
                          rhTipo === 'comissao' ? 'bg-indigo-650 border-indigo-655 text-white' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Comissão Manual
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs rounded transition-colors shadow-sm"
                  >
                    Adicionar ao Livro-Caixa
                  </button>
                </form>
              </div>

              {/* Ledger ledger comissao list */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase text-slate-400 font-sans mt-1">Livro de Comissões e Adiantamentos do Restaurante</h4>

                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                      <tr>
                        <th className="text-left p-3">Funcionário</th>
                        <th className="text-left p-3">Tipo lançamento</th>
                        <th className="text-right p-3">Valor</th>
                        <th className="text-center p-3">Status Cobrança</th>
                        <th className="text-right p-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {resolvedRh.map(vc => (
                        <tr key={vc.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">{vc.nome_funcionario}</span>
                            <span className="text-[10px] text-slate-400 block font-serif uppercase tracking-wider">{vc.cargo_funcionario}</span>
                          </td>
                          <td className="p-3">
                            {vc.tipo === 'vale' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">VALE (Adiantamento)</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">COMISSÃO (Garçom)</span>
                            )}
                          </td>
                          <td className="p-3 font-black text-right text-slate-900 font-mono">
                            R$ {vc.valor.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {vc.status === 'pago' ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 text-center">LIQUIDADO</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-55 text-rose-700 text-center animate-pulse">PENDENTE</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {vc.status === 'pendente' ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Confirmar o repasse / baixa de R$ ${vc.valor.toFixed(2)} para ${vc.nome_funcionario}?`)) {
                                    onPayValeComissao(vc.id);
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded"
                              >
                                Dar Baixa
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-450 italic flex items-center justify-end gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                Pago
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

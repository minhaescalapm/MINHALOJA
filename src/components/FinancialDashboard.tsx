import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building, CreditCard, ChevronDown, CheckCircle, Clock, 
  Plus, Calendar, Trash2, ArrowUpRight, DollarSign, 
  FileText, ClipboardList, Users, ShieldAlert, Edit, Eye, Trash, CheckSquare, Loader2
} from 'lucide-react';
import { 
  Fornecedor, Cliente, Funcionario, ContaAPagar, 
  ContaAReceber, ValeEComissao, MovimentacaoCaixa, Pedido, Produto,
  HistoricoPagamentoFuncionario
} from '../types';
import { formatPhoneForInputDisplay, cleanAndFormatPhoneForSave } from '../utils/phone';

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
  
  // Optional for deletion/modifications
  onDeleteContaPagar?: (id: string) => void;
  onDeleteContaReceber?: (id: string) => void;
  onDeleteValeComissao?: (id: string) => void;
  onDeleteMovimentacao?: (id: string) => void;
  onUpdateContaPagar?: (id: string, update: Partial<ContaAPagar>) => void;
  onUpdateValeComissao?: (id: string, update: Partial<ValeEComissao>) => void;
  onAddMovimentacao?: (m: Omit<MovimentacaoCaixa, 'id' | 'data'>) => void;

  // Added Employee Callbacks
  onAddFuncionario?: (f: Omit<Funcionario, 'id' | 'data_cadastro'>) => void;
  onUpdateFuncionario?: (id: string, f: Partial<Funcionario>) => void;
  onDeleteFuncionario?: (id: string) => void;
  onSetValesComissoes?: (vales: ValeEComissao[]) => void;
  tenantId?: string;
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
  onDeleteContaPagar,
  onDeleteContaReceber,
  onDeleteValeComissao,
  onDeleteMovimentacao,
  onUpdateContaPagar,
  onUpdateValeComissao,
  onAddMovimentacao,
  onAddFuncionario,
  onUpdateFuncionario,
  onDeleteFuncionario,
  onSetValesComissoes,
  tenantId = 'bella'
}: FinancialDashboardProps) {
  
  // Horizontal sub-tabs: Funcionários, Entradas, Saídas, Lucro Real
  const [activeTab, setActiveTab] = useState<'funcionarios' | 'entradas' | 'saidas' | 'lucro_real'>('lucro_real');

  // Today standard simulation date
  const TODAY_STR = '2026-06-12';

  // State managers for fast edits or form creations
  const [selectedFuncionario, setSelectedFuncionario] = useState('');
  const [rhValor, setRhValor] = useState('');
  const [rhTipo, setRhTipo] = useState<'vale' | 'comissao'>('vale');

  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [pagarValor, setPagarValor] = useState('');
  const [pagarDueDate, setPagarDueDate] = useState('');

  const [manualEntradaValor, setManualEntradaValor] = useState('');
  const [manualEntradaDesc, setManualEntradaDesc] = useState('');
  const [manualSaidaValor, setManualSaidaValor] = useState('');
  const [manualSaidaDesc, setManualSaidaDesc] = useState('');

  // Editing registers states
  const [editingContaPagarId, setEditingContaPagarId] = useState<string | null>(null);
  const [editPagarValor, setEditPagarValor] = useState('');
  const [editPagarDate, setEditPagarDate] = useState('');

  const [editingValeId, setEditingValeId] = useState<string | null>(null);
  const [editValeVal, setEditValeVal] = useState('');

  // Staff and Payout Cycle States
  const [isAddingFuncionario, setIsAddingFuncionario] = useState(false);
  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncCargo, setNewFuncCargo] = useState<'admin' | 'caixa' | 'garcom'>('garcom');
  const [newFuncTelefone, setNewFuncTelefone] = useState('');
  const [newFuncComissao, setNewFuncComissao] = useState('10');
  const [newFuncSalario, setNewFuncSalario] = useState('1800');
  
  // Closing day configured state
  const [fechamentoDia, setFechamentoDia] = useState<number>(() => {
    const saved = localStorage.getItem(`saas_${tenantId}_fechamento_dia`);
    return saved ? parseInt(saved) : 5;
  });

  useEffect(() => {
    localStorage.setItem(`saas_${tenantId}_fechamento_dia`, fechamentoDia.toString());
  }, [fechamentoDia, tenantId]);

  const getCycleDates = (day: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    
    // Configured closing date in this month
    const closingDateThisMonth = new Date(currentYear, currentMonth, day);
    
    let startDate: Date;
    let endDate: Date;
    
    if (now <= closingDateThisMonth) {
      // We are in the cycle ending this month (starts previous month day + 1)
      startDate = new Date(currentYear, currentMonth - 1, day + 1);
      endDate = closingDateThisMonth;
    } else {
      // We are in the cycle starting this month and ending next month
      startDate = new Date(currentYear, currentMonth, day + 1);
      endDate = new Date(currentYear, currentMonth + 1, day);
    }
    
    const fmt = (d: Date) => {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    return {
      start: fmt(startDate),
      end: fmt(endDate),
      closingDay: day
    };
  };

  const currentCycle = getCycleDates(fechamentoDia);

  // Employee address fields state
  const [newFuncCep, setNewFuncCep] = useState('');
  const [newFuncEnd, setNewFuncEnd] = useState('');
  const [newFuncNumero, setNewFuncNumero] = useState('');
  const [newFuncBairro, setNewFuncBairro] = useState('');
  const [newFuncCidade, setNewFuncCidade] = useState('');
  const [loadingFuncCep, setLoadingFuncCep] = useState(false);
  const [funcCepSuccess, setFuncCepSuccess] = useState(false);

  // Edit Employee address fields state
  const [editFuncCep, setEditFuncCep] = useState('');
  const [editFuncEnd, setEditFuncEnd] = useState('');
  const [editFuncNumero, setEditFuncNumero] = useState('');
  const [editFuncBairro, setEditFuncBairro] = useState('');
  const [editFuncCidade, setEditFuncCidade] = useState('');
  const [loadingEditFuncCep, setLoadingEditFuncCep] = useState(false);

  // Auto-lookup employee CEP on change
  useEffect(() => {
    const clean = newFuncCep.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingFuncCep(true);
      setFuncCepSuccess(false);
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setNewFuncEnd(data.logradouro || '');
            setNewFuncBairro(data.bairro || '');
            setNewFuncCidade(`${data.localidade || ''} - ${data.uf || ''}`);
            setFuncCepSuccess(true);
            setTimeout(() => {
              const numInput = document.getElementById('newFuncNumeroInput');
              if (numInput) numInput.focus();
            }, 100);
          } else {
            alert('CEP do funcionário não encontrado!');
          }
        })
        .catch(err => {
          console.error('Erro ao buscar CEP do funcionário:', err);
        })
        .finally(() => {
          setLoadingFuncCep(false);
        });
    }
  }, [newFuncCep]);

  // Edit employee CEP lookup
  useEffect(() => {
    const clean = editFuncCep.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingEditFuncCep(true);
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setEditFuncEnd(data.logradouro || '');
            setEditFuncBairro(data.bairro || '');
            setEditFuncCidade(`${data.localidade || ''} - ${data.uf || ''}`);
            setTimeout(() => {
              const numInput = document.getElementById('editFuncNumeroInput');
              if (numInput) numInput.focus();
            }, 100);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingEditFuncCep(false));
    }
  }, [editFuncCep]);

  const [rhMotivo, setRhMotivo] = useState('');
  const [rhTipoExpanded, setRhTipoExpanded] = useState<'vale' | 'comissao' | 'bonificacao'>('vale');

  const [historicoPagamentos, setHistoricoPagamentos] = useState<HistoricoPagamentoFuncionario[]>(() => {
    const dataset = localStorage.getItem(`saas_${tenantId}_historico_pagamentos_funcionarios`);
    return dataset ? JSON.parse(dataset) : [];
  });

  React.useEffect(() => {
    localStorage.setItem(`saas_${tenantId}_historico_pagamentos_funcionarios`, JSON.stringify(historicoPagamentos));
  }, [historicoPagamentos, tenantId]);

  // Math consolidators for LUCRO REAL:
  // Formula: Lucro Real = (Receitas de Vendas/Entradas) - (Custos de Produtos Vendidos + Folha de Funcionários + Contas de Consumo + Saídas Gerais)

  // 1. Receitas de Vendas / Entradas
  const receitasVendas = useMemo(() => {
    // Total completed order values
    return pedidos
      .filter(p => p.status === 'concluido' || p.status === 'entregue')
      .reduce((sum, p) => sum + p.total, 0);
  }, [pedidos]);

  const receitasManualEntradas = useMemo(() => {
    // Manual cash-in entries
    return movimentacoes
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0);
  }, [movimentacoes]);

  const faturamentoTotal = useMemo(() => {
    return receitasVendas + receitasManualEntradas;
  }, [receitasVendas, receitasManualEntradas]);

  // 2. Custos de Produtos Vendidos (CPV)
  const custoProdutosVendidos = useMemo(() => {
    let cpv = 0;
    pedidos.forEach(p => {
      if (p.status === 'concluido' || p.status === 'entregue') {
        p.itens?.forEach(item => {
          const prod = produtos.find(pr => pr.id === item.produto_id);
          if (prod) {
            cpv += item.quantidade * prod.preco_custo;
          } else {
            // fallback (let's assume unit cost is 40% of selling price if not found)
            cpv += item.quantidade * (item.preco_unitario * 0.4);
          }
        });
      }
    });
    return cpv;
  }, [pedidos, produtos]);

  // 3. Folha de Funcionários
  const folhaFuncionarios = useMemo(() => {
    // Sum of base salaries of all active staff
    const baseSalariesSum = funcionarios.reduce((sum, f) => sum + (f.salario_base || 1800), 0);
    // Paid commissions or active vales
    const rhAdditionsVales = valesComissoes.reduce((sum, vc) => sum + vc.valor, 0);
    return baseSalariesSum + rhAdditionsVales;
  }, [funcionarios, valesComissoes]);

  // 4. Contas de Consumo + Saídas Gerais
  const contasConsumo = useMemo(() => {
    // Supplier billing or bills payable
    return contasPagar.reduce((sum, cp) => sum + cp.valor, 0);
  }, [contasPagar]);

  const saidasGeraisManual = useMemo(() => {
    // Manual sangrias (movimentacoes de saida)
    return movimentacoes
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0);
  }, [movimentacoes]);

  const despesasOutrasSoma = useMemo(() => {
    return contasConsumo + saidasGeraisManual;
  }, [contasConsumo, saidasGeraisManual]);

  // Summary: Lucro Real
  const lucroRealCalculado = useMemo(() => {
    const totalDespesas = custoProdutosVendidos + folhaFuncionarios + despesasOutrasSoma;
    return faturamentoTotal - totalDespesas;
  }, [faturamentoTotal, custoProdutosVendidos, folhaFuncionarios, despesasOutrasSoma]);

  // Handlers
  const handleAddNewContaPagar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFornecedor) {
      alert("Selecione um fornecedor para registrar a despesa correspondente!");
      return;
    }
    const val = parseFloat(pagarValor);
    if (isNaN(val) || val <= 0) {
      alert("Insira um valor comercial válido!");
      return;
    }
    if (!pagarDueDate) {
      alert("Selecione a data limite do vencimento!");
      return;
    }

    onAddContaPagar({
      fornecedor_id: selectedFornecedor,
      data_pedido: TODAY_STR,
      data_vencimento: pagarDueDate,
      valor: val,
      status: 'pendente'
    });

    setSelectedFornecedor('');
    setPagarValor('');
    setPagarDueDate('');
    alert("Conta a pagar registrada no fluxo financeiro!");
  };

  const handleAddNewValeComissao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuncionario) {
      alert("Selecione o funcionário!");
      return;
    }
    const val = parseFloat(rhValor);
    if (isNaN(val) || val <= 0) {
      alert("Insira um valor numérico válido!");
      return;
    }

    onAddValeComissao({
      funcionario_id: selectedFuncionario,
      tipo: rhTipoExpanded,
      valor: val,
      status: 'pendente',
      descricao: rhMotivo.trim() || undefined
    });

    setSelectedFuncionario('');
    setRhValor('');
    setRhMotivo('');
    alert("Benefício/Gasto registrado na folha de pessoal!");
  };

  const handleAddFuncionarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuncName) {
      alert("Informe o nome do funcionário!");
      return;
    }

    onAddFuncionario?.({
      nome: newFuncName.trim(),
      cargo: newFuncCargo,
      telefone: cleanAndFormatPhoneForSave(newFuncTelefone),
      comissao_percentual: parseFloat(newFuncComissao) || 0,
      salario_base: parseFloat(newFuncSalario) || 1800,
      cep: newFuncCep,
      endereco: newFuncEnd,
      numero: newFuncNumero,
      bairro: newFuncBairro,
      cidade: newFuncCidade
    });

    setNewFuncName('');
    setNewFuncCargo('garcom');
    setNewFuncTelefone('');
    setNewFuncComissao('10');
    setNewFuncSalario('1800');
    setNewFuncCep('');
    setNewFuncEnd('');
    setNewFuncNumero('');
    setNewFuncBairro('');
    setNewFuncCidade('');
    setFuncCepSuccess(false);
    setIsAddingFuncionario(false);
    alert("Funcionário cadastrado!");
  };

  const handleSaveFuncionarioUpdate = (id: string) => {
    if (!editFuncName) {
      alert("Nome é obrigatório!");
      return;
    }
    onUpdateFuncionario?.(id, {
      nome: editFuncName.trim(),
      cargo: editFuncCargo,
      telefone: cleanAndFormatPhoneForSave(editFuncTelefone),
      comissao_percentual: parseFloat(editFuncComissao) || 0,
      salario_base: parseFloat(editFuncSalario) || 1800,
      cep: editFuncCep,
      endereco: editFuncEnd,
      numero: editFuncNumero,
      bairro: editFuncBairro,
      cidade: editFuncCidade
    });
    setEditingFuncionarioId(null);
    alert("Funcionário atualizado!");
  };

  const handleFecharCiclo = (funcionarioId: string) => {
    const f = funcionarios.find(emp => emp.id === funcionarioId);
    if (!f) return;

    const salarioFixo = f.salario_base || 1800;

    // 1. Calculate active commission from sales
    const salesCommissions = pedidos
      .filter(p => (p.status === 'concluido' || p.status === 'entregue') && p.funcionario_id === f.id)
      .reduce((sum, p) => sum + ((p.total || 0) * ((f.comissao_percentual || 0) / 100)), 0);

    // 2. Active manual commissions
    const manualCommissions = valesComissoes
      .filter(vc => vc.funcionario_id === f.id && vc.tipo === 'comissao' && vc.status === 'pendente')
      .reduce((sum, vc) => sum + vc.valor, 0);

    const totalComissoes = salesCommissions + manualCommissions;

    // 3. Active vales
    const totalVales = valesComissoes
      .filter(vc => vc.funcionario_id === f.id && vc.tipo === 'vale' && vc.status === 'pendente')
      .reduce((sum, vc) => sum + vc.valor, 0);

    // 4. Active bonificações
    const totalBonificacoes = valesComissoes
      .filter(vc => vc.funcionario_id === f.id && vc.tipo === 'bonificacao' && vc.status === 'pendente')
      .reduce((sum, vc) => sum + vc.valor, 0);

    // 5. Net Salary
    const salarioLiquido = salarioFixo + totalComissoes + totalBonificacoes - totalVales;

    if (salarioLiquido < 0) {
      alert("O salário líquido não pode ser negativo para fechar o ciclo!");
      return;
    }

    // Create immutable record
    const novoRegistro: HistoricoPagamentoFuncionario = {
      id: `hp-${Date.now()}`,
      funcionario_id: f.id,
      nome_funcionario: f.nome,
      cargo: f.cargo,
      salario_base: salarioFixo,
      comissoes: totalComissoes,
      bonificacoes: totalBonificacoes,
      vales: totalVales,
      salario_liquido: salarioLiquido,
      data_pagamento: new Date().toISOString().split('T')[0]
    };

    setHistoricoPagamentos(prev => [novoRegistro, ...prev]);

    // Debit as Outflow in cash flow (onAddMovimentacao)
    onAddMovimentacao?.({
      caixa_id: 'financeiro',
      tipo: 'saida',
      valor: salarioLiquido,
      forma_pagamento: 'pix',
      status_pagamento: 'pago',
      descricao: `Folha Pagto: ${f.nome} (${f.cargo}) - Líquido R$ ${salarioLiquido.toFixed(2)}`,
      operador: 'Gerente Geral'
    });

    // Zero out employee vales and commissions for the next month
    const updatedValesComissoes = valesComissoes.map(vc => {
      if (vc.funcionario_id === f.id) {
        return { ...vc, status: 'pago' as const };
      }
      return vc;
    });

    onSetValesComissoes?.(updatedValesComissoes);

    alert(`Folha fechada com sucesso para ${f.nome}! R$ ${salarioLiquido.toFixed(2)} foi debitado no fluxo de caixa.`);
  };

  const [editingFuncionarioId, setEditingFuncionarioId] = useState<string | null>(null);
  const [editFuncName, setEditFuncName] = useState('');
  const [editFuncCargo, setEditFuncCargo] = useState<'admin' | 'caixa' | 'garcom'>('garcom');
  const [editFuncTelefone, setEditFuncTelefone] = useState('');
  const [editFuncComissao, setEditFuncComissao] = useState('');
  const [editFuncSalario, setEditFuncSalario] = useState('');

  const handleAddManualEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualEntradaValor);
    if (isNaN(val) || val <= 0) {
      alert("Valor inválido!");
      return;
    }
    if (!onAddMovimentacao) {
      alert("Não foi possível salvar de imediato.");
      return;
    }

    onAddMovimentacao({
      caixa_id: 'financeiro',
      tipo: 'entrada',
      valor: val,
      forma_pagamento: 'dinheiro',
      status_pagamento: 'pago',
      descricao: manualEntradaDesc.trim() || 'Entrada Avulsa de Caixa',
      operador: 'Gerente Geral'
    });

    setManualEntradaValor('');
    setManualEntradaDesc('');
    alert("Entrada manual de capital adicionada!");
  };

  const handleAddManualSaida = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualSaidaValor);
    if (isNaN(val) || val <= 0) {
      alert("Valor inválido!");
      return;
    }
    if (!onAddMovimentacao) {
      alert("Não foi possível salvar de imediato.");
      return;
    }

    onAddMovimentacao({
      caixa_id: 'financeiro',
      tipo: 'saida',
      valor: val,
      forma_pagamento: 'dinheiro',
      status_pagamento: 'pago',
      descricao: manualSaidaDesc.trim() || 'Retirada Avulsa de Caixa',
      operador: 'Gerente Geral'
    });

    setManualSaidaValor('');
    setManualSaidaDesc('');
    alert("Retirada (sangria) manual concluída!");
  };

  // Inline updater Saves
  const handleSaveContaPagarEdit = (id: string) => {
    const v = parseFloat(editPagarValor);
    if (isNaN(v) || v <= 0) {
      alert('Valor inválido!');
      return;
    }
    if (onUpdateContaPagar) {
      onUpdateContaPagar(id, {
        valor: v,
        data_vencimento: editPagarDate
      });
      setEditingContaPagarId(null);
      alert('Registro de conta a pagar alterado!');
    }
  };

  const handleSaveValeEdit = (id: string) => {
    const v = parseFloat(editValeVal);
    if (isNaN(v) || v <= 0) {
      alert('Valor inválido!');
      return;
    }
    if (onUpdateValeComissao) {
      onUpdateValeComissao(id, {
        valor: v
      });
      setEditingValeId(null);
      alert('Registro de benefício/vale alterado!');
    }
  };

  return (
    <div className="space-y-6" id="dashboard-financeiro-container">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Módulo de Fluxo de Caixa & Controladoria Comercial</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão unificada de recursos humanos, gastos, faturamento real e demonstrativos completos de lucro líquido da operação.
          </p>
        </div>

        {/* Horizontal Sub-Tabs Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-slate-205 dark:border-slate-800 w-full md:w-auto" id="financial-sub-tabs">
          {[
            { id: 'funcionarios', label: 'Funcionários' },
            { id: 'entradas', label: 'Entrada' },
            { id: 'saidas', label: 'Saída' },
            { id: 'lucro_real', label: 'Lucro Real' },
          ].map(sb => (
            <button
              key={sb.id}
              onClick={() => setActiveTab(sb.id as any)}
              className={`flex-1 md:flex-initial text-center px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                activeTab === sb.id 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-350 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {sb.label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}

      {/* 1. LUCRO REAL TAB */}
      {activeTab === 'lucro_real' && (
        <div className="space-y-6 animate-fadeIn" id="lucro-real-tab-content">
          {/* Main Profit Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden ring-4 ring-rose-500/20">
            <div className="absolute right-0 top-0 translate-y-3 translate-x-3 opacity-5 pointer-events-none">
              <DollarSign className="w-64 h-64" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-3">
                <span className="px-3 py-1 bg-rose-500 text-white text-[9px] font-black uppercase rounded-full tracking-widest leading-none">DEMONSTRATIVO DE RESULTADOS (DRE)</span>
                <h3 className="text-2xl font-black">Lucro Líquido Real Consolidado</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                  Demonstrativo em tempo real deduzindo custos de fabricação (CPV), folha de pessoal, despesas comerciais gerais e sangrias.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center flex flex-col justify-center">
                <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">RESULTADO FINAL (LUCRO REAL)</span>
                <span className={`text-3xl font-mono font-black mt-2 block ${lucroRealCalculado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {lucroRealCalculado.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-350 block mt-1.5 uppercase font-bold tracking-widest">
                  {lucroRealCalculado >= 0 ? '🟢 SUPERÁVIT OPERACIONAL' : '🔴 DÉFICIT DE CAIXA'}
                </span>
              </div>
            </div>
          </div>

          {/* DRE Breakdown Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="dre-bento">
            {/* Card 1: Revenue */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-[10px] font-black text-emerald-600 block uppercase tracking-wider select-none">
                  (+) RECEITAS / ENTRADAS
                </span>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Vendas (Checkout)</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {receitasVendas.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Entradas Manuais</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {receitasManualEntradas.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
                <div className="flex justify-between items-center w-full gap-2 min-w-0">
                  <span className="text-[10px] font-black text-slate-900 dark:text-slate-300 truncate min-w-0">FATURAMENTO BRUTO:</span>
                  <span className="font-mono font-bold text-[12px] text-emerald-600 dark:text-emerald-400 shrink-0">
                    R$ {faturamentoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: COGS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-500 block uppercase tracking-wider select-none">
                  (-) CUSTO PRODUTOS (CPV)
                </span>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Insumos/Ingredientes</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {custoProdutosVendidos.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Total Fabricados</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      {pedidos.filter(p => p.status === 'concluido' || p.status === 'entregue').reduce((sum, p) => sum + (p.itens?.length || 0), 0)} itens
                    </strong>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
                <div className="flex justify-between items-center w-full gap-2 min-w-0">
                  <span className="text-[10px] font-black text-slate-900 dark:text-slate-300 truncate min-w-0">TOTAL DE INSUMOS:</span>
                  <span className="font-mono font-bold text-[12px] text-red-500 dark:text-red-400 shrink-0">
                    R$ {custoProdutosVendidos.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Employees Payroll */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-500 block uppercase tracking-wider select-none">
                  (-) FOLHA PESSOAL (RH)
                </span>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Salários Base</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {funcionarios.reduce((sum, f) => sum + (f.salario_base || 1800), 0).toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Vales e Comissões</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {valesComissoes.reduce((sum, vc) => sum + vc.valor, 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
                <div className="flex justify-between items-center w-full gap-2 min-w-0">
                  <span className="text-[10px] font-black text-slate-900 dark:text-slate-300 truncate min-w-0">CUSTO COM PESSOAL:</span>
                  <span className="font-mono font-bold text-[12px] text-red-500 dark:text-red-400 shrink-0">
                    R$ {folhaFuncionarios.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Bills & Outflows */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-[10px] font-black text-rose-500 block uppercase tracking-wider select-none">
                  (-) CONSUMO & SAÍDAS
                </span>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Contas a Pagar</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {contasConsumo.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">Sangrias de Caixa</span>
                    <strong className="font-mono text-[11px] text-slate-800 dark:text-slate-100 shrink-0">
                      R$ {saidasGeraisManual.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-auto">
                <div className="flex justify-between items-center w-full gap-2 min-w-0">
                  <span className="text-[10px] font-black text-slate-900 dark:text-slate-300 truncate min-w-0">OUTRAS DESPESAS:</span>
                  <span className="font-mono font-bold text-[12px] text-red-500 dark:text-red-400 shrink-0">
                    R$ {despesasOutrasSoma.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FUNCIONÁRIOS TAB */}
      {activeTab === 'funcionarios' && (
        <div className="space-y-6 animate-fadeIn" id="funcionarios-tab-content">
          
          {/* Top Panel with Fast Action buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-3xs">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500 animate-pulse" />
                <span>Gestão Integrada de RH & Folha de Pagamento</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cada cadastro de funcionário exibe comissões, vales e bonificações mensais com encerramento de ciclo autônomo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-955 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                <span className="text-slate-400 font-bold uppercase text-[9px]">📆 Dia do Fechamento:</span>
                <select
                  value={fechamentoDia}
                  onChange={e => setFechamentoDia(parseInt(e.target.value))}
                  className="font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(dayNum => (
                    <option key={dayNum} value={dayNum}>Dia {dayNum < 10 ? `0${dayNum}` : dayNum}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setNewFuncName('');
                  setNewFuncCargo('garcom');
                  setNewFuncTelefone('');
                  setNewFuncComissao('10');
                  setNewFuncSalario('1800');
                  setNewFuncCep('');
                  setNewFuncEnd('');
                  setNewFuncNumero('');
                  setNewFuncBairro('');
                  setNewFuncCidade('');
                  setFuncCepSuccess(false);
                  setIsAddingFuncionario(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg shrink-0 flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ CADASTRAR FUNCIONÁRIO</span>
              </button>
            </div>
          </div>

          {/* Quick inline register form for new Employees */}
          {isAddingFuncionario && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn select-none">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-xl relative animate-scaleIn">
                <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3 mb-5">
                  <h4 className="text-sm font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>Novo Cadastro Profissional</span>
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setIsAddingFuncionario(false)}
                    className="text-xs bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    X
                  </button>
                </div>

                <form onSubmit={handleAddFuncionarioSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Albuquerque"
                        value={newFuncName}
                        onChange={e => setNewFuncName(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cargo / Função *</label>
                      <select
                        value={newFuncCargo}
                        onChange={e => setNewFuncCargo(e.target.value as any)}
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="garcom">Garçom</option>
                        <option value="caixa">Operador de Caixa</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Telefone Principal *</label>
                      <div className="flex">
                        <span className="inline-flex items-center gap-1.5 px-2 bg-slate-100 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-lg text-slate-500 font-mono text-[10px] select-none text-slate-800">🇧🇷 +55</span>
                        <input
                          type="text"
                          required
                          placeholder="Ex: (21) 99999-8888"
                          value={newFuncTelefone}
                          onChange={e => setNewFuncTelefone(formatPhoneForInputDisplay(e.target.value))}
                          className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-lg px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Salário Fixo Mensal R$ *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newFuncSalario}
                        onChange={e => setNewFuncSalario(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Comissão sobre Vendas % *</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={newFuncComissao}
                        onChange={e => setNewFuncComissao(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-indigo-650 dark:text-indigo-400 font-mono font-bold"
                      />
                    </div>

                    {/* ADDRESS FIELDS WITH CEP LOOKUP FOR STAFF */}
                    <div className="border-t border-slate-100 dark:border-slate-800 sm:col-span-2 pt-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Residência & Endereço</span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block mb-1 flex items-center gap-1">
                        <span>CEP *</span>
                        {loadingFuncCep && <Loader2 className="w-3 h-3 animate-spin text-indigo-505" />}
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: 22020-001" 
                        value={newFuncCep} 
                        onChange={e => setNewFuncCep(e.target.value)} 
                        className={`w-full text-xs bg-white dark:bg-slate-950 border rounded-lg px-3 py-2 font-semibold font-mono ${
                          funcCepSuccess ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'
                        }`} 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Rua / Logradouro *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Avenida Atlântica" 
                        value={newFuncEnd} 
                        onChange={e => setNewFuncEnd(e.target.value)} 
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Número *</label>
                      <input 
                        id="newFuncNumeroInput"
                        type="text" 
                        required
                        placeholder="Ex: 500, Ap 102" 
                        value={newFuncNumero} 
                        onChange={e => setNewFuncNumero(e.target.value)} 
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-semibold" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Bairro *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Copacabana" 
                        value={newFuncBairro} 
                        onChange={e => setNewFuncBairro(e.target.value)} 
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2" 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cidade / Estado *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Rio de Janeiro - RJ" 
                        value={newFuncCidade} 
                        onChange={e => setNewFuncCidade(e.target.value)} 
                        className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-850 pt-4 mt-6">
                    <button 
                      type="button"
                      onClick={() => setIsAddingFuncionario(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Descartar
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                    >
                      Gravar Funcionário
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Cards Panel Grid of Employees (O Painel de Funcionários com 5 itens requisitados) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {funcionarios.map(f => {
              const baseSalary = f.salario_base || 1800;

              // Calculate active proportional sales commissions (on completed table & delivery sales)
              const salesCommissions = pedidos
                .filter(p => (p.status === 'concluido' || p.status === 'entregue') && p.funcionario_id === f.id)
                .reduce((sum, p) => sum + ((p.total || 0) * ((f.comissao_percentual || 0) / 100)), 0);

              // Calculate active manual commissions
              const activeCommissions = valesComissoes
                .filter(vc => vc.funcionario_id === f.id && vc.tipo === 'comissao' && vc.status === 'pendente')
                .reduce((sum, vc) => sum + vc.valor, 0);

              const totalComs = salesCommissions + activeCommissions;

              // Calculate active bonuses
              const activeBonuses = valesComissoes
                .filter(vc => vc.funcionario_id === f.id && vc.tipo === 'bonificacao' && vc.status === 'pendente')
                .reduce((sum, vc) => sum + vc.valor, 0);

              // Calculate active vales
              const activeVales = valesComissoes
                .filter(vc => vc.funcionario_id === f.id && vc.tipo === 'vale' && vc.status === 'pendente')
                .reduce((sum, vc) => sum + vc.valor, 0);

              // Liquid Total Salary = Salario + Comissoes + Bonificações - Vales
              const finalLiquidSalary = baseSalary + totalComs + activeBonuses - activeVales;

              const isEditingF = editingFuncionarioId === f.id;

              return (
                <div key={f.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
                  {isEditingF ? (
                    // INLINE CARD EDITOR
                    <div className="p-5 space-y-4">
                      <div className="border-b pb-2 mb-3">
                        <h4 className="text-xs font-black text-amber-600 uppercase">🖊️ Modificar Perfil Profissional</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Nome</label>
                          <input
                            type="text"
                            value={editFuncName}
                            onChange={e => setEditFuncName(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Cargo</label>
                          <select
                            value={editFuncCargo}
                            onChange={e => setEditFuncCargo(e.target.value as any)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-white font-bold"
                          >
                            <option value="garcom">Garçom</option>
                            <option value="caixa">Operador de Caixa</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Telefone / Contato</label>
                          <div className="flex">
                            <span className="inline-flex items-center gap-1.5 px-2 bg-slate-100 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l text-slate-500 font-mono text-[10px] select-none text-slate-800">🇧🇷 +55</span>
                            <input
                              type="text"
                              value={editFuncTelefone}
                              onChange={e => setEditFuncTelefone(formatPhoneForInputDisplay(e.target.value))}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-r p-2 text-slate-800 dark:text-white font-mono font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Salário Fixo R$</label>
                          <input
                            type="number"
                            value={editFuncSalario}
                            onChange={e => setEditFuncSalario(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Comissão (%)</label>
                          <input
                            type="number"
                            value={editFuncComissao}
                            onChange={e => setEditFuncComissao(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-white font-mono font-bold"
                          />
                        </div>

                        {/* Inline address modification */}
                        <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Endereço Residencial</span>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-indigo-505 block mb-1 flex items-center gap-1">
                            <span>CEP</span>
                            {loadingEditFuncCep && <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-505" />}
                          </label>
                          <input
                            type="text"
                            value={editFuncCep}
                            onChange={e => setEditFuncCep(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Rua / Logradouro</label>
                          <input
                            type="text"
                            value={editFuncEnd}
                            onChange={e => setEditFuncEnd(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Número</label>
                          <input
                            id="editFuncNumeroInput"
                            type="text"
                            value={editFuncNumero}
                            onChange={e => setEditFuncNumero(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-850 dark:text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Bairro</label>
                          <input
                            type="text"
                            value={editFuncBairro}
                            onChange={e => setEditFuncBairro(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-850 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Cidade / Estado</label>
                          <input
                            type="text"
                            value={editFuncCidade}
                            onChange={e => setEditFuncCidade(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-850 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
                        <button
                          onClick={() => handleSaveFuncionarioUpdate(f.id)}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg cursor-pointer"
                        >
                          Salvar Alterações
                        </button>
                        <button
                          onClick={() => setEditingFuncionarioId(null)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-205 text-slate-500 text-[10px] font-black rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // DETAILED CARD INFORMATION
                    <div className="flex flex-col h-full justify-between">
                      
                      {/* Top Header Row of Professional */}
                      <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/45 dark:bg-slate-950/20 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-455 font-black flex items-center justify-center rounded-xl text-sm border border-indigo-150/50">
                            {f.nome.charAt(0)}{f.nome.split(' ').slice(1,2).map(n => n.charAt(0)).join('') || ''}
                          </div>
                          <div>
                            <strong className="text-sm font-black text-slate-850 dark:text-white block">{f.nome}</strong>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-955/20 dark:text-indigo-400">
                                {f.cargo}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold font-mono">Comissão: {f.comissao_percentual}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Top corner operational edit/delete triggers */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingFuncionarioId(f.id);
                              setEditFuncName(f.nome);
                              setEditFuncCargo(f.cargo);
                              setEditFuncTelefone(formatPhoneForInputDisplay(f.telefone || ''));
                              setEditFuncSalario((f.salario_base || 1800).toString());
                              setEditFuncComissao((f.comissao_percentual || 0).toString());
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-indigo-600 rounded-lg transition-colors border border-transparent"
                            title="Editar Dados Profissionais"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir permanentemente o cadastro de "${f.nome}" do RH?`)) {
                                onDeleteFuncionario?.(f.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/10 text-slate-450 hover:text-rose-600 rounded-lg transition-colors border border-transparent"
                            title="Excluir Colaborador"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Financial Detail Breakdown */}
                      <div className="p-5 space-y-4 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850">
                            <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider leading-none">Salário Fixo:</span>
                            <strong className="text-xs font-mono font-black text-slate-805 dark:text-slate-205 mt-1 block">R$ {baseSalary.toFixed(2)}</strong>
                          </div>
                          
                          <div className="bg-emerald-50/40 dark:bg-emerald-955/5 p-2.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/10">
                            <span className="text-[9px] uppercase font-black text-emerald-600 block tracking-wider leading-none">Comissões Acum.:</span>
                            <strong className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-450 mt-1 block">R$ {totalComs.toFixed(2)}</strong>
                            {salesCommissions > 0 && (
                              <span className="text-[8px] font-mono text-slate-400 mt-0.5 block leading-none">R$ {salesCommissions.toFixed(2)} das vendas</span>
                            )}
                          </div>

                          <div className="bg-blue-50/30 dark:bg-blue-955/5 p-2.5 rounded-xl border border-blue-105/20">
                            <span className="text-[9px] uppercase font-black text-blue-600 block tracking-wider leading-none">Bonificações:</span>
                            <strong className="text-xs font-mono font-black text-blue-600 mt-1 block">R$ {activeBonuses.toFixed(2)}</strong>
                          </div>

                          <div className="bg-rose-50/30 dark:bg-rose-955/5 p-2.5 rounded-xl border border-rose-108/20">
                            <span className="text-[9px] uppercase font-black text-rose-500 block tracking-wider leading-none">Descontos Vales:</span>
                            <strong className="text-xs font-mono font-black text-rose-500 mt-1 block">- R$ {activeVales.toFixed(2)}</strong>
                          </div>
                        </div>

                        {/* Address and Contact Panel - EXIBIÇÃO FORMATADA DO LOGRADOURO COMPLETO */}
                        <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/20 dark:bg-slate-950/40 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5 mb-1.5 font-sans">
                            <span>Residência & Contato</span>
                            <span className="font-mono text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">{f.telefone || 'Sem telefone'}</span>
                          </div>
                          {f.cep ? (
                            <div className="space-y-1">
                              <p className="text-slate-700 dark:text-slate-350 font-medium leading-normal">
                                <span className="font-extrabold text-indigo-500 dark:text-indigo-400/90 text-[10px] uppercase font-sans tracking-wide">Endereço: </span>
                                {f.endereco}, {f.numero}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 leading-none pt-0.5">
                                <span className="font-semibold">{f.bairro} — {f.cidade}</span>
                                <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-350 font-black">{f.cep}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-405 dark:text-slate-500 italic text-[10px]">Residência e CEP não cadastrados.</p>
                          )}
                        </div>

                        {/* List of active vales / advances for this month (Lista dinâmica de Vales) */}
                        <div className="border border-slate-100 dark:border-slate-850 rounded-xl p-3 bg-slate-50/30 dark:bg-slate-950/20">
                          <span className="block text-[9px] text-slate-455 font-black uppercase tracking-wider mb-2 border-b border-dashed pb-1">
                            LISTA ATIVA DE VALES E ADIANTAMENTOS
                          </span>
                          
                          {valesComissoes.filter(vc => vc.funcionario_id === f.id && vc.status === 'pendente').length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic block">Nenhum vale pendente no mês ativo.</span>
                          ) : (
                            <div className="max-h-[85px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                              {valesComissoes
                                .filter(vc => vc.funcionario_id === f.id && vc.status === 'pendente')
                                .map(vc => (
                                  <div key={vc.id} className="flex justify-between items-center text-[10px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-md">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                                        {vc.data ? new Date(vc.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '00/00'}
                                      </span>
                                      <span className={`px-1 rounded text-[8px] font-black uppercase shrink-0 ${
                                        vc.tipo === 'vale' 
                                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450' 
                                          : vc.tipo === 'bonificacao' 
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-450' 
                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-450'
                                      }`}>
                                        {vc.tipo}
                                      </span>
                                      <span className="text-slate-500 dark:text-slate-350 font-medium truncate">{vc.descricao || 'Adiantamento'}</span>
                                    </div>
                                    <strong className="font-mono text-slate-750 dark:text-zinc-200 shrink-0">
                                      {vc.tipo === 'vale' ? '-' : '+'} R$ {vc.valor.toFixed(2)}
                                    </strong>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Big Banner showing Final Net Salary Calculation: Salario = Base + Coms + Bonus - Vales */}
                        <div className="bg-indigo-600 dark:bg-indigo-950 p-3 rounded-xl border border-indigo-500/20 dark:border-indigo-900/40 text-white flex justify-between items-center shadow-xs mt-3">
                          <div>
                            <span className="text-[9px] text-indigo-200 font-extrabold uppercase tracking-widest block leading-none">Salário Líquido Final:</span>
                            <span className="text-[8px] text-indigo-200 block mt-0.5 leading-none">Fixo + Comissões + Bonif. - Vales</span>
                          </div>
                          
                          <strong className="text-lg font-black font-mono tracking-tight text-white dark:text-zinc-100">
                            R$ {finalLiquidSalary.toFixed(2)}
                          </strong>
                        </div>
                      </div>

                       {/* Action footer block with Fechar Ciclo payment execution */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/45 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
                        <span className="text-[10px] text-slate-400 font-bold flex flex-col">
                          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                            <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>Ciclo em Aberto (Ref: Dia {fechamentoDia})</span>
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 mt-0.5">Competência: {currentCycle.start} a {currentCycle.end}</span>
                        </span>

                        <button
                          onClick={() => {
                            if (confirm(`Confirmar o Fechamento de Ciclo de folha para ${f.nome}? \n\nO valor líquido de R$ ${finalLiquidSalary.toFixed(2)} será registrado em estatísticas, debitado de forma instantânea como 'Saída' de RH no fluxo operacional de caixa, e os vales/comissões serão resetados para o novo mês.`)) {
                              handleFecharCiclo(f.id);
                            }
                          }}
                          className="px-4 py-1.5 bg-emerald-550 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Fechar Ciclo</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form to insert manual Vales / Adiantamentos / Bonificações */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Plus className="w-4 h-4 text-indigo-500 animate-bounce" />
              <span>Lançar Gasto, Vale ou Premiação de Funcionário</span>
            </h3>

            <form onSubmit={handleAddNewValeComissao} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Funcionário</label>
                <select
                  value={selectedFuncionario}
                  onChange={e => setSelectedFuncionario(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                >
                  <option value="">-- Selecionar funcionário --</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Tipo de Lançamento</label>
                <select
                  value={rhTipoExpanded}
                  onChange={e => setRhTipoExpanded(e.target.value as any)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                >
                  <option value="vale">Vale / Adiantamento (Deduzido)</option>
                  <option value="comissao">Comissão Extra (Adicionado)</option>
                  <option value="bonificacao">Bonificação / Prêmio (Adicionado)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Motivo / Motivação</label>
                <input
                  type="text"
                  placeholder="Ex: Vale mercado, Meta superada"
                  value={rhMotivo}
                  onChange={e => setRhMotivo(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-505 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Valor Total R$</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={rhValor}
                    onChange={e => setRhValor(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-indigo-505 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-transform active:scale-95 cursor-pointer h-9 shrink-0"
                  >
                    Lançar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Vales & Commissions ledger details with edit/delete (Opções Universais para Vales) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide">Registro Contábil Atual de Lançamentos Extra</h4>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider select-none">
                    <th className="p-4">Colaborador</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Motivo / Descrição</th>
                    <th className="p-4 text-right">Valor R$</th>
                    <th className="p-4 text-center font-bold">Status do Acordo</th>
                    <th className="p-4 text-center">Ações de Ajuste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {valesComissoes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">Nenhum adiantamento ou comissão lançado.</td>
                    </tr>
                  ) : (
                    valesComissoes.map(vc => {
                      const func = funcionarios.find(f => f.id === vc.funcionario_id);
                      return (
                        <tr key={vc.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-850 dark:text-white">{func?.nome || 'Operador Geral'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              vc.tipo === 'vale' 
                                ? 'bg-rose-50 text-rose-700' 
                                : vc.tipo === 'bonificacao' 
                                  ? 'bg-blue-50 text-blue-700' 
                                  : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {vc.tipo}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold">{vc.descricao || 'Lançamento Recorrente'}</td>
                          <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-zinc-200">R$ {vc.valor.toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              vc.status === 'pago' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-50 text-red-700'
                            }`}>
                              {vc.status === 'pago' ? 'FECHADO OK' : 'PENDENTE DE FOLHA'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {vc.status === 'pendente' && (
                                <button
                                  onClick={() => {
                                    setEditingValeId(vc.id);
                                    setEditValeVal(vc.valor.toString());
                                  }}
                                  className="p-1 hover:bg-slate-150 text-slate-500 hover:text-indigo-650 rounded cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('Deseja excluir definitivamente este lançamento extra?')) {
                                    onDeleteValeComissao?.(vc.id);
                                  }
                                }}
                                className="p-1 hover:bg-rose-100 text-rose-650 rounded cursor-pointer"
                                title="Excluir"
                              >
                                <Trash className="w-3.5 h-3.5" />
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

          {/* PERMANENT IMMUTABLE PAYOUT RECORDS SECTION (Estatísticas permanentes/histórico) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Histórico de Folhas Fechadas e Pagas (Imutável)</span>
              </h4>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black uppercase animate-pulse">Lançamentos Estatísticos</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider select-none">
                    <th className="p-4">Colaborador</th>
                    <th className="p-4 text-right">Cargo</th>
                    <th className="p-4 text-right">Data de Pagamento</th>
                    <th className="p-4 text-right">Salário Base</th>
                    <th className="p-4 text-right">Comissões</th>
                    <th className="p-4 text-right font-bold text-blue-600">Bonificação</th>
                    <th className="p-4 text-right font-bold text-rose-500">Vales Deduzidos</th>
                    <th className="p-4 text-right font-bold text-emerald-600">Valor Líquido Pago</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs text-slate-700">
                  {historicoPagamentos.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                        Nenhum ciclo fechado registrado no histórico permanente.
                      </td>
                    </tr>
                  ) : (
                    historicoPagamentos.map(hp => (
                      <tr key={hp.id} className="hover:bg-slate-50/30">
                        <td className="p-4 font-bold text-slate-800 dark:text-white">{hp.nome_funcionario}</td>
                        <td className="p-4 text-right text-slate-500 font-semibold uppercase text-[10px]">{hp.cargo}</td>
                        <td className="p-4 text-right font-mono text-slate-450">{hp.data_pagamento}</td>
                        <td className="p-4 text-right font-mono">R$ {hp.salario_base.toFixed(2)}</td>
                        <td className="p-4 text-right text-emerald-500 font-mono font-semibold">+R$ {hp.comissoes.toFixed(2)}</td>
                        <td className="p-4 text-right text-blue-500 font-mono font-semibold">+R$ {hp.bonificacoes.toFixed(2)}</td>
                        <td className="p-4 text-right text-rose-500 font-mono font-semibold">-R$ {hp.vales.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-450 bg-emerald-50/20">
                          R$ {hp.salario_liquido.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-750 uppercase tracking-widest border border-slate-205">
                            IMUTÁVEL
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Escluir esta estatística permanente de folha do histórico? \n\n(Atenção: Apenas o log estatístico será removido do relatório)')) {
                                setHistoricoPagamentos(prev => prev.filter(p => p.id !== hp.id));
                              }
                            }}
                            className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded cursor-pointer"
                            title="Deletar registro histórico"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3. ENTRADAS TAB */}
      {activeTab === 'entradas' && (
        <div className="space-y-6 animate-fadeIn" id="entradas-tab-content">
          
          {/* Form to insert manual entries */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-700 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <span>Registrar Aporte / Entrada Manual de Caixa</span>
            </h3>

            <form onSubmit={handleAddManualEntrada} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Descrição da Entrada comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troco de abertura de caixa, Venda corporativa"
                  value={manualEntradaDesc}
                  onChange={e => setManualEntradaDesc(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Valor Unitário R$</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={manualEntradaValor}
                    onChange={e => setManualEntradaValor(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-emerald-500/15 cursor-pointer h-9 shrink-0 flex items-center justify-center gap-1"
                  >
                    <span>ADICIONAR</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Fiados (Contas a Receber) List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide">Fidelidade Fiados (Contas a Receber)</h4>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-205 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider select-none">
                      <th className="p-4">Cliente</th>
                      <th className="p-4 text-right">Prometido para</th>
                      <th className="p-4 text-right">Valor Fiado</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                    {contasReceber.map(cr => {
                      const client = clientes.find(c => c.id === cr.cliente_id);
                      return (
                        <tr key={cr.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-850 dark:text-white">
                            {client?.nome || 'Consumidor Especial'}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">
                            {cr.data_prometida_pagamento}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-red-655 text-red-500">
                            R$ {cr.valor.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              cr.status === 'pago' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-rose-50 text-rose-700 animate-pulse'
                            }`}>
                              {cr.status === 'pago' ? 'RECEBIDO OK' : 'DEVENDO'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {cr.status === 'pendente' && (
                                <button
                                  onClick={() => {
                                    onReceiveContaReceber(cr.id);
                                    alert('Caixa arrecadou o valor do fiado!');
                                  }}
                                  className="px-2 py-1 bg-emerald-500 text-white font-bold rounded-md text-[10px]"
                                >
                                  Quitar
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('Deletar registro de fiado?')) {
                                    onDeleteContaReceber?.(cr.id);
                                  }
                                }}
                                className="p-1 text-rose-505 rounded hover:bg-rose-100"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* List of Manual Inflows / Cash entries */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide font-sans">Movimentações Avulsas de Entrada</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-205 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider select-none">
                      <th className="p-4">Descrição da Entrada</th>
                      <th className="p-4 text-right">Valor R$</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                    {movimentacoes.filter(m => m.tipo === 'entrada').map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800 dark:text-white">
                          {m.descricao}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-600">
                          R$ {m.valor.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Estornar entrada manual do caixa?')) {
                                onDeleteMovimentacao?.(m.id);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px]"
                          >
                            Excluir
                          </button>
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

      {/* 4. SAÍDAS TAB */}
      {activeTab === 'saidas' && (
        <div className="space-y-6 animate-fadeIn" id="saidas-tab-content">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Accounts Payable quick add */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-700 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <Building className="w-4 h-4 text-red-500" />
                <span>Registrar Nova Despesa de Fornecedor / Consumo</span>
              </h3>

              <form onSubmit={handleAddNewContaPagar} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 font-sans">Selecione o Fornecedor da Conta</label>
                  <select
                    value={selectedFornecedor}
                    onChange={e => setSelectedFornecedor(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-bold focus:ring-1 focus:ring-rose-500 focus:outline-none dark:text-white"
                  >
                    <option value="">-- Escolher Fornecedor --</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nome_empresa} ({f.contato_responsavel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Valor Comercial R$</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 500.00"
                      value={pagarValor}
                      onChange={e => setPagarValor(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono font-bold focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Data Vencimento</label>
                    <input
                      type="date"
                      required
                      value={pagarDueDate}
                      onChange={e => setPagarDueDate(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-830 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-rose-500/10 cursor-pointer h-9 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>REGISTRAR CONTA A PAGAR</span>
                </button>
              </form>
            </div>

            {/* Quick add manual exits (sangrias) */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-700 dark:text-rose-450 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <ArrowUpRight className="w-4 h-4 text-red-500 rotate-180" />
                <span>Efetuar Retirada de Caixa Manual (Sangria)</span>
              </h3>

              <form onSubmit={handleAddManualSaida} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Motivo / Finalidade da Saída</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pagamento motoboy avulso, Compra de papel para impressora"
                    value={manualSaidaDesc}
                    onChange={e => setManualSaidaDesc(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Valor Retirado R$</label>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={manualSaidaValor}
                      onChange={e => setManualSaidaValor(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-3 py-2 font-mono font-bold"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-650 bg-rose-600 hover:bg-rose-700 font-extrabold text-white text-xs rounded-lg transition-all"
                    >
                      COMISSIONAR RETIRADA
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>

          {/* Inline Edit for Conta a Pagar */}
          {editingContaPagarId && (
            <div className="p-4 bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Atualizar Valor Comercial R$</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPagarValor}
                    onChange={e => setEditPagarValor(e.target.value)}
                    className="w-full text-xs bg-white border rounded p-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Nova Data Limite</label>
                  <input
                    type="date"
                    value={editPagarDate}
                    onChange={e => setEditPagarDate(e.target.value)}
                    className="w-full text-xs bg-white border rounded p-1.5 font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveContaPagarEdit(editingContaPagarId)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingContaPagarId(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-705 text-xs font-bold rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Table representing all supplier expense liabilities */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide">Duplicatas e Faturas Recorrentes de Saída</h4>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-slate-450 uppercase text-[9px] font-black tracking-wider select-none">
                    <th className="p-4">Credor/Fornecedor</th>
                    <th className="p-4 text-right">Cadastrado em</th>
                    <th className="p-4 text-right">Vencimento em</th>
                    <th className="p-4 text-right">Valor da Fatura</th>
                    <th className="p-4 text-center">Status Duplicata</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs text-slate-705">
                  {contasPagar.map(cp => {
                    const forn = fornecedores.find(f => f.id === cp.fornecedor_id);
                    const isOverdue = cp.status === 'pendente' && cp.data_vencimento < TODAY_STR;
                    return (
                      <tr key={cp.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800 dark:text-white">
                          {forn?.nome_empresa || 'Servidores de Consumo Publicos'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-450 leading-none">
                          {cp.data_pedido}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold leading-none ${isOverdue ? 'text-red-500' : 'text-slate-455'}`}>
                          {cp.data_vencimento} {isOverdue && '⚠️ VENCIDA'}
                        </td>
                        <td className="p-4 text-right font-mono font-extrabold text-slate-800 dark:text-white">
                          R$ {cp.valor.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            cp.status === 'pago' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-705'
                          }`}>
                            {cp.status === 'pago' ? 'LIQUIDADO' : 'PENDENTE'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {cp.status === 'pendente' && (
                              <button
                                onClick={() => {
                                  onPayContaPagar(cp.id);
                                  alert('Caixa quitou a duplicata avulsa!');
                                }}
                                className="px-2.5 py-1 bg-emerald-500 text-white font-extrabold rounded text-[10px]"
                              >
                                Pagar
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingContaPagarId(cp.id);
                                setEditPagarValor(cp.valor.toString());
                                setEditPagarDate(cp.data_vencimento);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs rounded"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Deletar duplicata a pagar?')) {
                                  onDeleteContaPagar?.(cp.id);
                                }
                              }}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, Tag, Truck, UserPlus, Briefcase, Search, PlusCircle, 
  Trash2, Edit, CheckCircle, Eye, AlertCircle, RefreshCcw
} from 'lucide-react';
import { Cliente, Produto, Funcionario, Fornecedor } from '../types';

interface RegistersCRUDProps {
  clientes: Cliente[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  fornecedores: Fornecedor[];
  onAddCliente: (c: Omit<Cliente, 'id' | 'data_cadastro'>) => void;
  onUpdateCliente: (id: string, c: Partial<Cliente>) => void;
  onDeleteCliente: (id: string) => void;
  onAddProduto: (p: Omit<Produto, 'id'>) => void;
  onUpdateProduto: (id: string, p: Partial<Produto>) => void;
  onDeleteProduto: (id: string) => void;
  onAddFuncionario: (f: Omit<Funcionario, 'id' | 'data_cadastro'>) => void;
  onUpdateFuncionario: (id: string, f: Partial<Funcionario>) => void;
  onDeleteFuncionario: (id: string) => void;
  onAddFornecedor: (f: Omit<Fornecedor, 'id'>) => void;
  onUpdateFornecedor: (id: string, f: Partial<Fornecedor>) => void;
  onDeleteFornecedor: (id: string) => void;
}

export default function RegistersCRUD({
  clientes,
  produtos,
  funcionarios,
  fornecedores,
  onAddCliente,
  onUpdateCliente,
  onDeleteCliente,
  onAddProduto,
  onUpdateProduto,
  onDeleteProduto,
  onAddFuncionario,
  onUpdateFuncionario,
  onDeleteFuncionario,
  onAddFornecedor,
  onUpdateFornecedor,
  onDeleteFornecedor,
}: RegistersCRUDProps) {
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'clientes' | 'funcionarios' | 'fornecedores'>('clientes');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state trackers
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);

  // General field values for modals and inputs
  // Products
  const [pNome, setpNome] = useState('');
  const [pCat, setpCat] = useState('');
  const [pPrecoVenda, setpPrecoVenda] = useState('');
  const [pPrecoCusto, setpPrecoCusto] = useState('');
  const [pEstoque, setpEstoque] = useState('');
  const [pEstoqueMin, setpEstoqueMin] = useState('');
  const [pUnidade, setpUnidade] = useState('un');

  // Customers
  const [cNome, setcNome] = useState('');
  const [cTel, setcTel] = useState('');
  const [cEnd, setcEnd] = useState('');
  const [cLimite, setcLimite] = useState('');

  // Employees
  const [fNome, setfNome] = useState('');
  const [fCargo, setfCargo] = useState<'admin' | 'caixa' | 'garcom'>('garcom');
  const [fTel, setfTel] = useState('');
  const [fComissao, setfComissao] = useState('');

  // Suppliers
  const [forNome, setforNome] = useState('');
  const [forContato, setforContato] = useState('');
  const [forTel, setforTel] = useState('');
  const [forCNPJ, setforCNPJ] = useState('');

  // Reset forms helper
  const resetFormValues = () => {
    setEditingId(null);
    setIsInserting(false);

    setpNome(''); setpCat(''); setpPrecoVenda(''); setpPrecoCusto(''); setpEstoque(''); setpEstoqueMin(''); setpUnidade('un');
    setcNome(''); setcTel(''); setcEnd(''); setcLimite('');
    setfNome(''); setfCargo('garcom'); setfTel(''); setfComissao('');
    setforNome(''); setforContato(''); setforTel(''); setforCNPJ('');
  };

  const handleEditTrigger = (item: any, type: string) => {
    setEditingId(item.id);
    setIsInserting(false);

    if (type === 'produto') {
      setpNome(item.nome);
      setpCat(item.categoria);
      setpPrecoVenda(item.preco_venda.toString());
      setpPrecoCusto(item.preco_custo.toString());
      setpEstoque(item.estoque_atual.toString());
      setpEstoqueMin(item.estoque_minimo.toString());
      setpUnidade(item.unidade_medida);
    } else if (type === 'cliente') {
      setcNome(item.nome);
      setcTel(item.telefone);
      setcEnd(item.endereco);
      setcLimite(item.limite_fiado.toString());
    } else if (type === 'funcionario') {
      setfNome(item.nome);
      setfCargo(item.cargo);
      setfTel(item.telefone);
      setfComissao(item.comissao_percentual.toString());
    } else if (type === 'fornecedor') {
      setforNome(item.nome_empresa);
      setforContato(item.contato || '');
      setforTel(item.telefone || '');
      setforCNPJ(item.cnpj_cpf);
    }
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeSubTab === 'produtos') {
      const payload = {
        nome: pNome,
        categoria: pCat || 'Bebidas',
        preco_venda: parseFloat(pPrecoVenda) || 0,
        preco_custo: parseFloat(pPrecoCusto) || 0,
        estoque_atual: parseInt(pEstoque) || 0,
        estoque_minimo: parseInt(pEstoqueMin) || 0,
        unidade_medida: pUnidade
      };

      if (!payload.nome) { alert("Informe o nome do produto!"); return; }
      if (editingId) {
        onUpdateProduto(editingId, payload);
      } else {
        onAddProduto(payload);
      }
    } else if (activeSubTab === 'clientes') {
      const payload = {
        nome: cNome,
        telefone: cTel,
        endereco: cEnd,
        limite_fiado: parseFloat(cLimite) || 0
      };

      if (!payload.nome || !payload.telefone) { alert("Nome e Telefone são campos obrigatórios!"); return; }
      if (editingId) {
        onUpdateCliente(editingId, payload);
      } else {
        onAddCliente(payload);
      }
    } else if (activeSubTab === 'funcionarios') {
      const payload = {
        nome: fNome,
        cargo: fCargo,
        telefone: fTel,
        comissao_percentual: parseFloat(fComissao) || 0
      };

      if (!payload.nome) { alert("Informa o nome do funcionário!"); return; }
      if (editingId) {
        onUpdateFuncionario(editingId, payload);
      } else {
        onAddFuncionario(payload);
      }
    } else if (activeSubTab === 'fornecedores') {
      const payload = {
        nome_empresa: forNome,
        contato: forContato,
        telefone: forTel,
        cnpj_cpf: forCNPJ
      };

      if (!payload.nome_empresa || !payload.cnpj_cpf) { alert("Nome da Empresa e CNPJ/CPF são obrigatórios!"); return; }
      if (editingId) {
        onUpdateFornecedor(editingId, payload);
      } else {
        onAddFornecedor(payload);
      }
    }

    resetFormValues();
    alert("Operação realizada com sucesso!");
  };

  // Filter lists
  const filteredProducts = useMemo(() => {
    if (activeSubTab !== 'produtos') return [];
    return produtos.filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || p.categoria.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [produtos, searchQuery, activeSubTab]);

  const filteredClientes = useMemo(() => {
    if (activeSubTab !== 'clientes') return [];
    return clientes.filter(c => c.nome.toLowerCase().includes(searchQuery.toLowerCase()) || c.telefone.includes(searchQuery));
  }, [clientes, searchQuery, activeSubTab]);

  const filteredFuncionarios = useMemo(() => {
    if (activeSubTab !== 'funcionarios') return [];
    return funcionarios.filter(f => f.nome.toLowerCase().includes(searchQuery.toLowerCase()) || f.cargo.includes(searchQuery));
  }, [funcionarios, searchQuery, activeSubTab]);

  const filteredFornecedores = useMemo(() => {
    if (activeSubTab !== 'fornecedores') return [];
    return fornecedores.filter(f => f.nome_empresa.toLowerCase().includes(searchQuery.toLowerCase()) || f.cnpj_cpf.includes(searchQuery));
  }, [fornecedores, searchQuery, activeSubTab]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm space-y-6" id="crud-registros-gerais">
      
      {/* Sub tabs selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex gap-2 pb-0.5 overflow-x-auto">
          {[
            { id: 'clientes', label: 'Clientes (Fidelidade)', icon: Users },
            { id: 'funcionarios', label: 'Funcionários (RH)', icon: Briefcase },
            { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setSearchQuery('');
                  resetFormValues();
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeSubTab === tab.id 
                    ? 'bg-slate-900 border border-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 border border-transparent text-slate-650 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Create and Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input 
              type="text" 
              placeholder={`Filtrar ${activeSubTab}...`} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 w-full sm:w-44"
            />
          </div>

          <button 
            onClick={() => {
              resetFormValues();
              setIsInserting(true);
            }}
            className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black rounded-lg transition-colors flex items-center gap-1 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Cadastrar</span>
          </button>
        </div>
      </div>

      {/* Editing or Inserting Inline Drawer/Panel representation */}
      {(editingId || isInserting) && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 md:p-5 text-slate-850 shadow-2xs">
          <div className="flex items-center justify-between border-b border-indigo-150 pb-2 mb-4">
            <h4 className="font-extrabold text-indigo-900 text-sm">
              {editingId ? '📝 Editar Registro Ativo' : '➕ Adicionar Novo Lançamento'}
            </h4>
            <button 
              onClick={resetFormValues}
              className="text-xs bg-white border border-slate-250 text-slate-600 font-bold px-2 py-0.5 rounded shadow-3xs"
            >
              Cancelar/Fechar
            </button>
          </div>

          <form onSubmit={handleOnSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* PRODUCT PROPERTIES */}
            {activeSubTab === 'produtos' && (
              <>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome do Produto</label>
                  <input type="text" required placeholder="Pastel, Cerveja Skol..." value={pNome} onChange={e => setpNome(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Categoria</label>
                  <input type="text" placeholder="Bebidas, Salgados, Outros" value={pCat} onChange={e => setpCat(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Unidade</label>
                  <select value={pUnidade} onChange={e => setpUnidade(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550">
                    <option value="un">Unidade (un)</option>
                    <option value="lt">Litro (lt)</option>
                    <option value="kg">Quilo (kg)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Preço Venda (R$)</label>
                  <input type="number" step="0.01" required placeholder="0,00" value={pPrecoVenda} onChange={e => setpPrecoVenda(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Preço Custo (R$)</label>
                  <input type="number" step="0.01" required placeholder="0,00" value={pPrecoCusto} onChange={e => setpPrecoCusto(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Estoque Atual</label>
                  <input type="number" required placeholder="10" value={pEstoque} onChange={e => setpEstoque(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Estoque Crítico Mínmo</label>
                  <input type="number" required placeholder="3" value={pEstoqueMin} onChange={e => setpEstoqueMin(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono" />
                </div>
              </>
            )}

            {/* CUSTOMER PROPERTIES */}
            {activeSubTab === 'clientes' && (
              <>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome Completo</label>
                  <input type="text" required placeholder="Amanda Borges, Cláudio..." value={cNome} onChange={e => setcNome(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Telefone / Whats</label>
                  <input type="text" required placeholder="(11) 99999-0000" value={cTel} onChange={e => setcTel(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Limite do Fiado (R$)</label>
                  <input type="number" placeholder="250" value={cLimite} onChange={e => setcLimite(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono font-bold" />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Endereço Residencial (Para Delivery)</label>
                  <input type="text" placeholder="Rua das Macieiras, 115 - Bloco A" value={cEnd} onChange={e => setcEnd(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
              </>
            )}

            {/* EMPLOYEE PROPERTIES */}
            {activeSubTab === 'funcionarios' && (
              <>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Nome do Funcionário</label>
                  <input type="text" required placeholder="Mateus Silva..." value={fNome} onChange={e => setfNome(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cargo</label>
                  <select value={fCargo} onChange={e => setfCargo(e.target.value as any)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 text-slate-800 font-bold">
                    <option value="garcom">Garçom</option>
                    <option value="caixa">Operador de Caixa</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Telefone de Contato</label>
                  <input type="text" placeholder="(11) 99999-0000" value={fTel} onChange={e => setfTel(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                {fCargo === 'garcom' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Comissão Percentual (%)</label>
                    <input type="number" placeholder="10" value={fComissao} onChange={e => setfComissao(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono font-bold" />
                  </div>
                )}
              </>
            )}

            {/* SUPPLIER PROPERTIES */}
            {activeSubTab === 'fornecedores' && (
              <>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Razão Social / Nome Empresa</label>
                  <input type="text" required placeholder="AMBEV Alimentos..." value={forNome} onChange={e => setforNome(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">CNPJ ou CPF</label>
                  <input type="text" required placeholder="00.000.000/0001-00" value={forCNPJ} onChange={e => setforCNPJ(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550 font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pessoa de Contato</label>
                  <input type="text" placeholder="Sandra, Rodrigo..." value={forContato} onChange={e => setforContato(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Telefone de Vendas</label>
                  <input type="text" placeholder="(11) 3322-1100" value={forTel} onChange={e => setforTel(e.target.value)} className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-indigo-550" />
                </div>
              </>
            )}

            <div className="md:col-span-4 flex items-center justify-end gap-2 border-t border-indigo-100 pt-3.5 mt-2">
              <button type="button" onClick={resetFormValues} className="px-3.5 py-2 bg-indigo-100 text-indigo-700 font-bold text-xs rounded transition-all">Descartar</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all shadow-md">Salvar Informações</button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER ACTIVE TAB TABLE LIST */}
      <div className="border border-slate-150 rounded-xl overflow-hidden shadow-3xs bg-white">
        
        {/* PRODUCTS LIST */}
        {activeSubTab === 'produtos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                <tr>
                  <th className="text-left p-3">Produto / Categoria</th>
                  <th className="text-right p-3">Preço Venda</th>
                  <th className="text-right p-3">Preço Custo</th>
                  <th className="text-center p-3">Estoque Atual</th>
                  <th className="text-center p-3">Margem Lucro</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const profitRatio = p.preco_venda ? ((p.preco_venda - p.preco_custo) / p.preco_venda) * 100 : 0;
                  const isLow = p.estoque_atual <= p.estoque_minimo;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-55/40">
                      <td className="p-3">
                        <span className="font-extrabold text-slate-800 block">{p.nome}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{p.categoria}</span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 font-mono">R$ {p.preco_venda.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-slate-500 font-mono">R$ {p.preco_custo.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                          p.estoque_atual <= 0 ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.estoque_atual} {p.unidade_medida}
                        </span>
                      </td>
                      <td className="p-3 text-center text-[10px] text-emerald-600 font-bold font-mono">
                        {profitRatio.toFixed(0)}% margem
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleEditTrigger(p, 'produto')} className="p-1 px-2.5 text-slate-600 hover:text-indigo-650 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button onClick={() => { if (confirm(`Deseja realmente excluir o produto: ${p.nome}?`)) onDeleteProduto(p.id); }} className="p-1 px-2 text-rose-600 hover:text-white bg-slate-100 hover:bg-rose-500 border border-slate-200 hover:border-rose-400 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CUSTOMERS LIST */}
        {activeSubTab === 'clientes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                <tr>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Endereço Residencial</th>
                  <th className="text-right p-3">Limite Fiado</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-55/40">
                    <td className="p-3">
                      <span className="font-extrabold text-slate-800 block">{c.nome}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Fidelidade desde {new Date(c.data_cadastro).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono">{c.telefone}</td>
                    <td className="p-3 text-slate-500 whitespace-pre-wrap max-w-xs">{c.endereco || 'Retira Balcão'}</td>
                    <td className="p-3 text-right font-black text-rose-700 font-mono">R$ {c.limite_fiado.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleEditTrigger(c, 'cliente')} className="p-1 px-2.5 text-slate-600 hover:text-indigo-650 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => { if (confirm(`Deseja realmente excluir o cliente: ${c.nome}?`)) onDeleteCliente(c.id); }} className="p-1 px-2 text-rose-600 hover:text-white bg-slate-100 hover:bg-rose-500 border border-slate-200 hover:border-rose-400 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EMPLOYEES LIST */}
        {activeSubTab === 'funcionarios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                <tr>
                  <th className="text-left p-3">Funcionário</th>
                  <th className="text-left p-3">Cargo Ativo</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-right p-3">Porcentagem Comissão</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFuncionarios.map(f => (
                  <tr key={f.id} className="hover:bg-slate-55/40">
                    <td className="p-3 font-extrabold text-slate-800">{f.nome}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        f.cargo === 'admin' ? 'bg-indigo-100 text-indigo-800' : f.cargo === 'caixa' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-105 text-blue-800'
                      }`}>
                        {f.cargo === 'admin' ? 'ADMINISTRADOR' : f.cargo === 'caixa' ? 'CAIXA FINANCEIRO' : 'GARÇOM / ATENDENTE'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono">{f.telefone}</td>
                    <td className="p-3 text-right font-black text-indigo-705 font-mono">{f.comissao_percentual}%</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleEditTrigger(f, 'funcionario')} className="p-1 px-2.5 text-slate-600 hover:text-indigo-650 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => { if (confirm(`Deseja realmente excluir o funcionário: ${f.nome}?`)) onDeleteFuncionario(f.id); }} className="p-1 px-2 text-rose-600 hover:text-white bg-slate-100 hover:bg-rose-500 border border-slate-200 hover:border-rose-400 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUPPLIERS LIST */}
        {activeSubTab === 'fornecedores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-400 font-sans">
                <tr>
                  <th className="text-left p-3">Razão Social</th>
                  <th className="text-left p-3">Documento (CNPJ)</th>
                  <th className="text-left p-3">Vendedor Contato</th>
                  <th className="text-left p-3">Telefone Televendas</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFornecedores.map(f => (
                  <tr key={f.id} className="hover:bg-slate-55/40">
                    <td className="p-3 font-extrabold text-slate-800">{f.nome_empresa}</td>
                    <td className="p-3 text-slate-650 font-mono">{f.cnpj_cpf}</td>
                    <td className="p-3 text-slate-500">{f.contato || 'Sem vendedor'}</td>
                    <td className="p-3 text-slate-600 font-mono">{f.telefone || 'Sem telefone'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleEditTrigger(f, 'fornecedor')} className="p-1 px-2.5 text-slate-600 hover:text-indigo-650 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => { if (confirm(`Deseja realmente excluir o fornecedor: ${f.nome_empresa}?`)) onDeleteFornecedor(f.id); }} className="p-1 px-2 text-rose-600 hover:text-white bg-slate-100 hover:bg-rose-500 border border-slate-200 hover:border-rose-400 rounded leading-none transition-colors font-bold text-[10px] inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

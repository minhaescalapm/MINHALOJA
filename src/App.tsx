/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, DollarSign, LayoutDashboard, Coins, Users, Utensils, 
  Truck, ArrowUpRight, ShieldCheck, HeartHandshake, Database, Sliders,
  Smartphone, User, LogOut, Sun, Moon, Info, Settings, FileText, Package,
  Trash, Search, Plus, Calendar, Lock, Unlock, CheckCircle
} from 'lucide-react';

import { 
  getStorageData, saveStorageData,
  INITIAL_FUNCIONARIOS, INITIAL_CLIENTES, INITIAL_FORNECEDORES,
  INITIAL_PRODUTOS, INITIAL_MESAS, INITIAL_PEDIDOS, INITIAL_CAIXAS,
  INITIAL_MOVIMENTACOES, INITIAL_CONTAS_A_PAGAR, INITIAL_CONTAS_A_RECEBER,
  INITIAL_VALES_E_COMISSOES 
} from './components/MockData';

import { saveCloudState, syncFromCloud } from './lib/databaseService';


import { 
  Produto, Cliente, Funcionario, Fornecedor, Mesa, Pedido, 
  CaixaDiario, MovimentacaoCaixa, ContaAPagar, ContaAReceber, ValeEComissao, Empresa 
} from './types';

// Importing Custom Views
import CashierView from './components/CashierView';
import GarcomView from './components/GarcomView';
import TablesDashboard from './components/TablesDashboard';
import DeliveryPanel from './components/DeliveryPanel';
import FinancialDashboard from './components/FinancialDashboard';
import RegistersCRUD from './components/RegistersCRUD';
import ProductsRegistration from './components/ProductsRegistration';
import ClientsManagement from './components/ClientsManagement';
import StockManagement from './components/StockManagement';
import SupabasePanel from './components/SupabasePanel';

// --- SPECIAL SEGMENT MOCK CONSTANTS FOR FICTIONAL COMPANIES ---
const ZEROED_MESAS: Mesa[] = [
  { id: 'm-1', numero_mesa: 1, status: 'livre', total_atual: 0 },
  { id: 'm-2', numero_mesa: 2, status: 'livre', total_atual: 0 },
  { id: 'm-3', numero_mesa: 3, status: 'livre', total_atual: 0 },
  { id: 'm-4', numero_mesa: 4, status: 'livre', total_atual: 0 },
  { id: 'm-5', numero_mesa: 5, status: 'livre', total_atual: 0 },
  { id: 'm-6', numero_mesa: 6, status: 'livre', total_atual: 0 },
  { id: 'm-7', numero_mesa: 7, status: 'livre', total_atual: 0 },
  { id: 'm-8', numero_mesa: 8, status: 'livre', total_atual: 0 }
];

const BELLA_PRODUTOS: Produto[] = [
  { id: 'bp-1', nome: 'Pizza Calabresa Especial (Bella)', categoria: 'Pizzas', preco_venda: 45.00, preco_custo: 18.00, estoque_atual: 40, estoque_minimo: 10, unidade_medida: 'un' },
  { id: 'bp-2', nome: 'Pizza Margherita Suprema', categoria: 'Pizzas', preco_venda: 42.00, preco_custo: 15.00, estoque_atual: 40, estoque_minimo: 10, unidade_medida: 'un' },
  { id: 'bp-3', nome: 'Pizza Quatro Queijos Divina', categoria: 'Pizzas', preco_venda: 48.00, preco_custo: 20.00, estoque_atual: 30, estoque_minimo: 10, unidade_medida: 'un' },
  { id: 'bp-4', nome: 'Refrigerante Coca-Cola 2L', categoria: 'Bebidas', preco_venda: 12.00, preco_custo: 5.50, estoque_atual: 100, estoque_minimo: 20, unidade_medida: 'un' },
  { id: 'bp-5', nome: 'Vinho Tinto Seco Importado', categoria: 'Bebidas Alcoólicas', preco_venda: 65.00, preco_custo: 25.00, estoque_atual: 24, estoque_minimo: 5, unidade_medida: 'un' }
];

const CHEF_PRODUTOS: Produto[] = [
  { id: 'cp-1', nome: 'Pastel de Carne com Ovo (Chef)', categoria: 'Pastéis Salgados', preco_venda: 12.00, preco_custo: 4.00, estoque_atual: 60, estoque_minimo: 15, unidade_medida: 'un' },
  { id: 'cp-2', nome: 'Pastel de Queijo Especial', categoria: 'Pastéis Salgados', preco_venda: 11.50, preco_custo: 3.50, estoque_atual: 60, estoque_minimo: 15, unidade_medida: 'un' },
  { id: 'cp-3', nome: 'Pastel de Frango com Catupiry', categoria: 'Pastéis Salgados', preco_venda: 13.00, preco_custo: 4.50, estoque_atual: 50, estoque_minimo: 15, unidade_medida: 'un' },
  { id: 'cp-4', nome: 'Suco Natural de Laranja 500ml', categoria: 'Bebidas', preco_venda: 8.50, preco_custo: 2.50, estoque_atual: 150, estoque_minimo: 20, unidade_medida: 'un' },
  { id: 'cp-5', nome: 'Caldo de Cana Turbinado 500ml', categoria: 'Bebidas', preco_venda: 9.00, preco_custo: 2.00, estoque_atual: 200, estoque_minimo: 30, unidade_medida: 'un' }
];

const DEFAULT_EMPRESAS: Empresa[] = [
  {
    id: 'bella',
    nome_empresa: 'Pizzaria Bella Itália',
    nome_responsavel: 'Isabella Rossi',
    telefone_admin: '11999999999',
    senha_hash: 'Bella1234!',
    status_assinatura: 'trial',
    data_cadastro: '2026-06-01T00:00:00.000Z',
    data_fim_trial: '2026-07-01T00:00:00.000Z'
  },
  {
    id: 'chef',
    nome_empresa: 'Pastelaria do Chef',
    nome_responsavel: 'Chef Jacquin',
    telefone_admin: '11988888888',
    senha_hash: 'Chef1234!',
    status_assinatura: 'trial',
    data_cadastro: '2026-06-05T00:00:00.000Z',
    data_fim_trial: '2026-07-05T00:00:00.000Z'
  },
  {
    id: 'admin',
    nome_empresa: 'Administração Geral',
    nome_responsavel: 'Wag Admin',
    telefone_admin: '21975151937',
    senha_hash: 'Wag0508$',
    status_assinatura: 'ativo',
    data_cadastro: '2026-06-12T00:00:00.000Z',
    data_fim_trial: '2050-12-31T23:59:59.000Z'
  }
];

export default function App() {
  // --- SESSION & WHITE-LABEL CUSTOMIZATION STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('saas_is_authenticated') === 'true';
  });
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    return localStorage.getItem('saas_current_tenant_id') || 'bella';
  });

  // Dynamic enterprises list state
  const [empresas, setEmpresas] = useState<Empresa[]>(() => {
    const cached = localStorage.getItem('saas_empresas_list');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_EMPRESAS;
  });

  useEffect(() => {
    localStorage.setItem('saas_empresas_list', JSON.stringify(empresas));
  }, [empresas]);

  // Auth View/Tab states
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Track last registered enterprise to follow the guidelines of showing client's suggestion and hiding others
  const [lastRegisteredEmpId, setLastRegisteredEmpId] = useState<string | null>(() => {
    return localStorage.getItem('saas_last_registered_emp_id');
  });

  const lastRegisteredEmp = useMemo(() => {
    if (!lastRegisteredEmpId) return null;
    return empresas.find(e => e.id === lastRegisteredEmpId) || null;
  }, [lastRegisteredEmpId, empresas]);

  // Login inputs
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regResponsibleName, setRegResponsibleName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Admin SaaS Control states
  const [adminSearch, setAdminSearch] = useState('');
  const [adminNewName, setAdminNewName] = useState('');
  const [adminNewResp, setAdminNewResp] = useState('');
  const [adminNewPhone, setAdminNewPhone] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminNewStatus, setAdminNewStatus] = useState<'trial' | 'ativo' | 'bloqueado'>('trial');

  const filteredEmpresas = useMemo(() => {
    return empresas.filter(emp => {
      if (emp.id === 'admin') return false; // Hide master admin row from listing
      const search = adminSearch.toLowerCase();
      return (
        emp.nome_empresa.toLowerCase().includes(search) ||
        emp.nome_responsavel.toLowerCase().includes(search) ||
        emp.telefone_admin.toLowerCase().includes(search)
      );
    });
  }, [empresas, adminSearch]);

  const handleAdminRegisterCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewName || !adminNewResp || !adminNewPhone || !adminNewPass) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    const cleanPhone = adminNewPhone.replace(/\D/g, '');
    const duplicate = empresas.find(emp => emp.telefone_admin.replace(/\D/g, '') === cleanPhone);
    if (duplicate) {
      alert('Esse telefone de administrador já existe cadastrado no sistema!');
      return;
    }

    const newEmpId = `emp-${Date.now()}`;
    const newEmpresa: Empresa = {
      id: newEmpId,
      nome_empresa: adminNewName,
      nome_responsavel: adminNewResp,
      telefone_admin: cleanPhone,
      senha_hash: adminNewPass,
      status_assinatura: adminNewStatus,
      data_cadastro: new Date().toISOString(),
      data_fim_trial: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const updated = [...empresas, newEmpresa];
    setEmpresas(updated);
    localStorage.setItem('saas_empresas_list', JSON.stringify(updated));

    // Clear inputs
    setAdminNewName('');
    setAdminNewResp('');
    setAdminNewPhone('');
    setAdminNewPass('');
    setAdminNewStatus('trial');

    alert(`Parabéns! Empresa "${newEmpresa.nome_empresa}" cadastrada via Painel VIP com sucesso!`);
  };

  // Legacy credentials (guarantees background compilation stability)
  const [username, setUsername] = useState('bella@pizza.com');
  const [password, setPassword] = useState('123456');

  // Tenant customization properties (simulates config.json on runtime)
  const [tenantName, setTenantName] = useState('Pizzaria Bella Itália');
  const [tenantPrimaryColor, setTenantPrimaryColor] = useState<'indigo' | 'amber' | 'rose' | 'emerald' | 'slate'>('rose');
  const [serviceFee, setServiceFee] = useState<number>(10); // Percent comissão default
  const [isThemeDark, setIsThemeDark] = useState<boolean>(false);

  // --- BUSINESS CORE STATE ---
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('Sincronizando...');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [caixas, setCaixas] = useState<CaixaDiario[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCaixa[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaAPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaAReceber[]>([]);
  const [valesComissoes, setValesComissoes] = useState<ValeEComissao[]>([]);

  // --- CAIXA SEPARADO DO DELIVERY ---
  const [caixaDeliveryStatus, setCaixaDeliveryStatus] = useState<'aberto' | 'fechado'>(() => {
    return (localStorage.getItem('saas_caixa_delivery_status') as 'aberto' | 'fechado') || 'fechado';
  });
  const [caixaDeliveryValorInicial, setCaixaDeliveryValorInicial] = useState<number>(() => {
    return parseFloat(localStorage.getItem('saas_caixa_delivery_valor_inicial') || '100');
  });
  const [caixaDeliveryVendasConcluidas, setCaixaDeliveryVendasConcluidas] = useState<number>(() => {
    return parseFloat(localStorage.getItem('saas_caixa_delivery_vendas_concluidas') || '0');
  });

  const handleOpenCaixaDelivery = (valorInicial: number) => {
    setCaixaDeliveryStatus('aberto');
    setCaixaDeliveryValorInicial(valorInicial);
    setCaixaDeliveryVendasConcluidas(0);
    localStorage.setItem('saas_caixa_delivery_status', 'aberto');
    localStorage.setItem('saas_caixa_delivery_valor_inicial', valorInicial.toString());
    localStorage.setItem('saas_caixa_delivery_vendas_concluidas', '0');
  };

  const handleCloseCaixaDelivery = () => {
    setCaixaDeliveryStatus('fechado');
    localStorage.setItem('saas_caixa_delivery_status', 'fechado');
  };

  const handleAddDeliveryPedido = (clienteId: string, items: { produtoId: string; quantidade: number }[]) => {
    const newPedidoId = `ped-${Date.now()}`;
    const newItems = items.map((item, idx) => {
      const prod = produtos.find(p => p.id === item.produtoId);
      const price = prod?.preco_venda || 0;
      return {
        id: `iti-${newPedidoId}-${idx}`,
        pedido_id: newPedidoId,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: price,
        subtotal: item.quantidade * price
      };
    });

    const newPedido: Pedido = {
      id: newPedidoId,
      tipo_pedido: 'entrega',
      cliente_id: clienteId,
      status: 'pendente',
      data_pedido: new Date().toISOString(),
      itens: newItems
    };

    saveState('saas_pedidos', [newPedido, ...pedidos], setPedidos);
  };

  // Navigation Active Tab inside SaaS
  const [currentTab, setCurrentTab] = useState<'caixa' | 'mesas' | 'delivery' | 'financial' | 'crud' | 'waiter' | 'produtos' | 'clientes' | 'estoque' | 'admin_saas' | 'database'>('caixa');

  // --- DYNAMIC MULTI-TENANT LOADER ---
  const loadTenantData = (tenantId: string) => {
    if (tenantId === 'bella') {
      setTenantName('Pizzaria Bella Itália');
      setTenantPrimaryColor('rose');
      setProdutos(getStorageData('saas_bella_produtos', BELLA_PRODUTOS));
      setClientes(getStorageData('saas_bella_clientes', INITIAL_CLIENTES));
      setFuncionarios(getStorageData('saas_bella_funcionarios', INITIAL_FUNCIONARIOS));
      setFornecedores(getStorageData('saas_bella_fornecedores', INITIAL_FORNECEDORES));
      setMesas(getStorageData('saas_bella_mesas', ZEROED_MESAS));
      setPedidos(getStorageData('saas_bella_pedidos', []));
      setCaixas(getStorageData('saas_bella_caixas', []));
      setMovimentacoes(getStorageData('saas_bella_movimentacoes', []));
      setContasPagar(getStorageData('saas_bella_contaspagar', []));
      setContasReceber(getStorageData('saas_bella_contasreceber', []));
      setValesComissoes(getStorageData('saas_bella_valescomissoes', []));
    } else if (tenantId === 'chef') {
      setTenantName('Pastelaria do Chef');
      setTenantPrimaryColor('amber');
      setProdutos(getStorageData('saas_chef_produtos', CHEF_PRODUTOS));
      setClientes(getStorageData('saas_chef_clientes', INITIAL_CLIENTES));
      setFuncionarios(getStorageData('saas_chef_funcionarios', INITIAL_FUNCIONARIOS));
      setFornecedores(getStorageData('saas_chef_fornecedores', INITIAL_FORNECEDORES));
      setMesas(getStorageData('saas_chef_mesas', ZEROED_MESAS));
      setPedidos(getStorageData('saas_chef_pedidos', []));
      setCaixas(getStorageData('saas_chef_caixas', []));
      setMovimentacoes(getStorageData('saas_chef_movimentacoes', []));
      setContasPagar(getStorageData('saas_chef_contaspagar', []));
      setContasReceber(getStorageData('saas_chef_contasreceber', []));
      setValesComissoes(getStorageData('saas_chef_valescomissoes', []));
    } else if (tenantId === 'admin') {
      setTenantName('Administração Geral');
      setTenantPrimaryColor('slate');
      setProdutos([]);
      setClientes([]);
      setFuncionarios([]);
      setFornecedores([]);
      setMesas([]);
      setPedidos([]);
      setCaixas([]);
      setMovimentacoes([]);
      setContasPagar([]);
      setContasReceber([]);
      setValesComissoes([]);
    } else {
      // Dynamically registered establishments
      const matched = empresas.find(emp => emp.id === tenantId);
      const matchedName = matched ? matched.nome_empresa : 'Cantina & Bar Estrela';
      const matchedResponsible = matched ? matched.nome_responsavel : 'Administrador';
      
      setTenantName(matchedName);
      setTenantPrimaryColor('indigo');
      
      setProdutos(getStorageData(`saas_${tenantId}_produtos`, []));
      setClientes(getStorageData(`saas_${tenantId}_clientes`, []));
      setFuncionarios(getStorageData(`saas_${tenantId}_funcionarios`, [
        { id: `fn-${tenantId}-1`, nome: matchedResponsible, cargo: 'admin', telefone: '', comissao_percentual: 10, data_cadastro: new Date().toISOString() }
      ]));
      setFornecedores(getStorageData(`saas_${tenantId}_fornecedores`, []));
      setMesas(getStorageData(`saas_${tenantId}_mesas`, ZEROED_MESAS));
      setPedidos(getStorageData(`saas_${tenantId}_pedidos`, []));
      setCaixas(getStorageData(`saas_${tenantId}_caixas`, []));
      setMovimentacoes(getStorageData(`saas_${tenantId}_movimentacoes`, []));
      setContasPagar(getStorageData(`saas_${tenantId}_contaspagar`, []));
      setContasReceber(getStorageData(`saas_${tenantId}_contasreceber`, []));
      setValesComissoes(getStorageData(`saas_${tenantId}_valescomissoes`, []));
    }
  };

  // --- LOAD INITIAL DATA ON MOUNT OR TENANT SWITCH ---
  useEffect(() => {
    loadTenantData(currentTenantId);
    
    const runCloudSync = async () => {
      setIsSyncing(true);
      setDbStatusMsg('Buscando dados da nuvem...');
      try {
        const cloudData = await syncFromCloud(currentTenantId);
        if (cloudData) {
          if (cloudData.saas_produtos !== undefined) setProdutos(cloudData.saas_produtos);
          if (cloudData.saas_clientes !== undefined) setClientes(cloudData.saas_clientes);
          if (cloudData.saas_funcionarios !== undefined) setFuncionarios(cloudData.saas_funcionarios);
          if (cloudData.saas_fornecedores !== undefined) setFornecedores(cloudData.saas_fornecedores);
          if (cloudData.saas_mesas !== undefined) setMesas(cloudData.saas_mesas);
          if (cloudData.saas_pedidos !== undefined) setPedidos(cloudData.saas_pedidos);
          if (cloudData.saas_caixas !== undefined) setCaixas(cloudData.saas_caixas);
          if (cloudData.saas_movimentacoes !== undefined) setMovimentacoes(cloudData.saas_movimentacoes);
          if (cloudData.saas_contaspagar !== undefined) setContasPagar(cloudData.saas_contaspagar);
          if (cloudData.saas_contasreceber !== undefined) setContasReceber(cloudData.saas_contasreceber);
          if (cloudData.saas_valescomissoes !== undefined) setValesComissoes(cloudData.saas_valescomissoes);
          setDbStatusMsg('Nuvem Sincronizada!');
        } else {
          setDbStatusMsg('Usando cache local');
        }
      } catch (e) {
        console.warn('Silent cloud sync failed:', e);
        setDbStatusMsg('Sem internet, dados salvos localmente');
      } finally {
        setIsSyncing(false);
      }
    };

    const timer = setTimeout(() => {
      runCloudSync();
    }, 800);

    // Load custom tenant config if any
    const savedConfig = localStorage.getItem(`saas_tenant_config_${currentTenantId}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.name) setTenantName(parsed.name);
        if (parsed.color) setTenantPrimaryColor(parsed.color);
        if (parsed.fee !== undefined) setServiceFee(parsed.fee);
      } catch (e) {}
    }

    return () => clearTimeout(timer);
  }, [currentTenantId]);

  // --- PERSIST STATES ON ANY CHANGE AND DETECT CURRENT TENANT ---
  const saveState = (key: string, data: any, stateSetter: any) => {
    stateSetter(data);
    saveCloudState(currentTenantId, key, data);
  };

  // Saved Tenant Config automatically on fields change
  useEffect(() => {
    localStorage.setItem(`saas_tenant_config_${currentTenantId}`, JSON.stringify({
      name: tenantName,
      color: tenantPrimaryColor,
      fee: serviceFee
    }));
  }, [tenantName, tenantPrimaryColor, serviceFee, currentTenantId]);

  // --- DYNAMICALLY RESOLVED CAUTIOUS STATES ---
  const activeCaixa = useMemo(() => {
    return caixas.find(c => c.status === 'aberto');
  }, [caixas]);

  // --- CORE STATE ACTION RESOLVERS & BUSINESS LOGIC ---
  
  // 1. Open daily Cash Register (CaixaDiario)
  const handleOpenCaixa = (valorInicial: number, employeeId: string) => {
    const newCaixa: CaixaDiario = {
      id: `cx-${Date.now()}`,
      data_abertura: new Date().toISOString(),
      valor_inicial: valorInicial,
      status: 'aberto',
      funcionario_id: employeeId
    };

    const newMov: MovimentacaoCaixa = {
      id: `mov-${Date.now()}`,
      caixa_id: newCaixa.id,
      tipo: 'entrada',
      valor: valorInicial,
      forma_pagamento: 'dinheiro',
      status_pagamento: 'pago',
      data: new Date().toISOString(),
      descricao: `Abertura oficial de caixa por operador designado`
    };

    saveState('saas_caixas', [newCaixa, ...caixas], setCaixas);
    saveState('saas_movimentacoes', [newMov, ...movimentacoes], setMovimentacoes);
  };

  // 2. Close active Cash Register
  const handleCloseCaixa = (valorFinal: number) => {
    if (!activeCaixa) return;

    const updatedCaixas = caixas.map(c => {
      if (c.id === activeCaixa.id) {
        return {
          ...c,
          status: 'fechado' as const,
          data_fechamento: new Date().toISOString(),
          valor_final: valorFinal
        };
      }
      return c;
    });

    saveState('saas_caixas', updatedCaixas, setCaixas);
  };

  const handleSimulateNewTenant = () => {
    const zeroed = produtos.map(p => ({ ...p, estoque_atual: 0 }));
    saveState('saas_produtos', zeroed, setProdutos);
    alert("Simulação de nova contratação ativada! O estoque de todos os produtos do Mix foi zerado (0). Agora a empresa contratante deverá inserir o estoque atual manualmente!");
  };

  // 3. Manual suprimento/sangria flow
  const handleAddMovimentacao = (mov: Omit<MovimentacaoCaixa, 'id' | 'data'>) => {
    const newMov: MovimentacaoCaixa = {
      ...mov,
      id: `mov-${Date.now()}`,
      data: new Date().toISOString()
    };
    saveState('saas_movimentacoes', [newMov, ...movimentacoes], setMovimentacoes);
  };

  // 4. MAIN CENTRALIZED POS SALES REGISTRATION RULES
  const handleRegisterSale = (
    tipoPedido: 'balcao' | 'entrega' | 'mesa',
    funcionarioId: string,
    clienteId: string | undefined,
    itens: { produtoId: string; quantidade: number; precoUnitario: number }[],
    formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado',
    dataPrometidaFiado?: string
  ) => {
    // Determine active register checks
    if (!activeCaixa && formaPagamento !== 'fiado') {
      return { success: false, error: 'O caixa está FECHADO. Impossível realizar transações fiscais.' };
    }

    // A. STOCK RULES: Verify and deduct stock
    const updatedProducts = produtos.map(prod => {
      const line = itens.find(it => it.produtoId === prod.id);
      if (line) {
        const nextStock = prod.estoque_atual - line.quantidade;
        if (nextStock < 0) {
          return null; // Will trigger bounds error if returned null
        }
        return {
          ...prod,
          estoque_atual: nextStock
        };
      }
      return prod;
    });

    if (updatedProducts.includes(null)) {
      return { success: false, error: 'Erro de estoque: Um ou mais itens selecionados ultrapassam o volume disponível.' };
    }

    // Apply stock deduction changes
    saveState('saas_produtos', updatedProducts.filter(Boolean) as Produto[], setProdutos);

    // B. Create the order
    const pedidoTotal = itens.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0);
    const newPedidoId = `ped-${Date.now()}`;
    const newItems = itens.map((item, idx) => ({
      id: `iti-${newPedidoId}-${idx}`,
      pedido_id: newPedidoId,
      produto_id: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
      subtotal: item.quantidade * item.precoUnitario
    }));

    const newPedido: Pedido = {
      id: newPedidoId,
      tipo_pedido: tipoPedido,
      cliente_id: clienteId,
      funcionario_id: funcionarioId,
      status: 'concluido',
      data_pedido: new Date().toISOString(),
      itens: newItems
    };

    // Save order
    saveState('saas_pedidos', [newPedido, ...pedidos], setPedidos);

    // C. FINANCE ROUTING & "FIADO" RULE: 
    if (formaPagamento === 'fiado') {
      if (!clienteId) {
        return { success: false, error: 'Venda a prazo/fiado exige identificação prévia do cliente.' };
      }
      
      const client = clientes.find(c => c.id === clienteId);
      if (client && client.limite_fiado < pedidoTotal) {
        return { 
          success: false, 
          error: `Limite INSUBISTENTE. O cliente ${client.nome} possui limite de R$ ${client.limite_fiado.toFixed(2)}, mas a compra soma R$ ${pedidoTotal.toFixed(2)}.` 
        };
      }

      // If fiado, do NOT add to cash flow, but register "contas_a_receber"
      const newFiadoDueDate = dataPrometidaFiado || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newReceivable: ContaAReceber = {
        id: `cr-${Date.now()}`,
        cliente_id: clienteId,
        pedido_id: newPedido.id,
        valor: pedidoTotal,
        data_pedido: new Date().toISOString().split('T')[0],
        data_prometida_pagamento: newFiadoDueDate,
        status: 'pendente'
      };

      saveState('saas_contasreceber', [newReceivable, ...contasReceber], setContasReceber);
    } else {
      // IF PAID (Dinheiro, PIX, Débito, Crédito) -> Add to active cash balance!
      if (activeCaixa) {
        const cashMovement: MovimentacaoCaixa = {
          id: `mov-${Date.now()}`,
          caixa_id: activeCaixa.id,
          tipo: 'entrada',
          valor: pedidoTotal,
          forma_pagamento: formaPagamento,
          status_pagamento: 'pago',
          pedido_id: newPedido.id,
          data: new Date().toISOString(),
          descricao: `Venda registrada no Caixa`
        };

        saveState('saas_movimentacoes', [cashMovement, ...movimentacoes], setMovimentacoes);
      }
    }

    // D. WAITER COMMISSION RULE: If ordered by Waiter, calculate comissions & save as pending "vales_e_comissoes"
    const seller = funcionarios.find(f => f.id === funcionarioId);
    if (seller && seller.cargo === 'garcom') {
      const commissionAmount = pedidoTotal * (seller.comissao_percentual / 100);
      if (commissionAmount > 0) {
        const newCommission: ValeEComissao = {
          id: `vc-${Date.now()}`,
          funcionario_id: funcionarioId,
          tipo: 'comissao',
          valor: commissionAmount,
          status: 'pendente',
          data: new Date().toISOString()
        };
        saveState('saas_valescomissoes', [newCommission, ...valesComissoes], setValesComissoes);
      }
    }

    return { 
      success: true, 
      receiptData: {
        id: newPedido.id,
        data_pedido: newPedido.data_pedido,
        funcionario_id: funcionarioId,
        cliente_id: clienteId,
        formaPagamento,
        dataPrometidaFiado,
        valor_total: pedidoTotal,
        itens: newItems
      } 
    };
  };

  // 5. Open free Table on the waiter/dashboard layout
  const handleOpenMesa = (mesaId: string) => {
    const updatedMesas = mesas.map(m => {
      if (m.id === mesaId && m.status === 'livre') {
        return {
          ...m,
          status: 'ocupada' as const
        };
      }
      return m;
    });
    saveState('saas_mesas', updatedMesas, setMesas);
  };

  // 6. Direct Order from waiter/garçom view adding directly to bills
  const handleAddOrderToMesa = (
    mesaId: string, 
    waiterId: string, 
    items: { produtoId: string; quantidade: number }[]
  ) => {
    // Calculate total
    let sessionTotal = 0;
    const itemRecords: any[] = [];

    // Deduct stocks
    const updatedProducts = produtos.map(prod => {
      const line = items.find(it => it.produtoId === prod.id);
      if (line) {
        sessionTotal += (prod.preco_venda * line.quantidade);
        itemRecords.push({
          produtoId: prod.id,
          quantidade: line.quantidade,
          precoUnitario: prod.preco_venda
        });
        return {
          ...prod,
          estoque_atual: Math.max(0, prod.estoque_atual - line.quantidade)
        };
      }
      return prod;
    });

    saveState('saas_produtos', updatedProducts, setProdutos);

    // Save actual order row (Preparo state inside and marked as Mesa type order)
    const newPedidoId = `ped-mesa-${Date.now()}`;
    const newItems = items.map((item, idx) => {
      const prod = produtos.find(p => p.id === item.produtoId);
      const price = prod?.preco_venda || 0;
      return {
        id: `iti-${newPedidoId}-${idx}`,
        pedido_id: newPedidoId,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: price,
        subtotal: item.quantidade * price
      };
    });

    const newPedido: Pedido = {
      id: newPedidoId,
      tipo_pedido: 'mesa',
      mesa_id: mesaId,
      funcionario_id: waiterId,
      status: 'preparo',
      data_pedido: new Date().toISOString(),
      itens: newItems
    };

    saveState('saas_pedidos', [newPedido, ...pedidos], setPedidos);

    // Update table stats
    const updatedMesas = mesas.map(m => {
      if (m.id === mesaId) {
        return {
          ...m,
          status: 'ocupada' as const,
          total_atual: m.total_atual + sessionTotal
        };
      }
      return m;
    });
    saveState('saas_mesas', updatedMesas, setMesas);
  };

  // 7. Update generic Table status from the visual desks grid dashboard
  const handleSetStatusMesa = (id: string, status: Mesa['status']) => {
    const updatedMesas = mesas.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status,
          total_atual: status === 'livre' ? 0 : m.total_atual
        };
      }
      return m;
    });
    saveState('saas_mesas', updatedMesas, setMesas);
  };

  // 8. Trigger Desk checkout redirect: Transfer details to Cashier PDV
  const handleSelectMesaForPayment = (mesa: Mesa) => {
    // Find active prep/entregue order for this table
    const assocPedido = pedidos.find(p => p.mesa_id === mesa.id && p.status !== 'concluido');
    if (!assocPedido || !assocPedido.itens || assocPedido.itens.length === 0) {
      alert(`ERRO: Nenhum pedido ativo em preparo registrado para a Mesa ${mesa.numero_mesa}! Forçaremos o checkout direto de R$ ${mesa.total_atual.toFixed(2)}.`);
      // If no order row exists, proceed anyway by letting user pay equivalent balance as miscellaneous item
      const miscPrice = mesa.total_atual;
      if (miscPrice <= 0) {
        alert("Esta mesa possui consumo zerado.");
        return;
      }
      
      const res = handleRegisterSale(
        'mesa',
        funcionarios.find(f => f.cargo === 'caixa')?.id || 'f-1',
        undefined,
        [{ produtoId: 'p-1', quantidade: 1, precoUnitario: miscPrice }], // Simulate purchase with core Beer representing table sum
        'dinheiro'
      );
      if (res.success) {
        handleSetStatusMesa(mesa.id, 'livre');
        setCurrentTab('caixa');
      }
    } else {
      // Transfer table cart list directly to central checkout register
      const itemsPayload = assocPedido.itens.map(it => ({
        produtoId: it.produto_id,
        quantidade: it.quantidade,
        precoUnitario: it.preco_unitario
      }));

      const response = handleRegisterSale(
        'mesa',
        assocPedido.funcionario_id || 'f-1',
        undefined,
        itemsPayload,
        'dinheiro'
      );

      if (response.success) {
        // Mark associated order as completed
        const updatedPedidos = pedidos.map(p => {
          if (p.id === assocPedido.id) {
            return { ...p, status: 'concluido' as const };
          }
          return p;
        });
        saveState('saas_pedidos', updatedPedidos, setPedidos);

        // Reset Table
        handleSetStatusMesa(mesa.id, 'livre');
        setCurrentTab('caixa');
        alert(`Mesa ${mesa.numero_mesa} fechada e paga via Dinheiro com Sucesso!`);
      }
    }
  };

  // 8b. Clean full-white table payment from our new checkout panel
  const handleCloseMesaAndCompletePayment = (
    mesaId: string,
    orderIds: string[],
    sellerId: string,
    buyerId: string | undefined,
    itens: { produtoId: string; quantidade: number; precoUnitario: number }[],
    paymentMethod: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado',
    dataPrometidaFiado?: string
  ) => {
    // Register pos sale
    const response = handleRegisterSale(
      'mesa',
      sellerId,
      buyerId,
      itens,
      paymentMethod,
      dataPrometidaFiado
    );

    if (response.success) {
      // Mark old pending table orders as done
      const updatedPedidos = pedidos.map(p => {
        if (orderIds.includes(p.id)) {
          return { ...p, status: 'concluido' as const };
        }
        return p;
      });
      saveState('saas_pedidos', updatedPedidos, setPedidos);

      // Reset Table completely
      const updatedMesas = mesas.map(m => {
        if (m.id === mesaId) {
          return {
            ...m,
            status: 'livre' as const,
            total_atual: 0,
            gorjeta_aceita: false
          };
        }
        return m;
      });
      saveState('saas_mesas', updatedMesas, setMesas);

      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  };

  const handleToggleGorjetaMesa = (id: string) => {
    const updatedMesas = mesas.map(m => {
      if (m.id === id) {
        return {
          ...m,
          gorjeta_aceita: !m.gorjeta_aceita
        };
      }
      return m;
    });
    saveState('saas_mesas', updatedMesas, setMesas);
  };

  const handleUpdateMesaName = (id: string, name: string) => {
    const updatedMesas = mesas.map(m => {
      if (m.id === id) {
        return {
          ...m,
          nome_personalizado: name
        };
      }
      return m;
    });
    saveState('saas_mesas', updatedMesas, setMesas);
  };

  // 9. Delivery dispatches or Status Changes
  const handleUpdatePedidoStatus = (pedidoId: string, status: Pedido['status']) => {
    const updatedPedidos = pedidos.map(p => {
      if (p.id === pedidoId) {
        // If status is concluid, trigger cash registers
        if (status === 'concluido') {
          const totalOrderVal = (p.itens?.reduce((sum, item) => sum + item.subtotal, 0) || 0) + 5.00; // Total includes delivery rate
          
          // Increment separate delivery cashier sales
          const newVendasConcluidas = caixaDeliveryVendasConcluidas + totalOrderVal;
          setCaixaDeliveryVendasConcluidas(newVendasConcluidas);
          localStorage.setItem('saas_caixa_delivery_vendas_concluidas', newVendasConcluidas.toString());

          // Send total to Caixa Geral (using activeCaixa.id if open, or falling back so that the total enters the General system Cash registers)
          const targetCaixaId = activeCaixa ? activeCaixa.id : (caixas[0]?.id || 'geral_independente');
          const extraDeliveryMov: MovimentacaoCaixa = {
            id: `mov-${Date.now()}`,
            caixa_id: targetCaixaId,
            tipo: 'entrada',
            valor: totalOrderVal,
            forma_pagamento: 'dinheiro',
            status_pagamento: 'pago',
            pedido_id: p.id,
            data: new Date().toISOString(),
            descricao: `Venda Delivery entregue e recolhida`
          };
          saveState('saas_movimentacoes', [extraDeliveryMov, ...movimentacoes], setMovimentacoes);
        }
        return {
          ...p,
          status
        };
      }
      return p;
    });
    saveState('saas_pedidos', updatedPedidos, setPedidos);
  };

  const handleDispatchDelivery = (pedidoId: string, driverName: string) => {
    const updatedPedidos = pedidos.map(p => {
      if (p.id === pedidoId) {
        return {
          ...p,
          status: 'entregue' as const, // Saiu para entrega
          driver_name: driverName
        };
      }
      return p;
    });
    saveState('saas_pedidos', updatedPedidos, setPedidos);
  };

  // 15. Financial adjustments
  const handleAddContaPagar = (conta: Omit<ContaAPagar, 'id'>) => {
    const newConta: ContaAPagar = {
      ...conta,
      id: `cp-${Date.now()}`
    };
    saveState('saas_contaspagar', [newConta, ...contasPagar], setContasPagar);
  };

  const handlePayContaPagar = (id: string) => {
    const updated = contasPagar.map(cp => {
      if (cp.id === id) {
        // Log physically inside cashier as cash payout
        if (activeCaixa) {
          const supplierName = fornecedores.find(f => f.id === cp.fornecedor_id)?.nome_empresa || 'Fornecedor';
          const payout: MovimentacaoCaixa = {
            id: `mov-${Date.now()}`,
            caixa_id: activeCaixa.id,
            tipo: 'saida',
            valor: cp.valor,
            forma_pagamento: 'dinheiro',
            status_pagamento: 'pago',
            data: new Date().toISOString(),
            descricao: `Pagamento de Duplicata: ${supplierName}`
          };
          saveState('saas_movimentacoes', [payout, ...movimentacoes], setMovimentacoes);
        }
        return {
          ...cp,
          status: 'pago' as const,
          data_pagamento: TODAY_STR
        };
      }
      return cp;
    });
    saveState('saas_contaspagar', updated, setContasPagar);
  };

  const handleReceiveContaReceber = (id: string) => {
    const updated = contasReceber.map(cr => {
      if (cr.id === id) {
        // Receive in cash register
        if (activeCaixa) {
          const clientName = clientes.find(c => c.id === cr.cliente_id)?.nome || 'Cliente';
          const receivableInflow: MovimentacaoCaixa = {
            id: `mov-${Date.now()}`,
            caixa_id: activeCaixa.id,
            tipo: 'entrada',
            valor: cr.valor,
            forma_pagamento: 'dinheiro',
            status_pagamento: 'pago',
            data: new Date().toISOString(),
            descricao: `Recebimento de Fiado: ${clientName}`
          };
          saveState('saas_movimentacoes', [receivableInflow, ...movimentacoes], setMovimentacoes);
        }
        return {
          ...cr,
          status: 'pago' as const
        };
      }
      return cr;
    });
    saveState('saas_contasreceber', updated, setContasReceber);
  };

  // 16. Vale / Commissions actions
  const handleAddValeComissao = (vc: Omit<ValeEComissao, 'id' | 'data'>) => {
    const newVC: ValeEComissao = {
      ...vc,
      id: `vc-${Date.now()}`,
      data: new Date().toISOString()
    };
    saveState('saas_valescomissoes', [newVC, ...valesComissoes], setValesComissoes);
  };

  const handlePayValeComissao = (id: string) => {
    const updated = valesComissoes.map(vc => {
      if (vc.id === id) {
        if (activeCaixa) {
          const staffName = funcionarios.find(f => f.id === vc.funcionario_id)?.nome || 'Funcionário';
          const payout: MovimentacaoCaixa = {
            id: `mov-${Date.now()}`,
            caixa_id: activeCaixa.id,
            tipo: 'saida',
            valor: vc.valor,
            forma_pagamento: 'dinheiro',
            status_pagamento: 'pago',
            data: new Date().toISOString(),
            descricao: `Baixa de comissão/vale: ${staffName}`
          };
          saveState('saas_movimentacoes', [payout, ...movimentacoes], setMovimentacoes);
        }
        return {
          ...vc,
          status: 'pago' as const
        };
      }
      return vc;
    });
    saveState('saas_valescomissoes', updated, setValesComissoes);
  };

  const TODAY_STR = '2026-06-12';

  // --- ADD QUICK CLIENT FROM PDV SIDEBAR ---
  const handleQuickAddClient = (clientData: Omit<Cliente, 'id' | 'data_cadastro'>) => {
    const newId = `c-quick-${Date.now()}`;
    const newClient: Cliente = {
      ...clientData,
      id: newId,
      data_cadastro: new Date().toISOString()
    };
    
    // Add to active clients list
    const updatedClientes = [newClient, ...clientes];
    setClientes(updatedClientes);
    
    // Save tenant-specifically on local cache
    if (currentTenantId === 'bella') {
      localStorage.setItem('saas_bella_clientes', JSON.stringify(updatedClientes));
    } else if (currentTenantId === 'chef') {
      localStorage.setItem('saas_chef_clientes', JSON.stringify(updatedClientes));
    } else {
      localStorage.setItem(`saas_${currentTenantId}_clientes`, JSON.stringify(updatedClientes));
    }
    return newId;
  };

  // --- PHONE LOGIN HANDLER ---
  const handlePhoneLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhoneDigits = loginPhone.replace(/\D/g, '');
    const cleanPassword = loginPassword.trim();
    
    // Admin bypass block
    if (cleanPhoneDigits === '21975151937' && cleanPassword === 'Wag0508$') {
      setCurrentTenantId('admin');
      localStorage.setItem('saas_current_tenant_id', 'admin');
      setIsAuthenticated(true);
      localStorage.setItem('saas_is_authenticated', 'true');
      localStorage.setItem('saas_is_admin_user', 'true');
      setCurrentTab('admin_saas');
      return;
    }
    
    // Search current dynamic list, fallback to DEFAULT_EMPRESAS so built-in test credentials NEVER fail
    let matched = empresas.find(emp => emp.telefone_admin.replace(/\D/g, '') === cleanPhoneDigits);
    if (!matched) {
      matched = DEFAULT_EMPRESAS.find(emp => emp.telefone_admin.replace(/\D/g, '') === cleanPhoneDigits);
    }
    
    if (!matched) {
      alert('Corrija seu telefone');
      return;
    }
    
    if (matched.senha_hash.trim() !== cleanPassword) {
      alert('Corrija sua senha');
      return;
    }
    
    if (matched.status_assinatura === 'bloqueado') {
      alert('Esta empresa está bloqueada! Favor regularizar a mensalidade de R$ 50 ou contactar o suporte WT Sistemas.');
      return;
    }
    
    // Log in!
    setCurrentTenantId(matched.id);
    localStorage.setItem('saas_current_tenant_id', matched.id);
    setIsAuthenticated(true);
    localStorage.setItem('saas_is_authenticated', 'true');
    localStorage.removeItem('saas_is_admin_user'); // Not admin unless admin bypass used
    setCurrentTab('caixa');
  };

  // --- PASSWORD SECURITY REGEX CHECK ---
  const checkPasswordStrength = (psw: string) => {
    return psw.length >= 4;
  };

  // --- REGISTER COMPANY HANDLER ---
  const handleRegisterCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompanyName.trim() || !regResponsibleName.trim() || !regPhone.trim() || !regPassword.trim()) {
      alert('Todos os campos são obrigatórios!');
      return;
    }
    
    const cleanRegPhone = regPhone.replace(/\D/g, '');
    if (cleanRegPhone.length < 10) {
      alert('Insira um telefone comercial válido!');
      return;
    }
    
    // Validate password pattern strictly
    if (!checkPasswordStrength(regPassword)) {
      alert('A senha escolhida precisa ter pelo menos 4 caracteres!');
      return;
    }
    
    // Check duplication
    const duplicate = empresas.find(emp => emp.telefone_admin.replace(/\D/g, '') === cleanRegPhone);
    if (duplicate) {
      alert('Já existe uma empresa cadastrada com esse telefone comercial!');
      return;
    }
    
    // Define 30 days trial expiration
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + 30);
    
    const newEmpId = `emp-${Date.now()}`;
    const newEmpresa: Empresa = {
      id: newEmpId,
      nome_empresa: regCompanyName,
      nome_responsavel: regResponsibleName,
      telefone_admin: cleanRegPhone,
      senha_hash: regPassword,
      status_assinatura: 'trial',
      data_cadastro: now.toISOString(),
      data_fim_trial: trialEnd.toISOString()
    };
    
    // Save to empresas
    const updatedEmpresas = [...empresas, newEmpresa];
    setEmpresas(updatedEmpresas);
    localStorage.setItem('saas_empresas_list', JSON.stringify(updatedEmpresas));
    
    // Track last registered company
    setLastRegisteredEmpId(newEmpId);
    localStorage.setItem('saas_last_registered_emp_id', newEmpId);
    
    // Suggest and fill candidate login credentials
    const formattedPhone = formatBrazilPhoneInput(cleanRegPhone);
    setLoginPhone(formattedPhone);
    setLoginPassword(regPassword);
    
    // Reset inputs
    setRegCompanyName('');
    setRegResponsibleName('');
    setRegPhone('');
    setRegPassword('');
    setAuthTab('login');
    
    alert(`Parabéns! Empresa "${newEmpresa.nome_empresa}" cadastrada com sucesso! Período de teste gratuito por 30 dias (trial) foi ativado.\n\nPreenchemos seus dados automaticamente no login.`);
  };

  // Dynamic Brazil phone mask utility
  const formatBrazilPhoneInput = (v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
  };

  // --- RENDERING CONFIGURATION THEME MAP ---
  const primaryThemeColorClass = {
    indigo: {
      bg: 'bg-indigo-600 hover:bg-indigo-700',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      gradient: 'from-indigo-600 to-indigo-850',
      focus: 'focus:ring-indigo-500Border',
      accText: 'text-indigo-700'
    },
    amber: {
      bg: 'bg-amber-600 hover:bg-amber-500',
      border: 'border-amber-200',
      text: 'text-amber-600',
      gradient: 'from-amber-600 to-amber-800',
      focus: 'focus:ring-amber-500Border',
      accText: 'text-amber-700'
    },
    rose: {
      bg: 'bg-rose-600 hover:bg-rose-500',
      border: 'border-rose-200',
      text: 'text-rose-600',
      gradient: 'from-rose-600 to-rose-800',
      focus: 'focus:ring-rose-500Border',
      accText: 'text-rose-700'
    },
    emerald: {
      bg: 'bg-emerald-600 hover:bg-emerald-700',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      gradient: 'from-emerald-600 to-emerald-800',
      focus: 'focus:ring-emerald-500Border',
      accText: 'text-emerald-700'
    },
    slate: {
      bg: 'bg-slate-700 hover:bg-slate-600',
      border: 'border-slate-300',
      text: 'text-slate-800',
      gradient: 'from-slate-700 to-slate-900',
      focus: 'focus:ring-slate-500Border',
      accText: 'text-slate-800'
    }
  }[tenantPrimaryColor];

  // --- MULTI-TENANT QUICK LOGIN METHODS ---
  const handleQuickLogin = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    localStorage.setItem('saas_current_tenant_id', tenantId);
    if (tenantId === 'bella') {
      setUsername('bella@pizza.com');
      setTenantName('Pizzaria Bella Itália');
      setTenantPrimaryColor('rose');
    } else if (tenantId === 'chef') {
      setUsername('chef@pastel.com');
      setTenantName('Pastelaria do Chef');
      setTenantPrimaryColor('amber');
    }
    setIsAuthenticated(true);
    localStorage.setItem('saas_is_authenticated', 'true');
  };

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUser = username.trim().toLowerCase();
    
    let targetTenant = 'bella';
    if (normalizedUser === 'chef@pastel.com') {
      targetTenant = 'chef';
    } else if (normalizedUser === 'bella@pizza.com') {
      targetTenant = 'bella';
    } else if (normalizedUser === 'admin@pizzariasaas.com') {
      targetTenant = 'admin';
    } else {
      targetTenant = 'bella';
    }

    setCurrentTenantId(targetTenant);
    localStorage.setItem('saas_current_tenant_id', targetTenant);
    setIsAuthenticated(true);
    localStorage.setItem('saas_is_authenticated', 'true');
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${isThemeDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${isThemeDark ? 'dark' : ''}`}>
      
      {/* 1. AUTHENTICATED OR NOT - LANDING LOGIN */}
      {!isAuthenticated ? (
        <div className="min-h-screen flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 relative overflow-y-auto">
          
          {/* Visual Accents decorative */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
 
          <div className="max-w-xl w-full space-y-6 bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl relative z-10 transition-all font-sans">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                <Building2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">SaaS Multi-Tenant PDV</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Bares & Lanchonetes (R$ 50/mês)</p>
            </div>

            {/* TAB SELECTOR: LOGIN VS CADASTRAR */}
            <div className="flex border-b border-slate-800 p-1 bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  authTab === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fazer Login
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  authTab === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cadastrar Empresa
              </button>
            </div>

            {authTab === 'login' ? (
              /* TAB 1: LOGIN FORM */
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Acesse com Telefone & Senha</span>
                </div>

                <form className="space-y-4" onSubmit={handlePhoneLoginSubmit}>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Telefone de Acesso (Login)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (21) 97515-1937"
                      value={loginPhone}
                      onChange={e => setLoginPhone(formatBrazilPhoneInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Senha de Entrada</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider text-center cursor-pointer"
                  >
                    Entrar no Sistema
                  </button>
                </form>

                {/* Show candidate login suggestion only if the user has recently registered a tenant locally */}
                {lastRegisteredEmp && (
                  <div className="space-y-3 pt-4 border-t border-slate-900">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="h-px bg-slate-850 flex-1"></span>
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider font-mono">Sugestão de Login Conectado</span>
                      <span className="h-px bg-slate-850 flex-1"></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const formatted = formatBrazilPhoneInput(lastRegisteredEmp.telefone_admin);
                        setLoginPhone(formatted);
                        setLoginPassword(lastRegisteredEmp.senha_hash);
                        alert(`Dados preenchidos com o seu cadastro de "${lastRegisteredEmp.nome_empresa}". Clique em "Entrar no Sistema"!`);
                      }}
                      className="w-full bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/30 hover:border-emerald-500/65 p-3.5 rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                          ✨ SEU CADASTRO REALIZADO
                        </span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          Re-Preencher
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white mt-1">{lastRegisteredEmp.nome_empresa}</h3>
                      <p className="text-[10px] text-slate-400">Responsável: {lastRegisteredEmp.nome_responsavel}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Telefone: {formatBrazilPhoneInput(lastRegisteredEmp.telefone_admin)}</p>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: REGISTER COMPANY CLIENT FORM */
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                    Inicie seu teste gratuito por 30 dias (TRIAL)
                  </span>
                </div>

                <form className="space-y-4 text-xs" onSubmit={handleRegisterCompanySubmit}>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Nome da Empresa / Comércio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Bar do João"
                      value={regCompanyName}
                      onChange={e => setRegCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Nome do Responsável *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={regResponsibleName}
                      onChange={e => setRegResponsibleName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Telefone Comercial (Seu Login) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (21) 99999-9999"
                      value={regPhone}
                      onChange={e => setRegPhone(formatBrazilPhoneInput(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold mb-0.5">Criar Senha de Segurança *</label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 chars"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-mono"
                    />

                    {/* REAL-TIME PASSWORD REQUIREMENT FEEDBACK */}
                    <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-850 space-y-1.5 transition-all">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                        Validação de Senha em Tempo Real:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className={/[A-Z]/.test(regPassword) ? "text-emerald-400 font-bold" : "text-rose-450 font-bold"}>
                            {/[A-Z]/.test(regPassword) ? "✓" : "✗"}
                          </span>
                          <span className={/[A-Z]/.test(regPassword) ? "text-white" : "text-slate-500"}>1 Letra Maiúscula</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={/[a-z]/.test(regPassword) ? "text-emerald-400 font-bold" : "text-rose-450 font-bold"}>
                            {/[a-z]/.test(regPassword) ? "✓" : "✗"}
                          </span>
                          <span className={/[a-z]/.test(regPassword) ? "text-white" : "text-slate-500"}>1 Letra Minúscula</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={(regPassword.match(/\d/g) || []).length >= 4 ? "text-emerald-400 font-bold" : "text-rose-450 font-bold"}>
                            {(regPassword.match(/\d/g) || []).length >= 4 ? "✓" : "✗"}
                          </span>
                          <span className={(regPassword.match(/\d/g) || []).length >= 4 ? "text-white" : "text-slate-500"}>Mínimo 4 Números</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={/[^A-Za-z0-9]/.test(regPassword) ? "text-emerald-400 font-bold" : "text-rose-450 font-bold"}>
                            {/[^A-Za-z0-9]/.test(regPassword) ? "✓" : "✗"}
                          </span>
                          <span className={/[^A-Za-z0-9]/.test(regPassword) ? "text-white" : "text-slate-500"}>1 Carac. Especial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider text-center cursor-pointer"
                  >
                    Cadastrar Empresa & Fazer Login
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      ) : (
        /* 2. AUTHENTICATED INNER SYSTEMS DASHBOARD */
        <>
          {/* SIDEBAR NAVIGATION - Clean Utility / Minimal style */}
          <aside className="hidden md:flex w-24 bg-slate-900 flex-col items-center py-6 justify-between shrink-0 text-white select-none border-r border-slate-800">
            <div className="flex flex-col items-center gap-8 w-full">
              {/* App Launcher Logo */}
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 tracking-wider font-mono">
                {currentTenantId === 'admin' ? 'WT' : 'PDV'}
              </div>
              
              {/* Vertical Nav List */}
              <nav className="flex flex-col gap-4 w-full px-2">
                {[
                  ...(currentTenantId === 'admin' ? [{ id: 'admin_saas', label: 'VIP SaaS', icon: ShieldCheck }] : []),
                  { id: 'caixa', label: 'PDV', icon: Coins },
                  { id: 'mesas', label: 'Mesas', icon: Utensils },
                  { id: 'delivery', label: 'Delivery', icon: Truck },
                  { id: 'waiter', label: 'Garçom', icon: Smartphone },
                  { id: 'financial', label: 'Financeiro', icon: ArrowUpRight },
                  { id: 'crud', label: 'Cadastros', icon: Users },
                  { id: 'produtos', label: 'Produtos', icon: Package },
                  { id: 'database', label: 'Nuvem DB', icon: Database },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id as any)}
                      className={`w-full py-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all outline-none ${
                        isActive 
                          ? 'bg-slate-800 text-emerald-400 shadow-inner border border-slate-750 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-[9px] tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer details */}
            <div className="flex flex-col items-center gap-4 w-full">
              <button 
                onClick={() => setIsThemeDark(!isThemeDark)} 
                className="p-2.5 bg-slate-800 hover:bg-slate-750 hover:text-white rounded-xl text-slate-300 transition-colors"
                title="Alternar Tema"
              >
                {isThemeDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
              </button>

              <button 
                onClick={() => setIsAuthenticated(false)}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 hover:text-white rounded-xl text-slate-400 transition-colors"
                title="Branding & Config"
              >
                <Settings className="w-4 h-4 hover:rotate-45 transition-transform duration-300" />
              </button>

              <button 
                onClick={() => {
                  setIsAuthenticated(false);
                  localStorage.setItem('saas_is_authenticated', 'false');
                }}
                className="p-2.5 bg-rose-950/40 hover:bg-rose-600 hover:text-white rounded-xl text-rose-400 transition-colors border border-rose-900/30"
                title="Sair do Sistema / Alternar Empresa"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            
            {/* HEADER */}
            <header className={`min-h-[5.5rem] py-3.5 border-b shrink-0 flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 z-10 select-none transition-all duration-200 ${isThemeDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                      {currentTenantId === 'admin' ? 'W' : 'P'}
                    </span>
                    <h1 className="text-sm md:text-base font-black tracking-tight uppercase">
                      {currentTenantId === 'admin' ? 'WT SISTEMAS' : tenantName}
                    </h1>
                    <span className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      SaaS White-Label
                    </span>
                  </div>
                  
                  {/* SECONDARY HORIZONTAL NAVIGATION BAR */}
                  {currentTenantId !== 'admin' && (
                    <div className="flex items-center gap-1.5 mt-2 express-nav-bar bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-3xs" id="secondary-hdr-nav-rail">
                      {[
                        { id: 'clientes', label: 'CLIENTES' },
                        { id: 'produtos', label: 'PRODUTOS' },
                        { id: 'financial', label: 'FINANCEIRO' },
                        { id: 'estoque', label: 'ESTOQUE' },
                      ].map(tabItem => {
                        const isActive = currentTab === tabItem.id;
                        return (
                          <button
                            key={tabItem.id}
                            onClick={() => setCurrentTab(tabItem.id as any)}
                            className={`px-3 py-1 text-[10px] font-black rounded-md tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/55'
                            }`}
                          >
                            {tabItem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active register badge from template */}
                <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                  activeCaixa 
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' 
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-405 border border-rose-200/50 dark:border-rose-800/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeCaixa ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  <span className="hidden xs:inline text-[11px] uppercase tracking-wider font-bold">{activeCaixa ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}</span>
                  {activeCaixa && <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-400 font-normal ml-0.5">Operador: Lucas Silva</span>}
                </div>
              </div>

              {/* Mobile top-layout links if screen is small */}
              <div className="flex md:hidden items-center gap-1 overflow-x-auto max-w-[140px] xs:max-w-[180px] sm:max-w-xs custom-scrollbar py-1">
                {[
                  ...(currentTenantId === 'admin' ? [{ id: 'admin_saas', label: 'VIP SaaS' }] : []),
                  { id: 'caixa', label: 'PDV' },
                  { id: 'mesas', label: 'Mesas' },
                  { id: 'delivery', label: 'Deliv.' },
                  { id: 'waiter', label: 'Garçom' },
                  { id: 'financial', label: 'Finance' },
                  { id: 'crud', label: 'Cadastro' },
                  { id: 'produtos', label: 'Produtos' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id as any)}
                    className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-colors ${
                      currentTab === item.id 
                        ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400' 
                        : 'text-slate-505 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                {/* Theme switch specifically for mobile layout */}
                <button 
                  onClick={() => setIsThemeDark(!isThemeDark)} 
                  className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                  title="Alternar Tema"
                >
                  {isThemeDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                </button>

                <button 
                  onClick={() => setIsAuthenticated(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 flex items-center justify-center"
                  title="Configuração do Tenant"
                >
                  <Settings className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  <span className="hidden sm:inline ml-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Config SaaS</span>
                </button>

                <button 
                  onClick={() => {
                    setIsAuthenticated(false);
                    localStorage.setItem('saas_is_authenticated', 'false');
                  }}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg flex items-center justify-center gap-1 border border-rose-200/50"
                  title="Sair do Sistema / Alternar Empresa"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-black">SAIR / ALTERNAR</span>
                </button>
              </div>
            </header>

            {/* VIP ASSISTANCE BANNER */}
            {localStorage.getItem('saas_is_admin_user') === 'true' && currentTenantId !== 'admin' && (
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-indigo-950 text-white font-sans px-4 md:px-6 py-4 text-xs flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg border-b border-purple-800 z-20 shrink-0 select-none animate-fadeIn">
                <div className="flex items-center gap-3 font-semibold uppercase tracking-wider text-purple-200">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-300 block font-black leading-none">MODO ASSISTÊNCIA SaaS ATIVADO</span>
                    <span className="text-white text-base font-black tracking-tight mt-1 block">Visualizando Loja: <span className="underline decoration-indigo-400 font-extrabold">{tenantName}</span></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTenantId('admin');
                    localStorage.setItem('saas_current_tenant_id', 'admin');
                    setCurrentTab('admin_saas');
                    alert('Retornado ao Painel Geral de Controle Administrativo SaaS!');
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 font-black text-slate-950 px-5  py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer outline-none shrink-0"
                >
                  ⬅ Voltar ao Painel Geral
                </button>
              </div>
            )}

            {/* SCROLLABLE MAIN CANVAS */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-20 transition-colors duration-200">
              
              {currentTab === 'caixa' && (
                <CashierView
                  produtos={produtos}
                  clientes={clientes}
                  funcionarios={funcionarios}
                  caixas={caixas}
                  movimentacoes={movimentacoes}
                  onOpenCaixa={handleOpenCaixa}
                  onCloseCaixa={handleCloseCaixa}
                  onAddMovimentacao={handleAddMovimentacao}
                  onRegisterSale={handleRegisterSale}
                  activeCaixa={activeCaixa}
                  tenantName={tenantName}
                  onAddClientQuick={handleQuickAddClient}
                />
              )}

              {currentTab === 'mesas' && (
                <TablesDashboard
                  mesas={mesas}
                  pedidos={pedidos}
                  produtos={produtos}
                  funcionarios={funcionarios}
                  clientes={clientes}
                  activeCaixa={activeCaixa}
                  onSetStatusMesa={handleSetStatusMesa}
                  onAddOrderToMesa={handleAddOrderToMesa}
                  onToggleGorjetaMesa={handleToggleGorjetaMesa}
                  onCloseMesaAndCompletePayment={handleCloseMesaAndCompletePayment}
                  onUpdateMesaName={handleUpdateMesaName}
                />
              )}

              {currentTab === 'delivery' && (
                <DeliveryPanel
                  pedidos={pedidos}
                  clientes={clientes}
                  produtos={produtos}
                  funcionarios={funcionarios}
                  onUpdatePedidoStatus={handleUpdatePedidoStatus}
                  onDispatchDelivery={handleDispatchDelivery}
                  caixaDeliveryStatus={caixaDeliveryStatus}
                  caixaDeliveryValorInicial={caixaDeliveryValorInicial}
                  caixaDeliveryVendasConcluidas={caixaDeliveryVendasConcluidas}
                  onOpenCaixaDelivery={handleOpenCaixaDelivery}
                  onCloseCaixaDelivery={handleCloseCaixaDelivery}
                  onAddDeliveryPedido={handleAddDeliveryPedido}
                />
              )}

              {currentTab === 'waiter' && (
                <div className="max-w-xl mx-auto">
                  <GarcomView
                    mesas={mesas}
                    produtos={produtos}
                    funcionarios={funcionarios}
                    onOpenMesa={handleOpenMesa}
                    onAddOrderToMesa={handleAddOrderToMesa}
                    onUpdateMesaName={handleUpdateMesaName}
                  />
                </div>
              )}

              {currentTab === 'financial' && (
                <FinancialDashboard
                  contasPagar={contasPagar}
                  contasReceber={contasReceber}
                  valesComissoes={valesComissoes}
                  fornecedores={fornecedores}
                  clientes={clientes}
                  funcionarios={funcionarios}
                  movimentacoes={movimentacoes}
                  pedidos={pedidos}
                  produtos={produtos}
                  onAddContaPagar={handleAddContaPagar}
                  onPayContaPagar={handlePayContaPagar}
                  onReceiveContaReceber={handleReceiveContaReceber}
                  onPayValeComissao={handlePayValeComissao}
                  onAddValeComissao={handleAddValeComissao}
                  onDeleteContaPagar={(id) => {
                    saveState('saas_contaspagar', contasPagar.filter(cp => cp.id !== id), setContasPagar);
                  }}
                  onDeleteContaReceber={(id) => {
                    saveState('saas_contasreceber', contasReceber.filter(cr => cr.id !== id), setContasReceber);
                  }}
                  onDeleteValeComissao={(id) => {
                    saveState('saas_valescomissoes', valesComissoes.filter(vc => vc.id !== id), setValesComissoes);
                  }}
                  onDeleteMovimentacao={(id) => {
                    saveState('saas_movimentacoes', movimentacoes.filter(m => m.id !== id), setMovimentacoes);
                  }}
                  onUpdateContaPagar={(id, update) => {
                    const updated = contasPagar.map(cp => cp.id === id ? { ...cp, ...update } : cp);
                    saveState('saas_contaspagar', updated, setContasPagar);
                  }}
                  onUpdateValeComissao={(id, update) => {
                    const updated = valesComissoes.map(vc => vc.id === id ? { ...vc, ...update } : vc);
                    saveState('saas_valescomissoes', updated, setValesComissoes);
                  }}
                  onAddMovimentacao={(m) => {
                    const newM: MovimentacaoCaixa = { ...m, id: `mov-${Date.now()}`, data: new Date().toISOString() };
                    saveState('saas_movimentacoes', [newM, ...movimentacoes], setMovimentacoes);
                  }}
                  onAddFuncionario={(f) => {
                    const newF: Funcionario = { ...f, id: `func-${Date.now()}`, data_cadastro: new Date().toISOString() };
                    saveState('saas_funcionarios', [newF, ...funcionarios], setFuncionarios);
                  }}
                  onUpdateFuncionario={(id, fUpdate) => {
                    const updated = funcionarios.map(f => f.id === id ? { ...f, ...fUpdate } : f);
                    saveState('saas_funcionarios', updated, setFuncionarios);
                  }}
                  onDeleteFuncionario={(id) => {
                    saveState('saas_funcionarios', funcionarios.filter(f => f.id !== id), setFuncionarios);
                  }}
                  onSetValesComissoes={(vcs) => {
                    saveState('saas_valescomissoes', vcs, setValesComissoes);
                  }}
                  tenantId={currentTenantId}
                />
              )}

              {currentTab === 'clientes' && (
                <ClientsManagement
                  clientes={clientes}
                  pedidos={pedidos}
                  produtos={produtos}
                  onAddCliente={(c) => {
                    const newC: Cliente = { ...c, id: `c-${Date.now()}`, data_cadastro: new Date().toISOString() };
                    saveState('saas_clientes', [newC, ...clientes], setClientes);
                  }}
                  onUpdateCliente={(id, update) => {
                    const updated = clientes.map(c => c.id === id ? { ...c, ...update } : c);
                    saveState('saas_clientes', updated, setClientes);
                  }}
                  onDeleteCliente={(id) => {
                    saveState('saas_clientes', clientes.filter(c => c.id !== id), setClientes);
                  }}
                />
              )}

              {currentTab === 'estoque' && (
                <StockManagement
                  produtos={produtos}
                  pedidos={pedidos}
                  onUpdateProduto={(id, update) => {
                    const updated = produtos.map(p => p.id === id ? { ...p, ...update } : p);
                    saveState('saas_produtos', updated, setProdutos);
                  }}
                />
              )}

              {currentTab === 'crud' && (
                <RegistersCRUD
                  clientes={clientes}
                  produtos={produtos}
                  funcionarios={funcionarios}
                  fornecedores={fornecedores}
                  
                  // Customers
                  onAddCliente={(c) => {
                    const newC: Cliente = { ...c, id: `c-${Date.now()}`, data_cadastro: new Date().toISOString() };
                    saveState('saas_clientes', [newC, ...clientes], setClientes);
                  }}
                  onUpdateCliente={(id, update) => {
                    const updated = clientes.map(c => c.id === id ? { ...c, ...update } : c);
                    saveState('saas_clientes', updated, setClientes);
                  }}
                  onDeleteCliente={(id) => {
                    saveState('saas_clientes', clientes.filter(c => c.id !== id), setClientes);
                  }}

                  // Products
                  onAddProduto={(p) => {
                    const newP: Produto = { ...p, id: `p-${Date.now()}` };
                    saveState('saas_produtos', [newP, ...produtos], setProdutos);
                  }}
                  onUpdateProduto={(id, update) => {
                    const updated = produtos.map(p => p.id === id ? { ...p, ...update } : p);
                    saveState('saas_produtos', updated, setProdutos);
                  }}
                  onDeleteProduto={(id) => {
                    saveState('saas_produtos', produtos.filter(p => p.id !== id), setProdutos);
                  }}

                  // Employees
                  onAddFuncionario={(f) => {
                    const newF: Funcionario = { ...f, id: `f-${Date.now()}`, data_cadastro: new Date().toISOString() };
                    saveState('saas_funcionarios', [newF, ...funcionarios], setFuncionarios);
                  }}
                  onUpdateFuncionario={(id, update) => {
                    const updated = funcionarios.map(f => f.id === id ? { ...f, ...update } : f);
                    saveState('saas_funcionarios', updated, setFuncionarios);
                  }}
                  onDeleteFuncionario={(id) => {
                    saveState('saas_funcionarios', funcionarios.filter(f => f.id !== id), setFuncionarios);
                  }}

                  // Suppliers
                  onAddFornecedor={(f) => {
                    const newF: Fornecedor = { ...f, id: `for-${Date.now()}` };
                    saveState('saas_fornecedores', [newF, ...fornecedores], setFornecedores);
                  }}
                  onUpdateFornecedor={(id, update) => {
                    const updated = fornecedores.map(f => f.id === id ? { ...f, ...update } : f);
                    saveState('saas_fornecedores', updated, setFornecedores);
                  }}
                  onDeleteFornecedor={(id) => {
                    saveState('saas_fornecedores', fornecedores.filter(f => f.id !== id), setFornecedores);
                  }}
                />
              )}

              {currentTab === 'produtos' && (
                <ProductsRegistration
                  produtos={produtos}
                  onAddProduto={(p) => {
                    const newP: Produto = { ...p, id: `p-${Date.now()}` };
                    saveState('saas_produtos', [newP, ...produtos], setProdutos);
                  }}
                  onUpdateProduto={(id, update) => {
                    const updated = produtos.map(p => p.id === id ? { ...p, ...update } : p);
                    saveState('saas_produtos', updated, setProdutos);
                  }}
                  onDeleteProduto={(id) => {
                    saveState('saas_produtos', produtos.filter(p => p.id !== id), setProdutos);
                  }}
                />
              )}

              {currentTab === 'database' && (
                <div className="max-w-7xl mx-auto space-y-6">
                  <SupabasePanel currentTenantId={currentTenantId} />
                </div>
              )}

              {currentTab === 'admin_saas' && currentTenantId === 'admin' && (
                <div className="space-y-6 select-none font-sans max-w-7xl mx-auto">
                  
                  {/* Top Welcome Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        🛡️ PAINEL CENTRAL DE OPERAÇÕES VIP
                      </div>
                      <h2 className="text-xl md:text-2xl font-black mt-2 tracking-tight">Controle & Monitoramento de Clientes SaaS</h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        Gerencie as assinaturas de bares e restaurantes, libere acessos VIP, alterne entre faturamento ativo, estenda períodos de teste trial ou acesse diretamente o PDV de qualquer cliente para assistência técnica remota em tempo real.
                      </p>
                    </div>
                    <div className="bg-slate-850 border border-slate-800 px-4 py-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Mensalidade Padrão</span>
                      <strong className="text-xl font-black text-emerald-400">R$ 50,00 <span className="text-xs font-normal text-slate-400 font-sans">/estabelecimento</span></strong>
                    </div>
                  </div>

                  {/* Operational Metrics Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total de Empresas</span>
                        <Building2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-3xl font-black text-white mt-1.5">{empresas.filter(e => e.id !== 'admin').length}</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">Cadastros válidos</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Período de Testes</span>
                        <Info className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="text-3xl font-black text-white mt-1.5">{empresas.filter(e => e.id !== 'admin' && e.status_assinatura === 'trial').length}</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">Acessos demonstrativos</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Clientes VIP Ativos</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-3xl font-black text-white mt-1.5">{empresas.filter(e => e.id !== 'admin' && e.status_assinatura === 'ativo').length}</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">Licenças pagas contratadas</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Lojas Bloqueadas</span>
                        <Lock className="w-4 h-4 text-rose-500" />
                      </div>
                      <h3 className="text-3xl font-black text-white mt-1.5">{empresas.filter(e => e.id !== 'admin' && e.status_assinatura === 'bloqueado').length}</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">Assinatura vencida</p>
                    </div>

                    <div className="col-span-2 lg:col-span-1 bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Receita Mensal</span>
                        <DollarSign className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-3xl font-black text-emerald-400 mt-1.5">
                        R$ {empresas.filter(e => e.id !== 'admin' && e.status_assinatura === 'ativo').length * 50},00
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-0.5">Previsão em tempo real</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Registered Client List (Colum Left-Center) */}
                    <div className="lg:col-span-2 space-y-4">
                      
                      {/* Search & Actions Bar */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar loja, dono ou telefone..."
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/25 outline-none border border-transparent dark:border-slate-750"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          Exibindo {filteredEmpresas.length} estabelecimento(s)
                        </span>
                      </div>

                      {/* Interactive Client Cards */}
                      {filteredEmpresas.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl">
                          <Building2 className="w-12 h-12 text-slate-350 dark:text-slate-650 mx-auto mb-3" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum estabelecimento encontrado</h4>
                          <p className="text-xs text-slate-400 mt-1">Crie um novo cliente utilizando o formulário de cadastro rápido ao lado.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredEmpresas.map(emp => {
                            const isTrial = emp.status_assinatura === 'trial';
                            const isActive = emp.status_assinatura === 'ativo';
                            const isBlocked = emp.status_assinatura === 'bloqueado';
                            const trialDaysLeft = Math.ceil((new Date(emp.data_fim_trial).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            const formattedRegisterDate = new Date(emp.data_cadastro).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                            const formattedTrialEnds = new Date(emp.data_fim_trial).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                            return (
                              <div key={emp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  {/* Title & Badge */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-xs uppercase shadow-inner shrink-0">
                                      {emp.nome_empresa.substring(0, 2)}
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">{emp.nome_empresa}</h3>
                                      <span className="text-[10px] text-slate-400 mt-1 block">ID: #{emp.id}</span>
                                    </div>

                                    {/* Action Status Badges */}
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ml-auto md:ml-2 ${
                                      isActive 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-400/20' 
                                        : isTrial 
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-400/10'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-450/20 animate-pulse'
                                    }`}>
                                      {emp.status_assinatura === 'ativo' ? 'VIP ATIVO' : emp.status_assinatura === 'trial' ? 'Acesso Trial' : 'Bloqueado'}
                                    </span>
                                  </div>

                                  {/* Details Specifications */}
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-transparent">
                                    <div>
                                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Responsável</span>
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{emp.nome_responsavel}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Telefone / Login ID</span>
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{formatBrazilPhoneInput(emp.telefone_admin)}</span>
                                    </div>
                                    <div className="mt-1">
                                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Registrado em</span>
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{formattedRegisterDate}</span>
                                    </div>
                                    <div className="mt-1">
                                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Fim de Licença</span>
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                                        {formattedTrialEnds}
                                        {isTrial && (
                                          <span className={`text-[9px] font-bold ${trialDaysLeft > 5 ? 'text-amber-500' : 'text-rose-505'}`}>
                                            ({trialDaysLeft}d)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Administrative Troubleshooting Helper Password */}
                                  <div className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 p-1.5 rounded border border-slate-200/50 dark:border-slate-800">
                                    🔑 Senha do Admin Cliente: <span className="text-slate-700 dark:text-indigo-300 font-black tracking-widest">{emp.senha_hash}</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex xl:flex-col gap-2 shrink-0 md:border-l border-slate-200/60 dark:border-slate-800 md:pl-4 justify-start md:justify-center">
                                  
                                  {/* BYPASS BUTTON - DANGEROUS BUT EXTREMELY HELPFUL */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentTenantId(emp.id);
                                      localStorage.setItem('saas_current_tenant_id', emp.id);
                                      setCurrentTab('caixa');
                                      alert(`MODO DE ASSISTÊNCIA SaaS: Você acessou o sistema de "${emp.nome_empresa}" diretamente sem precisar digitar as credenciais. Para retornar ao Painel Central Admin de controle, utilize o botão na barra roxa de monitoramento que foi inserida no topo da tela.`);
                                    }}
                                    className="bg-purple-650 hover:bg-purple-600 hover:text-white text-white font-black text-[10px] uppercase tracking-wider py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all outline-none"
                                    title="Acessar o PDV sem logar"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                    Acessar Loja
                                  </button>

                                  <div className="flex gap-2 w-full">
                                    {/* ACTIVATE VIP BUTTON */}
                                    {!isActive && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = empresas.map(e => e.id === emp.id ? { ...e, status_assinatura: 'ativo' as const } : e);
                                          setEmpresas(updated);
                                          localStorage.setItem('saas_empresas_list', JSON.stringify(updated));
                                          alert(`Empresa "${emp.nome_empresa}" ativada como VIP (Status Ativo) com sucesso!`);
                                        }}
                                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-300/30 dark:border-emerald-500/20 py-1 px-2 text-[9px] font-black uppercase rounded-lg transition-all"
                                        title="Liberar assinatura VIP / Mensalidade paga"
                                      >
                                        Liberar VIP
                                      </button>
                                    )}

                                    {/* BLOCK BUTTON */}
                                    {!isBlocked && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = empresas.map(e => e.id === emp.id ? { ...e, status_assinatura: 'bloqueado' as const } : e);
                                          setEmpresas(updated);
                                          localStorage.setItem('saas_empresas_list', JSON.stringify(updated));
                                          alert(`Empresa "${emp.nome_empresa}" bloqueada no sistema. O cliente receberá aviso de pendência financeira ao tentar logar.`);
                                        }}
                                        className="flex-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-300/30 dark:border-rose-500/20 py-1 px-2 text-[9px] font-black uppercase rounded-lg transition-all"
                                        title="Suspender acesso por falta de pagamento"
                                      >
                                        Bloquear
                                      </button>
                                    )}

                                    {/* SET BACK TO TRIAL IF NEEDED */}
                                    {isBlocked && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = empresas.map(e => e.id === emp.id ? { ...e, status_assinatura: 'trial' as const } : e);
                                          setEmpresas(updated);
                                          localStorage.setItem('saas_empresas_list', JSON.stringify(updated));
                                          alert(`Empresa "${emp.nome_empresa}" redefinida para período de teste gratuito (Trial)!`);
                                        }}
                                        className="flex-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-955/20 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-450 border border-amber-300/30 dark:border-amber-500/20 py-1 px-2 text-[9px] font-black uppercase rounded-lg transition-all"
                                        title="Restaurar para período de testes"
                                      >
                                        Voltar Trial
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex gap-2 w-full">
                                    {/* EXTEND TRIAL DATES */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentEnd = new Date(emp.data_fim_trial).getTime();
                                        const newEnd = new Date(currentEnd + 30 * 24 * 60 * 60 * 1000).toISOString();
                                        const updated = empresas.map(e => e.id === emp.id ? { ...e, data_fim_trial: newEnd } : e);
                                        setEmpresas(updated);
                                        localStorage.setItem('saas_empresas_list', JSON.stringify(updated));
                                        alert(`Licença de "${emp.nome_empresa}" estendida por mais 30 dias com sucesso!\nNova data: ${new Date(newEnd).toLocaleDateString('pt-BR')}`);
                                      }}
                                      className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-purple-900/50 hover:bg-slate-200 dark:hover:bg-slate-750 py-1 px-2 text-[9px] font-black uppercase rounded-lg transition-all"
                                      title="Adicionar +30 dias de trial"
                                    >
                                      + 30 Dias
                                    </button>

                                    {/* DELETE BUTTON */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`⚠️ ATENÇÃO EXTREMA: Deseja realmente remover "${emp.nome_empresa}" permanentemente do banco de dados central? Esta ação limpará o cadastro deste cliente.`)) {
                                          const updated = empresas.filter(e => e.id !== emp.id);
                                          setEmpresas(updated);
                                          localStorage.setItem('saas_empresas_list', JSON.stringify(updated));
                                          alert(`Empresa removida com sucesso.`);
                                        }
                                      }}
                                      className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 hover:text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/20 py-1 px-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                                      title="Remover permanentemente"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quick Register Central Form (Col 3) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase">
                          <Plus className="w-4 h-4 text-indigo-500" /> Cadastrar Novo Estabelecimento
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">Insira um novo cliente diretamente no banco de dados central com privilégios específicos.</p>
                      </div>

                      <form onSubmit={handleAdminRegisterCompany} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Nome Fantasia da Empresa *</label>
                          <input
                            type="text"
                            placeholder="Ex: Pizzaria Bella Itália"
                            value={adminNewName}
                            onChange={(e) => setAdminNewName(e.target.value)}
                            required
                            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 w-full rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-750"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Dono / Administrador Responsável *</label>
                          <input
                            type="text"
                            placeholder="Ex: Isabella Rossi"
                            value={adminNewResp}
                            onChange={(e) => setAdminNewResp(e.target.value)}
                            required
                            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 w-full rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-750"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Celular / Login ID *</label>
                          <input
                            type="tel"
                            placeholder="Ex: (11) 99999-9999"
                            value={adminNewPhone}
                            onChange={(e) => setAdminNewPhone(formatBrazilPhoneInput(e.target.value))}
                            required
                            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 w-full rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-750 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Senha de Acesso de Segurança *</label>
                          <input
                            type="password"
                            placeholder="Mínimo 4 caracteres"
                            value={adminNewPass}
                            onChange={(e) => setAdminNewPass(e.target.value)}
                            required
                            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 w-full rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-750"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Status de Assunção Inicial</label>
                          <select
                            value={adminNewStatus}
                            onChange={(e) => setAdminNewStatus(e.target.value as any)}
                            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 w-full rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-205 dark:border-slate-750"
                          >
                            <option value="trial">Acesso Trial Gratuito (30 dias)</option>
                            <option value="ativo">VIP Ativado / Mensalidade Confirmada</option>
                            <option value="bloqueado">Bloqueado Inicialmente</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                        >
                          Confirmar Ativação & Registrar
                        </button>
                      </form>
                      
                    </div>

                  </div>
                </div>
              )}

            </main>

            {/* STATUS BAR FOOTER */}
            <footer className={`h-10 shrink-0 border-t flex items-center justify-between px-4 md:px-6 text-[10px] font-semibold tracking-wider select-none ${isThemeDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              <div className="flex gap-6 uppercase">
                <span className="hidden sm:inline">Vercel Deploy: <strong className="text-emerald-500">OK</strong></span>
                <span>Nuvem Sync: <span className={`${isSyncing ? 'text-amber-500 animate-pulse font-bold' : 'text-emerald-500 font-bold'}`}>● {dbStatusMsg.toUpperCase()}</span></span>
                <span className="hidden md:inline">ID Loja: #BR-992-SP</span>
              </div>
              <div className="flex gap-4 items-center">
                <span>v2.4.0 WHITE-LABEL</span>
                <span className="text-slate-400 font-mono font-bold">Quinta, 12 de Jun, 21:04</span>
              </div>
            </footer>

          </div>
        </>
      )}

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Funcionario, Cliente, Fornecedor, Produto, Mesa, Pedido, CaixaDiario, ContaAPagar, ContaAReceber, ValeEComissao, MovimentacaoCaixa } from '../types';

export const INITIAL_FUNCIONARIOS: Funcionario[] = [
  { id: 'f-1', nome: 'Carlos Souza (Caixa)', cargo: 'caixa', telefone: '(11) 98888-1111', comissao_percentual: 0, data_cadastro: '2026-01-10' },
  { id: 'f-2', nome: 'Mateus Silva (Garçom)', cargo: 'garcom', telefone: '(11) 98888-2222', comissao_percentual: 10, data_cadastro: '2026-01-12' },
  { id: 'f-3', nome: 'Juliana Costa (Garçom)', cargo: 'garcom', telefone: '(11) 98888-3333', comissao_percentual: 8, data_cadastro: '2026-02-15' },
  { id: 'f-4', nome: 'Sérgio Reis (Admin)', cargo: 'admin', telefone: '(11) 99999-0000', comissao_percentual: 0, data_cadastro: '2026-01-01' }
];

export const INITIAL_CLIENTES: Cliente[] = [
  { id: 'c-1', nome: 'Rafael Mendes', telefone: '(11) 97777-0101', endereco: 'Rua das Flores, 123', limite_fiado: 350.00, data_cadastro: '2026-02-10' },
  { id: 'c-2', nome: 'Amanda Borges', telefone: '(11) 97777-0202', endereco: 'Av. Paulista, 1000 - Ap 42', limite_fiado: 200.00, data_cadastro: '2026-03-12' },
  { id: 'c-3', nome: 'Ronaldo Lima (Fiado Recorrente)', telefone: '(11) 97777-0303', endereco: 'Rua XV de Novembro, 88', limite_fiado: 600.00, data_cadastro: '2026-01-15' },
  { id: 'c-4', nome: 'Clara Nunes', telefone: '(11) 97777-0404', endereco: 'Rua Bahia, 456', limite_fiado: 150.00, data_cadastro: '2026-04-01' }
];

export const INITIAL_FORNECEDORES: Fornecedor[] = [
  { id: 'for-1', nome_empresa: 'Distribuidora de Bebidas Ambev S.A.', contato: 'Marcos Santos', telefone: '(11) 3322-1100', cnpj_cpf: '12.345.678/0001-99' },
  { id: 'for-2', nome_empresa: 'Hortifruti Central Ltda', contato: 'Dona Sandra', telefone: '(11) 3322-2200', cnpj_cpf: '98.765.432/0001-00' },
  { id: 'for-3', nome_empresa: 'Atacadão Carnes Nobres', contato: 'Rodrigo Boi', telefone: '(11) 3322-3300', cnpj_cpf: '11.222.333/0001-44' }
];

export const INITIAL_PRODUTOS: Produto[] = [
  { id: 'p-1', nome: 'Cerveja Duplo Malte 600ml', categoria: 'Bebidas Alcoólicas', preco_venda: 12.50, preco_custo: 5.80, estoque_atual: 0, estoque_minimo: 30, unidade_medida: 'un' },
  { id: 'p-2', nome: 'Refrigerante Coca-Cola Lata 350ml', categoria: 'Bebidas', preco_venda: 6.50, preco_custo: 2.50, estoque_atual: 0, estoque_minimo: 50, unidade_medida: 'un' },
  { id: 'p-3', nome: 'Pastel Especial de Carne', categoria: 'Salgados / Porções', preco_venda: 10.00, preco_custo: 3.50, estoque_atual: 0, estoque_minimo: 15, unidade_medida: 'un' },
  { id: 'p-4', nome: 'Pastel Especial de Queijo', categoria: 'Salgados / Porções', preco_venda: 9.50, preco_custo: 3.00, estoque_atual: 0, estoque_minimo: 15, unidade_medida: 'un' },
  { id: 'p-5', nome: 'Isca de Filé com Catupiry (Porção)', categoria: 'Salgados / Porções', preco_venda: 62.00, preco_custo: 28.00, estoque_atual: 0, estoque_minimo: 5, unidade_medida: 'un' },
  { id: 'p-6', nome: 'Batata Frita Tradicional Grande', categoria: 'Salgados / Porções', preco_venda: 35.00, preco_custo: 12.00, estoque_atual: 0, estoque_minimo: 10, unidade_medida: 'un' },
  { id: 'p-7', nome: 'Caipirinha Tradicional de Limão', categoria: 'Bebidas Alcoólicas', preco_venda: 18.00, preco_custo: 4.50, estoque_atual: 0, estoque_minimo: 20, unidade_medida: 'un' },
  { id: 'p-8', nome: 'Água Mineral Sem Gás 500ml', categoria: 'Bebidas', preco_venda: 4.00, preco_custo: 1.10, estoque_atual: 0, estoque_minimo: 40, unidade_medida: 'un' }
];

export const INITIAL_MESAS: Mesa[] = [
  { id: 'm-1', numero_mesa: 1, status: 'livre', total_atual: 0 },
  { id: 'm-2', numero_mesa: 2, status: 'ocupada', total_atual: 84.50 },
  { id: 'm-3', numero_mesa: 3, status: 'livre', total_atual: 0 },
  { id: 'm-4', numero_mesa: 4, status: 'ocupada', total_atual: 12.50 },
  { id: 'm-5', numero_mesa: 5, status: 'aguardando_pagamento', total_atual: 156.00 },
  { id: 'm-6', numero_mesa: 6, status: 'livre', total_atual: 0 },
  { id: 'm-7', numero_mesa: 7, status: 'livre', total_atual: 0 },
  { id: 'm-8', numero_mesa: 8, status: 'livre', total_atual: 0 }
];

export const INITIAL_PEDIDOS: Pedido[] = [
  {
    id: 'ped-mesa-1',
    tipo_pedido: 'mesa',
    mesa_id: 'm-2',
    funcionario_id: 'f-2', // Mateus
    status: 'preparo',
    data_pedido: '2026-06-12T10:45:00Z',
    itens: [
      { id: 'ip-1', pedido_id: 'ped-mesa-1', produto_id: 'p-1', quantidade: 4, preco_unitario: 12.50, subtotal: 50.00 }, // Cerveja
      { id: 'ip-2', pedido_id: 'ped-mesa-1', produto_id: 'p-3', quantidade: 2, preco_unitario: 10.00, subtotal: 20.00 }, // Pastel Carne
      { id: 'ip-3', pedido_id: 'ped-mesa-1', produto_id: 'p-2', quantidade: 1, preco_unitario: 6.50, subtotal: 6.50 },   // Coca
      { id: 'ip-4', pedido_id: 'ped-mesa-1', produto_id: 'p-8', quantidade: 2, preco_unitario: 4.00, subtotal: 8.00 }    // Agua
    ]
  },
  {
    id: 'ped-mesa-2',
    tipo_pedido: 'mesa',
    mesa_id: 'm-4',
    funcionario_id: 'f-3', // Juliana
    status: 'entregue',
    data_pedido: '2026-06-12T11:00:00Z',
    itens: [
      { id: 'ip-5', pedido_id: 'ped-mesa-2', produto_id: 'p-1', quantidade: 1, preco_unitario: 12.50, subtotal: 12.50 }
    ]
  },
  {
    id: 'ped-mesa-3',
    tipo_pedido: 'mesa',
    mesa_id: 'm-5',
    funcionario_id: 'f-2',
    status: 'entregue',
    data_pedido: '2026-06-12T09:30:00Z',
    itens: [
      { id: 'ip-6', pedido_id: 'ped-mesa-3', produto_id: 'p-5', quantidade: 2, preco_unitario: 62.00, subtotal: 124.00 }, // Isca boi
      { id: 'ip-7', pedido_id: 'ped-mesa-3', produto_id: 'p-1', quantidade: 2, preco_unitario: 12.50, subtotal: 25.00 },  // Cerveja
      { id: 'ip-8', pedido_id: 'ped-mesa-3', produto_id: 'p-8', quantidade: 1, preco_unitario: 4.00, subtotal: 4.00 }     // Agua
    ]
  },
  {
    id: 'ped-deliv-1',
    tipo_pedido: 'entrega',
    cliente_id: 'c-1',
    status: 'preparo',
    data_pedido: '2026-06-12T11:15:00Z',
    driver_name: 'Marcos Motoboy',
    itens: [
      { id: 'ip-9', pedido_id: 'ped-deliv-1', produto_id: 'p-3', quantidade: 3, preco_unitario: 10.00, subtotal: 30.00 },
      { id: 'ip-10', pedido_id: 'ped-deliv-1', produto_id: 'p-6', quantidade: 1, preco_unitario: 35.00, subtotal: 35.00 }
    ]
  }
];

export const INITIAL_CAIXAS: CaixaDiario[] = [
  { id: 'cx-active', data_abertura: '2026-06-12T08:00:00Z', valor_inicial: 250.00, status: 'aberto', funcionario_id: 'f-1' }
];

export const INITIAL_MOVIMENTACOES: MovimentacaoCaixa[] = [
  { id: 'mov-1', caixa_id: 'cx-active', tipo: 'entrada', valor: 250.00, forma_pagamento: 'dinheiro', status_pagamento: 'pago', data: '2026-06-12T08:00:00Z', descricao: 'Abertura de Caixa inicial' },
  { id: 'mov-2', caixa_id: 'cx-active', tipo: 'entrada', valor: 35.50, forma_pagamento: 'pix', status_pagamento: 'pago', data: '2026-06-12T08:45:00Z', descricao: 'Venda rápida balcão #1034' },
  { id: 'mov-3', caixa_id: 'cx-active', tipo: 'saida', valor: 50.00, forma_pagamento: 'dinheiro', status_pagamento: 'pago', data: '2026-06-12T09:15:00Z', descricao: 'Suprimento / Troco menor' }
];

export const INITIAL_CONTAS_A_PAGAR: ContaAPagar[] = [
  { id: 'cp-1', fornecedor_id: 'for-1', data_pedido: '2026-06-05', data_vencimento: '2026-06-15', valor: 1450.00, status: 'pendente' },
  { id: 'cp-2', fornecedor_id: 'for-2', data_pedido: '2026-06-10', data_vencimento: '2026-06-12', valor: 350.00, data_pagamento: '2026-06-12', status: 'pago' },
  { id: 'cp-3', fornecedor_id: 'for-3', data_pedido: '2026-06-01', data_vencimento: '2026-06-11', valor: 850.00, status: 'pendente' } // VENCIDA
];

export const INITIAL_CONTAS_A_RECEBER: ContaAReceber[] = [
  { id: 'cr-1', cliente_id: 'c-3', pedido_id: 'ped-hist-1', valor: 180.00, data_pedido: '2026-06-01', data_prometida_pagamento: '2026-06-08', status: 'pendente' }, // TOTALMENTE VENCIDO (Badge Vermelho) --- Current date is June 12, 2026
  { id: 'cr-2', cliente_id: 'c-1', pedido_id: 'ped-hist-2', valor: 75.00, data_pedido: '2026-06-10', data_prometida_pagamento: '2026-06-12', status: 'pendente' },  // VENCE HOJE (Badge Amarelo/Laranja)
  { id: 'cr-3', cliente_id: 'c-2', pedido_id: 'ped-hist-3', valor: 120.00, data_pedido: '2026-06-11', data_prometida_pagamento: '2026-06-25', status: 'pendente' }  // Em dia
];

export const INITIAL_VALES_E_COMISSOES: ValeEComissao[] = [
  { id: 'vc-1', funcionario_id: 'f-2', tipo: 'comissao', valor: 15.60, status: 'pendente', data: '2026-06-11' },
  { id: 'vc-2', funcionario_id: 'f-2', tipo: 'vale', valor: 50.00, status: 'pago', data: '2026-06-08' },
  { id: 'vc-3', funcionario_id: 'f-3', tipo: 'comissao', valor: 28.40, status: 'pendente', data: '2026-06-12' }
];

export function getStorageData<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultValue;
  }
}

export function saveStorageData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

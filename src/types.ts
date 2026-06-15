/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Funcionario {
  id: string;
  nome: string;
  cargo: 'admin' | 'caixa' | 'garcom';
  telefone: string;
  comissao_percentual: number;
  data_cadastro: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  referencia?: string;
  forma_pagamento_preferida?: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado';
  limite_fiado: number;
  data_cadastro: string;
}

export interface Empresa {
  id: string;
  nome_empresa: string;
  nome_responsavel: string;
  telefone_admin: string;
  senha_hash: string; // Stored safely
  status_assinatura: 'trial' | 'ativo' | 'bloqueado';
  data_cadastro: string;
  data_fim_trial: string;
}

export interface Fornecedor {
  id: string;
  nome_empresa: string;
  contato: string;
  telefone: string;
  cnpj_cpf: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco_venda: number;
  preco_custo: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string; // Ex: 'un', 'kg', 'lt'
}

export interface HistoricoEstoque {
  id: string;
  produto_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  funcionario_id: string;
  data: string;
}

export interface Mesa {
  id: string;
  numero_mesa: number;
  status: 'livre' | 'ocupada' | 'aguardando_pagamento';
  total_atual: number;
  gorjeta_aceita?: boolean;
  nome_personalizado?: string;
}

export interface Pedido {
  id: string;
  tipo_pedido: 'balcao' | 'entrega' | 'mesa';
  mesa_id?: string;
  cliente_id?: string;
  funcionario_id?: string; // Garçom se for de mesa
  status: 'pendente' | 'preparo' | 'entregue' | 'concluido';
  data_pedido: string;
  driver_name?: string; // Para deliverys
  itens?: ItemPedido[];
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface CaixaDiario {
  id: string;
  data_abertura: string;
  data_fechamento?: string;
  valor_inicial: number;
  valor_final?: number;
  status: 'aberto' | 'fechado';
  funcionario_id: string;
}

export interface MovimentacaoCaixa {
  id: string;
  caixa_id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  forma_pagamento: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'fiado';
  status_pagamento: 'pago' | 'pendente';
  pedido_id?: string;
  data: string;
  descricao?: string;
}

export interface ContaAPagar {
  id: string;
  fornecedor_id: string;
  data_pedido: string;
  data_vencimento: string;
  data_pagamento?: string;
  valor: number;
  status: 'pendente' | 'pago';
}

export interface ContaAReceber {
  id: string;
  cliente_id: string;
  pedido_id: string;
  valor: number;
  data_pedido: string;
  data_prometida_pagamento: string;
  status: 'pendente' | 'pago';
}

export interface ValeEComissao {
  id: string;
  funcionario_id: string;
  tipo: 'vale' | 'comissao';
  valor: number;
  status: 'pendente' | 'pago';
  data: string;
}

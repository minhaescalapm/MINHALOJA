/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, FileCode, FolderGit, LayoutGrid, Copy, Check, HeartHandshake } from 'lucide-react';

export default function SupabasePanel() {
  const [activeTab, setActiveTab] = useState<'sql' | 'folders' | 'client' | 'saas'>('sql');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sqlScript = `-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - SUPABASE/POSTGRESQL
-- Arquitetura SaaS Multi-Tenant com Isolamento de Dados por empresa_id
-- Cole este script diretamente no 'SQL Editor' do painel do seu Supabase.

-- Habilitar extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA EMPRESAS (TENANTS)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_empresa VARCHAR(150) NOT NULL,
    nome_responsavel VARCHAR(150),
    telefone_admin VARCHAR(20) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    status_assinatura VARCHAR(30) DEFAULT 'trial' CHECK (status_assinatura IN ('trial', 'ativo', 'bloqueado')),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fim_trial TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- SEED / BYPASS DO ADMINISTRADOR GERAL (EU)
-- Telefone: "21975151937" | Senha: "Wag0508$"
INSERT INTO empresas (id, nome_empresa, nome_responsavel, telefone_admin, senha_hash, status_assinatura)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Administradora Central SaaS',
    'Admin Geral',
    '21975151937',
    'Wag0508$', -- bypass_password
    'ativo'
) ON CONFLICT (telefone_admin) DO NOTHING;

-- 2. TABELA FUNCIONARIOS
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    cargo VARCHAR(50) NOT NULL CHECK (cargo IN ('admin', 'caixa', 'garcom')),
    telefone VARCHAR(20),
    comissao_percentual DECIMAL(5,2) DEFAULT 0.00 CHECK (comissao_percentual >= 0 AND comissao_percentual <= 100),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA CLIENTES (Consumidores)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT,
    referencia TEXT,
    forma_pagamento_preferida VARCHAR(30) CHECK (forma_pagamento_preferida IN ('dinheiro', 'pix', 'debito', 'credito', 'fiado')),
    limite_fiado DECIMAL(10,2) DEFAULT 0.00 CHECK (limite_fiado >= 0),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA FORNECEDORES
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome_empresa VARCHAR(150) NOT NULL,
    contato VARCHAR(100),
    telefone VARCHAR(20),
    cnpj_cpf VARCHAR(25) NOT NULL UNIQUE
);

-- 5. TABELA PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    preco_venda DECIMAL(10,2) NOT NULL CHECK (preco_venda >= 0),
    preco_custo DECIMAL(10,2) NOT NULL CHECK (preco_custo >= 0),
    estoque_atual INT DEFAULT 0 CHECK (estoque_atual >= 0),
    estoque_minimo INT DEFAULT 0,
    unidade_medida VARCHAR(10) DEFAULT 'un'
);

-- 6. TABELA HISTORICOESTOQUE (Triggers ou registros manuais)
CREATE TABLE IF NOT EXISTS historico_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade INT NOT NULL CHECK (quantidade > 0),
    motivo VARCHAR(255) NOT NULL,
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA MESAS
CREATE TABLE IF NOT EXISTS mesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero_mesa INT NOT NULL CHECK (numero_mesa > 0),
    status VARCHAR(30) DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_pagamento')),
    total_atual DECIMAL(10,2) DEFAULT 0.00 CHECK (total_atual >= 0),
    CONSTRAINT unique_mesa_per_empresa UNIQUE (empresa_id, numero_mesa)
);

-- 8. TABELA PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_pedido VARCHAR(20) NOT NULL CHECK (tipo_pedido IN ('balcao', 'entrega', 'mesa')),
    mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL, -- Garçom responsável
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparo', 'entregue', 'concluido')),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA ITENS PEDIDO
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- 10. TABELA CAIXA DIARIO
CREATE TABLE IF NOT EXISTS caixa_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    text_filial VARCHAR(50),
    valor_inicial DECIMAL(10,2) NOT NULL CHECK (valor_inicial >= 0),
    valor_final DECIMAL(10,2) CHECK (valor_final >= 0),
    status VARCHAR(15) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL
);

-- 11. TABELA MOVIMENTACOES CAIXA
CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    caixa_id UUID REFERENCES caixa_diario(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    forma_pagamento VARCHAR(20) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito', 'fiado')),
    status_pagamento VARCHAR(15) NOT NULL CHECK (status_pagamento IN ('pago', 'pendente')),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABELA CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS contas_a_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE CASCADE,
    data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    status VARCHAR(15) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago'))
);

-- 13. TABELA CONTAS A RECEBER (Fiados/Pendentes)
CREATE TABLE IF NOT EXISTS contas_a_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    data_prometida_pagamento DATE NOT NULL,
    status VARCHAR(15) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago'))
);

-- 14. TABELA VALES E COMISSOES (Funcionários/RH)
CREATE TABLE IF NOT EXISTS vales_e_comissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
    tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('vale', 'comissao')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    status VARCHAR(15) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDICES MULTI-TENANT PARA EXCELENTE PERFORMANCE ISOLADA
CREATE INDEX IF NOT EXISTS idx_assoc_empresa ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_cat ON produtos(empresa_id, categoria);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa_status ON pedidos(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_a_receber(empresa_id, status, data_prometida_pagamento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_empresa ON movimentacoes_caixa(empresa_id, caixa_id);
`;

  const folderStructure = `📂 bar-pdv-saas-root/
├── 📂 src/
│   ├── 📂 app/                    # Next.js App Router Structure
│   │   ├── 📄 layout.tsx          # HTML Wrapper, Google Fonts & Providers
│   │   ├── 📄 page.tsx            # Landing Page / Seleção de Estabelecimento
│   │   ├── 📂 login/
│   │   │   └── 📄 page.tsx        # Login customizado (White-Label Config)
│   │   ├── 📂 dashboard/
│   │   │   ├── 📄 layout.tsx      # Sidebar, Header & Session Validator
│   │   │   ├── 📄 page.tsx        # Dashboard executivo / Resumo Financeiro
│   │   │   ├── 📂 caixa/
│   │   │   │   └── 📄 page.tsx    # Venda Rápida (PDV Balcão) & Fechamento
│   │   │   ├── 📂 garcom/
│   │   │   │   └── 📄 page.tsx    # Interface Mobile-First dos Garçons
│   │   │   ├── 📂 mesas/
│   │   │   │   └── 📄 page.tsx    # Status Layout das Mesas em tempo real
│   │   │   ├── 📂 delivery/
│   │   │   │   └── 📄 page.tsx    # Gerenciador de entregas e motoboys
│   │   │   ├── 📂 financeiro/
│   │   │   │   └── 📄 page.tsx    # Contas a pagar e Prazos/Fiados pendentes
│   │   │   └── 📂 cadastros/
│   │   │       └── 📄 page.tsx    # CRUD de Clientes, Prod., Fornecedores, Func.
│   ├── 📂 components/             # Componentes reutilizáveis
│   │   ├── 📄 receipt-print.tsx   # Gerador de arquivo de impressão térmica (58/80mm)
│   │   ├── 📄 modal-edit.tsx      # Diálogos dinâmicos
│   │   └── 📄 sidebar.tsx         # Menu lateral responsivo
│   ├── 📂 lib/                    # Utilitários e Infraestrutura
│   │   ├── 📄 supabase.ts         # Arquivo de conexão multi-tenant
│   │   └── 📄 utils.ts            # Formatação de Moedas, CNPJ e datas
│   └── 📄 types.ts                # Definições de Tipos/Interfaces TypeScript
├── 📄 .env.local                  # Variáveis de ambiente secretas
├── 📄 package.json                # Dependências (Next.js, Supabase, Lucide)
├── 📄 config.json                 # Customizações Visuais para o Cliente White-Label
└── 📄 tailwind.config.js          # Configurações do Tailwind CSS`;

  const clientTemplateCode = `// src/lib/supabase.ts
// Instanciação modular do cliente do Supabase
// Suporta a leitura de chaves parametrizadas por subdomínio ou config de ambiente.

import { createClient } from '@supabase/supabase-js';

// No modelo White-Label, cada cliente pode hospedar em seu próprio Supabase
// Para ler dinamicamente ou fixar por build (Vercel Environment Variables):
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase: Variáveis de ambiente de conexão não detectadas. Verifique seu arquivo .env.local"
  );
}

// Inicializa a conexão
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Helper para selecionar banco de dados correspondente caso use multi-tenant na mesma tabela:
// (Se preferir infraestrutura isolada com 1 DB único por cliente, este arquivo carrega a chave exclusiva dele na Vercel).
export async function getTenantConfigs() {
  // Retorna os parâmetros visuais e regras de negócio do estabelecimento
  try {
    const { data, error } = await supabase
      .from('estabelecimento_config')
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    // Retorna defaults parametrizados no config.json se falhar
    return {
      nome: "Cantina & Bar White Label",
      cor_primaria: "#f59e0b", // amber-500
      taxas_servico: 0.10,
      limite_fiado_padrao: 200.00
    };
  }
}
`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100" id="supabase-guide-panel">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Painel de Integração Supabase & Next.js
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">White-Label SaaS ready</span>
            </h2>
            <p className="text-xs text-slate-400">Scripts SQL, estruturação de pastas para Next.js App Router e conexão cliente</p>
          </div>
        </div>
        
        {/* Buttons / Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentText = activeTab === 'sql' ? sqlScript : activeTab === 'folders' ? folderStructure : clientTemplateCode;
              handleCopy(currentText);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 md:p-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'sql' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Script SQL Supabase
        </button>

        <button
          onClick={() => setActiveTab('folders')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'folders' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderGit className="w-3.5 h-3.5" />
          Estrutura Pastas Next.js
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'client' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Conexão Supabase.ts
        </button>

        <button
          onClick={() => setActiveTab('saas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'saas' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Estratégia White-Label SaaS
        </button>
      </div>

      {/* Content body */}
      <div className="p-4 md:p-6 font-mono text-sm leading-relaxed overflow-y-auto max-h-[450px]">
        {activeTab === 'sql' && (
          <div>
            <div className="mb-4 bg-emerald-500/10 rounded-lg p-3 text-xs border border-emerald-500/20 text-emerald-400/90 font-sans">
              ℹ️ <strong>Instruções do PostgreSQL no Supabase:</strong> Este script cria todas as 13 tabelas, define chaves primárias e estrangeiras em CASCADE ou RESTRICT, valida intervalos usando constraints de verificação (ex: comissao de 0 a 100), e inclui colunas calculadas automáticas (ex: subtotal de itens). Os índices garantem respostas em milissegundos mesmo com milhares de registros diários.
            </div>
            <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap leading-5 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
              {sqlScript}
            </pre>
          </div>
        )}

        {activeTab === 'folders' && (
          <div>
            <div className="mb-4 bg-indigo-500/10 rounded-lg p-3 text-xs border border-indigo-500/20 text-indigo-400/90 font-sans">
              📁 <strong>App Router Padrão (White-Label):</strong> Estrutura recomendada para o Next.js 14+ usando a Vercel. Oferece carregamento otimizado de rotas, layouts aninhados que mantêm estados de sessão de caixas abertos, e isolamento visual móvel automático para garçons em ambientes de restaurante.
            </div>
            <pre className="text-xs text-blue-300 whitespace-pre leading-6 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
              {folderStructure}
            </pre>
          </div>
        )}

        {activeTab === 'client' && (
          <div>
            <div className="mb-4 bg-amber-500/10 rounded-lg p-3 text-xs border border-amber-500/20 text-amber-400/90 font-sans">
              ⚡ <strong>Instanciador de conexão Supabase:</strong> Insira no arquivo <code>src/lib/supabase.ts</code> do seu projeto Next.js. O código inclui um helper de Tenant local para carregar esquemas dinâmicos de marca de forma flexível de acordo com o subdomínio ou arquivo <code>config.json</code> do cliente.
            </div>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-5 bg-slate-950 p-4 rounded-lg border border-slate-800">
              {clientTemplateCode}
            </pre>
          </div>
        )}

        {activeTab === 'saas' && (
          <div className="font-sans text-xs text-slate-300 leading-6 whitespace-normal p-1">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Modelo SaaS Premium por R$ 50/mês: Arquitetura Multitenancy Recomendada
            </h3>
            
            <p className="mb-3 text-slate-400">
              Para cobrar uma mensalidade baixa de R$ 50/mês de múltiplos bares e lanchonetes mantendo excelente margem de lucro e privacidade absoluta dos dados de cada estabelecimento, existem duas abordagens arquiteturais no ecossistema Supabase + Vercel:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="bg-slate-955 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">Estratégia 1: Database Dedicado (1 DB por Cliente)</span>
                <span className="text-xs text-slate-400">
                  Cada estabelecimento possui seu próprio projeto Supabase (Plano Gratuito suporta até 2 projetos ativos, após isso US$ 25/mês por projeto adicional, ou use instâncias Docker autohospedadas em servidores VPS como Hetzner/DigitalOcean por US$ 5/mês). 
                  <br /><strong>Vantagem:</strong> Privacidade jurídica total, segurança de chaves isoladas e facilidade de backup pontual.
                </span>
              </div>
              <div className="bg-slate-955 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Estratégia 2: Banco Multitenant Único com RLS</span>
                <span className="text-xs text-slate-400">
                  Um único banco de dados Postgres no Supabase atende a todos os clientes. Adicionamos a coluna <code>estabelecimento_id UUID REFERENCES estabelecimento(id)</code> em absolutamente todas as tabelas e ativamos <strong>Row Level Security (RLS)</strong> no Postgres.
                  <br /><strong>Vantagem:</strong> Custo fixo baixíssimo (1 único plano Supabase atende 150+ estabelecimentos com facilidade). As políticas RLS garantem que o garçom do Bar A nunca visualize os dados do Bar B.
                </span>
              </div>
            </div>

            <h4 className="font-semibold text-white mb-1">Ativação de Licenças (Painel Admin Geral):</h4>
            <p className="text-slate-400">
              No seu banco administrativo central de controle, crie uma tabela de <code>estabelecimentos</code> contendo a data de expiração da assinatura. No middleware de carregamento das requisições na Vercel (Next.js Middleware), verifique se a licença do domínio atual expirou. Se sim, bloqueie a tela e exiba um QR Code Pix apontando para o seu WhatsApp/Gateway de Pagamentos para renovar a mensalidade de R$ 50.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

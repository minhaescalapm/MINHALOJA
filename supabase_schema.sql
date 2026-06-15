-- ====================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS HIGIENIZADO PARA SUPABASE (POSTGRESQL)
-- RESOLUÇÃO COMPLETA DE ERROS DE CONSTRAINTS E ANCORAGEM DE CHAVES (VARCHAR)
-- ====================================================================
--
-- 💡 POR QUE ESTE SCRIPT É O PERFEITO?
-- 
-- 1. Executa um limpa-trilho (DROP CASCADE) para eliminar quaisquer tabelas com
--    conflito de tipos antigos (como UUID misturado com VARCHAR).
-- 2. Padroniza todas as chaves primárias (PK) e estrangeiras (FK) como VARCHAR(255),
--    permitindo compatibilidade integral com chaves estruturadas no seu Front-End
--    (ex: 'fn-bella-1', 'bella', 'chef') e chaves dinâmicas.
-- 3. Utiliza "empresa_id" de forma consistente para isolamento de dados SaaS.

-- ==========================================
-- 0. LIMPEZA TOTAL DE CONFLITOS ANTERIORES
-- ==========================================
DROP TRIGGER IF EXISTS trigger_atualiza_estoque_por_historico ON historico_estoque;
DROP TRIGGER IF EXISTS trigger_registra_historico_por_estoque_produto ON produtos;
DROP FUNCTION IF EXISTS trg_atualiza_estoque_por_historico;
DROP FUNCTION IF EXISTS trg_registra_historico_por_estoque_produto;

DROP TABLE IF EXISTS historico_pagamentos_funcionarios CASCADE;
DROP TABLE IF EXISTS vales_e_comissoes CASCADE;
DROP TABLE IF EXISTS contas_a_receber CASCADE;
DROP TABLE IF EXISTS contas_a_pagar CASCADE;
DROP TABLE IF EXISTS movimentacoes_caixa CASCADE;
DROP TABLE IF EXISTS caixa_diario CASCADE;
DROP TABLE IF EXISTS caixas_diario CASCADE;
DROP TABLE IF EXISTS caixas CASCADE;
DROP TABLE IF EXISTS itens_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;
DROP TABLE IF EXISTS historico_estoque CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS fornecedores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- Habilitar extensões úteis se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. TABELA EXTRA DE AUDITORIA E BACKUP EXPRESSO
-- ==========================================
CREATE TABLE IF NOT EXISTS saas_store (
    tenant_id VARCHAR(255) NOT NULL,
    key_name VARCHAR(255) NOT NULL,
    value_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_saas_store PRIMARY KEY (tenant_id, key_name)
);

-- ==========================================
-- 1. TABELA DE EMPRESAS (SaaS Tenants)
-- ==========================================
CREATE TABLE empresas (
    id VARCHAR(255) PRIMARY KEY,
    nome_empresa VARCHAR(255) NOT NULL,
    nome_responsavel VARCHAR(255) NOT NULL,
    telefone_admin VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    status_assinatura VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (status_assinatura IN ('trial', 'ativo', 'bloqueado')),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_fim_trial TIMESTAMP WITH TIME ZONE NOT NULL
);

-- SEED / BYPASS DO ADMINISTRADOR GERAL
-- Telefone: "21975151937" | Senha: "Wag0508$"
INSERT INTO empresas (id, nome_empresa, nome_responsavel, telefone_admin, senha_hash, status_assinatura, data_fim_trial)
VALUES (
    'admin',
    'Administradora Central SaaS',
    'Admin Geral',
    '21975151937',
    'Wag0508$',
    'ativo',
    CURRENT_TIMESTAMP + INTERVAL '3000 days'
) ON CONFLICT (telefone_admin) DO NOTHING;

-- Seed inicial de Demonstração (Bella)
INSERT INTO empresas (id, nome_empresa, nome_responsavel, telefone_admin, senha_hash, status_assinatura, data_fim_trial)
VALUES (
    'bella',
    'Pizzaria Bella Itália',
    'Bella Responsável',
    '21999999999',
    'bella123',
    'ativo',
    CURRENT_TIMESTAMP + INTERVAL '30 days'
) ON CONFLICT (telefone_admin) DO NOTHING;

-- ==========================================
-- 2. TABELA DE FUNCIONÁRIOS
-- ==========================================
CREATE TABLE funcionarios (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL CHECK (cargo IN ('admin', 'caixa', 'garcom')),
    telefone VARCHAR(50),
    comissao_percentual DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    salario_base DECIMAL(10,2) NOT NULL DEFAULT 1800.00,
    cep VARCHAR(20),
    endereco TEXT,
    numero VARCHAR(50),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. TABELA DE CLIENTES
-- ==========================================
CREATE TABLE clientes (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    endereco TEXT,
    referencia TEXT,
    forma_pagamento_preferida VARCHAR(50) CHECK (forma_pagamento_preferida IN ('dinheiro', 'pix', 'debito', 'credito', 'fiado')),
    limite_fiado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cep VARCHAR(20),
    numero VARCHAR(50),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. TABELA DE FORNECEDORES
-- ==========================================
CREATE TABLE fornecedores (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    nome_empresa VARCHAR(255) NOT NULL,
    contato VARCHAR(255),
    telefone VARCHAR(50),
    cnpj_cpf VARCHAR(50)
);

-- ==========================================
-- 5. TABELA DE PRODUTOS
-- ==========================================
CREATE TABLE produtos (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estoque_atual DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    estoque_minimo DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    unidade_medida VARCHAR(20) NOT NULL DEFAULT 'un'
);

-- ==========================================
-- 6. TABELA DE HISTÓRICO DE ESTOQUE
-- ==========================================
CREATE TABLE historico_estoque (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    produto_id VARCHAR(255) REFERENCES produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade DECIMAL(10,3) NOT NULL,
    motivo VARCHAR(255),
    funcionario_id VARCHAR(255) REFERENCES funcionarios(id) ON DELETE SET NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 7. TABELA DE MESAS
-- ==========================================
CREATE TABLE mesas (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    numero_mesa INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'libre' CHECK (status IN ('livre', 'ocupada', 'aguardando_pagamento')),
    total_atual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gorjeta_aceita BOOLEAN DEFAULT FALSE,
    nome_personalizado VARCHAR(255),
    CONSTRAINT unique_mesa_per_empresa UNIQUE (empresa_id, numero_mesa)
);

-- ==========================================
-- 8. TABELA DE PEDIDOS
-- ==========================================
CREATE TABLE pedidos (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_pedido VARCHAR(50) NOT NULL CHECK (tipo_pedido IN ('balcao', 'entrega', 'mesa')),
    mesa_id VARCHAR(255) REFERENCES mesas(id) ON DELETE SET NULL,
    cliente_id VARCHAR(255) REFERENCES clientes(id) ON DELETE SET NULL,
    funcionario_id VARCHAR(255) REFERENCES funcionarios(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparo', 'entregue', 'concluido')),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    driver_name VARCHAR(255)
);

-- ==========================================
-- 9. TABELA DE ITENS DE PEDIDO
-- ==========================================
CREATE TABLE itens_pedido (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    pedido_id VARCHAR(255) REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id VARCHAR(255) REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade DECIMAL(10,3) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- ==========================================
-- 10. TABELA DE CAIXA DIÁRIO
-- ==========================================
CREATE TABLE caixa_diario (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_fechamento TIMESTAMP WITH TIME ZONE,
    valor_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_final DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    funcionario_id VARCHAR(255) REFERENCES funcionarios(id) ON DELETE SET NULL
);

-- ==========================================
-- 11. TABELA DE MOVIMENTAÇÃO DE CAIXA
-- ==========================================
CREATE TABLE movimentacoes_caixa (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    caixa_id VARCHAR(255) REFERENCES caixa_diario(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito', 'fiado')),
    status_pagamento VARCHAR(20) NOT NULL DEFAULT 'pago' CHECK (status_pagamento IN ('pago', 'pendente')),
    pedido_id VARCHAR(255) REFERENCES pedidos(id) ON DELETE SET NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    descricao TEXT
);

-- ==========================================
-- 12. TABELA DE CONTAS A PAGAR
-- ==========================================
CREATE TABLE contas_a_pagar (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    fornecedor_id VARCHAR(255) REFERENCES fornecedores(id) ON DELETE SET NULL,
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago'))
);

-- ==========================================
-- 13. TABELA DE CONTAS A RECEBER
-- ==========================================
CREATE TABLE contas_a_receber (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id VARCHAR(255) REFERENCES clientes(id) ON DELETE CASCADE,
    pedido_id VARCHAR(255) REFERENCES pedidos(id) ON DELETE SET NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_prometida_pagamento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago'))
);

-- ==========================================
-- 14. TABELA DE VALES E COMISSÕES
-- ==========================================
CREATE TABLE vales_e_comissoes (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    funcionario_id VARCHAR(255) REFERENCES funcionarios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vale', 'comissao', 'bonificacao')),
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
    descricao TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 15. TABELA DE HISTÓRICO DE PAGAMENTO RH / GARÇOM
-- ==========================================
CREATE TABLE historico_pagamentos_funcionarios (
    id VARCHAR(255) PRIMARY KEY,
    empresa_id VARCHAR(255) REFERENCES empresas(id) ON DELETE CASCADE,
    funcionario_id VARCHAR(255) REFERENCES funcionarios(id) ON DELETE CASCADE,
    nome_funcionario VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    comissoes DECIMAL(10,2) NOT NULL,
    bonificacoes DECIMAL(10,2) NOT NULL,
    vales DECIMAL(10,2) NOT NULL,
    salario_liquido DECIMAL(10,2) NOT NULL,
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ====================================================================
-- CRIANDO ÍNDICES PARA ALTA PERFORMANCE (FILTRAGEM POR EMPRESA_ID)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa ON funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historico_estoque_empresa ON historico_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mesas_empresa ON mesas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_empresa ON itens_pedido(empresa_id);
CREATE INDEX IF NOT EXISTS idx_caixas_diario_empresa ON caixa_diario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_empresa ON movimentacoes_caixa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_empresa ON contas_a_pagar(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_empresa ON contas_a_receber(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vales_e_comissoes_empresa ON vales_e_comissoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historico_pagamentos_empresa ON historico_pagamentos_funcionarios(empresa_id);

-- ====================================================================
-- TRIGGERS DE AUTOMÇÃO E DUPLA SINCRONIZAÇÃO DE ESTOQUE
-- ====================================================================

-- Trigger to update product stock when a historical stock movement is inserted (entrada / saida)
CREATE OR REPLACE FUNCTION trg_atualiza_estoque_por_historico()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'entrada' THEN
        UPDATE produtos
        SET estoque_atual = estoque_atual + NEW.quantidade
        WHERE id = NEW.produto_id;
    ELSIF NEW.tipo = 'saida' THEN
        UPDATE produtos
        SET estoque_atual = estoque_atual - NEW.quantidade
        WHERE id = NEW.produto_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_atualiza_estoque_por_historico
AFTER INSERT ON historico_estoque
FOR EACH ROW
EXECUTE FUNCTION trg_atualiza_estoque_por_historico();


-- Trigger to log stock history change if product stock is modified directly
CREATE OR REPLACE FUNCTION trg_registra_historico_por_estoque_produto()
RETURNS TRIGGER AS $$
DECLARE
    diff_qtd DECIMAL(10,3);
    tipo_mov VARCHAR(20);
BEGIN
    diff_qtd := NEW.estoque_atual - OLD.estoque_atual;
    IF diff_qtd <> 0 THEN
        IF diff_qtd > 0 THEN
            tipo_mov := 'entrada';
        ELSE
            tipo_mov := 'saida';
            diff_qtd := ABS(diff_qtd);
        END IF;
        
        -- Insert into historico_estoque
        -- To avoid trigger loop, we only insert if called directly (not from trg_atualiza_estoque_por_historico)
        IF pg_trigger_depth() = 1 THEN
            INSERT INTO historico_estoque (id, empresa_id, produto_id, tipo, quantidade, motivo, funcionario_id, data)
            VALUES (
                'mov-' || NEW.id || '-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::VARCHAR,
                NEW.empresa_id,
                NEW.id,
                tipo_mov,
                diff_qtd,
                'Ajuste direto no cadastro de produtos',
                NULL,
                CURRENT_TIMESTAMP
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_registra_historico_por_estoque_produto
AFTER UPDATE OF estoque_atual ON produtos
FOR EACH ROW
EXECUTE FUNCTION trg_registra_historico_por_estoque_produto();

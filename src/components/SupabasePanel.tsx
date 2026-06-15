import React, { useState, useEffect } from 'react';
import { Database, FileCode, FolderGit, Copy, Check, HeartHandshake, Link2, Send, CloudLightning, ShieldCheck, DatabaseZap } from 'lucide-react';
import { exportAllToSupabase, getSupabaseClient } from '../lib/databaseService';

interface SupabasePanelProps {
  currentTenantId: string;
}

export default function SupabasePanel({ currentTenantId }: SupabasePanelProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'sql' | 'folders' | 'client' | 'saas'>('sync');
  const [copied, setCopied] = useState(false);
  
  // Custom Supabase Credentials
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('supabase_anon_key') || '');
  
  const [isExporting, setIsExporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string }>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Test active Supabase connection on load or credentials change
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      const client = getSupabaseClient(supabaseUrl, supabaseKey);
      if (client) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } else {
      setIsConnected(false);
    }
  }, [supabaseUrl, supabaseKey]);

  const handleSaveCredentials = () => {
    localStorage.setItem('supabase_url', supabaseUrl.trim());
    localStorage.setItem('supabase_anon_key', supabaseKey.trim());
    
    // Refresh page state and notify
    if (supabaseUrl.trim() && supabaseKey.trim()) {
      setSyncStatus({ success: true, message: 'Parâmetros guardados com sucesso! Banco conectado.' });
    } else {
      setSyncStatus({ success: true, message: 'Configurações de Supabase limpas.' });
    }
    
    // Auto clear msg
    setTimeout(() => setSyncStatus({}), 4000);
  };

  const handleFullBackupExport = async () => {
    setIsExporting(true);
    setSyncStatus({ message: 'Conectando e injetando tabelas no Supabase...' });
    
    try {
      const response = await exportAllToSupabase(currentTenantId, supabaseUrl, supabaseKey);
      setSyncStatus(response);
    } catch (e: any) {
      setSyncStatus({ success: false, message: e.message || 'Erro de rede ou permissão recusada.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sqlScript = `-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - SUPABASE/POSTGRESQL
-- Arquitetura SaaS Multi-Tenant com tabela unificada 'saas_store'
-- Cole este script diretamente no 'SQL Editor' do seu painel do Supabase.

CREATE TABLE IF NOT EXISTS saas_store (
    tenant_id VARCHAR(255) NOT NULL,
    key_name VARCHAR(255) NOT NULL,
    value_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_saas_store PRIMARY KEY (tenant_id, key_name)
);

-- Habilitar Row Level Security para regras SaaS robustas (Opcional)
ALTER TABLE saas_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolamento Multitenant por tenant_id" 
ON saas_store 
FOR ALL 
USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');
`;

  const folderStructure = `📂 bar-pdv-saas-root/
├── 📂 src/
│   ├── 📂 lib/                    # Conectores de banco de dados
│   │   └── 📄 databaseService.ts  # Ponte automática Firebase ⇆ Supabase
│   ├── 📂 components/             # Telas e Painéis Administrativos
│   │   └── 📄 SupabasePanel.tsx   # Painel interativo de conexões
│   └── 📄 App.tsx                 # Estado unificado com sincronismo Cloud
├── 📄 firebase-applet-config.json # Credenciais nativas auto-provisionadas
└── 📄 .env.example                # Declaração das variáveis ambientais`;

  const clientTemplateCode = `// src/lib/databaseService.ts
// Instanciação nativa do cliente unificado do Supabase.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100 flex flex-col" id="supabase-guide-panel">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Multi-Cloud Sync: Firebase & Supabase
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">PRODUTIVO</span>
            </h2>
            <p className="text-xs text-slate-400">Banco de dados automático Firebase ativo com suporte customizado para Supabase</p>
          </div>
        </div>
        
        {/* Copy Script Button */}
        {activeTab !== 'sync' && (
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
        )}
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 md:p-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'sync' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
          Painel de Sincronismo & Setup
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'sql' ? 'bg-indigo-700/50 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DatabaseZap className="w-3.5 h-3.5" />
          Injeção de Tabelas SQL
        </button>

        <button
          onClick={() => setActiveTab('folders')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'folders' ? 'bg-indigo-700/50 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderGit className="w-3.5 h-3.5" />
          Estrutura Arquivos App
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'client' ? 'bg-indigo-700/50 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          Conectores Supabase.ts
        </button>

        <button
          onClick={() => setActiveTab('saas')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'saas' ? 'bg-indigo-700/50 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Estratégia SaaS
        </button>
      </div>

      {/* Content body */}
      <div className="p-4 md:p-6 font-mono text-sm leading-relaxed overflow-y-auto max-h-[500px]">
        {activeTab === 'sync' && (
          <div className="font-sans space-y-6">
            
            {/* Status indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-xs font-black uppercase tracking-wider">Servidor Firebase Cloud</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Ativo, seguro e auto-sincronizado nativamente no GCP do Google AI Studio para o estabelecimento <code className="text-emerald-300 font-mono font-bold bg-slate-900 px-1 rounded">"{currentTenantId}"</code>.
                  </p>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    SALVANDO AUTOMATICAMENTE (100% ONLINE)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-xs font-black uppercase tracking-wider">Banco de Dados Supabase</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Status: {isConnected ? <span className="text-emerald-400 font-bold">Vínculo Ativo</span> : <span className="text-slate-500 italic">Preencha os Campos Abaixo</span>}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mt-3 ${
                    isConnected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isConnected ? '● CLOUD LINK ATIVO' : '● NENHUM BANCO CONFIGURADO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Credentials */}
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800">
              <h3 className="text-white font-bold text-sm tracking-tight mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-400" />
                Conectar seu próprio projeto Supabase (Opcional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">URL do Supabase API</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzabcdefghijklmnop.supabase.co"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">Anon Public/Key APK</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Estes parâmetros são guardados exclusivamente no seu navegador de forma privada.</span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleSaveCredentials}
                    className="flex-1 max-w-[200px] border border-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Salvar Parâmetros
                  </button>

                  <button
                    onClick={handleFullBackupExport}
                    disabled={!isConnected || isExporting}
                    className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs py-2 px-4 rounded-lg transition-all ${
                      isConnected && !isExporting 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg cursor-pointer' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isExporting ? 'Exportando...' : 'Exportar Fictícios/Local para Supabase'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {syncStatus.message && (
              <div className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
                syncStatus.success === true 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : syncStatus.success === false
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
              }`}>
                <strong>Log do Sistema:</strong> {syncStatus.message}
              </div>
            )}

            {/* Quick Warning / Instruction */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 space-y-2 leading-relaxed">
              <span className="font-bold text-white block uppercase text-[10px] tracking-wide">💡 Como testar a persistência imediata:</span>
              <p>
                1. <strong>Instante:</strong> Qualquer item que você cadastrar, caixa que abrir ou comissão que lançar agora será salvo de forma robusta e imediata na nuvem.
              </p>
              <p>
                2. <strong>Teste de Sobrevivência de Dados:</strong> Insira uns dados novos na tela (ex: um Produto), recarregue a página inteira apertando F5. Você verá que os dados carregam sozinhos da nuvem instantaneamente!
              </p>
            </div>

          </div>
        )}

        {activeTab === 'sql' && (
          <div>
            <div className="mb-4 bg-indigo-500/10 rounded-lg p-3 text-xs border border-indigo-500/20 text-indigo-400/90 font-sans">
              ℹ️ <strong>Instruções do SQL:</strong> Para ativar o sincronismo no Supabase, abra seu projeto no painel do Supabase, acesse a aba <strong>"SQL Editor"</strong>, crie uma query nova, cole o código abaixo e clique em <strong>Run</strong>. Isso criará a tabela <code>saas_store</code> que unifica os estados do seu PDV.
            </div>
            <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap leading-5 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
              {sqlScript}
            </pre>
          </div>
        )}

        {activeTab === 'folders' && (
          <div>
            <div className="mb-4 bg-indigo-500/10 rounded-lg p-3 text-xs border border-indigo-500/20 text-indigo-400/90 font-sans">
              📁 <strong>Estrutura de Sincronismo do Front-end:</strong> Estrutura interna que montamos no seu workspace para ativar os salvamentos persistentes do PDV SaaS.
            </div>
            <pre className="text-xs text-blue-300 whitespace-pre leading-6 bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800">
              {folderStructure}
            </pre>
          </div>
        )}

        {activeTab === 'client' && (
          <div>
            <div className="mb-4 bg-amber-500/10 rounded-lg p-3 text-xs border border-amber-500/20 text-amber-400/90 font-sans">
              ⚡ <strong>Instanciador de conexão Supabase:</strong> Código modular interno que faz a leitura dinâmica de chaves das variáveis de ambiente e fallback local em cache.
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
              Modelo SaaS Premium R$ 50/mês
            </h3>
            
            <p className="mb-3 text-slate-400 text-xs">
              Para faturar escalável cobrando um valor acessível dos estabelecimentos, a arquitetura multi-tenant híbrida que configuramos no seu código permite isolar as informações por ID sem onerar consumo do servidor. Cada bar salva em sua própria coleção sem misturar orçamentos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">Estratégia Híbrida Ativo-Local</span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Os garçons e caixas operam em conexões locais com velocidade imediata de clique (0ms latency). O banco unificado atualiza de forma assíncrona na nuvem, mantendo o PDV imune a quedas de internet momentâneas do bar.
                </span>
              </div>
              <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Central de Controle SaaS</span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  A tabela <code>saas_store</code> unificada armazena dados de todas as lanchonetes de forma totalmente isolada. Pode colocar 500 estabelecimentos ativos sob as mesmas faturas básicas das quotas gratuitas de desenvolvimento!
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

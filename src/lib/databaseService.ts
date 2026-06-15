import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Supabase Client with dynamic/saved credentials or environment variables
export const getSupabaseClient = (customUrl?: string, customKey?: string) => {
  const url = customUrl || localStorage.getItem('supabase_url') || (import.meta as any).env.VITE_SUPABASE_URL || '';
  const key = customKey || localStorage.getItem('supabase_anon_key') || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  if (url && key && url.startsWith('http')) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Error creating Supabase client:', e);
    }
  }
  return null;
};

// Available sync keys
export const SYNC_KEYS = [
  'saas_produtos',
  'saas_clientes',
  'saas_funcionarios',
  'saas_fornecedores',
  'saas_mesas',
  'saas_pedidos',
  'saas_caixas',
  'saas_movimentacoes',
  'saas_contaspagar',
  'saas_contasreceber',
  'saas_valescomissoes'
];

// Helper to resolve specific localized tenant keys
export const getResolvedKey = (tenantId: string, key: string): string => {
  if (tenantId === 'bella') {
    return key.replace('saas_', 'saas_bella_');
  } else if (tenantId === 'chef') {
    return key.replace('saas_', 'saas_chef_');
  } else {
    return `saas_${tenantId}_${key.replace('saas_', '')}`;
  }
};

/**
 * Saves state both locally and globally on Firestore/Supabase.
 * Pre-configures Firebase automatically so it works out of the box.
 */
export const saveCloudState = async (tenantId: string, key: string, data: any) => {
  const resolvedKey = getResolvedKey(tenantId, key);
  
  // 1. Always protect local storage cache
  localStorage.setItem(resolvedKey, JSON.stringify(data));

  // 2. Firestore Sync (Real-time auto-saving)
  try {
    const docRef = doc(firestoreDb, 'saas_tenants', tenantId, 'collections', key);
    await setDoc(docRef, {
      data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firebase] Saved collection ${key} for tenant ${tenantId}`);
  } catch (e) {
    console.warn(`[Firebase] Failed to write ${key}:`, e);
  }

  // 3. Supabase Sync (if configured)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // First, attempt to update general state store table `saas_store`
      const { error } = await supabase
        .from('saas_store')
        .upsert({
          tenant_id: tenantId,
          key_name: key,
          value_data: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id,key_name' });

      if (error) {
        console.warn('[Supabase] Failed to save in saas_store table:', error.message);
      } else {
        console.log(`[Supabase] Saved state ${key} in saas_store for ${tenantId}`);
      }

      // 4. Row-by-Row Synchronization for relational tables in Postgres Supabase
      // Wrapping with a separate try-catch so it won't crash main sync if schemas aren't ideal
      try {
        let tenantName = tenantId;
        try {
          const savedConfig = localStorage.getItem(`saas_tenant_config_${tenantId}`);
          if (savedConfig) {
            tenantName = JSON.parse(savedConfig).name || tenantId;
          }
        } catch (e) {}

        // Ensure tenant/company row exists to fulfill FK reference constraint
        await supabase.from('empresas').upsert({
          id: tenantId,
          nome_empresa: tenantName,
          nome_responsavel: 'Administrador SaaS',
          telefone_admin: tenantId, // Unique phone for each company based on their SaaS ID
          senha_hash: 'default',
          status_assinatura: 'ativo',
          data_fim_trial: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'id' });

        // Map and write products
        if (key === 'saas_produtos' && Array.isArray(data)) {
          const rows = data.map((p: any) => ({
            id: p.id,
            empresa_id: tenantId,
            nome: p.nome,
            categoria: p.categoria || 'Outros',
            preco_venda: parseFloat(p.preco_venda) || 0,
            preco_custo: parseFloat(p.preco_custo) || 0,
            estoque_atual: parseFloat(p.estoque_atual) || 0,
            estoque_minimo: parseFloat(p.estoque_minimo) || 0,
            unidade_medida: p.unidade_medida || 'un'
          }));
          const { error: err } = await supabase.from('produtos').upsert(rows, { onConflict: 'id' });
          if (err) console.warn('[Supabase] individual table products warning:', err.message);
        }

        // Map and write clients
        if (key === 'saas_clientes' && Array.isArray(data)) {
          const rows = data.map((c: any) => ({
            id: c.id,
            empresa_id: tenantId,
            nome: c.nome,
            telefone: c.telefone || '',
            endereco: c.endereco || '',
            limite_fiado: parseFloat(c.limite_fiado) || 0
          }));
          const { error: err } = await supabase.from('clientes').upsert(rows, { onConflict: 'id' });
          if (err) console.warn('[Supabase] individual table clients warning:', err.message);
        }

        // Map and write employees (funcionarios)
        if (key === 'saas_funcionarios' && Array.isArray(data)) {
          const rows = data.map((f: any) => ({
            id: f.id,
            empresa_id: tenantId,
            nome: f.nome,
            cargo: f.cargo || 'garcom',
            telefone: f.telefone || '',
            comissao_percentual: parseFloat(f.comissao_percentual) || 0,
            salario_base: parseFloat(f.salario_base) || 1200.00
          }));
          const { error: err } = await supabase.from('funcionarios').upsert(rows, { onConflict: 'id' });
          if (err) console.warn('[Supabase] individual table employees warning:', err.message);
        }

        // Map and write suppliers (fornecedores)
        if (key === 'saas_fornecedores' && Array.isArray(data)) {
          const rows = data.map((f: any) => ({
            id: f.id,
            empresa_id: tenantId,
            nome_empresa: f.nome_empresa,
            contato: f.contato || '',
            telefone: f.telefone || '',
            cnpj_cpf: f.cnpj_cpf || ''
          }));
          const { error: err } = await supabase.from('fornecedores').upsert(rows, { onConflict: 'id' });
          if (err) console.warn('[Supabase] individual table suppliers warning:', err.message);
        }

        // Map and write tables (mesas)
        if (key === 'saas_mesas' && Array.isArray(data)) {
          const rows = data.map((m: any) => {
            let statusDb = m.status || 'livre';
            if (statusDb === 'fechada') statusDb = 'fechamento';
            if (statusDb === 'ocupada' || statusDb === 'refeicao') statusDb = 'ocupada';
            if (!['livre', 'ocupada', 'preparo', 'fechamento'].includes(statusDb)) {
              statusDb = 'livre';
            }
            return {
              id: m.id,
              empresa_id: tenantId,
              numero_mesa: parseInt(m.numero_mesa) || 0,
              status: statusDb,
              total_atual: parseFloat(m.total_atual) || 0,
              nome_personalized: m.nome_personalizado || null
            };
          });
          const { error: err } = await supabase.from('mesas').upsert(rows, { onConflict: 'id' });
          if (err) console.warn('[Supabase] individual table mesas warning:', err.message);
        }
      } catch (innerE: any) {
        console.warn('[Supabase] relational row upsert ignored details:', innerE.message || innerE);
      }
    } catch (e) {
      console.warn('[Supabase] Save exception:', e);
    }
  }
};

/**
 * Full Tenant data pull on startup.
 * Restores all collections from Cloud Firestore / Supabase if local state is empty/stale.
 */
export const syncFromCloud = async (tenantId: string): Promise<{ [key: string]: any } | null> => {
  const syncedData: { [key: string]: any } = {};

  // 1. Try Supabase FIRST (SaaS Multi-tenant JSON table backup) as primary if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      console.log(`[Supabase] Querying saas_store for tenant ${tenantId}...`);
      const { data, error } = await supabase
        .from('saas_store')
        .select('*')
        .eq('tenant_id', tenantId);

      if (!error && data && data.length > 0) {
        for (const row of data) {
          syncedData[row.key_name] = row.value_data;
          const resolvedKey = getResolvedKey(tenantId, row.key_name);
          localStorage.setItem(resolvedKey, JSON.stringify(row.value_data));
        }
        console.log(`[Supabase] Sync successfully completed for tenant ${tenantId}`);
        return syncedData;
      }
    } catch (e) {
      console.warn('[Supabase] Sync failed:', e);
    }
  }

  // 2. Try Firebase Firestore (The default cloud-provisioned store) as secondary backup
  let hasCloudData = false;
  try {
    console.log(`[Firebase] Fetching data for tenant ${tenantId}...`);
    for (const key of SYNC_KEYS) {
      const docRef = doc(firestoreDb, 'saas_tenants', tenantId, 'collections', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        syncedData[key] = cloudData;
        const resolvedKey = getResolvedKey(tenantId, key);
        localStorage.setItem(resolvedKey, JSON.stringify(cloudData));
        hasCloudData = true;
      }
    }
    if (hasCloudData) {
      console.log(`[Firebase] Sync successfully completed for tenant ${tenantId}`);
      return syncedData;
    }
  } catch (e) {
    console.warn('[Firebase] Sync failed, dropping back to local storage cache:', e);
  }

  return null;
};

/**
 * Triggers full backup transfer to Supabase from current localStorage.
 */
export const exportAllToSupabase = async (tenantId: string, customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> => {
  const supabase = getSupabaseClient(customUrl, customKey);
  if (!supabase) {
    return { success: false, message: 'Supabase não está configurado ou credenciais estão inválidas.' };
  }

  try {
    let successCount = 0;
    for (const key of SYNC_KEYS) {
      const resolvedKey = getResolvedKey(tenantId, key);
      const localValue = localStorage.getItem(resolvedKey);
      if (localValue) {
        const parsed = JSON.parse(localValue);
        const { error } = await supabase
          .from('saas_store')
          .upsert({
            tenant_id: tenantId,
            key_name: key,
            value_data: parsed,
            updated_at: new Date().toISOString()
          }, { onConflict: 'tenant_id,key_name' });

        if (!error) successCount++;
      }
    }
    return { 
      success: true, 
      message: `Sucesso! Importado ${successCount} tabelas para o Supabase no tenant "${tenantId}".` 
    };
  } catch (e: any) {
    return { success: false, message: `Ocorreu um erro durante a exportação: ${e.message}. Certifique-se de ter criado a tabela 'saas_store' no painel do Supabase.` };
  }
};

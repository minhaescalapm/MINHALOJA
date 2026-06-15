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

  // Flag to know if we obtained anything
  let hasCloudData = false;

  // Try Firebase Firestore (The default cloud-provisioned store)
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

  // Try Supabase (SaaS Multi-tenant JSON table backup)
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

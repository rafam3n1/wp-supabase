import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// CONFIGURAÇÕES SUPABASE
const supabaseUrl = 'https://djksrucignhwjagxfaox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqa3NydWNpZ25od2phZ3hmYW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzODYxMDIsImV4cCI6MjA1ODk2MjEwMn0.ZqBQ26JT312wk1JSrTXVeQ8pNiq-3X06XThj30rj_PI';
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. PEGAR E-MAIL DO USUÁRIO (via meta tag adicionada no <head>)
function getUserEmail() {
    try {
      const el = document.getElementById('uip-app-data');
      if (!el) return null;
  
      const raw = el.getAttribute('uip_ajax');
      const json = JSON.parse(raw);
      return json?.uipAppData?.options?.dynamicData?.useremail?.value || null;
    } catch (e) {
      console.error('Erro ao extrair email:', e);
      return null;
    }
  }  

// 3. SOMAR VALORES DE 'SAIDA' NA TABELA 'transacoes'
async function calcularTotalSaidas(usuarioId) {
  const { data, error } = await supabase
    .from('transacoes')
    .select('valor')
    .eq('usuario_id', usuarioId)
    .eq('tipo', 'saida');

  if (error || !data) {
    console.error('Erro ao buscar transações:', error);
    return 0;
  }

  const total = data.reduce((soma, item) => soma + parseFloat(item.valor || 0), 0);
  return total.toFixed(2);
}

// 4. PREENCHER ELEMENTO DO ELEMENTOR
async function preencherTotalSaidas() {
  const email = getUserEmail();
  if (!email) {
    console.warn('Email do usuário não encontrado.');
    return;
  }

  const usuarioId = await buscarIdDoUsuario(email);
  if (!usuarioId) return;

  const totalSaidas = await calcularTotalSaidas(usuarioId);

  const el = document.getElementById('total-saidas');
  if (el) {
    el.textContent = `R$ ${totalSaidas}`;
  }
}

// INICIAR
preencherTotalSaidas();

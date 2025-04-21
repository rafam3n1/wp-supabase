import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// CONFIGURAÇÕES SUPABASE
const supabaseUrl = 'https://djksrucignhwjagxfaox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqa3NydWNpZ25od2phZ3hmYW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzODYxMDIsImV4cCI6MjA1ODk2MjEwMn0.ZqBQ26JT312wk1JSrTXVeQ8pNiq-3X06XThj30rj_PI';
const supabase = createClient(supabaseUrl, supabaseKey);

// PEGAR E-MAIL DO USUÁRIO
function getUserEmail() {
  try {
    const el = document.getElementById('uip-app-data');
    if (!el) {
      console.warn('❌ Elemento #uip-app-data não encontrado');
      return null;
    }

    const raw = el.getAttribute('uip_ajax');
    const cleaned = raw.replace(/\\\\/g, '\\');
    const json = JSON.parse(cleaned);
    const email = json?.uipAppData?.options?.dynamicData?.useremail?.value;

    if (!email) {
      console.warn('❌ Email não encontrado no JSON extraído');
      return null;
    }

    console.log('📧 Email encontrado:', email);
    return email;
  } catch (e) {
    console.error('❌ Erro ao extrair e-mail:', e);
    return null;
  }
}

// BUSCAR ID DO USUÁRIO
async function buscarIdDoUsuario(email) {
  console.log('🔍 Buscando ID do usuário para o email:', email);
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !data) {
    console.error('❌ Erro ao buscar usuário no Supabase:', error);
    return null;
  }

  console.log('🆔 ID encontrado:', data.id);
  return data.id;
}

// CONTROLE DE MÊS E ANO
let month = new Date().getMonth();
let year = new Date().getFullYear();

function updateMonthDisplay() {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const el = document.getElementById('currentMonth');
  const label = `${months[month]} ${year}`;

  if (el) {
    el.innerText = label;
  }

  console.log('📅 Mês exibido:', label);
}

// ATUALIZA RECEITAS
async function atualizarReceitas() {
  console.log('🔁 Atualizando receitas...');

  const email = getUserEmail();
  if (!email) return;

  const usuarioId = await buscarIdDoUsuario(email);
  if (!usuarioId) return;

  console.log('📦 Buscando transações do tipo "entrada"...');
  const { data, error } = await supabase
    .from('transacoes')
    .select('valor, data')
    .eq('usuario_id', usuarioId)
    .eq('tipo', 'entrada');

  if (error || !data) {
    console.error('❌ Erro ao buscar transações:', error);
    return;
  }

  console.log(`📄 Transações encontradas: ${data.length}`);
const totalDoMes = data
  .filter(item => {
    const dataItem = new Date(item.data);
    const itemMonth = dataItem.getMonth();
    const itemYear = dataItem.getFullYear();
    const cond = itemMonth === month && itemYear === year;

    console.log(`📆 data: ${item.data} → mês: ${itemMonth + 1}, ano: ${itemYear} → ${cond ? '✔️ incluído' : '❌ ignorado'}`);
    return cond;
  })
  .reduce((soma, item) => {
    console.log('➕ Somando valor:', item.valor);
    return soma + parseFloat(item.valor || 0);
  }, 0);

console.log('💸 Total FINAL do mês:', totalDoMes);


  console.log('💰 Total calculado para o mês:', totalDoMes);

  const el = document.getElementById('total-entradas');
  if (el) {
    el.innerText = totalDoMes.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    console.log('✅ Total exibido em #total-entradas');
  } else {
    console.warn('⚠️ Elemento #total-entradas não encontrado.');
  }
}

// Atualizar Despesas
async function atualizarDespesas(mesSelecionado) {
  console.log("🔴 Atualizando despesas...");

  const email = getUserEmail();
  console.log("📧 Email encontrado:", email);

  const { data: usuario, error: erroUsuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .single();

  if (erroUsuario || !usuario) {
    console.error("❌ Erro ao buscar usuário:", erroUsuario);
    return;
  }

  const idUsuario = usuario.id;
  console.log("🆔 ID encontrado:", idUsuario);

  const inicioMes = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 1).toISOString();
  const fimMes = new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth() + 1, 0, 23, 59, 59).toISOString();

  console.log(`📅 Buscando transações do tipo "saida"...`);

  const { data: transacoes, error: erroTransacoes } = await supabase
    .from("transacoes")
    .select("valor")
    .eq("usuario_id", idUsuario)
    .eq("tipo", "saida")
    .gte("data", inicioMes)
    .lte("data", fimMes);

  if (erroTransacoes) {
    console.error("❌ Erro ao buscar transações:", erroTransacoes);
    return;
  }

  console.log("📊 Transações encontradas:", transacoes.length);

  const total = transacoes.reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalFormatado = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  console.log(`💸 Total calculado para o mês: ${totalFormatado}`);

  const elementoTotal = document.getElementById("total-despesas");
  if (elementoTotal) {
    elementoTotal.innerText = totalFormatado;
    console.log("✅ Total exibido em #total-despesas");
  } else {
    console.warn("⚠️ Elemento #total-despesas não encontrado.");
  }
}


// BOTÕES DE MÊS
document.getElementById('prevMonth').onclick = async () => {
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  updateMonthDisplay();
  await atualizarReceitas();
  await atualizarDespesas(new Date(year, month));
  await carregarTransacoesDoMes();
  atualizarSaldo();
};

document.getElementById('nextMonth').onclick = async () => {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  updateMonthDisplay();
  await atualizarReceitas();
  await atualizarDespesas(new Date(year, month));
  atualizarSaldo();
};


// INÍCIO
updateMonthDisplay();
atualizarReceitas();
atualizarDespesas(new Date(year, month));

// BOTÕES DE MÊS
document.getElementById('prevMonth').onclick = async () => {
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  updateMonthDisplay();
  await atualizarReceitas();
  await atualizarDespesas(new Date(year, month));
};

document.getElementById('nextMonth').onclick = async () => {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  updateMonthDisplay();
  await atualizarReceitas();
  await atualizarDespesas(new Date(year, month));
};

function atualizarSaldo() {
  const receitasText = document.getElementById('total-entradas')?.innerText || 'R$ 0,00';
  const despesasText = document.getElementById('total-despesas')?.innerText || 'R$ 0,00';

  const receitas = parseFloat(receitasText.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
  const despesas = parseFloat(despesasText.replace('R$', '').replace('.', '').replace(',', '.')) || 0;

  const saldo = receitas - despesas;

  const saldoElement = document.getElementById('total-saldo');
  if (saldoElement) {
    saldoElement.innerText = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

async function atualizarPrevisaoReceber() {
  console.log('🔮 Calculando entradas previstas...');

  const hoje = new Date();
  const { data: transacoes, error } = await supabase
    .from('transacoes')
    .select('valor, data')
    .eq('tipo', 'entrada')
    .gte('data', hoje.toISOString().split('T')[0]);

  if (error) {
    console.error('Erro ao buscar previsões:', error.message);
    return;
  }

  const totalPrevisto = transacoes.reduce((soma, transacao) => {
    return soma + Number(transacao.valor);
  }, 0);

  console.log(`💰 Previsto: ${totalPrevisto}`);

  const previstoEl = document.getElementById('total-previsto');
  if (previstoEl) {
    previstoEl.innerText = totalPrevisto.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

async function atualizarPrevisaoPagar() {
  console.log('📤 Calculando saídas previstas...');

  const hoje = new Date();
  const { data: transacoes, error } = await supabase
    .from('transacoes')
    .select('valor, data')
    .eq('tipo', 'saida')
    .gte('data', hoje.toISOString().split('T')[0]);

  if (error) {
    console.error('Erro ao buscar previsões de saída:', error.message);
    return;
  }

  const totalPrevisto = transacoes.reduce((soma, transacao) => {
    return soma + Number(transacao.valor);
  }, 0);

  console.log(`📉 Previsto a pagar: ${totalPrevisto}`);

  const previstoEl = document.getElementById('total-previsto-saida');
  if (previstoEl) {
    previstoEl.innerText = totalPrevisto.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}


async function carregarGraficoTendencias() {
  const hoje = new Date();
  const mesesLabels = [];
  const entradasPorMes = {};
  const saidasPorMes = {};

  // Gera os últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).charAt(0).toUpperCase() + d.toLocaleDateString('pt-BR', { month: 'short' }).slice(1);
    const chave = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;

    mesesLabels.push(label);
    entradasPorMes[chave] = 0;
    saidasPorMes[chave] = 0;
  }

  const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1).toISOString().split('T')[0];
  const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

  const email = getUserEmail();
  if (!email) return console.error('❌ Email não encontrado para gráfico.');

  const { data: usuarios, error: erroUsuario } = await supabase.from('usuarios').select('id').eq('email', email).single();
  if (erroUsuario || !usuarios) return console.error('Usuário não encontrado.');

  const usuarioId = usuarios.id;

  const { data: transacoes, error: erroTransacoes } = await supabase
    .from('transacoes')
    .select('valor, tipo, data')
    .eq('usuario_id', usuarioId)
    .gte('data', dataInicio)
    .lte('data', dataFim);

  if (erroTransacoes) return console.error('Erro nas transações', erroTransacoes);

  transacoes.forEach((t) => {
    const d = new Date(t.data);
    const chave = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const valor = parseFloat(t.valor) || 0;

    if (t.tipo === 'entrada') entradasPorMes[chave] += valor;
    if (t.tipo === 'saida') saidasPorMes[chave] += valor;
  });

  const dadosEntradas = Object.values(entradasPorMes);
  const dadosSaidas = Object.values(saidasPorMes);

  // Criação do gráfico
  const ctx = document.getElementById('graficoTendencias').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mesesLabels,
      datasets: [
        {
          label: 'Receitas',
          data: dadosEntradas,
          backgroundColor: '#00cc66',
        },
        {
          label: 'Despesas',
          data: dadosSaidas,
          backgroundColor: '#ff4444',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#fff' }
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#fff',
            callback: (v) => 'R$ ' + v.toLocaleString('pt-BR')
          },
          beginAtZero: true
        },
        x: {
          ticks: {
            color: '#fff'
          }
        }
      }
    }
  });
}

carregarGraficoTendencias();

// transacoes individuais
async function carregarTransacoesDoMes() {
  const email = getUserEmail();
  if (!email) return console.error("❌ Email não encontrado.");

  const { data: usuario, error: erroUsuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .single();

  if (erroUsuario || !usuario) return console.error("❌ Usuário não encontrado.");

  const usuarioId = usuario.id;

  const { data: transacoes, error: erroTransacoes } = await supabase
    .from("transacoes")
    .select(`
      id,
      data,
      descricao,
      valor,
      tipo,
      categoria_transacoes:categoria_id ( descricao )
    `)
    .eq("usuario_id", usuarioId)
    .order("data", { ascending: false });

  if (erroTransacoes) return console.error("Erro ao buscar transações:", erroTransacoes);

  const transacoesDoMes = transacoes.filter((t) => {
    const data = new Date(t.data);
    return data.getMonth() === month && data.getFullYear() === year;
  });

  const corpoTabela = document.getElementById("corpo-tabela-transacoes");
  corpoTabela.innerHTML = "";

  transacoesDoMes.forEach((t) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${new Date(t.data).toLocaleDateString()}</td>
      <td>${t.descricao}</td>
      <td>${t.categoria_transacoes?.descricao || "-"}</td>
      <td style="color: ${t.tipo === 'entrada' ? 'limegreen' : 'red'}; font-weight: 600;">
        ${t.tipo === 'entrada' ? '+' : '-'} R$ ${parseFloat(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </td>
    `;
    corpoTabela.appendChild(linha);
  });
}


// INÍCIO
updateMonthDisplay();
carregarTransacoesDoMes();

(async () => {
  await atualizarReceitas();
  await atualizarDespesas(new Date(year, month));
  atualizarSaldo();
  await atualizarPrevisaoReceber();
  await atualizarPrevisaoPagar();
  await carregarGraficoTendencias(); // 👍 garante que só roda no final
})();
let contasGlobais = [];
let currentFilter = 'todas';
let currentMonth = new Date().toISOString().slice(0, 7);

const MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Dashboard
    if (document.getElementById('account-form')) {
        setCurrentMonthLabel();
        carregarContas();
    }

    // Página de usuário
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dados = {
                nome: document.getElementById('user-nome').value,
                email: document.getElementById('user-email').value
            };
            try {
                const response = await fetch('http://127.0.0.1:5000/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                const result = await response.json();
                if (!response.ok || result.success === false) throw new Error(result.error || 'Erro desconhecido');
                window.location.href = '/conta.html';
            } catch (error) {
                showToast('Erro ao vincular conta: ' + error.message, 'error');
            }
        });
    }
});

// ============================================================
// NAVEGAÇÃO DE MÊS
// ============================================================
function setCurrentMonthLabel() {
    const [y, m] = currentMonth.split('-');
    const label = MESES[parseInt(m) - 1] + ' ' + y;
    const el = document.getElementById('month-label');
    if (el) el.textContent = label;
}

function changeMonth(delta) {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    currentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    setCurrentMonthLabel();
    renderizarTabela(contasGlobais);
}

// ============================================================
// FORM: PARCELAS
// ============================================================
function toggleParcelas() {
    const tipo = document.getElementById('modalidade').value;
    document.getElementById('group-parcelas').style.display =
        tipo === 'parcelada' ? 'block' : 'none';
}

// ============================================================
// FORM: SUBMIT
// ============================================================
async function submitConta(e) {
    e.preventDefault();

    // Limpa erros anteriores
    ['descricao', 'valor', 'data'].forEach(f => {
        const el = document.getElementById('err-' + f);
        if (el) el.textContent = '';
    });

    const descricao = document.getElementById('descricao').value.trim();
    const valor = document.getElementById('valor').value;
    const data = document.getElementById('data').value;
    const modalidade = document.getElementById('modalidade').value;

    let valido = true;

    if (!descricao) {
        document.getElementById('err-descricao').textContent = 'Informe a descrição';
        valido = false;
    }
    if (!valor || parseFloat(valor) <= 0) {
        document.getElementById('err-valor').textContent = 'Valor inválido';
        valido = false;
    }
    if (!data) {
        document.getElementById('err-data').textContent = 'Informe a data';
        valido = false;
    }
    if (!valido) return;

    const btn = document.getElementById('btn-registrar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px"></i>Salvando...';

    try {
        if (modalidade === 'parcelada') {
            const qtd = parseInt(document.getElementById('qtd-parcelas').value) || 1;
            const promises = [];
            for (let i = 0; i < qtd; i++) {
                const d = new Date(data + 'T12:00:00');
                d.setMonth(d.getMonth() + i);
                const dataParc = d.toISOString().slice(0, 10);
                promises.push(
                    fetch('http://127.0.0.1:5000/api/contas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            descricao: `${descricao} ${i + 1}/${qtd}`,
                            valor,
                            data: dataParc,
                            modalidade,
                            usuario_id: 2
                        })
                    })
                );
            }
            await Promise.all(promises);
            showToast(`${qtd} parcelas registradas!`, 'success');
        } else {
            const response = await fetch('http://127.0.0.1:5000/api/contas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descricao, valor, data, modalidade, usuario_id: 2 })
            });
            const result = await response.json();
            if (!response.ok || result.success === false) throw new Error(result.error || 'Erro desconhecido');
            showToast('Lançamento registrado!', 'success');
        }

        document.getElementById('account-form').reset();
        document.getElementById('group-parcelas').style.display = 'none';
        await carregarContas();

    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right:8px"></i>Efetivar Registro';
    }
}

// ============================================================
// API: CARREGAR CONTAS
// ============================================================
async function carregarContas() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/contas/2');
        contasGlobais = await response.json();
        renderizarTabela(contasGlobais);
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        showToast('Não foi possível carregar os lançamentos', 'error');
    }
}

// ============================================================
// RENDER TABELA
// ============================================================
function renderizarTabela(contas) {
    const area = document.getElementById('table-area');
    const hojeStr = new Date().toISOString().split('T')[0];

    // filtra pelo mês atual
    const doMes = contas.filter(c => c.vencimento.slice(0, 7) === currentMonth);
    const filtradas = currentFilter === 'todas'
        ? doMes
        : doMes.filter(c => c.tipo === currentFilter);

    // atualiza stats
    const total = doMes.reduce((s, c) => s + c.valor, 0);
    const venceHoje = doMes.filter(c => c.vencimento === hojeStr).length;
    const parcelas = doMes.filter(c => c.tipo === 'parcelada').length;

    document.getElementById('total-mes').textContent =
        'R$ ' + total.toFixed(2).replace('.', ',');
    document.getElementById('total-count').textContent =
        doMes.length + ' lançamento' + (doMes.length !== 1 ? 's' : '');
    document.getElementById('total-vencendo').textContent = venceHoje;
    document.getElementById('vencendo-sub').textContent =
        venceHoje > 0 ? venceHoje + ' conta' + (venceHoje > 1 ? 's' : '') + ' hoje' : 'tudo em dia';
    document.getElementById('total-sync').textContent = parcelas;

    // estado vazio
    if (!filtradas.length) {
        area.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open empty-icon"></i>
                <p class="empty-title">Nenhum lançamento aqui</p>
                <p class="empty-desc">Adicione uma conta no formulário ao lado<br>ou navegue para outro mês.</p>
            </div>`;
        return;
    }

    const badgeClass = { fixa: 'badge-fixa', parcelada: 'badge-parcelada', esporadica: 'badge-esporadica' };
    const badgeLabel = { fixa: 'Fixa', parcelada: 'Parcelada', esporadica: 'Esporádica' };

    const rows = filtradas.map(conta => {
        const isVence = conta.vencimento === hojeStr;
        const dataCell = isVence
            ? `${formatarData(conta.vencimento)} <span class="badge badge-vence">Hoje</span>`
            : formatarData(conta.vencimento);

        return `<tr>
            <td>${conta.descricao}</td>
            <td>${dataCell}</td>
            <td style="font-weight:700">R$ ${conta.valor.toFixed(2).replace('.', ',')}</td>
            <td><span class="badge ${badgeClass[conta.tipo] || ''}">${badgeLabel[conta.tipo] || conta.tipo}</span></td>
            <td>
                <button class="del-btn" onclick="deletarConta(${conta.id})" title="Remover lançamento">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    area.innerHTML = `
        <table id="accounts-table">
            <thead>
                <tr class="text-uppercase">
                    <th>Item</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="table-body">${rows}</tbody>
        </table>`;
}

// ============================================================
// FILTROS
// ============================================================
function filtrar(tipo, btn) {
    currentFilter = tipo;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderizarTabela(contasGlobais);
}

// ============================================================
// DELETAR
// ============================================================
async function deletarConta(id) {
    if (!confirm('Deseja remover este lançamento?')) return;
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/contas/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showToast('Lançamento removido');
            await carregarContas();
        } else {
            showToast('Erro ao deletar: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Erro ao deletar: ' + error.message, 'error');
    }
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function formatarData(dataISO) {
    const [y, m, d] = dataISO.split('-');
    return `${d}/${m}/${y}`;
}

let toastTimer;
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
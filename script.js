// ================= CONFIGURAÇÕES =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v500'; // Versão nova para limpar erros de data

// Função MANUAL de data (Evita erros do GitHub e fuso horário)
function getTodayString() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`; // Retorna sempre YYYY-MM-DD
}

let currentViewDate = new Date();
let selectedDate = getTodayString();
let currentUserKey = null;

// ================= BANCO DE DADOS =================
let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    team: {
        "lucas": { name: "Lucas", pass: "123" },
        "gamarra": { name: "Gamarra", pass: "123" },
        "mateus": { name: "Mateus", pass: "123" },
        "luis": { name: "Luis", pass: "123" }
    },
    tasks: []
};

function save() { localStorage.setItem(DB_NAME, JSON.stringify(db)); }

// ================= TEMA (CORREÇÃO DO ERRO) =================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('belize_theme', isDark ? 'dark' : 'light');
}

// Carregar tema imediatamente
if (localStorage.getItem('belize_theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// ================= LOGIN =================
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if (u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return;
    }

    if (db.team[u] && db.team[u].pass === p) {
        currentUserKey = u;
        showScreen('worker-panel'); renderWorkerUI();
    } else {
        alert("Acesso negado.");
    }
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel', 'rest-screen'].forEach(s => {
        document.getElementById(s)?.classList.add('hidden');
    });
    document.getElementById(id)?.classList.remove('hidden');
}

// ================= ADMIN =================
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    let html = `<div class="cal-header">${currentViewDate.toLocaleDateString('pt-BR', {month:'long', year:'numeric'}).toUpperCase()}</div><div class="calendar-grid">`;
    for (let i = 1; i <= days; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = "Data selecionada: " + selectedDate.split('-').reverse().join('/');
}

function selectDate(date) { selectedDate = date; renderCalendar(); renderAdminUI(); }

function createTask() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();
    if (!desc) return;

    db.tasks.push({ id: Date.now(), workerId: worker, date: selectedDate, desc, status: 'Pendente' });
    save(); renderAdminUI();
    document.getElementById('task-desc').value = "";
}

function renderAdminUI() {
    const acc = document.getElementById('worker-accordion');
    acc.innerHTML = '';
    const sel = document.getElementById('assign-to');
    sel.innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    for (let k in db.team) {
        const tasks = db.tasks.filter(t => t.workerId === k && t.date === selectedDate);
        const content = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - ${t.status}</div>`).join('') || 'Sem tarefas.';
        acc.innerHTML += `<div class="worker-card"><div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div><div class="worker-content hidden">${content}</div></div>`;
    }
}

// ================= FUNCIONÁRIO =================
function renderWorkerUI() {
    const hoje = getTodayString();
    // Filtro rigoroso por ID do funcionário e DATA exata
    const tasks = db.tasks.filter(t => t.workerId === currentUserKey && t.date === hoje);
    const list = document.getElementById('worker-task-list');
    document.getElementById('display-worker-name').innerText = db.team[currentUserKey].name;

    if (!tasks.length) {
        list.innerHTML = `<div class="card" style="text-align:center">Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</div>`;
        return;
    }

    list.innerHTML = tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: ${t.status}</p>
            ${t.status === 'Pendente' ? `<button class="btn-adm" onclick="finishTask(${t.id})">CONCLUIR</button>` : '✅'}
        </div>`).join('');
}

function finishTask(id) {
    const t = db.tasks.find(x => x.id === id);
    if(t) t.status = 'Concluída';
    save(); renderWorkerUI();
}

// ================= RELATÓRIO =================
function generateReport() {
    const tasks = db.tasks.filter(t => t.date === selectedDate);
    let r = `📋 *BELIZE RDT - ${selectedDate.split('-').reverse().join('/')}*\n`;
    Object.keys(db.team).forEach(k => {
        const wt = tasks.filter(t => t.workerId === k);
        if (wt.length) {
            r += `\n👤 *${db.team[k].name.toUpperCase()}*\n`;
            wt.forEach(t => r += `${t.status === 'Concluída' ? '✅' : '⏳'} ${t.desc}\n`);
        }
    });
    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`, '_blank');
}
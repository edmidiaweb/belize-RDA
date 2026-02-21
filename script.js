// ================= CONFIGURAÇÕES E BANCO =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v400'; // Versão nova para evitar conflitos antigos

let currentViewDate = new Date();
let currentUserKey = null;

// Função para obter a data no formato YYYY-MM-DD sem erros de fuso
function getFixedDate() {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

let selectedDate = getFixedDate();

// Inicialização do Banco de Dados
let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    team: {
        "lucas": { name: "Lucas", pass: "123" },
        "gamarra": { name: "Gamarra", pass: "123" },
        "mateus": { name: "Mateus", pass: "123" },
        "luis": { name: "Luis", pass: "123" }
    },
    tasks: []
};

function save() {
    localStorage.setItem(DB_NAME, JSON.stringify(db));
}

// ================= INTERFACE E TEMA =================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('belize_theme', isDark ? 'dark' : 'light');
}

// Carregar tema salvo ao iniciar
(function() {
    if (localStorage.getItem('belize_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

function showScreen(id) {
    const screens = ['login-screen', 'admin-panel', 'worker-panel', 'rest-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
}

// ================= LOGIN =================
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    // Login Admin Simplificado (sem hash para evitar erro de HTTPS)
    if (u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel');
        renderCalendar();
        renderAdminUI();
        return;
    }

    // Login Funcionários (Lucas, Gamarra, Mateus, Luis)
    if (db.team[u] && db.team[u].pass === p) {
        currentUserKey = u;
        showScreen('worker-panel');
        renderWorkerUI();
    } else {
        alert("Usuário ou senha incorretos.");
    }
}

// ================= ADMIN (CALENDÁRIO E TAREFAS) =================
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `<div class="cal-header">${currentViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;

    for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dStr}')">${i}</div>`;
    }

    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = "Data Selecionada: " + selectedDate.split('-').reverse().join('/');
}

function selectDate(date) {
    selectedDate = date;
    renderCalendar();
    renderAdminUI();
}

function changeMonth(dir) {
    currentViewDate.setMonth(currentViewDate.getMonth() + dir);
    renderCalendar();
}

function createTask() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value.trim();

    if (!desc) return alert("Descreva a tarefa.");

    db.tasks.push({
        id: Date.now(),
        workerId: worker,
        date: selectedDate,
        desc: desc,
        status: 'Pendente'
    });

    save();
    renderAdminUI();
    document.getElementById('task-desc').value = "";
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    if (!accordion) return;
    accordion.innerHTML = '';

    const sel = document.getElementById('assign-to');
    if (sel) {
        sel.innerHTML = Object.keys(db.team)
            .map(k => `<option value="${k}">${db.team[k].name}</option>`)
            .join('');
    }

    for (let k in db.team) {
        const tasks = db.tasks.filter(t => t.workerId === k && t.date === selectedDate);
        const content = tasks.length 
            ? tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - ${t.status}</div>`).join('')
            : '<p style="padding:10px; font-size:0.75rem; opacity:0.6">Sem atividades.</p>';

        accordion.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    ${db.team[k].name} ▾
                </div>
                <div class="worker-content hidden">${content}</div>
            </div>`;
    }
}

// ================= FUNCIONÁRIO (PAINEL DO LUCAS) =================
function renderWorkerUI() {
    const hoje = getFixedDate();
    const tasks = db.tasks.filter(t => t.workerId === currentUserKey && t.date === hoje);
    const list = document.getElementById('worker-task-list');
    
    document.getElementById('display-worker-name').innerText = db.team[currentUserKey].name;

    if (tasks.length === 0) {
        list.innerHTML = `
            <div class="card" style="text-align:center; opacity:0.7">
                <p>Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</p>
            </div>`;
        return;
    }

    list.innerHTML = tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: <b>${t.status}</b></p>
            ${t.status === 'Pendente' 
                ? `<button class="btn-adm" onclick="finishTask(${t.id})">CONCLUIR TAREFA</button>` 
                : '✅ Concluída'}
        </div>`).join('');
}

function finishTask(id) {
    const task = db.tasks.find(t => t.id === id);
    if (task) {
        task.status = 'Concluída';
        save();
        renderWorkerUI();
    }
}

// ================= RELATÓRIOS E WHATSAPP =================
function generateReport() {
    const tasks = db.tasks.filter(t => t.date === selectedDate);
    if (!tasks.length) return alert("Nenhuma tarefa neste dia.");

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
    const text = document.getElementById('report-text').value;
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(text)}`, '_blank');
}
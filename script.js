// ================= CONFIG =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v350'; // Nova versão para resetar o cache

let currentViewDate = new Date();
let currentUserKey = null;

// Função de data robusta (YYYY-MM-DD)
function getFixedDate() {
    const d = new Date();
    return d.toISOString().split('T')[0]; 
}

let selectedDate = getFixedDate();

// Feriados Itanhaém 2026
const holidays = {
    "01-01": "Confraternização Universal", "01-20": "São Sebastião",
    "02-16": "Carnaval", "02-17": "Carnaval", "04-03": "Sexta-feira Santa",
    "04-21": "Tiradentes", "04-22": "Aniversário Itanhaém", "05-01": "Dia do Trabalho",
    "06-04": "Corpus Christi", "07-09": "Revolução Constitucionalista",
    "09-07": "Independência", "10-12": "Nossa Sra. Aparecida", "11-02": "Finados",
    "11-15": "Proclamação República", "11-20": "Consciência Negra", "12-25": "Natal"
};

// ================= BANCO =================
let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    team: {
        "lucas": { name: "Lucas", pass: "123" },
        "gamarra": { name: "Gamarra", pass: "123" },
        "mateus": { name: "Mateus", pass: "123" },
        "luis": { name: "Luis", pass: "123" }
    },
    tasks: []
};

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));

// ================= LOGIN (SIMPLIFICADO) =================
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    // LOGIN ADMIN (Acesso Direto)
    if (u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel');
        renderCalendar();
        renderAdminUI();
        return;
    }

    // LOGIN FUNCIONÁRIO
    if (db.team[u] && db.team[u].pass === p) {
        currentUserKey = u;
        showScreen('worker-panel');
        renderWorkerUI();
    } else {
        alert("Usuário ou senha inválidos.");
    }
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel', 'rest-screen'].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

// ================= CALENDÁRIO =================
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    let html = `<div class="cal-header">${currentViewDate.toLocaleDateString('pt-BR', {month:'long', year:'numeric'}).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;

    for (let i = 1; i <= days; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const hol = holidays[`${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`];
        
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''} ${hol ? 'holiday' : ''}" 
                 onclick="selectDate('${dStr}')">${i}${hol ? '<span class="dot"></span>' : ''}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = "Data: " + selectedDate.split('-').reverse().join('/');
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

// ================= ADMIN =================
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
    alert("Tarefa enviada!");
}

function renderAdminUI() {
    const acc = document.getElementById('worker-accordion');
    if (!acc) return;
    acc.innerHTML = '';

    const sel = document.getElementById('assign-to');
    sel.innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    for (let k in db.team) {
        const tasks = db.tasks.filter(t => t.workerId === k && t.date === selectedDate);
        const content = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - ${t.status}</div>`).join('') || 'Sem tarefas.';
        
        acc.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    ${db.team[k].name} ▾
                </div>
                <div class="worker-content hidden">${content}</div>
            </div>`;
    }
}

// ================= FUNCIONÁRIO (LUCAS) =================
function renderWorkerUI() {
    const hoje = getFixedDate();
    const tasks = db.tasks.filter(t => t.workerId === currentUserKey && t.date === hoje);
    const list = document.getElementById('worker-task-list');
    document.getElementById('display-worker-name').innerText = db.team[currentUserKey].name;

    if (tasks.length === 0) {
        list.innerHTML = `<div class="card" style="text-align:center">Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</div>`;
    } else {
        list.innerHTML = tasks.map(t => `
            <div class="card">
                <h3>${t.desc}</h3>
                <p>Status: ${t.status}</p>
                ${t.status === 'Pendente' ? `<button class="btn-adm" onclick="finishTask(${t.id})">FINALIZAR</button>` : '✅ Concluída'}
            </div>`).join('');
    }
}

function finishTask(id) {
    const task = db.tasks.find(t => t.id === id);
    if (task) {
        task.status = 'Concluída';
        save();
        renderWorkerUI();
    }
}

// ================= TEMA E WHATSAPP =================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

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
    const text = document.getElementById('report-text').value;
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(text)}`, '_blank');
}
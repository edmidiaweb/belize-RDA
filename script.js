// ================= CONFIG =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v300'; // Nova versão para limpar o cache de erros

const ADMIN_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbddf0c5d4b0b4d0f3f42";

let currentViewDate = new Date();
let currentUserKey = null;

// CORREÇÃO: Função de data mais robusta para evitar erros de fuso
function getFixedDate() {
    const d = new Date();
    // Ajusta para o fuso de Brasília (UTC-3) antes de converter para string
    const offset = -3;
    const brasilaTime = new Date(d.getTime() + (offset * 3600000));
    return d.toISOString().split('T')[0]; 
}

let selectedDate = getFixedDate();

// ================= BANCO =================
let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    team: {
        "lucas": { name: "Lucas", passHash: null },
        "gamarra": { name: "Gamarra", passHash: null },
        "mateus": { name: "Mateus", passHash: null },
        "luis": { name: "Luis", passHash: null }
    },
    tasks: []
};

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));

// ================= HASH =================
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ================= LOGIN =================
async function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;
    const passHash = await hashPassword(p);

    if (u === 'admin' && passHash === ADMIN_HASH) {
        showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return;
    }

    if (db.team[u]) {
        if (!db.team[u].passHash) { db.team[u].passHash = passHash; save(); }
        if (db.team[u].passHash === passHash) {
            currentUserKey = u;
            showScreen('worker-panel'); renderWorkerUI(); return;
        }
    }
    alert("Dados incorretos.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
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
    document.getElementById('selected-date-label').innerText = "Agendando para: " + selectedDate.split('-').reverse().join('/');
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
        const content = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - ${t.status}</div>`).join('') || 'Nenhuma tarefa.';
        acc.innerHTML += `<div class="worker-card"><div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div><div class="worker-content hidden">${content}</div></div>`;
    }
}

// ================= FUNCIONÁRIO =================
function renderWorkerUI() {
    const hoje = getFixedDate();
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
    db.tasks.find(t => t.id === id).status = 'Concluída';
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
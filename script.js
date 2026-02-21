// ================= CONFIG =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v220';

// SHA-256 fixo da senha: admbelize2026
const ADMIN_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbddf0c5d4b0b4d0f3f42";

let currentViewDate = new Date();
let selectedDate = getLocalDateString();
let currentUserKey = null;

// ================= DATA LOCAL =================
function getLocalDateString() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// ================= HASH SHA-256 =================
async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle)
        throw new Error("Crypto API não disponível. Use localhost ou HTTPS.");

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ================= BANCO =================
let db = JSON.parse(localStorage.getItem(DB_NAME));

if (!db) {
    db = {
        team: {
            "lucas": { name: "Lucas", passHash: null },
            "gamarra": { name: "Gamarra", passHash: null },
            "mateus": { name: "Mateus", passHash: null },
            "luis": { name: "Luis", passHash: null }
        },
        tasks: [],
        reports: {}
    };
}

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));

// ================= MIGRAÇÃO DO MODELO ANTIGO =================
(function migrateOldVersion() {
    const old = JSON.parse(localStorage.getItem('belize_rdt_v150'));
    if (!old || db.tasks.length) return;

    for (let key in old.team) {
        if (!db.team[key]) continue;

        old.team[key].tasks.forEach(t => {
            db.tasks.push({
                id: t.id,
                workerId: key,
                date: t.date,
                desc: t.desc,
                status: t.status
            });
        });
    }
    save();
})();

// ================= LOGIN =================
async function handleLogin() {
    try {
        const u = document.getElementById('login-user').value.trim().toLowerCase();
        const p = document.getElementById('login-pass').value;

        if (!u || !p)
            return alert("Preencha usuário e senha.");

        const passHash = await hashPassword(p);

        // ===== ADMIN =====
        if (u === 'admin') {
            if (passHash === ADMIN_HASH) {
                showScreen('admin-panel');
                renderCalendar();
                renderAdminUI();
                return;
            }
            return alert("Senha admin incorreta.");
        }

        // ===== FUNCIONÁRIO =====
        if (!db.team[u])
            return alert("Usuário não encontrado.");

        if (!db.team[u].passHash) {
            db.team[u].passHash = passHash;
            save();
        }

        if (db.team[u].passHash !== passHash)
            return alert("Senha incorreta.");

        currentUserKey = u;
        showScreen('worker-panel');
        renderWorkerUI();

    } catch (err) {
        console.error(err);
        alert("Erro no login. Use localhost ou HTTPS.");
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
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `<div class="cal-header">${currentViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;

    for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;

        html += `
            <div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''}"
                onclick="selectDate('${dStr}')">
                ${i}
            </div>`;
    }

    container.innerHTML = html + `</div>`;
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

    if (!worker || !db.team[worker])
        return alert("Funcionário inválido.");

    if (!desc)
        return alert("Descreva a tarefa.");

    db.tasks.push({
        id: Date.now(),
        workerId: worker,
        date: selectedDate,
        desc,
        status: 'Pendente'
    });

    save();
    renderAdminUI();
    document.getElementById('task-desc').value = "";
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';

    const sel = document.getElementById('assign-to');
    sel.innerHTML = Object.keys(db.team)
        .map(k => `<option value="${k}">${db.team[k].name}</option>`)
        .join('');

    for (let k in db.team) {
        const tasks = db.tasks.filter(t => t.workerId === k && t.date === selectedDate);

        const content = tasks.length
            ? tasks.map(t =>
                `<div class="task-item">
                    <b>${t.desc}</b> - <small>${t.status}</small>
                </div>`).join('')
            : '<p style="padding:10px;font-size:0.7rem">Nenhuma tarefa.</p>';

        accordion.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    ${db.team[k].name} ▾
                </div>
                <div class="worker-content hidden">${content}</div>
            </div>`;
    }
}

// ================= FUNCIONÁRIO =================
function renderWorkerUI() {
    if (!currentUserKey || !db.team[currentUserKey])
        return alert("Usuário inválido.");

    const hoje = getLocalDateString();

    const tasks = db.tasks.filter(t =>
        t.workerId === currentUserKey &&
        t.date === hoje
    );

    const list = document.getElementById('worker-task-list');

    if (!tasks.length) {
        list.innerHTML = `
            <div class="card" style="text-align:center; opacity:0.7">
                <p>Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</p>
                <small>As tarefas aparecem apenas no dia programado.</small>
            </div>`;
        return;
    }

    list.innerHTML = tasks.map(t => `
        <div class="card">
            <h3>${t.desc}</h3>
            <p>Status: <b>${t.status}</b></p>
            ${t.status === 'Pendente'
                ? `<button class="btn-adm" onclick="finishTask(${t.id})">MARCAR COMO CONCLUÍDO</button>`
                : '✅ Concluída'}
        </div>
    `).join('');
}

function finishTask(id) {
    const task = db.tasks.find(t => t.id === id);
    if (!task) return alert("Tarefa não encontrada.");

    task.status = 'Concluída';
    save();
    renderWorkerUI();
}

// ================= RELATÓRIO =================
function generateReport() {
    const tasks = db.tasks.filter(t => t.date === selectedDate);

    if (!tasks.length)
        return alert("Nenhuma tarefa nesse dia.");

    let r = `📋 *BELIZE RDT - ${selectedDate.split('-').reverse().join('/')}*\n`;

    Object.keys(db.team).forEach(worker => {
        const workerTasks = tasks.filter(t => t.workerId === worker);
        if (!workerTasks.length) return;

        r += `\n👤 *${db.team[worker].name.toUpperCase()}*\n`;
        workerTasks.forEach(t => {
            r += `${t.status === 'Concluída' ? '✅' : '⏳'} ${t.desc}\n`;
        });
    });

    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    const text = document.getElementById('report-text').value;
    if (!text) return;

    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(text)}`, '_blank');

    db.reports[selectedDate] = {
        sent: true,
        sentAt: Date.now()
    };

    db.tasks = db.tasks.filter(t =>
        !(t.date === selectedDate && t.status === 'Concluída')
    );

    save();

    alert("Relatório enviado e tarefas concluídas removidas.");
    renderAdminUI();
}
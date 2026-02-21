// ================= CONFIG =================
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v200';

let currentViewDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];
let currentUserKey = null;

// ================= HASH (SHA-256) =================
async function hashPassword(password) {
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
        team: {},
        tasks: [],
        reports: {}
    };
}

// ===== MIGRAÇÃO AUTOMÁTICA DO MODELO ANTIGO =====
function migrateIfNeeded() {
    if (db.adminTasks !== undefined || Object.values(db.team || {}).some(u => u.tasks)) {
        const old = JSON.parse(localStorage.getItem('belize_rdt_v150'));
        if (old) {
            const newDB = {
                team: {},
                tasks: [],
                reports: {}
            };

            for (let key in old.team) {
                newDB.team[key] = {
                    name: old.team[key].name,
                    passHash: null
                };

                old.team[key].tasks.forEach(t => {
                    newDB.tasks.push({
                        id: t.id,
                        workerId: key,
                        date: t.date,
                        desc: t.desc,
                        status: t.status
                    });
                });
            }

            db = newDB;
            save();
        }
    }
}
migrateIfNeeded();

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));

// ================= LOGIN =================
async function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if (!u || !p) return alert("Preencha usuário e senha.");

    // ADMIN
    if (u === 'admin') {
        const adminHash = await hashPassword("admbelize2026");
        if ((await hashPassword(p)) === adminHash) {
            showScreen('admin-panel');
            renderCalendar();
            renderAdminUI();
            return;
        }
    }

    // FUNCIONÁRIO
    const user = db.team[u];
    if (!user) return alert("Usuário não encontrado.");

    const passHash = await hashPassword(p);

    if (!user.passHash) {
        // Primeira vez → salva hash
        user.passHash = passHash;
        save();
    }

    if (user.passHash !== passHash)
        return alert("Senha incorreta.");

    currentUserKey = u;
    showScreen('worker-panel');
    renderWorkerUI();
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
    const hoje = new Date().toISOString().split('T')[0];
    const list = document.getElementById('worker-task-list');

    const tasks = db.tasks.filter(t =>
        t.workerId === currentUserKey &&
        t.date === hoje
    );

    if (!tasks.length) {
        list.innerHTML = `<div class="card">Nenhuma tarefa para hoje.</div>`;
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

    // Marca relatório como enviado
    db.reports[selectedDate] = {
        sent: true,
        sentAt: Date.now()
    };

    // Remove tarefas concluídas desse dia
    db.tasks = db.tasks.filter(t =>
        !(t.date === selectedDate && t.status === 'Concluída')
    );

    save();

    alert("Relatório enviado e tarefas concluídas removidas.");
    renderAdminUI();
}
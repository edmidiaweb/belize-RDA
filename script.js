// --- TEMA (MODO NOTURNO) ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('belize_theme', isDark ? 'dark' : 'light');
}

(function initTheme() {
    if (localStorage.getItem('belize_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v90';
let selectedDate = new Date().toISOString().split('T')[0];

let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    adminTasks: [],
    team: {
        "lucas": { name: "Lucas", pass: "123", tasks: [] },
        "gamarra": { name: "Gamarra", pass: "123", tasks: [] },
        "mateus": { name: "Mateus", pass: "123", tasks: [] },
        "luis": { name: "Luis", pass: "123", tasks: [] }
    }
};

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));
const getNowTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// --- CALENDÁRIO ---
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let html = `<div class="calendar-grid">`;
    for(let i = 1; i <= daysInMonth; i++) {
        const dStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = `Visualizando: ${new Date(selectedDate + "T12:00:00").toLocaleDateString('pt-BR')}`;
}

function selectDate(date) { selectedDate = date; renderCalendar(); renderAdminUI(); }

// --- LOGIN ---
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;
    if(u === 'admin' && p === 'admbelize2026') { showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return; }
    if(db.team[u] && db.team[u].pass === p) { window.currentUserKey = u; showScreen('worker-panel'); renderWorkerUI(); } 
    else alert("Dados inválidos.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- ADMIN: TAREFAS ---
function saveAdminTask() {
    const desc = document.getElementById('admin-task-desc').value;
    if(!desc) return alert("Descreva a atividade.");
    const file = document.getElementById('admin-photo-input').files[0];
    const obs = document.getElementById('admin-task-obs').value;

    const execute = (img = null) => {
        db.adminTasks.push({ id: Date.now(), date: selectedDate, desc: "ADMIN: " + desc, obs, photo: img, time: getNowTime() });
        save(); alert("Salvo!"); 
        document.getElementById('admin-task-desc').value = ""; renderAdminUI();
    };
    if(file) { const reader = new FileReader(); reader.onload = (e) => execute(e.target.result); reader.readAsDataURL(file); } 
    else execute();
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';
    document.getElementById('assign-to').innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    // Lista tarefas do Admin
    const myTasks = db.adminTasks.filter(t => t.date === selectedDate);
    if(myTasks.length) {
        let h = myTasks.map(t => `<div class="task-item"><b>${t.desc}</b><br><small>${t.time} | ${t.obs || ''}</small></div>`).join('');
        accordion.innerHTML += `<div class="worker-card"><div class="worker-header" style="background:var(--belize);color:white">Minhas Atividades (Admin)</div><div class="worker-content">${h}</div></div>`;
    }

    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate);
        let h = tasks.map(t => `
            <div class="task-item">
                <div style="display:flex;justify-content:space-between"><b>${t.desc}</b><small>${t.status}</small></div>
                <div style="margin-top:5px"><span class="time-badge">${t.start || '--'} às ${t.end || '--'}</span></div>
                <div style="margin-top:8px;display:flex;gap:5px">
                    <button class="btn-small" onclick="editTask('${k}',${t.id})">EDITAR</button>
                    <button class="btn-small" style="color:red" onclick="deleteTask('${k}',${t.id})">EXCLUIR</button>
                </div>
            </div>`).join('') || '<p style="padding:10px;font-size:0.7rem">Sem tarefas agendadas.</p>';
        accordion.innerHTML += `<div class="worker-card"><div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div><div class="worker-content hidden">${h}</div></div>`;
    }
}

function createTask() {
    const k = document.getElementById('assign-to').value;
    const d = document.getElementById('task-desc').value;
    if(!d) return;
    db.team[k].tasks.push({ id: Date.now(), date: selectedDate, desc: d, status: 'Pendente', start: null, end: null, photo: null });
    save(); renderAdminUI(); document.getElementById('task-desc').value = "";
}

function editTask(k, id) {
    const t = db.team[k].tasks.find(x => x.id === id);
    const n = prompt("Nova descrição:", t.desc);
    if(n) { t.desc = n; save(); renderAdminUI(); }
}

function deleteTask(k, id) {
    if(confirm("Excluir tarefa?")) { db.team[k].tasks = db.team[k].tasks.filter(x => x.id !== id); save(); renderAdminUI(); }
}

// --- TRABALHADOR ---
function renderWorkerUI() {
    const u = window.currentUserKey;
    document.getElementById('display-worker-name').innerText = db.team[u].name;
    const hoje = new Date().toISOString().split('T')[0];
    const tasks = db.team[u].tasks.filter(t => t.date === hoje);
    const active = tasks.find(t => t.status === 'Em Andamento');
    const area = document.getElementById('active-task-area');
    const list = document.getElementById('worker-task-list');

    list.innerHTML = ''; area.innerHTML = '';
    if(active) {
        area.classList.remove('hidden');
        area.innerHTML = `<div class="card"><h3>${active.desc}</h3><input type="file" id="p-in" capture="environment"><textarea id="t-obs" placeholder="Observações (opcional)"></textarea><button class="btn-success" onclick="finishTask(${active.id})">FINALIZAR SERVIÇO</button></div>`;
    } else {
        area.classList.add('hidden');
        tasks.filter(t => t.status === 'Pendente').forEach(t => {
            list.innerHTML += `<div class="card"><b>${t.desc}</b><button class="btn-adm" onclick="startTask(${t.id})" style="margin-top:10px">INICIAR</button></div>`;
        });
    }
}

function startTask(id) {
    const t = db.team[window.currentUserKey].tasks.find(x => x.id === id);
    t.status = 'Em Andamento'; t.start = getNowTime(); save(); renderWorkerUI();
}

function finishTask(id) {
    const t = db.team[window.currentUserKey].tasks.find(x => x.id === id);
    const f = document.getElementById('p-in').files[0];
    const done = (img = null) => {
        t.status = 'Concluída'; t.end = getNowTime(); t.photo = img; t.obs = document.getElementById('t-obs').value;
        save(); alert("Finalizado!"); renderWorkerUI();
    };
    if(f) { const r = new FileReader(); r.onload = (e) => done(e.target.result); r.readAsDataURL(f); } else done();
}

function generateReport() {
    let rep = `📋 *BELIZE RDT - ${new Date(selectedDate + "T12:00:00").toLocaleDateString()}*\\n`;
    db.adminTasks.filter(t => t.date === selectedDate).forEach(t => rep += `\\n🛠️ ADMIN: ${t.desc.replace("ADMIN: ","")}\\n⏱ ${t.time}\\n`);
    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate && t.status === 'Concluída');
        if(tasks.length) {
            rep += `\\n👤 *${db.team[k].name.toUpperCase()}*\\n`;
            tasks.forEach(t => rep += `✅ ${t.desc}\\n⏱ ${t.start} - ${t.end}\\n`);
        }
    }
    document.getElementById('report-text').value = rep;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`, '_blank');
}
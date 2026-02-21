const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v120'; // Versão atualizada para sincronia total

let currentViewDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];

let db = JSON.parse(localStorage.getItem(DB_NAME)) || {
    team: {
        "lucas": { name: "Lucas", pass: "123", tasks: [] },
        "gamarra": { name: "Gamarra", pass: "123", tasks: [] },
        "mateus": { name: "Mateus", pass: "123", tasks: [] },
        "luis": { name: "Luis", pass: "123", tasks: [] }
    }
};

const save = () => localStorage.setItem(DB_NAME, JSON.stringify(db));

// --- EXPEDIENTE ---
function isWorkHours() {
    const agora = new Date();
    const dia = agora.getDay(); 
    const hora = agora.getHours();
    if (dia === 0) return false; 
    if (dia >= 1 && dia <= 5) return hora >= 8 && hora < 17;
    if (dia === 6) return hora >= 8 && hora < 23; // Sábado até 23h para testes
    return false;
}

// --- TEMA ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

(function init() {
    if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');
})();

// --- CALENDÁRIO ---
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if(!container) return;
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Mostrar setas se for última semana do mês
    if (new Date().getDate() > 24) document.getElementById('month-nav').classList.remove('hidden');

    let html = `<div class="calendar-grid">`;
    for(let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''}" onclick="selectDate('${dStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = "Data: " + selectedDate.split('-').reverse().join('/');
}

function selectDate(date) { selectedDate = date; renderCalendar(); renderAdminUI(); }
function changeMonth(dir) { currentViewDate.setMonth(currentViewDate.getMonth() + dir); renderCalendar(); }

// --- LOGIN ---
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if(u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return;
    }

    if(db.team[u] && db.team[u].pass === p) {
        if(!isWorkHours()) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('rest-screen').classList.remove('hidden');
            document.getElementById('rest-message').innerText = "Curta sua família e aproveite os momentos preciosos da vida. Não se preocupe com o amanhã!";
        } else {
            window.currentUserKey = u;
            showScreen('worker-panel'); renderWorkerUI();
        }
    } else alert("Usuário ou senha incorretos.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel', 'rest-screen'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- ADMIN ---
function createTask() {
    const k = document.getElementById('assign-to').value;
    const d = document.getElementById('task-desc').value;
    if(!d) return alert("Descreva a tarefa");
    db.team[k].tasks.push({ id: Date.now(), date: selectedDate, desc: d, status: 'Pendente' });
    save(); renderAdminUI(); document.getElementById('task-desc').value = "";
    alert("Tarefa agendada!");
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';
    document.getElementById('assign-to').innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate);
        let h = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - ${t.status}</div>`).join('') || 'Sem tarefas.';
        accordion.innerHTML += `<div class="worker-card"><div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div><div class="worker-content hidden">${h}</div></div>`;
    }
}

// --- FUNCIONÁRIO ---
function renderWorkerUI() {
    const u = window.currentUserKey;
    document.getElementById('display-worker-name').innerText = db.team[u].name;
    const hoje = new Date().toISOString().split('T')[0];
    const tasks = db.team[u].tasks.filter(t => t.date === hoje);
    const list = document.getElementById('worker-task-list');
    
    if(tasks.length === 0) {
        list.innerHTML = `<div class="card" style="text-align:center; opacity:0.6">
            <p>Nenhuma tarefa para hoje (${hoje.split('-').reverse().join('/')})</p>
        </div>`;
    } else {
        list.innerHTML = tasks.map(t => `<div class="card"><b>${t.desc}</b><br><small>Status: ${t.status}</small></div>`).join('');
    }
}

function generateReport() {
    let r = `📋 *BELIZE RDT - ${selectedDate}*\\n`;
    for(let k in db.team) {
        const done = db.team[k].tasks.filter(t => t.date === selectedDate);
        if(done.length) {
            r += `\\n👤 *${db.team[k].name.toUpperCase()}*\\n`;
            done.forEach(t => r += `✅ ${t.desc}\\n`);
        }
    }
    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`, '_blank');
}
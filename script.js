const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v120'; // Versão resetada para limpar erros de fuso

let currentViewDate = new Date();
// Força a data selecionada para o formato ISO puro (YYYY-MM-DD)
let selectedDate = new Date().toISOString().split('T')[0];

const holidays = {
    "01-01": "Confraternização Universal", "01-20": "São Sebastião",
    "02-16": "Carnaval", "02-17": "Carnaval", "04-03": "Sexta-feira Santa",
    "04-21": "Tiradentes", "04-22": "Aniversário Itanhaém", "05-01": "Dia do Trabalho",
    "06-04": "Corpus Christi", "07-09": "Revolução Constitucionalista",
    "09-07": "Independência", "10-12": "Nossa Sra. Aparecida", "11-02": "Finados",
    "11-15": "Proclamação República", "11-20": "Consciência Negra", "12-25": "Natal"
};

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

// --- EXPEDIENTE ---
function isWorkHours() {
    const agora = new Date();
    const dia = agora.getDay(); 
    const hora = agora.getHours();
    if (dia === 0) return false; 
    if (dia >= 1 && dia <= 5) return hora >= 8 && hora < 17;
    if (dia === 6) return hora >= 8 && hora < 23; // Horário de teste para Sábado
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
    
    let html = `<div style="text-align:center; margin-bottom:10px; font-weight:bold; color:var(--belize)">
                ${currentViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;
    for(let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const hol = holidays[`${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`];
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''} ${hol ? 'holiday' : ''}" onclick="selectDate('${dStr}')">${i}</div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = `Agendando para: ${selectedDate.split('-').reverse().join('/')}`;
}

function selectDate(date) { selectedDate = date; renderCalendar(); renderAdminUI(); }

function changeMonth(dir) {
    currentViewDate.setMonth(currentViewDate.getMonth() + dir);
    renderCalendar();
}

// --- LOGIN ---
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;
    if(u === 'admin' && p === 'admbelize2026') { showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return; }
    if(db.team[u] && db.team[u].pass === p) {
        if(!isWorkHours()) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('rest-screen').classList.remove('hidden');
            document.getElementById('rest-message').innerText = "Bom descanso! Curta sua família e recarregue as energias.";
        } else {
            window.currentUserKey = u;
            showScreen('worker-panel'); renderWorkerUI();
        }
    } else alert("Acesso negado.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel', 'rest-screen'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- ADMIN ---
function createTask() {
    const k = document.getElementById('assign-to').value;
    const d = document.getElementById('task-desc').value;
    if(!d) return alert("Escreva a tarefa!");
    db.team[k].tasks.push({ id: Date.now(), date: selectedDate, desc: d, status: 'Pendente' });
    save(); renderAdminUI(); document.getElementById('task-desc').value = "";
    alert("Tarefa lançada para " + selectedDate);
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';
    document.getElementById('assign-to').innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate);
        let h = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - ${t.status}</div>`).join('') || '<p style="padding:10px; font-size:0.7rem">Nada para este dia.</p>';
        accordion.innerHTML += `<div class="worker-card"><div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div><div class="worker-content hidden">${h}</div></div>`;
    }
}

// --- FUNCIONÁRIO (A CORREÇÃO ESTÁ AQUI) ---
function renderWorkerUI() {
    const u = window.currentUserKey;
    document.getElementById('display-worker-name').innerText = db.team[u].name;
    
    // Pega a data de hoje formatada exatamente como o Admin salva
    const agora = new Date();
    const hojeParaFiltro = agora.getFullYear() + '-' + String(agora.getMonth() + 1).padStart(2, '0') + '-' + String(agora.getDate()).padStart(2, '0');
    
    // Busca tarefas do dia
    const tasks = db.team[u].tasks.filter(t => t.date === hojeParaFiltro);
    const list = document.getElementById('worker-task-list');
    
    if(tasks.length === 0) {
        list.innerHTML = `<div class="card" style="text-align:center; opacity:0.7">
            <p>Nenhuma tarefa para hoje (${hojeParaFiltro.split('-').reverse().join('/')})</p>
            <small>Fale com o encarregado caso isso esteja errado.</small>
        </div>`;
    } else {
        list.innerHTML = tasks.map(t => `
            <div class="card">
                <b>${t.desc}</b><br>
                <small>Status: ${t.status}</small>
                ${t.status === 'Pendente' ? `<button class="btn-adm" style="margin-top:10px" onclick="updateStatus('${u}', ${t.id})">CONCLUIR</button>` : ''}
            </div>`).join('');
    }
}

function updateStatus(u, id) {
    const t = db.team[u].tasks.find(x => x.id === id);
    t.status = 'Concluída';
    save(); renderWorkerUI();
}
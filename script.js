const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v100';

let currentViewDate = new Date();
let selectedDate = new Date().toLocaleDateString('en-CA');

// Feriados Itanhaém 2026 (Nacionais + Municipais)
const holidays = {
    "01-01": "Confraternização Universal",
    "01-20": "São Sebastião (Padroeiro de Itanhaém)",
    "02-16": "Carnaval",
    "02-17": "Carnaval",
    "04-03": "Sexta-feira Santa",
    "04-21": "Tiradentes",
    "04-22": "Aniversário de Itanhaém",
    "05-01": "Dia do Trabalho",
    "06-04": "Corpus Christi",
    "07-09": "Revolução Constitucionalista",
    "09-07": "Independência do Brasil",
    "10-12": "Nossa Sra. Aparecida",
    "11-02": "Finados",
    "11-15": "Proclamação da República",
    "11-20": "Consciência Negra",
    "12-25": "Natal"
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

// --- LÓGICA DE EXPEDIENTE ---
function isWorkHours() {
    const agora = new Date();
    const dia = agora.getDay(); // 0=Dom, 1=Seg...
    const hora = agora.getHours();
    
    if (dia === 0) return false; // Domingo Folga
    if (dia >= 1 && dia <= 5) { // Seg a Sex: 8h às 17h
        return hora >= 8 && hora < 17;
    }
    if (dia === 6) { // Sabado: 8h às 12h
        return hora >= 8 && hora < 12;
    }
    return false;
}

function showRestMessage() {
    const messages = [
        "O trabalho termina aqui, mas a vida continua lá fora. Não se preocupe com o amanhã, aproveite o hoje com sua família!",
        "Momentos preciosos são aqueles que passamos com quem amamos. Descanse, recarregue as energias e curta sua casa.",
        "Você deu o seu melhor hoje! Agora é hora de ser apenas você. Aproveite cada segundo desse descanso merecido.",
        "O expediente acabou. Que tal um tempo de qualidade com a família? O amanhã a gente resolve amanhã!"
    ];
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('rest-screen').classList.remove('hidden');
    document.getElementById('rest-message').innerText = messages[Math.floor(Math.random() * messages.length)];
}

// --- TEMA E INICIALIZAÇÃO ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

(function init() {
    if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');
})();

// --- CALENDÁRIO COM NAVEGAÇÃO E FERIADOS ---
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const nav = document.getElementById('month-nav');
    if(!container) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Regra da última semana: Se hoje for dia > 24, mostra setas de navegação
    const hojeReal = new Date();
    if (hojeReal.getDate() > 24) nav.classList.remove('hidden');

    let html = `<div style="text-align:center; margin-bottom:10px; font-weight:bold; color:var(--belize)">
                ${currentViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;
    
    for(let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const holidayKey = `${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isHoliday = holidays[holidayKey];
        const isSelected = dStr === selectedDate;
        
        html += `<div class="cal-day ${isSelected ? 'selected-day' : ''} ${isHoliday ? 'holiday' : ''}" 
                 onclick="selectDate('${dStr}')" title="${isHoliday || ''}">
                 ${i}${isHoliday ? '<span class="dot"></span>' : ''}
                 </div>`;
    }
    container.innerHTML = html + `</div>`;
    document.getElementById('selected-date-label').innerText = `Data: ${new Date(selectedDate + "T12:00:00").toLocaleDateString('pt-BR')}`;
}

function changeMonth(dir) {
    currentViewDate.setMonth(currentViewDate.getMonth() + dir);
    renderCalendar();
}

function selectDate(date) { selectedDate = date; renderCalendar(); renderAdminUI(); }

// --- LOGIN ---
function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;

    if(u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return;
    }

    if(db.team[u] && db.team[u].pass === p) {
        if(!isWorkHours()) {
            showRestMessage();
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

// --- FUNÇÕES DE GESTÃO (ADMIN) ---
function saveAdminTask() {
    const desc = document.getElementById('admin-task-desc').value;
    if(!desc) return;
    db.adminTasks.push({ id: Date.now(), date: selectedDate, desc: "ADMIN: " + desc, time: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) });
    save(); renderAdminUI(); document.getElementById('admin-task-desc').value = "";
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';
    const sel = document.getElementById('assign-to');
    if(sel) sel.innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    const adm = db.adminTasks.filter(t => t.date === selectedDate);
    if(adm.length) {
        let h = adm.map(t => `<div class="task-item"><b>${t.desc}</b> <small>(${t.time})</small></div>`).join('');
        accordion.innerHTML += `<div class="worker-card"><div class="worker-header" style="background:var(--belize);color:white">Minhas Atividades (Admin)</div><div class="worker-content">${h}</div></div>`;
    }

    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate);
        let h = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - <small>${t.status}</small></div>`).join('') || '<p style="font-size:0.7rem; padding:10px">Sem tarefas.</p>';
        accordion.innerHTML += `<div class="worker-card"><div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div><div class="worker-content hidden">${h}</div></div>`;
    }
}

function createTask() {
    const k = document.getElementById('assign-to').value;
    const d = document.getElementById('task-desc').value;
    if(!d) return;
    db.team[k].tasks.push({ id: Date.now(), date: selectedDate, desc: d, status: 'Pendente' });
    save(); renderAdminUI(); document.getElementById('task-desc').value = "";
}

// --- TRABALHADOR ---
function renderWorkerUI() {
    const u = window.currentUserKey;
    document.getElementById('display-worker-name').innerText = db.team[u].name;
    const hoje = new Date().toLocaleDateString('en-CA');
    const tasks = db.team[u].tasks.filter(t => t.date === hoje);
    const list = document.getElementById('worker-task-list');
    list.innerHTML = tasks.map(t => `<div class="card"><b>${t.desc}</b><br><small>Status: ${t.status}</small></div>`).join('') || '<p>Nenhuma tarefa para hoje.</p>';
}

function generateReport() {
    let r = `📋 *BELIZE RDT - ${new Date(selectedDate + "T12:00:00").toLocaleDateString()}*\\n`;
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
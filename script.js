// Configurações Gerais
const MY_PHONE = "5513996305218";
const DB_NAME = 'belize_rdt_v150'; // Versão atualizada para sincronia total

let currentViewDate = new Date();
// Define a data selecionada inicialmente como HOJE no formato YYYY-MM-DD
let selectedDate = new Date().toISOString().split('T')[0];
let currentUserKey = null;

// Feriados Itanhaém 2026 (Nacionais + Municipais)
const holidays = {
    "01-01": "Confraternização Universal",
    "01-20": "São Sebastião (Padroeiro)",
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

// Inicialização do Banco de Dados
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
    if (dia >= 1 && dia <= 5) return hora >= 8 && hora < 17; // Seg a Sex: 8h às 17h
    if (dia === 6) return hora >= 8 && hora < 23; // Sábado: 8h às 23h (Horário de teste solicitado)
    return false;
}

function showRestMessage() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('rest-screen').classList.remove('hidden');
    const msg = [
        "Não se preocupe com o amanhã, aproveite o hoje com sua família!",
        "Curta os momentos preciosos da vida. O trabalho pode esperar.",
        "Descanse e recarregue as energias. Bom descanso!"
    ];
    document.getElementById('rest-message').innerText = msg[Math.floor(Math.random() * msg.length)];
}

// --- TEMA (MODO NOTURNO) ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('belize_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

(function initTheme() {
    if (localStorage.getItem('belize_theme') === 'dark') document.body.classList.add('dark-mode');
})();

// --- CALENDÁRIO (ADMIN) ---
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const nav = document.getElementById('month-nav');
    if(!container) return;

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Mostra navegação de meses apenas na última semana (após dia 24)
    if (new Date().getDate() > 24) nav.classList.remove('hidden');

    let html = `<div class="cal-header">${currentViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</div>`;
    html += `<div class="calendar-grid">`;
    
    for(let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const holKey = `${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isHoliday = holidays[holKey];
        
        html += `<div class="cal-day ${dStr === selectedDate ? 'selected-day' : ''} ${isHoliday ? 'holiday' : ''}" 
                 onclick="selectDate('${dStr}')">
                 ${i}${isHoliday ? '<span class="dot"></span>' : ''}
                 </div>`;
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

    if(u === 'admin' && p === 'admbelize2026') {
        showScreen('admin-panel'); renderCalendar(); renderAdminUI(); return;
    }

    if(db.team[u] && db.team[u].pass === p) {
        if(!isWorkHours()) {
            showRestMessage();
        } else {
            currentUserKey = u;
            showScreen('worker-panel'); renderWorkerUI();
        }
    } else alert("Usuário ou senha incorretos.");
}

function showScreen(id) {
    ['login-screen', 'admin-panel', 'worker-panel', 'rest-screen'].forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

// --- FUNCIONALIDADES ADMIN ---
function createTask() {
    const worker = document.getElementById('assign-to').value;
    const desc = document.getElementById('task-desc').value;
    if(!desc) return alert("Escreva a tarefa!");

    // IMPORTANTE: Agora salva com a selectedDate (data clicada no calendário)
    db.team[worker].tasks.push({
        id: Date.now(),
        date: selectedDate,
        desc: desc,
        status: 'Pendente'
    });
    save();
    renderAdminUI();
    document.getElementById('task-desc').value = "";
    alert("Tarefa lançada para " + selectedDate.split('-').reverse().join('/'));
}

function renderAdminUI() {
    const accordion = document.getElementById('worker-accordion');
    accordion.innerHTML = '';
    
    const sel = document.getElementById('assign-to');
    if(sel) sel.innerHTML = Object.keys(db.team).map(k => `<option value="${k}">${db.team[k].name}</option>`).join('');

    for(let k in db.team) {
        const tasks = db.team[k].tasks.filter(t => t.date === selectedDate);
        let h = tasks.map(t => `<div class="task-item"><b>${t.desc}</b> - <small>${t.status}</small></div>`).join('') || '<p style="padding:10px; font-size:0.7rem">Nenhuma tarefa agendada.</p>';
        accordion.innerHTML += `
            <div class="worker-card">
                <div class="worker-header" onclick="this.nextElementSibling.classList.toggle('hidden')">${db.team[k].name} ▾</div>
                <div class="worker-content hidden">${h}</div>
            </div>`;
    }
}

// --- FUNCIONALIDADES FUNCIONÁRIO ---
function renderWorkerUI() {
    const u = currentUserKey;
    document.getElementById('display-worker-name').innerText = db.team[u].name;
    
    // Pega a data de HOJE no formato YYYY-MM-DD para o funcionário
    const agora = new Date();
    const hojeParaFiltro = agora.getFullYear() + '-' + String(agora.getMonth() + 1).padStart(2, '0') + '-' + String(agora.getDate()).padStart(2, '0');
    
    const tasks = db.team[u].tasks.filter(t => t.date === hojeParaFiltro);
    const list = document.getElementById('worker-task-list');
    
    if(tasks.length === 0) {
        list.innerHTML = `
            <div class="card" style="text-align:center; opacity:0.7">
                <p>Nenhuma tarefa para hoje (${hojeParaFiltro.split('-').reverse().join('/')})</p>
                <small>As tarefas aparecem apenas no dia programado.</small>
            </div>`;
    } else {
        list.innerHTML = tasks.map(t => `
            <div class="card">
                <h3>${t.desc}</h3>
                <p>Status: <b>${t.status}</b></p>
                ${t.status === 'Pendente' ? `<button class="btn-adm" onclick="finishTask(${t.id})">MARCAR COMO CONCLUÍDO</button>` : '✅ Tarefa Finalizada'}
            </div>`).join('');
    }
}

function finishTask(id) {
    const t = db.team[currentUserKey].tasks.find(x => x.id === id);
    t.status = 'Concluída';
    save();
    renderWorkerUI();
}

// Relatório WhatsApp
function generateReport() {
    let r = `📋 *BELIZE RDT - ${selectedDate.split('-').reverse().join('/')}*\\n`;
    for(let k in db.team) {
        const tks = db.team[k].tasks.filter(t => t.date === selectedDate);
        if(tks.length) {
            r += `\\n👤 *${db.team[k].name.toUpperCase()}*\\n`;
            tks.forEach(t => r += `${t.status === 'Concluída' ? '✅' : '⏳'} ${t.desc}\\n`);
        }
    }
    document.getElementById('report-text').value = r;
    document.getElementById('report-area').classList.remove('hidden');
}

function sendAndClear() {
    window.open(`https://wa.me/${MY_PHONE}?text=${encodeURIComponent(document.getElementById('report-text').value)}`, '_blank');
}
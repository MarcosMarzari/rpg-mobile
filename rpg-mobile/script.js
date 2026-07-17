// ================= MATRIZ DO MAPA (0 = Caminho Livre, 1 = Parede/Obstáculo) =================
const MAPA_LARGURA = 12;
const MAPA_ALTURA = 12;
const TAMANHO_CELULA = 32;

const MAPA = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,1,0,1,0,0,0,1,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,1,1,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
];

// ================= CONFIGURAÇÃO DAS RARIDADES DO MUNDO =================
const RARIDADES = {
    COMUM: { nome: 'Comum', cor: '#94a3b8', classeCss: 'r-comum', multiplicador: 1 },
    RARO: { nome: 'Raro', cor: '#3b82f6', classeCss: 'r-raro', multiplicador: 2 },
    EPICO: { nome: 'Épico', cor: '#a855f7', classeCss: 'r-epico', multiplicador: 4 },
    LENDARIO: { nome: 'Lendário', cor: '#f97316', classeCss: 'r-lendario', multiplicador: 8 },
    CELESTIAL: { nome: 'Celestial', cor: '#f59e0b', classeCss: 'r-celestial', multiplicador: 15 }
};

// ================= LOJA DE ITENS (MELHORIA DE ATRIBUTOS) =================
const ITENS_LOJA = [
    { id: 'espada', nome: 'Espada de Ferro', preco: 50, atqBonus: 5, vidaBonus: 0, icone: '⚔️' },
    { id: 'armadura', nome: 'Armadura Pesada', preco: 75, atqBonus: 0, vidaBonus: 30, icone: '🛡️' },
    { id: 'anel_celestial', nome: 'Anel do Éden', preco: 300, atqBonus: 25, vidaBonus: 100, icone: '💍' }
];

// ================= ESTADO GLOBAL DO JOGO =================
let heroi = {
    x: 1, // Posição inicial na matriz (coluna)
    y: 1, // Posição inicial na matriz (linha)
    sprite: '🧙‍♂️',
    vidaMax: 100,
    vida: 100,
    ataque: 15,
    gold: 50,
    nivel: 1,
    xp: 0
};

// Feras soltas no mapa explorável
let ferasNoMapa = [
    { x: 3, y: 3, sprite: '🐺', nome: 'Lobo', raridade: RARIDADES.COMUM, derrotada: false },
    { x: 6, y: 1, sprite: '🐍', nome: 'Serpente', raridade: RARIDADES.RARO, derrotada: false },
    { x: 9, y: 5, sprite: '🦂', nome: 'Escorpião', raridade: RARIDADES.EPICO, derrotada: false },
    { x: 8, y: 9, sprite: '🐉', nome: 'Dragão', raridade: RARIDADES.LENDARIO, derrotada: false },
    { x: 10, y: 10, sprite: '🦄', nome: 'Quimera Celestial', raridade: RARIDADES.CELESTIAL, derrotada: false }
];

let feraCombate = null; // Guarda a fera enfrentada no combate ativo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ================= LOOP DE RENDERIZAÇÃO 2D DO CANVAS =================
function desenharCenario() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < MAPA_ALTURA; r++) {
        for (let c = 0; c < MAPA_LARGURA; c++) {
            if (MAPA[r][c] === 1) {
                // Obstáculo / Parede do labirinto
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(c * TAMANHO_CELULA, r * TAMANHO_CELULA, TAMANHO_CELULA, TAMANHO_CELULA);
                ctx.strokeStyle = '#334155';
                ctx.strokeRect(c * TAMANHO_CELULA, r * TAMANHO_CELULA, TAMANHO_CELULA, TAMANHO_CELULA);
            } else {
                // Caminho por onde o boneco anda
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(c * TAMANHO_CELULA, r * TAMANHO_CELULA, TAMANHO_CELULA, TAMANHO_CELULA);
            }
        }
    }

    // Desenha Feras ativas no mapa
    ferasNoMapa.forEach(fera => {
        if (!fera.derrotada) {
            ctx.fillStyle = fera.raridade.cor;
            // Desenha um aura sob as feras de acordo com a raridade
            ctx.beginPath();
            ctx.arc(fera.x * TAMANHO_CELULA + 16, fera.y * TAMANHO_CELULA + 16, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.font = "20px Arial";
            ctx.fillText(fera.sprite, fera.x * TAMANHO_CELULA + 6, fera.y * TAMANHO_CELULA + 24);
        }
    });

    // Desenha o Boneco do Herói andando
    ctx.font = "22px Arial";
    ctx.fillText(heroi.sprite, heroi.x * TAMANHO_CELULA + 5, heroi.y * TAMANHO_CELULA + 25);
}

// ================= MOVIMENTAÇÃO INTELIGENTE (E CONTROLE DE COLISÃO) =================
function moverHeroi(dx, dy) {
    const novoX = heroi.x + dx;
    const novoY = heroi.y + dy;

    // Se o próximo bloco for caminho livre (0) na matriz, move o boneco
    if (MAPA[novoY][novoX] === 0) {
        heroi.x = novoX;
        heroi.y = novoY;
        desenharCenario();
        checarEncontros();
    }
}

// ================= GESTÃO DE ENCONTRO E COMBATE =================
function checarEncontros() {
    ferasNoMapa.forEach(fera => {
        if (!fera.derrotada && fera.x === heroi.x && fera.y === heroi.y) {
            iniciarBatalha(fera);
        }
    });
}

function iniciarBatalha(fera) {
    feraCombate = {
        ...fera,
        vidaMax: 40 * fera.raridade.multiplicador,
        vida: 40 * fera.raridade.multiplicador,
        ataque: 5 * fera.raridade.multiplicador
    };

    // Altera interface para tela de combate de turnos
    document.getElementById('tela-exploracao').classList.remove('ativo');
    document.getElementById('tela-batalha').classList.add('ativo');

    // Atualiza Informações do combate
    document.getElementById('batalha-raridade').textContent = `Fera ${feraCombate.raridade.nome}`;
    document.getElementById('batalha-nivel').textContent = `Multiplicador de Poder: x${feraCombate.raridade.multiplicador}`;
    
    document.getElementById('fera-nome').textContent = feraCombate.nome;
    document.getElementById('fera-avatar').textContent = feraCombate.sprite;
    
    const tagRaridade = document.getElementById('fera-raridade-label');
    tagRaridade.className = `raridade-tag ${feraCombate.raridade.classeCss}`;
    tagRaridade.textContent = `Raridade: ${feraCombate.raridade.nome}`;

    document.getElementById('log-combate').innerHTML = `<p style="color:#eab308">A batalha começou contra um animal ${feraCombate.raridade.nome}!</p>`;
    atualizarHUDBatalha();
}

function atualizarHUDBatalha() {
    // Painel Herói
    const pctVidaHeroi = Math.max(0, (heroi.vida / heroi.vidaMax) * 100);
    document.getElementById('heroi-vida-barra').style.width = `${pctVidaHeroi}%`;
    document.getElementById('heroi-vida-texto').textContent = `${heroi.vida}/${heroi.vidaMax} HP`;
    document.getElementById('heroi-atributos').textContent = `⚔️ Atq: ${heroi.ataque} | Gold: 💰 ${heroi.gold}`;

    // Painel Fera
    const pctVidaFera = Math.max(0, (feraCombate.vida / feraCombate.vidaMax) * 100);
    document.getElementById('fera-vida-barra').style.width = `${pctVidaFera}%`;
    document.getElementById('fera-vida-texto').textContent = `${feraCombate.vida}/${feraCombate.vidaMax} HP`;
}

// Ações do Combate de Turnos
document.getElementById('btn-atacar').addEventListener('click', () => {
    // Ataque do Jogador
    const danoJogador = heroi.ataque;
    feraCombate.vida -= danoJogador;
    adicionarLogLogico(`Você golpeou a fera causando ${danoJogador} de dano!`, 'white');

    if (feraCombate.vida <= 0) {
        vitoriaCombate();
        return;
    }

    // Contra-ataque da Fera
    setTimeout(() => {
        const danoFera = feraCombate.ataque;
        heroi.vida -= danoFera;
        adicionarLogLogico(`A fera te atacou e causou ${danoFera} de dano!`, '#f87171');
        
        if (heroi.vida <= 0) {
            adicionarLogLogico(`Você sucumbiu diante do monstro! Voltando ao vilarejo...`, '#ef4444');
            setTimeout(resuscitarNoVilarejo, 2000);
        }
        atualizarHUDBatalha();
    }, 600);

    atualizarHUDBatalha();
});

document.getElementById('btn-curar').addEventListener('click', () => {
    const cura = Math.floor(heroi.vidaMax * 0.4);
    heroi.vida = Math.min(heroi.vidaMax, heroi.vida + cura);
    adicionarLogLogico(`Você usou energia elemental e recuperou ${cura} de HP!`, '#4ade80');
    atualizarHUDBatalha();
});

document.getElementById('btn-fugir').addEventListener('click', () => {
    adicionarLogLogico('Você recuou estrategicamente da batalha!', '#94a3b8');
    setTimeout(retornarAoMapa, 1000);
});

function adicionarLogLogico(txt, cor) {
    const log = document.getElementById('log-combate');
    log.innerHTML += `<p style="color: ${cor}">${txt}</p>`;
    log.scrollTop = log.scrollHeight;
}

// Drops e Prêmios de Acordo com a Raridade
function vitoriaCombate() {
    const recompensaBase = 15;
    const moedasGanhas = recompensaBase * feraCombate.raridade.multiplicador;
    heroi.gold += moedasGanhas;

    // Marca a fera como morta no mapa original
    const idx = ferasNoMapa.findIndex(f => f.x === feraCombate.x && f.y === feraCombate.y);
    if (idx !== -1) ferasNoMapa[idx].derrotada = true;

    adicionarLogLogico(`🏆 Vitória! Fera derrotada!`, '#eab308');
    adicionarLogLogico(`💰 Drop de Ouro: +${moedasGanhas} moedas!`, '#eab308');

    setTimeout(retornarAoMapa, 1800);
}

function retornarAoMapa() {
    document.getElementById('tela-batalha').classList.remove('ativo');
    document.getElementById('tela-exploracao').classList.add('ativo');
    
    // Atualiza HUD do mapa
    document.getElementById('exp-gold').textContent = `💰 ${heroi.gold}`;
    desenharCenario();
}

function resuscitarNoVilarejo() {
    heroi.x = 1;
    heroi.y = 1;
    heroi.vida = heroi.vidaMax;
    retornarAoMapa();
}

// ================= ENGENHARIA DA LOJA =================
const modalLoja = document.getElementById('tela-loja');

document.getElementById('btn-abrir-loja').addEventListener('click', () => {
    modalLoja.classList.add('ativo');
    document.getElementById('loja-gold').textContent = `Moedas: ${heroi.gold}`;
    
    const containerItens = document.getElementById('itens-loja');
    containerItens.innerHTML = '';

    ITENS_LOJA.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-loja';
        itemDiv.innerHTML = `
            <div class="item-info">
                <span class="item-nome">${item.icone} ${item.nome}</span>
                <span class="item-status">+${item.atqBonus} Atq | +${item.vidaBonus} HP</span>
            </div>
            <button class="btn-comprar" onclick="comprarItem(${JSON.stringify(item).replace(/"/g, '&quot;')})">💰 ${item.preco}</button>
        `;
        containerItens.appendChild(itemDiv);
    });
});

window.comprarItem = function(item) {
    if (heroi.gold >= item.preco) {
        heroi.gold -= item.preco;
        heroi.ataque += item.atqBonus;
        heroi.vidaMax += item.vidaBonus;
        heroi.vida = heroi.vidaMax; // cura herói ao aprimorar
        
        document.getElementById('loja-gold').textContent = `Moedas: ${heroi.gold}`;
        document.getElementById('exp-gold').textContent = `💰 ${heroi.gold}`;
        alert(`Você comprou ${item.nome}! Atributos aumentados permanentemente.`);
    } else {
        alert('Ouro insuficiente para adquirir esta melhoria!');
    }
};

document.getElementById('btn-fechar-loja').addEventListener('click', () => {
    modalLoja.classList.remove('ativo');
});

// ================= CONTROLES DE DIREÇÃO (TOUCH & KEYBOARD) =================
document.getElementById('dpad-up').addEventListener('click', () => moverHeroi(0, -1));
document.getElementById('dpad-down').addEventListener('click', () => moverHeroi(0, 1));
document.getElementById('dpad-left').addEventListener('click', () => moverHeroi(-1, 0));
document.getElementById('dpad-right').addEventListener('click', () => moverHeroi(1, 0));

window.addEventListener('keydown', (e) => {
    if (document.getElementById('tela-exploracao').classList.contains('ativo')) {
        if (e.key === 'ArrowUp' || e.key === 'w') moverHeroi(0, -1);
        if (e.key === 'ArrowDown' || e.key === 's') moverHeroi(0, 1);
        if (e.key === 'ArrowLeft' || e.key === 'a') moverHeroi(-1, 0);
        if (e.key === 'ArrowRight' || e.key === 'd') moverHeroi(1, 0);
    }
});

// Inicia o Canvas desenhado na abertura
desenharCenario();
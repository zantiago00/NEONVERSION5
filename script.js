// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const player = document.getElementById('player');
const container = document.getElementById('gameContainer');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const comboEl = document.getElementById('combo');

// Pantallas y Formularios
const emailScreen = document.getElementById('emailScreen'); // NUEVO: Pantalla de correo inicial
const emailForm = document.getElementById('emailForm');     // NUEVO: Formulario de correo inicial
const initialEmailInput = document.getElementById('initialEmail'); // NUEVO: Input de correo inicial

const registerScreen = document.getElementById('registerScreen');
const registerForm = document.getElementById('registerForm');
const startScreen = document.getElementById('startScreen');
const rankingDisplayScreen = document.getElementById('rankingDisplay');

// Botones e Inputs
const startButton = document.getElementById('startButton');
const playerNameInput = document.getElementById('playerName');
const playerEmailInput = document.getElementById('playerEmail'); // Input de correo en pantalla de registro
const rankingDiv = document.getElementById('ranking');
const finalScoreTextEl = document.getElementById('finalScoreText');
const restartButton = document.getElementById('restartButton');
const registerButton = document.getElementById('registerButton');

// Elementos de Términos y Condiciones
const termsModal = document.getElementById('termsModal');
const openTermsBtn = document.getElementById('openTermsBtn');
const closeBtn = document.querySelector('.close-btn');
const acceptTermsBtn = document.getElementById('acceptTermsBtn');
const termsCheckbox = document.getElementById('termsCheckbox');

// --- CONSTANTES Y VARIABLES GLOBALES ---
const gravity = 0.65;
const initialJumpStrength = 18;
const groundY = 0;
const baseSpeed = 7;
const initialTime = 120;
const RANKING_URL = "https://script.google.com/macros/s/AKfycbzBUuj5qYyp9PnnP83ofKBGwStiqmk8ixX4CcQiPZWAevi1_vB6rqiXtYioXM4GcnHidw/exec"; // URL del Ranking API

// Configuración del juego
const OBSTACLE_MIN_GAP = 120; // Espacio mínimo entre obstáculos (ms)
const MAX_CONSECUTIVE_OBSTACLES = 3; // Máximo número de obstáculos consecutivos
const MIN_COIN_INTERVAL = 1800; // Intervalo mínimo entre monedas (ms)
const OBSTACLE_RATE_DECREASE = 0.97; // Factor de reducción de frecuencia de obstáculos por nivel de combo

let gameRunning = false;
let score = 0;
let combo = 0;
let gameTime = initialTime;
let gameLoopId;
let playerName = "Anónimo"; // Nombre por defecto
let playerEmail = ""; // Variable para almacenar el correo electrónico validado

let playerY = 0;
let velocityY = 0;
let isJumping = false;
let canDoubleJump = false; // Flag: ¿Tiene el poder de doble salto activo?

let obstacles = [];
let coins = [];
let currentSpeed = baseSpeed;
let speedBoostActive = false;
let boostDuration = 0;

let obstacleInterval;
let coinInterval;
let lastObstacleTime = 0;
let consecutiveObstacles = 0;
let lastCoinTime = 0;

// --- FUNCIONES DE ADAPTACIÓN RESPONSIVA ---

// Función para verificar si la página está en un iframe
function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

// Función para detectar si es un dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajustar el contenedor del juego según el entorno y dispositivo
function adjustGameContainer() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Determinar dimensiones óptimas manteniendo ratio 2:1
    let containerWidth, containerHeight;

    if (windowWidth / windowHeight >= 2) {
        // Pantalla muy ancha - ajustar altura
        containerHeight = windowHeight * 0.9;
        containerWidth = containerHeight * 2;
    } else {
        // Pantalla no tan ancha - ajustar ancho
        containerWidth = windowWidth * 0.95;
        containerHeight = containerWidth / 2;
    }

    // Aplicar límites máximos
    containerWidth = Math.min(containerWidth, 1600);
    containerHeight = Math.min(containerHeight, 800);

    // Ajustar las dimensiones del contenedor
    container.style.width = `${containerWidth}px`;
    container.style.height = `${containerHeight}px`;

    // Ajustes adicionales para móviles
    if (isMobileDevice()) {
        document.documentElement.style.touchAction = 'none'; // Prevenir desplazamiento táctil
        if (window.innerHeight > window.innerWidth) {
            // En modo retrato
            document.body.classList.add('portrait');
            document.getElementById('orientation-message').style.display = 'flex'; // Mostrar mensaje de rotar
            if(gameRunning) { // Si el juego estaba corriendo, pausarlo (o mostrar mensaje)
                 // Aquí podrías pausar el juego si tienes esa funcionalidad
                 // Por ahora solo mostramos el mensaje
            }
        } else {
            document.body.classList.remove('portrait');
             document.getElementById('orientation-message').style.display = 'none'; // Ocultar mensaje de rotar
             // Aquí podrías reanudar el juego si lo pausaste
        }
    } else {
         document.getElementById('orientation-message').style.display = 'none'; // Ocultar en escritorio
    }
}

// --- FUNCIONES DE GESTIÓN DE PANTALLAS ---

// Funciones para el modal de términos y condiciones
function openTermsModal() {
    termsModal.style.display = "block";
}

function closeTermsModal() {
    termsModal.style.display = "none";
}

function acceptTerms() {
    termsCheckbox.checked = true;
    closeTermsModal();
}

// Event listeners para el modal
openTermsBtn.addEventListener('click', function(e) {
    e.preventDefault();
    openTermsModal();
});

closeBtn.addEventListener('click', closeTermsModal);
acceptTermsBtn.addEventListener('click', acceptTerms);

// Cerrar modal si se hace clic fuera del contenido
window.addEventListener('click', function(e) {
    if (e.target === termsModal) {
        closeTermsModal();
    }
});

// NUEVO: Manejo del formulario de correo inicial (Paso 3 de la Opción B)
emailForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = initialEmailInput.value.trim();

    // Validación básica de correo
    if (!email || !email.includes('@') || !email.includes('.')) {
        alert("Por favor, ingresa un correo electrónico válido.");
        initialEmailInput.focus(); // Devolver foco al input
        return;
    }

    // Guardar el correo validado en la variable global
    playerEmail = email;
    // Pre-rellenar el campo de correo en la pantalla de registro
    playerEmailInput.value = email;
    // Deshabilitar la edición del correo en la pantalla de registro (opcional pero recomendado)
    playerEmailInput.readOnly = true;
    playerEmailInput.style.backgroundColor = '#eee'; // Estilo visual para indicar no editable

    // Avanzar a la pantalla de registro
    emailScreen.style.display = 'none';
    registerScreen.style.display = 'flex';
    playerNameInput.focus(); // Poner foco en el campo de nombre
});


// Manejo del formulario de registro
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validar formulario
    if (!playerNameInput.value.trim()) {
        alert("Por favor, ingresa tu nombre de jugador");
        playerNameInput.focus();
        return;
    }

    // El correo ya fue validado y está en playerEmailInput (y en la variable playerEmail)
    // No es necesario revalidarlo aquí, pero nos aseguramos que no esté vacío (por si acaso)
    if (!playerEmailInput.value.trim()) {
        alert("Ha ocurrido un error con el correo electrónico. Por favor, vuelve a empezar.");
        // Opcionalmente, regresar a la pantalla de correo:
        // registerScreen.style.display = 'none';
        // emailScreen.style.display = 'flex';
        // initialEmailInput.focus();
        return;
    }

    if (!termsCheckbox.checked) {
        alert("Debes aceptar los términos y condiciones para continuar");
        // Opcional: abrir el modal automáticamente
        // openTermsModal();
        return;
    }

    // Guardar el nombre del jugador (el correo ya se guardó desde el paso anterior)
    playerName = playerNameInput.value.trim();
    if (playerName.length > 15) playerName = playerName.substring(0, 15);

    // Pasar a la pantalla de inicio del juego
    registerScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

// Añadir un listener adicional para el botón de registro (por si acaso)
// (Se mantiene como estaba)
registerButton.addEventListener('click', function(e) {
    e.preventDefault();
    registerForm.dispatchEvent(new Event('submit'));
});

// --- FUNCIÓN DE INICIO DEL JUEGO (MEJORADA) ---
function startGame() {
    // Solo iniciar si no está corriendo Y si estamos en la pantalla de inicio
    if (gameRunning || startScreen.style.display === 'none') return;

    console.log("Iniciando juego...");

    startScreen.style.display = 'none';
    rankingDisplayScreen.style.display = 'none'; // Ocultar pantalla de ranking al iniciar

    gameRunning = true;
    score = 0; combo = 0; gameTime = initialTime;
    obstacles = []; coins = [];
    playerY = groundY; velocityY = 0; isJumping = false;
    canDoubleJump = false; // Resetear poder al inicio
    speedBoostActive = false; boostDuration = 0; currentSpeed = baseSpeed;
    lastObstacleTime = 0; consecutiveObstacles = 0; lastCoinTime = 0;

    // Eliminar restos de partida anterior
    container.querySelectorAll('.obstacle, .coin, .floating-text').forEach(el => el.remove());
    player.style.bottom = playerY + 'px';
    player.classList.remove('powered', 'jumping', 'collected');
    container.classList.remove('hit', 'shake');

    updateUI();
    clearIntervals();

    // Programar generación
    scheduleNextObstacle();
    scheduleNextCoin();

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(updateGame);
}

// --- [ ... RESTO DEL CÓDIGO (Funciones scheduleNextObstacle, scheduleNextCoin, updateGame, spawnObstacle, updateObstacles, spawnCoin, updateCoins, jump, showFloatingText, checkCollision, clearIntervals, updateUI, gameOver) ... ] ---
// --- Estas funciones se mantienen igual que en tu código original "MEJORADO" ---

// --- Pegar aquí todas las funciones desde scheduleNextObstacle hasta updateUI ---

function scheduleNextObstacle() {
    if (!gameRunning) return;

    const now = Date.now();
    const timeSinceLastObstacle = now - lastObstacleTime;

    let interval = 1800;

    if (combo >= 3) interval *= Math.pow(OBSTACLE_RATE_DECREASE, Math.min(10, combo - 2));

    if (consecutiveObstacles >= MAX_CONSECUTIVE_OBSTACLES) {
        interval *= 1.5;
        consecutiveObstacles = 0;
    }

    const actualDelay = Math.max(OBSTACLE_MIN_GAP, interval - timeSinceLastObstacle); // Usa MIN_GAP también

    obstacleInterval = setTimeout(() => {
        spawnObstacle();
        consecutiveObstacles++;
        lastObstacleTime = Date.now();
        scheduleNextObstacle();
    }, actualDelay);
}

function scheduleNextCoin() {
    if (!gameRunning) return;

    const now = Date.now();
    const timeSinceLastCoin = now - lastCoinTime;

    let interval = 2500;
    if (combo >= 6) interval *= 0.75;
    interval += Math.random() * 1000;

    const actualDelay = Math.max(MIN_COIN_INTERVAL, interval - timeSinceLastCoin); // Usa MIN_COIN_INTERVAL

    coinInterval = setTimeout(() => {
        spawnCoin();
        lastCoinTime = Date.now();
        scheduleNextCoin();
    }, actualDelay);
}

function updateGame() {
    if (!gameRunning) return;

    gameTime = Math.max(0, gameTime - (1 / 60));
    updateUI();

    if (gameTime <= 0) {
        gameOver();
        return;
    }

    // Ajustar velocidad
    if (speedBoostActive) {
        boostDuration -= (1 / 60);
        if (boostDuration <= 0) {
            speedBoostActive = false;
            // Podrías añadir un efecto visual al terminar el boost
        }
    }

    if (!speedBoostActive) {
        currentSpeed = baseSpeed * (combo >= 6 ? 1.5 : (combo >= 3 ? 1.2 : 1));
    } else {
        currentSpeed = baseSpeed * 1.5; // Mantener velocidad de boost
    }

    // Física de salto
    velocityY -= gravity;
    playerY += velocityY;

    if (playerY <= groundY) {
        playerY = groundY;
        velocityY = 0;
        if (isJumping) {
            isJumping = false;
             // La clase 'jumping' se maneja en la función jump() con timeout
        }
    }
    player.style.bottom = playerY + 'px';

    updateObstacles();
    updateCoins();

    gameLoopId = requestAnimationFrame(updateGame);
}

function spawnObstacle() {
    if (!gameRunning) return;

    const MIN_OBSTACLE_GAP_PX = 100; // Espacio visual mínimo en píxeles

    const obs = document.createElement('div');
    obs.className = 'obstacle';
    let obsWidth = 62;
    obs.style.width = `${obsWidth}px`;
    obs.style.height = '62px'; // Altura estándar

    // Asegurar visibilidad (ya incluido en CSS, pero refuerza)
    obs.style.visibility = 'visible';
    obs.style.display = 'block';
    obs.style.opacity = '1';

    obs.style.left = container.offsetWidth + 'px';
    obs.style.bottom = groundY + 'px';

    let makeLarger = false;
    let spawnSecond = false;

    if (combo >= 3) {
        if (Math.random() < 0.3) { // 30% de ser más grande
            obs.style.width = '74px';
            obs.style.height = '74px';
            obs.classList.add('large');
            obsWidth = 74;
            makeLarger = true;
        }
        if (Math.random() < 0.4 && consecutiveObstacles < MAX_CONSECUTIVE_OBSTACLES) {
            spawnSecond = true;
        }
    }

    container.appendChild(obs);
    obstacles.push({
        element: obs,
        width: obsWidth,
        height: parseInt(obs.style.height || '62')
    });

    if (spawnSecond) {
        const secondObstacle = document.createElement('div');
        secondObstacle.className = 'obstacle';

        secondObstacle.style.visibility = 'visible';
        secondObstacle.style.display = 'block';
        secondObstacle.style.opacity = '1';

        const gap = MIN_OBSTACLE_GAP_PX + Math.random() * 50;
        secondObstacle.style.left = (container.offsetWidth + obsWidth + gap) + 'px';
        secondObstacle.style.bottom = groundY + 'px';

        let secondWidth = 62;
        secondObstacle.style.width = `${secondWidth}px`;
        secondObstacle.style.height = '62px';
        if (makeLarger && Math.random() < 0.5) { // 50% chance de ser grande si el primero lo fue
             secondObstacle.style.width = '74px';
             secondObstacle.style.height = '74px';
             secondObstacle.classList.add('large');
             secondWidth = 74;
        }

        container.appendChild(secondObstacle);
        obstacles.push({
            element: secondObstacle,
            width: secondWidth,
            height: parseInt(secondObstacle.style.height || '62')
        });
        consecutiveObstacles++; // Contar el segundo como consecutivo también
    }
}


function updateObstacles() {
    obstacles = obstacles.filter(obstacle => {
        const obstacleElement = obstacle.element;

        if (!obstacleElement || !obstacleElement.isConnected) {
            return false; // Eliminar si ya no está en el DOM
        }

        // Forzar visibilidad (refuerzo)
        obstacleElement.style.visibility = 'visible';
        obstacleElement.style.display = 'block';
        obstacleElement.style.opacity = '1';


        let currentLeft = parseFloat(obstacleElement.style.left); // No necesita fallback si se setea siempre
        let newLeft = currentLeft - currentSpeed;
        obstacleElement.style.left = newLeft + 'px';

        // Colisión
        if (checkCollision(player, obstacleElement, -10)) { // Margen negativo
            gameTime = Math.max(0, gameTime - 1);
            combo = 0;
            consecutiveObstacles = 0; // Resetear contador al chocar
            updateUI();
            speedBoostActive = false;
            canDoubleJump = false;
            player.classList.remove('powered');

            // Efectos visuales de impacto
            container.classList.add('hit', 'shake');
            setTimeout(() => {
                container.classList.remove('hit', 'shake');
            }, 300);

            // Texto flotante
            const rect = obstacleElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            showFloatingText(rect.left - containerRect.left + rect.width / 2, rect.top - containerRect.top - 10, '-1s', false);

            obstacleElement.remove();
            return false;
        }

        // Eliminar al salir por la izquierda
        if (newLeft < -obstacle.width) {
            score++;
            updateUI();
            obstacleElement.remove();
            return false;
        }
        return true;
    });
}

function spawnCoin() {
    if (!gameRunning) return;
    let coinType; let bonus;

    if (combo >= 6) { coinType = 'yellow'; bonus = 5; }
    else if (combo >= 3) { coinType = 'blue'; bonus = 2; }
    else { coinType = 'green'; bonus = 1; }

    const coin = document.createElement('div');
    coin.className = `coin ${coinType}`;
    // coin.textContent = `+${bonus}s`; // Quitado para usar solo CSS

    coin.style.left = (container.offsetWidth + Math.random() * 100) + 'px';

    const containerHeight = container.offsetHeight;
    const safeBottom = Math.min(containerHeight * 0.7, containerHeight - 80);
    const randomBottom = 50 + Math.random() * (safeBottom - 50);
    coin.style.bottom = randomBottom + 'px';

    container.appendChild(coin);
    coins.push({
        element: coin,
        bonus: bonus,
        type: coinType,
        width: 50, // Dimensiones para colisión
        height: 50
    });
}

function updateCoins() {
    coins = coins.filter(coinData => {
        const coinElement = coinData.element;

        if (!coinElement || !coinElement.isConnected) {
            return false;
        }

        let currentLeft = parseFloat(coinElement.style.left);
        let newLeft = currentLeft - currentSpeed;
        coinElement.style.left = newLeft + 'px';

        // Colisión
        if (checkCollision(player, coinElement, 5)) { // Margen positivo
            combo++;
            gameTime = Math.min(initialTime + 30, gameTime + coinData.bonus); // Límite superior de tiempo
            score += 5 * combo;
            updateUI();

            // Efectos especiales
            if (coinData.type === 'blue' || coinData.type === 'yellow') {
                speedBoostActive = true;
                boostDuration = 5; // Duración fija del boost
            }
            if (coinData.type === 'yellow') {
                canDoubleJump = true;
                player.classList.add('powered');
            }

            // Efecto visual al recoger moneda
            player.classList.add('collected');
            setTimeout(() => player.classList.remove('collected'), 200);

            // Texto flotante
            const rect = coinElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            showFloatingText(
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top - 10,
                `+${coinData.bonus}s`, true
            );

            coinElement.remove();
            return false;
        }

        // Eliminar al salir por la izquierda
        if (newLeft < -coinData.width) {
            coinElement.remove();
            return false;
        }
        return true;
    });
}


function jump() {
    if (!gameRunning) return;

    const currentJumpStrength = initialJumpStrength * (combo >= 3 ? 1.15 : 1);

    // Salto Normal
    if (!isJumping) {
        isJumping = true;
        velocityY = currentJumpStrength;
        player.classList.add('jumping');
        setTimeout(() => { if(player.classList.contains('jumping')) player.classList.remove('jumping'); }, 200);
    }
    // Doble Salto
    else if (isJumping && canDoubleJump) { // Solo si está en el aire Y tiene el poder
        velocityY = currentJumpStrength * 1.1; // Un poco más fuerte
        canDoubleJump = false; // Consume el poder
        player.classList.remove('powered'); // Quitar efecto visual amarillo
        player.classList.add('jumping'); // Reaplicar efecto visual de salto
        setTimeout(() => { if(player.classList.contains('jumping')) player.classList.remove('jumping'); }, 200);
    }
}

function showFloatingText(x, y, text, isPlus) {
    const el = document.createElement('div');
    el.className = `floating-text ${isPlus ? 'plus' : 'minus'}`;
    el.textContent = text;

    // Posición y tamaño responsivo (ajustar valores según necesidad)
    const containerWidth = container.offsetWidth || 800; // Fallback
    const scaleFactor = containerWidth / 1000; // Factor basado en ancho de 1000px
    const baseFontSize = 16; // Tamaño base en px
    const baseOffset = 20; // Offset base en px

    el.style.left = (x - (baseOffset * scaleFactor)) + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = `${baseFontSize * scaleFactor}px`; // Escalar tamaño de fuente


    container.appendChild(el);
    el.offsetHeight; // Reflow

    setTimeout(() => { if (el && el.parentNode) el.remove(); }, 1150); // Duración de la animación + buffer
}


function checkCollision(el1, el2, margin = 0) {
    try {
        if (!el1 || !el2 || !el1.isConnected || !el2.isConnected) {
            return false;
        }
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();

        if (rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0) {
             // Si un elemento no tiene dimensiones (quizás display: none), no hay colisión
            return false;
        }

        return (
            rect1.left < rect2.right + margin &&
            rect1.right > rect2.left - margin &&
            rect1.top < rect2.bottom + margin &&
            rect1.bottom > rect2.top - margin
        );
    } catch (e) {
        console.error("Error en checkCollision:", e, el1, el2);
        return false;
    }
}

function clearIntervals() {
    clearTimeout(obstacleInterval);
    clearTimeout(coinInterval);
    obstacleInterval = null;
    coinInterval = null;
}

function updateUI() {
    scoreEl.textContent = score;
    timerEl.textContent = gameTime.toFixed(1);
    comboEl.textContent = 'Combo: ' + combo;
}


// --- FIN DE JUEGO Y RANKING (MEJORADA PARA ORDENAR POR PUNTUACIÓN) ---
async function gameOver() {
    if (!gameRunning) return; // Evitar doble llamada

    gameRunning = false;
    clearIntervals();
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    // Actualizar puntuación final antes de mostrar la pantalla
    finalScoreTextEl.textContent = `${playerName}, tu puntuación: ${score}`; // Más simple

    rankingDiv.innerHTML = "<p>Enviando puntuación y cargando ranking...</p>";
    rankingDisplayScreen.style.display = 'flex';

    const nombreCodificado = encodeURIComponent(playerName);
    // Usar el correo almacenado en la variable global
    const correoCodificado = encodeURIComponent(playerEmail);
    const puntajeCodificado = encodeURIComponent(score);
    const urlEnviar = `${RANKING_URL}?nombre=${nombreCodificado}&email=${correoCodificado}&puntaje=${puntajeCodificado}`;

    let rankingData = null;
    let sendError = null;
    let fetchError = null;

    // Intentar enviar y obtener datos en paralelo (puede ser más rápido)
    const sendPromise = fetch(urlEnviar).catch(err => {
        console.error("Error al enviar puntuación:", err);
        sendError = err; // Guardar error de envío
    });

    const fetchPromise = fetch(RANKING_URL)
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            rankingData = data; // Guardar datos de ranking
        })
        .catch(err => {
            console.error("Error al obtener ranking:", err);
            fetchError = err; // Guardar error de obtención
        });

    // Esperar a que ambas promesas terminen
    await Promise.all([sendPromise, fetchPromise]);

    // Si el juego se reinició mientras cargaba, no hacer nada más
    if (gameRunning || rankingDisplayScreen.style.display === 'none') return;

    // Procesar y mostrar el ranking si se obtuvieron datos
    if (rankingData) {
        try {
            const top = rankingData
                .map(r => ({
                    nombre: String(r.nombre || "Anónimo").substring(0, 15), // Limitar y asegurar string
                    puntaje: parseInt(String(r.puntaje || '0').replace(/[^\d-]/g, ''), 10) || 0 // Limpiar y parsear puntaje
                }))
                .filter(r => r.puntaje >= 0) // Filtrar puntajes negativos o inválidos si los hubiera
                .sort((a, b) => b.puntaje - a.puntaje) // Ordenar descendente
                .slice(0, 20); // Top 20

            let table = '<h2>Ranking Top 20</h2><table><thead><tr><th>#</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>';
            top.forEach((r, i) => {
                 // Escapar HTML simple para el nombre
                 const safeName = r.nombre.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                 table += `<tr><td>${i + 1}</td><td>${safeName}</td><td>${r.puntaje}</td></tr>`;
             });
             table += '</tbody></table>';
             rankingDiv.innerHTML = table;

             // Mostrar mensaje si hubo error al enviar pero se cargó el ranking
             if (sendError) {
                 rankingDiv.innerHTML += "<p style='color:orange; font-size:0.8em;'>Nota: Hubo un problema al guardar tu puntuación, pero el ranking se cargó.</p>";
             }

        } catch (processingError) {
             console.error("Error al procesar datos del ranking:", processingError);
             rankingDiv.innerHTML = "<p>Error al procesar el ranking. Intenta de nuevo.</p>";
         }
    } else if (fetchError) {
        // Mostrar error si falló la obtención del ranking
        rankingDiv.innerHTML = "<p>No se pudo cargar el ranking. Verifica tu conexión.</p>";
        // Mostrar mensaje si el envío también falló
        if (sendError) {
             rankingDiv.innerHTML += "<p style='color:red; font-size:0.8em;'>Tampoco se pudo guardar tu puntuación.</p>";
         } else {
             // O si el envío fue exitoso pero el ranking no cargó
             rankingDiv.innerHTML += "<p style='color:orange; font-size:0.8em;'>Tu puntuación fue enviada, pero no se pudo mostrar el ranking.</p>";
         }
    } else {
         // Caso improbable: ni datos ni error de fetch, pero sí de envío
         rankingDiv.innerHTML = "<p>Ranking no disponible.</p>";
         if (sendError) {
             rankingDiv.innerHTML += "<p style='color:red; font-size:0.8em;'>Error al guardar tu puntuación.</p>";
         }
     }
}


// --- EVENT LISTENERS (MEJORADO Y REORGANIZADO) ---
startButton.addEventListener('click', startGame);

// Quitar inicio con Enter en campo de nombre, ya no es necesario aquí
// playerNameInput.addEventListener('keyup', (e) => { ... });

// Control de teclas
document.addEventListener('keydown', (e) => {
    // Salto con Espacio
    if ((e.code === 'Space' || e.key === ' ' || e.keyCode === 32) && gameRunning) {
        e.preventDefault();
        jump();
    }
    // Iniciar juego con Enter/Espacio DESDE la pantalla de inicio (StartScreen)
    if ((e.key === 'Enter' || e.keyCode === 13 || e.code === 'Space' || e.key === ' ' || e.keyCode === 32)
        && !gameRunning && startScreen.style.display === 'flex') {
             e.preventDefault(); // Prevenir scroll si se usa Espacio
             startGame();
    }
     // Reiniciar juego con Enter/Espacio DESDE la pantalla de ranking
     if ((e.key === 'Enter' || e.keyCode === 13 || e.code === 'Space' || e.key === ' ' || e.keyCode === 32)
         && !gameRunning && rankingDisplayScreen.style.display === 'flex') {
         e.preventDefault();
         restartButton.click(); // Simular clic en el botón de reinicio
     }
});

// Prevenir scroll con Espacio (redundante pero seguro)
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ' || e.keyCode === 32) && gameRunning) {
        e.preventDefault();
    }
});

// Controles táctiles
container.addEventListener('touchstart', (e) => {
    // Saltar solo si se toca DENTRO del área de juego activa
    if (gameRunning && (e.target === container || player.contains(e.target))) {
         jump();
         e.preventDefault();
    }
}, { passive: false });

// Mejor soporte táctil (evitar scroll accidental)
if (isMobileDevice()) {
    // Prevenir scroll mientras se juega
    document.body.addEventListener('touchmove', (e) => {
        if (gameRunning) {
            e.preventDefault();
        }
    }, { passive: false });

    // Permitir tocar en cualquier lugar (no botones/inputs) para saltar
    document.addEventListener('touchstart', (e) => {
         // Saltar si el juego corre Y no se tocó un botón, link, input o el modal de términos
         if (gameRunning && !e.target.closest('button, a, input, .modal')) {
             jump();
             // e.preventDefault(); // Puede prevenir clics en botones si se activa aquí globalmente
         }
     }, { passive: false }); // Usar capture: true si es necesario para prioridad
}


// Botón de Reiniciar Juego
restartButton.addEventListener('click', () => {
    // Solo si el juego NO está corriendo (evita reinicios accidentales durante carga)
    if (!gameRunning) {
        rankingDisplayScreen.style.display = 'none';
        // Limpiar ranking anterior para evitar mostrarlo brevemente al reiniciar
        rankingDiv.innerHTML = "";
        finalScoreTextEl.textContent = ""; // Limpiar texto de puntuación final

        // Volver a la pantalla de inicio (StartScreen) para jugar de nuevo
        startScreen.style.display = 'flex';
    }
});

// Ajustar tamaño al cargar y al cambiar tamaño/orientación
window.addEventListener('load', () => {
    adjustGameContainer(); // Ajuste inicial

    // Mostrar la pantalla de correo primero (Paso 2 de la Opción B)
    emailScreen.style.display = 'flex';
    registerScreen.style.display = 'none';
    startScreen.style.display = 'none';
    rankingDisplayScreen.style.display = 'none';

    // Poner foco en el input de correo inicial
    setTimeout(() => {
        if (initialEmailInput) {
            initialEmailInput.focus();
        }
        // Mover el estilo forzado de obstáculos aquí si aún es necesario
        // aunque es mejor manejarlo en CSS o al crear el elemento
    }, 100); // Pequeño retraso

    // Listeners de orientación/resize más robustos
    if (window.screen && window.screen.orientation) {
        try {
             window.screen.orientation.addEventListener('change', () => setTimeout(adjustGameContainer, 150));
         } catch (e) {
             console.warn("Screen Orientation API no soportada o con errores.");
             // Fallback si la API falla o no existe
             window.addEventListener('orientationchange', () => setTimeout(adjustGameContainer, 150));
         }
    } else {
        window.addEventListener('orientationchange', () => setTimeout(adjustGameContainer, 150));
    }
    window.addEventListener('resize', () => setTimeout(adjustGameContainer, 150)); // Con debounce ligero
});


// Quitar el estilo forzado de obstáculos de aquí si ya está en CSS o al crearlo
// window.addEventListener('load', function() { ... }); // El código de este listener se movió arriba

// Manejador de errores global
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Error global detectado:", message, "en", source, `Línea:${lineno}`);
    // Podrías enviar este error a un servicio de logging si quisieras
    return true; // Previene que el error detenga otros scripts (puede ser peligroso)
};

// Inicialización inmediata de ajustes responsivos al cargar el script
adjustGameContainer();

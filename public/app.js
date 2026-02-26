const domains = [
  {
    name: 'i@INTEL',
    color: '#2f9bff',
    position: 'Inteligência e CTI',
    message: 'Antecipação e visão estratégica.',
    services: ['ThreatCore', 'Threat Intelligence', 'Threat Hunting', 'Dark Web Monitoring', 'Adversary Profiling', 'Relatórios Estratégicos']
  },
  {
    name: 'i@RISK',
    color: '#ffb321',
    position: 'Gestão de Exposição e Vulnerabilidade',
    message: 'Alerta, prevenção e priorização.',
    services: ['VEMaaS', 'Attack Surface Management', 'Patch Management', 'Risk Assessment', 'Exposure Mapping', 'OT / IoT Exposure']
  },
  {
    name: 'i@DEV',
    color: '#d34cff',
    position: 'Engenharia e Desenvolvimento Seguro',
    message: 'Inovação com segurança embarcada.',
    services: ['Secure Software Engineering', 'DevSecOps', 'SAST / DAST / SCA', 'Code Review', 'Hardening', 'Arquitetura Cloud Segura']
  },
  {
    name: 'i@DEFENSE',
    color: '#d7263d',
    position: 'Operações de Defesa e Resposta',
    message: 'Ação, resposta e contenção.',
    services: ['CDOC 365', 'MDR / XDR', 'Incident Response', 'Forense Digital', 'Breach & Attack Simulation', 'Monitoramento de Infraestruturas Críticas']
  },
  {
    name: 'i@CLOUD',
    color: '#3f74ff',
    position: 'Proteção de Infraestrutura Digital',
    message: 'Proteção distribuída.',
    services: ['Cloud Security', 'SaaS Security', 'Endpoint Security', 'Identity Security', 'SIEM', 'WAF', 'E-mail Security']
  },
  {
    name: 'i@GOV',
    color: '#96a0b5',
    position: 'Governança, Estratégia e Conformidade',
    message: 'Solidez institucional.',
    services: ['LGPD', 'vDPO', 'CISO as a Service', 'Advisory Executivo', 'Plano de Resposta a Incidentes', 'Disaster Recovery', 'BCP']
  },
  {
    name: 'i@WORKFORCE',
    color: '#183f9f',
    position: 'Capacidade Técnica Estratégica',
    message: 'Força operacional.',
    services: ['Outsourcing de Segurança', 'Squads dedicados', 'Alocação Especializada', 'Gestão Técnica Terceirizada']
  }
];

const scene = document.getElementById('orbitScene');
const svg = document.getElementById('orbitSvg');
const domainLayer = document.getElementById('domainLayer');
const centerCore = document.getElementById('centerCore');

const infoPanel = document.getElementById('infoPanel');
const relationList = document.getElementById('relationList');
const detailModal = document.getElementById('detailModal');
const modalTitle = document.getElementById('modalTitle');
const modalPosition = document.getElementById('modalPosition');
const modalMessage = document.getElementById('modalMessage');
const modalServices = document.getElementById('modalServices');
const toggleRotationBtn = document.getElementById('toggleRotation');

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = prefersReduced.matches;

let geometry = null;
let domainNodes = [];
let relationRows = [];
let baseAngles = [];
let orbitState = [];
let orbitConfig = [];

const settings = {
  autoRotation: true
};

let activeIndex = -1;
let hoverSource = null;
let hideModalTimer = null;
let lastFrame = null;
let simTime = 0;
let orbitHoverPaused = false;
let resumeStartMs = null;
const RESUME_FADE_MS = 130;
const GLOBAL_ORBIT_SPEED = 0.000082;

function init() {
  domainNodes = domains.map((domain, index) => createDomainNode(domain, index));
  relationRows = domains.map((domain, index) => createRelationRow(domain, index));
  configureOrbitModel();
  orbitState = domains.map(() => ({ x: 0, y: 0 }));

  detailModal.addEventListener('mouseenter', () => clearTimeout(hideModalTimer));
  detailModal.addEventListener('mouseleave', scheduleHideModal);
  scene.addEventListener('mouseenter', () => {
    orbitHoverPaused = true;
    resumeStartMs = null;
  });
  scene.addEventListener('mouseleave', () => {
    orbitHoverPaused = false;
    resumeStartMs = performance.now();
  });

  toggleRotationBtn.addEventListener('click', () => {
    settings.autoRotation = !settings.autoRotation;
    applyToggleVisual(toggleRotationBtn, settings.autoRotation);
    if (!settings.autoRotation) {
      // Reset to canonical layout when rotation is disabled.
      simTime = 0;
      placeNodes();
      renderSvg();
      centerCore.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });

  applyToggleVisual(toggleRotationBtn, settings.autoRotation);

  updateGeometry();
  applyCoreStyle();
  placeNodes();
  renderSvg();
  hideModal();
  requestAnimationFrame(tick);
}

function createDomainNode(domain, index) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = 'domain-node';
  const orbitalArt = buildOrbitalArt(domain);
  node.style.backgroundImage = `url("${orbitalArt}"), linear-gradient(155deg, ${hexToRgba(domain.color, 0.94)}, ${hexToRgba(domain.color, 0.58)})`;
  node.style.backgroundRepeat = 'no-repeat, no-repeat';
  node.style.backgroundPosition = 'center center, center center';
  node.style.backgroundSize = '84% 84%, cover';
  node.innerHTML = `<p class="title">${domain.name}</p><p class="subtitle">${domain.position}</p>`;

  node.addEventListener('mouseenter', () => {
    selectDomain(index, 'orbit');
    showModalFor(index, node);
  });
  node.addEventListener('focus', () => {
    selectDomain(index, 'orbit');
    showModalFor(index, node);
  });
  node.addEventListener('mouseleave', () => {
    if (hoverSource === 'orbit') {
      hideModal();
      clearActive();
    }
  });

  domainLayer.appendChild(node);
  return node;
}

function createRelationRow(domain, index) {
  const row = document.createElement('li');
  row.className = 'relation-item';

  const text = document.createElement('div');
  text.className = 'relation-text';
  text.innerHTML = `<p class="relation-name">${domain.name}</p><p class="relation-pos">${domain.position}</p>`;

  const arrow = document.createElement('button');
  arrow.type = 'button';
  arrow.className = 'relation-arrow';
  arrow.setAttribute('aria-label', `Abrir submódulos de ${domain.name}`);
  arrow.textContent = '→';

  row.appendChild(text);
  row.appendChild(arrow);

  row.addEventListener('mouseenter', () => selectDomain(index, 'list'));
  row.addEventListener('mouseleave', () => {
    if (hoverSource === 'list') clearActive();
  });

  arrow.addEventListener('mouseenter', () => {
    clearTimeout(hideModalTimer);
    selectDomain(index, 'arrow');
    showModalFor(index, arrow);
  });
  arrow.addEventListener('focus', () => {
    clearTimeout(hideModalTimer);
    selectDomain(index, 'arrow');
    showModalFor(index, arrow);
  });
  arrow.addEventListener('mouseleave', scheduleHideModal);

  relationList.appendChild(row);
  return { row, arrow };
}

function selectDomain(index, source) {
  activeIndex = index;
  hoverSource = source;

  domainNodes.forEach((node, idx) => node.classList.toggle('active', idx === index));
  relationRows.forEach((entry, idx) => entry.row.classList.toggle('active', idx === index));

  const domain = domains[index];
  infoPanel.style.background = `linear-gradient(165deg, ${hexToRgba(domain.color, 0.8)}, rgba(6, 12, 24, 0.95))`;
}

function clearActive() {
  hoverSource = null;
  activeIndex = -1;

  domainNodes.forEach((node) => {
    node.classList.remove('active');
    node.style.opacity = '1';
  });
  relationRows.forEach((entry) => entry.row.classList.remove('active'));
  infoPanel.style.background = 'linear-gradient(165deg, rgba(10, 32, 86, 0.86), rgba(8, 17, 34, 0.94))';
}

function showModalFor(index) {
  const domain = domains[index];
  modalTitle.textContent = domain.name;
  modalPosition.textContent = domain.position;
  modalMessage.textContent = domain.message;
  modalServices.innerHTML = domain.services.map((service) => `<li>${service}</li>`).join('');

  detailModal.style.background = `linear-gradient(155deg, ${hexToRgba(domain.color, 0.42)}, rgba(2, 7, 15, 0.78))`;
  detailModal.classList.add('open');
  const firstRow = relationRows[0]?.row;
  if (firstRow) {
    const panelRect = infoPanel.getBoundingClientRect();
    const rowRect = firstRow.getBoundingClientRect();
    const top = Math.max(110, rowRect.top - panelRect.top);
    detailModal.style.top = `${top}px`;
  }

  clearTimeout(hideModalTimer);
}

function scheduleHideModal() {
  clearTimeout(hideModalTimer);
  hideModalTimer = window.setTimeout(() => {
    hideModal();
    clearActive();
  }, 150);
}

function hideModal() {
  detailModal.classList.remove('open');
}

function applyToggleVisual(button, isOn) {
  button.classList.toggle('on', isOn);
  button.textContent = isOn ? 'Auto-rotação ON' : 'Auto-rotação OFF';
}

function isPaused() {
  return reducedMotion || !settings.autoRotation || orbitHoverPaused;
}

function updateGeometry() {
  const box = scene.getBoundingClientRect();
  const w = box.width;
  const h = box.height;
  const cx = w * 0.44;
  const cy = h * 0.5;
  const minDim = Math.min(w, h);

  geometry = {
    w,
    h,
    cx,
    cy,
    orbitR: minDim * 0.38,
    coreR: minDim * 0.115
  };

  centerCore.style.width = `${geometry.coreR * 2.45}px`;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
}

function pointAt(cx, cy, radius, angle) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

function placeNodes() {
  const { cx, cy, orbitR } = geometry;
  const globalPulse = Math.sin(simTime * 0.00009) * 0.0025;

  for (let i = 0; i < domains.length; i += 1) {
    const cfg = orbitConfig[i];
    const angle = baseAngles[i] + simTime * GLOBAL_ORBIT_SPEED;
    const radius = orbitR * cfg.baseRadiusFactor * (1 + globalPulse);
    const p = {
      idx: i,
      angle,
      radius,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
    orbitState[i] = p;
    domainNodes[i].style.left = `${p.x}px`;
    domainNodes[i].style.top = `${p.y}px`;
  }
}

function renderSvg() {
  const { w, h, cx, cy, orbitR, coreR } = geometry;
  const glow = 0.56 + Math.sin(simTime * 0.0019) * 0.14;

  let markup = '';
  markup += `<defs>
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(53,124,255,0.95)" />
      <stop offset="100%" stop-color="rgba(178,64,255,0.76)" />
    </linearGradient>
  </defs>`;

  markup += `<circle cx="${cx}" cy="${cy}" r="${orbitR}" fill="none" stroke="url(#ringGrad)" stroke-opacity="${glow}" stroke-width="2.05" />`;
  markup += `<circle cx="${cx}" cy="${cy}" r="${coreR * 1.4}" fill="none" stroke="rgba(88,180,255,0.45)" stroke-width="1.2" />`;

  for (let i = 0; i < orbitState.length; i += 1) {
    const p1 = orbitState[i];
    const dirX = p1.x - cx;
    const dirY = p1.y - cy;
    const dirLen = Math.hypot(dirX, dirY) || 1;
    const p0 = {
      x: cx + (dirX / dirLen) * coreR * 1.15,
      y: cy + (dirY / dirLen) * coreR * 1.15
    };
    const isActive = i === activeIndex;
    markup += `<line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="${isActive ? 'rgba(167,220,255,0.95)' : 'rgba(89,154,255,0.55)'}" stroke-width="${isActive ? 2.4 : 1.45}" />`;
  }

  if (activeIndex >= 0 && orbitState[activeIndex]) {
    const p = orbitState[activeIndex];
    const activeRadius = Math.hypot(p.x - cx, p.y - cy);
    markup += `<circle cx="${cx}" cy="${cy}" r="${activeRadius}" fill="none" stroke="rgba(167,220,255,0.8)" stroke-width="2.4" stroke-dasharray="6 7" />`;
  }

  markup += `<path d="M0 ${h * 0.14} Q ${w * 0.4} ${h * 0.04}, ${w} ${h * 0.16}" stroke="rgba(255,255,255,0.12)" stroke-width="1" fill="none" />`;
  svg.innerHTML = markup;
}

function detectCollisions() {
  return;
}

function pulseCore() {
  const pulse = 1 + Math.sin(simTime * 0.0024) * 0.03;
  centerCore.style.transform = `translate(-50%, -50%) scale(${pulse})`;
}

function tick(ts) {
  if (lastFrame == null) lastFrame = ts;
  const delta = ts - lastFrame;
  lastFrame = ts;

  const paused = isPaused();

  if (!paused) {
    let fade = 1;
    if (resumeStartMs !== null) {
      fade = Math.min(1, (ts - resumeStartMs) / RESUME_FADE_MS);
      if (fade >= 1) resumeStartMs = null;
    }
    simTime += delta * fade;
    placeNodes();
    renderSvg();
    pulseCore();
    detectCollisions();
  }
  requestAnimationFrame(tick);
}

function hexToRgba(hex, alpha) {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const num = Number.parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function configureOrbitModel() {
  baseAngles = new Array(domains.length).fill(0);
  orbitConfig = new Array(domains.length);

  const shuffledIndexes = shuffle(domains.map((_, i) => i));
  const start = Math.random() * Math.PI * 2;
  const step = (Math.PI * 2) / domains.length;

  for (let k = 0; k < domains.length; k += 1) {
    const i = shuffledIndexes[k];
    baseAngles[i] = start + k * step;
    orbitConfig[i] = {
      baseRadiusFactor: 1,
      // Uniform angular motion keeps proportional spacing and avoids collisions.
      angularSpeed: GLOBAL_ORBIT_SPEED
    };
  }
}

function getNodeDiameter() {
  const node = domainNodes[0];
  if (!node) return 120;
  const rect = node.getBoundingClientRect();
  return rect.width || 120;
}

function applyCoreStyle() {
  const coreArt = buildCoreArt();
  centerCore.style.backgroundImage = `url("${coreArt}"), radial-gradient(circle at 30% 20%, #ff5b64 0%, #d51727 42%, #7d0010 100%)`;
  centerCore.style.backgroundRepeat = 'no-repeat, no-repeat';
  centerCore.style.backgroundPosition = 'center center, center center';
  centerCore.style.backgroundSize = '54% 54%, cover';
}

function buildOrbitalArt(domain) {
  const key = domain.name.replace('i@', '').trim().toUpperCase();
  const iconPaths = getDomainIcon(key);
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <g fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2.2'>
        <circle cx='60' cy='60' r='42'/>
        <circle cx='60' cy='60' r='28' stroke='rgba(255,255,255,0.24)'/>
      </g>
      <circle cx='88' cy='60' r='3.8' fill='rgba(255,255,255,0.36)'/>
      ${iconPaths}
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildCoreArt() {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <g fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2.4'>
        <circle cx='60' cy='60' r='28'/>
        <path d='M38 60h44M60 38v44'/>
      </g>
      <circle cx='60' cy='60' r='6' fill='rgba(255,255,255,0.45)'/>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getDomainIcon(key) {
  if (key === 'DEFENSE') {
    return "<path d='M60 24 86 33v21c0 19-12 33-26 39-14-6-26-20-26-39V33z' fill='rgba(255,255,255,0.24)' stroke='rgba(255,255,255,0.36)' stroke-width='2.2'/>";
  }
  if (key === 'CLOUD') {
    return "<path d='M39 74h41a13 13 0 0 0 0-26h-2a20 20 0 0 0-37-5 15 15 0 0 0-2 31z' fill='rgba(255,255,255,0.24)' stroke='rgba(255,255,255,0.36)' stroke-width='2.2'/>";
  }
  if (key === 'GOV') {
    return "<path d='M31 45h58M60 34v11M43 45l-9 15h18zm43 0-9 15h18M39 82h42' stroke='rgba(255,255,255,0.36)' stroke-width='2.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/>";
  }
  if (key === 'RISK') {
    return "<path d='M60 28 88 79H32z' fill='rgba(255,255,255,0.2)' stroke='rgba(255,255,255,0.34)' stroke-width='2.2'/><path d='M60 47v18m0 9h.01' stroke='rgba(255,255,255,0.44)' stroke-width='3.2' stroke-linecap='round'/>";
  }
  if (key === 'INTEL') {
    return "<circle cx='60' cy='60' r='15' fill='rgba(255,255,255,0.2)' stroke='rgba(255,255,255,0.34)' stroke-width='2.2'/><circle cx='60' cy='60' r='5.5' fill='rgba(255,255,255,0.42)'/>";
  }
  if (key === 'DEV') {
    return "<path d='M45 46 34 60l11 14M75 46l11 14-11 14M66 40 54 80' stroke='rgba(255,255,255,0.42)' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round' fill='none'/>";
  }
  if (key === 'WORKFORCE') {
    return "<circle cx='49' cy='52' r='7.5' fill='rgba(255,255,255,0.24)'/><circle cx='71' cy='52' r='7.5' fill='rgba(255,255,255,0.24)'/><path d='M35 77c3-9 11-13 21-13s18 4 21 13' stroke='rgba(255,255,255,0.36)' stroke-width='3.2' fill='none' stroke-linecap='round'/>";
  }
  return "<circle cx='60' cy='60' r='10' fill='rgba(255,255,255,0.18)'/>";
}

window.addEventListener('resize', () => {
  updateGeometry();
  placeNodes();
  renderSvg();
});

prefersReduced.addEventListener('change', (event) => {
  reducedMotion = event.matches;
});

init();

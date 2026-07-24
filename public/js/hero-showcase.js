/* hero-showcase.js — Animated code→build→deploy→live showcase */

export function initHeroShowcase() {
  const container = document.querySelector('.hero-showcase');
  if (!container) return;

  const scenes = container.querySelectorAll('.hero-showcase__scene');
  const statusEl = container.querySelector('.hero-showcase__status');
  if (scenes.length === 0) return;

  const sceneNames = ['Writing Code...', 'Building Website...', 'Deploying...', 'Connecting Cloud...', 'Website Live!'];
  let currentScene = 0;
  let sceneTimeout = null;

  function showScene(index) {
    scenes.forEach((s, i) => s.classList.toggle('active', i === index));
    if (statusEl) {
      statusEl.innerHTML = `<span class="hero-showcase__status-dot"></span>${sceneNames[index]}`;
    }
  }

  // Scene 1: Code Editor typing
  function runCodeScene(scene) {
    const lines = scene.querySelectorAll('.code-line');
    let i = 0;
    function typeLine() {
      if (i < lines.length) {
        lines[i].classList.add('visible');
        i++;
        sceneTimeout = setTimeout(typeLine, 200 + Math.random() * 150);
      } else {
        sceneTimeout = setTimeout(() => nextScene(), 1500);
      }
    }
    typeLine();
  }

  // Scene 2: Browser preview assembly
  function runBrowserScene(scene) {
    const elements = scene.querySelectorAll('.web-element');
    const loadingBar = scene.querySelector('.web-loading__bar');
    let i = 0;
    function showElement() {
      if (i < elements.length) {
        elements[i].classList.add('visible');
        i++;
        sceneTimeout = setTimeout(showElement, 400);
      } else {
        if (loadingBar) {
          setTimeout(() => loadingBar.classList.add('complete'), 200);
        }
        sceneTimeout = setTimeout(() => nextScene(), 2000);
      }
    }
    showElement();
  }

  // Scene 3: Terminal deploy
  function runTerminalScene(scene) {
    const lines = scene.querySelectorAll('.term-line');
    const progressBar = scene.querySelector('.term-progress__bar');
    let i = 0;
    function typeLine() {
      if (i < lines.length) {
        lines[i].classList.add('visible');
        i++;
        sceneTimeout = setTimeout(typeLine, 300 + Math.random() * 200);
      } else {
        if (progressBar) {
          setTimeout(() => progressBar.classList.add('complete'), 300);
        }
        sceneTimeout = setTimeout(() => nextScene(), 2000);
      }
    }
    typeLine();
  }

  // Scene 4: Cloud deploy
  function runCloudScene(scene) {
    const nodes = scene.querySelectorAll('.cloud-node');
    const lines = scene.querySelectorAll('.cloud-line');
    let i = 0;
    function showNode() {
      if (i < nodes.length) {
        nodes[i].classList.add('visible');
        if (lines[i]) lines[i].classList.add('visible');
        i++;
        sceneTimeout = setTimeout(showNode, 300);
      } else {
        sceneTimeout = setTimeout(() => nextScene(), 2000);
      }
    }
    showNode();
  }

  // Scene 5: Live website
  function runLiveScene(scene) {
    const indicators = scene.querySelectorAll('.live-indicator');
    let i = 0;
    function showIndicator() {
      if (i < indicators.length) {
        indicators[i].classList.add('visible');
        i++;
        sceneTimeout = setTimeout(showIndicator, 400);
      } else {
        sceneTimeout = setTimeout(() => nextScene(), 3000);
      }
    }
    showIndicator();
  }

  const sceneRunners = [runCodeScene, runBrowserScene, runTerminalScene, runCloudScene, runLiveScene];

  function nextScene() {
    clearTimeout(sceneTimeout);
    // Reset current scene elements
    const current = scenes[currentScene];
    current.querySelectorAll('.visible').forEach(el => el.classList.remove('visible'));
    current.querySelectorAll('.code-line, .term-line').forEach(el => el.classList.remove('visible'));
    current.querySelectorAll('.web-loading__bar, .term-progress__bar').forEach(el => el.classList.remove('complete'));

    currentScene = (currentScene + 1) % scenes.length;
    showScene(currentScene);
    sceneRunners[currentScene](scenes[currentScene]);
  }

  // Start
  showScene(0);
  sceneRunners[0](scenes[0]);
}

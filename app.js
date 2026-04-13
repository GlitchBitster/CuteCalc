(() => {
  'use strict';

  /* ===== DOM refs ===== */
  const displayEl     = document.getElementById('display');
  const expressionEl  = document.getElementById('expression');
  const buttons       = document.querySelectorAll('.btn');

  /* ===== Calculator state ===== */
  let currentValue  = '0';
  let previousValue = '';
  let operator      = null;
  let resetNext     = false;

  /* ===== Update the screen ===== */
  function updateDisplay() {
    displayEl.textContent = currentValue;
    // Pop animation
    displayEl.classList.remove('pop');
    void displayEl.offsetWidth;          // reflow trigger
    displayEl.classList.add('pop');
  }

  function updateExpression() {
    if (previousValue && operator) {
      const opSymbol = { '/': '÷', '*': '×', '-': '−', '+': '+' }[operator] || operator;
      expressionEl.textContent = `${previousValue} ${opSymbol}`;
    } else {
      expressionEl.textContent = '';
    }
  }

  /* ===== Sparkle effect ===== */
  const sparkleEmojis = ['✨', '💖', '⭐', '🌟', '💫', '🌸', '💗'];

  function spawnSparkle(x, y) {
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('span');
      el.className = 'sparkle';
      el.textContent = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist  = 30 + Math.random() * 40;
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  /* ===== Highlight active operator ===== */
  function setActiveOperator(value) {
    document.querySelectorAll('.btn-operator').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  }

  /* ===== Calculator actions ===== */

  function inputNumber(num) {
    if (resetNext) {
      currentValue = num;
      resetNext = false;
    } else {
      currentValue = currentValue === '0' ? num : currentValue + num;
    }
    // Keep reasonable length
    if (currentValue.length > 14) currentValue = currentValue.slice(0, 14);
    updateDisplay();
  }

  function inputDecimal() {
    if (resetNext) {
      currentValue = '0.';
      resetNext = false;
    } else if (!currentValue.includes('.')) {
      currentValue += '.';
    }
    updateDisplay();
  }

  function inputOperator(op) {
    if (operator && !resetNext) {
      calculate();
    }
    previousValue = currentValue;
    operator = op;
    resetNext = true;
    setActiveOperator(op);
    updateExpression();
  }

  function calculate() {
    if (!operator || previousValue === '') return;

    const prev = parseFloat(previousValue);
    const curr = parseFloat(currentValue);
    let result;

    switch (operator) {
      case '+': result = prev + curr; break;
      case '-': result = prev - curr; break;
      case '*': result = prev * curr; break;
      case '/': result = curr === 0 ? 'Error' : prev / curr; break;
      default: return;
    }

    // Show full expression
    const opSymbol = { '/': '÷', '*': '×', '-': '−', '+': '+' }[operator] || operator;
    expressionEl.textContent = `${previousValue} ${opSymbol} ${currentValue} =`;

    if (result === 'Error') {
      currentValue = 'Error';
    } else {
      // Round to avoid floating-point weirdness
      currentValue = String(parseFloat(result.toFixed(10)));
    }

    operator = null;
    previousValue = '';
    resetNext = true;
    setActiveOperator(null);
    updateDisplay();
  }

  function handlePercent() {
    currentValue = String(parseFloat(currentValue) / 100);
    updateDisplay();
  }

  function handleBackspace() {
    if (currentValue.length > 1 && currentValue !== 'Error') {
      currentValue = currentValue.slice(0, -1);
    } else {
      currentValue = '0';
    }
    updateDisplay();
  }

  function clearAll() {
    currentValue  = '0';
    previousValue = '';
    operator      = null;
    resetNext     = false;
    setActiveOperator(null);
    updateExpression();
    updateDisplay();
  }

  /* ===== Play sounds per action ===== */
  function playSoundForAction(action, value) {
    const sounds = window.cuteSounds;
    if (!sounds || !sounds.enabled) return;
    switch (action) {
      case 'number':    sounds.playNumber(parseInt(value, 10)); break;
      case 'operator':  sounds.playOperator(); break;
      case 'equals':    sounds.playEquals(); break;
      case 'clear':     sounds.playClear(); break;
      case 'backspace': sounds.playBackspace(); break;
      case 'decimal':
      case 'percent':   sounds.playSpecial(); break;
    }
  }

  /* ===== Event handler ===== */
  function handleButton(e) {
    const btn    = e.currentTarget;
    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    // Sound
    playSoundForAction(action, value);

    // Sparkle at click position
    spawnSparkle(e.clientX, e.clientY);

    // Logic
    switch (action) {
      case 'number':    inputNumber(value); break;
      case 'operator':  inputOperator(value); break;
      case 'equals':    calculate(); break;
      case 'clear':     clearAll(); break;
      case 'backspace': handleBackspace(); break;
      case 'decimal':   inputDecimal(); break;
      case 'percent':   handlePercent(); break;
    }
  }

  /* ===== Keyboard support ===== */
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    let action, value;

    if (key >= '0' && key <= '9') {
      action = 'number'; value = key;
    } else if (key === '.') {
      action = 'decimal';
    } else if (key === '+' || key === '-') {
      action = 'operator'; value = key;
    } else if (key === '*' || key === 'x' || key === 'X') {
      action = 'operator'; value = '*';
    } else if (key === '/') {
      e.preventDefault();
      action = 'operator'; value = '/';
    } else if (key === '%') {
      action = 'percent';
    } else if (key === 'Enter' || key === '=') {
      action = 'equals';
    } else if (key === 'Backspace') {
      action = 'backspace';
    } else if (key === 'Escape' || key === 'Delete') {
      action = 'clear';
    } else {
      return;
    }

    playSoundForAction(action, value);

    // Find matching button and trigger sparkle at its center
    const matchBtn = document.querySelector(
      value
        ? `.btn[data-action="${action}"][data-value="${value}"]`
        : `.btn[data-action="${action}"]`
    );
    if (matchBtn) {
      const rect = matchBtn.getBoundingClientRect();
      spawnSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2);
      matchBtn.classList.add('pop');
      setTimeout(() => matchBtn.classList.remove('pop'), 120);
    }

    switch (action) {
      case 'number':    inputNumber(value); break;
      case 'operator':  inputOperator(value); break;
      case 'equals':    calculate(); break;
      case 'clear':     clearAll(); break;
      case 'backspace': handleBackspace(); break;
      case 'decimal':   inputDecimal(); break;
      case 'percent':   handlePercent(); break;
    }
  });

  /* ===== Wire up click listeners ===== */
  buttons.forEach(btn => btn.addEventListener('click', handleButton));
})();

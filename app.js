// Apple Calculator Complete Engine (iOS 18 & macOS Sequoia)
// Fully functioning with precise Apple calculator behavior

class AppleCalculator {
  constructor() {
    this.displayValue = '0';
    this.expressionTape = '';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.lastOperator = null;
    this.lastSecondOperand = null;
    this.isResult = false;
    this.memory = 0;
    this.angleMode = 'rad'; // 'rad' or 'deg'
    this.isSecondMode = false; // For '2nd' key
    this.parenStack = [];
    this.history = JSON.parse(localStorage.getItem('apple_calc_history') || '[]');
    this.activeOperatorBtn = null;
    this.currentMode = 'basic'; // 'basic', 'scientific', 'programmer', 'mathnotes'
    this.currentDevice = 'iphone'; // 'iphone' or 'mac'
    this.isLandscape = false;
    this.isConvertActive = false;
    this.programmerRadix = 10; // 16, 10, 8, 2
    this.programmerWordBits = 64; // 64, 32, 16, 8
    this.isRpnActive = false;
    this.rpnStack = [];

    // DOM Elements
    this.initDOMElements();
    this.attachEventListeners();
    this.initClock();
    this.updateDisplay();
    this.renderHistory();
  }

  initDOMElements() {
    this.displayEl = document.getElementById('calc-display');
    this.subDisplayEl = document.getElementById('calc-subdisplay');
    this.clearBtn = document.getElementById('btn-clear');
    this.radBadgeEl = document.getElementById('rad-badge');
    this.memoryBadgeEl = document.getElementById('memory-badge');
    this.historyDrawerEl = document.getElementById('history-drawer');
    this.historyListEl = document.getElementById('history-list');
    this.toastEl = document.getElementById('toast');
    this.calculatorCard = document.getElementById('calculator-card');
  }

  attachEventListeners() {
    // Button clicks (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      const value = btn.dataset.value;

      this.triggerHaptic(btn, action);

      switch (action) {
        case 'digit':
          this.inputDigit(value);
          break;
        case 'decimal':
          this.inputDecimal();
          break;
        case 'hex-digit':
          this.inputHexDigit(value);
          break;
        case 'bitwise':
          this.handleBitwise(value);
          break;
        case 'set-radix':
          this.setProgrammerRadix(parseInt(value, 10));
          break;
        case 'operator':
          this.handleOperator(value, btn);
          break;
        case 'equals':
          this.handleEquals();
          break;
        case 'clear':
          this.handleClear();
          break;
        case 'toggle-sign':
          this.toggleSign();
          break;
        case 'percent':
          this.handlePercent();
          break;
        case 'paren-open':
          this.handleOpenParen();
          break;
        case 'paren-close':
          this.handleCloseParen();
          break;
        case 'scientific':
          this.handleScientific(value);
          break;
        case 'memory':
          this.handleMemory(value);
          break;
        case 'toggle-rad':
          this.toggleAngleMode();
          break;
        case 'toggle-second':
          this.toggleSecondFunction();
          break;
        case 'constant':
          this.inputConstant(value);
          break;
        case 'backspace':
          this.deleteLastDigit();
          break;
      }
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Swipe on display to delete last digit (Iconic Apple gesture)
    this.setupDisplaySwipe();

    // Copy to clipboard by clicking display
    if (this.displayEl) {
      this.displayEl.addEventListener('click', () => this.copyToClipboard());
    }

    // Window theme & mode toggle buttons
    this.setupWindowControls();
  }

  triggerHaptic(btn, action) {
    if (window.calcAudio) {
      if (action === 'equals') window.calcAudio.playClick('equals');
      else if (action === 'operator') window.calcAudio.playClick('operator');
      else if (action === 'clear') window.calcAudio.playClick('clear');
      else window.calcAudio.playClick('number');
    }

    // Button press visual spring effect
    btn.classList.add('btn-pressed');
    setTimeout(() => btn.classList.remove('btn-pressed'), 120);
  }

  inputDigit(digit) {
    this.clearOperatorHighlight();

    if (this.waitingForSecondOperand) {
      this.displayValue = digit;
      this.waitingForSecondOperand = false;
    } else {
      if (this.isResult) {
        this.displayValue = digit;
        this.isResult = false;
        this.expressionTape = '';
      } else if (this.displayValue === '0') {
        this.displayValue = digit;
      } else if (this.displayValue === '-0') {
        this.displayValue = '-' + digit;
      } else {
        // Enforce max digits like Apple (up to 12 digits input)
        const digitsOnly = this.displayValue.replace(/[^0-9]/g, '');
        if (digitsOnly.length < 12) {
          this.displayValue += digit;
        }
      }
    }

    this.updateDisplay();
  }

  inputDecimal() {
    this.clearOperatorHighlight();

    if (this.waitingForSecondOperand) {
      this.displayValue = '0.';
      this.waitingForSecondOperand = false;
      this.updateDisplay();
      return;
    }

    if (this.isResult) {
      this.displayValue = '0.';
      this.isResult = false;
      this.expressionTape = '';
      this.updateDisplay();
      return;
    }

    if (!this.displayValue.includes('.')) {
      this.displayValue += '.';
      this.updateDisplay();
    }
  }

  handleOperator(nextOperator, btnElement) {
    const inputValue = parseFloat(this.displayValue);

    // RPN Mode calculation
    if (this.isRpnActive && this.rpnStack.length > 0) {
      let val2 = parseFloat(this.displayValue);
      let val1 = this.rpnStack.pop();
      const result = this.calculate(val1, val2, nextOperator);
      if (result === 'Error') {
        this.handleError();
        return;
      }
      this.displayValue = `${parseFloat(result.toFixed(10))}`;
      this.rpnStack.push(parseFloat(result.toFixed(10)));
      this.waitingForSecondOperand = true;
      this.isResult = true;
      this.expressionTape = `${this.formatDisplayValue(val1)} ${this.getOperatorSymbol(nextOperator)} ${this.formatDisplayValue(val2)}`;
      this.updateDisplay();
      return;
    }

    // If user presses another operator without typing a number, just update operator
    if (this.operator && this.waitingForSecondOperand) {
      this.operator = nextOperator;
      this.highlightOperator(btnElement);
      this.expressionTape = `${this.formatDisplayValue(this.firstOperand)} ${this.getOperatorSymbol(nextOperator)}`;
      this.updateDisplay();
      return;
    }

    if (this.firstOperand === null && !isNaN(inputValue)) {
      this.firstOperand = inputValue;
    } else if (this.operator) {
      const result = this.calculate(this.firstOperand, inputValue, this.operator);
      if (result === 'Error') {
        this.handleError();
        return;
      }
      this.displayValue = `${parseFloat(result.toFixed(10))}`;
      this.firstOperand = parseFloat(result.toFixed(10));
    }

    this.waitingForSecondOperand = true;
    this.operator = nextOperator;
    this.isResult = false;
    this.highlightOperator(btnElement);

    this.expressionTape = `${this.formatDisplayValue(this.firstOperand)} ${this.getOperatorSymbol(nextOperator)}`;
    this.updateDisplay();
  }

  calculate(first, second, op) {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '*':
        return first * second;
      case '/':
        if (second === 0) return 'Error';
        return first / second;
      case 'power':
        return Math.pow(first, second);
      case 'yroot':
        if (second === 0) return 'Error';
        return Math.pow(first, 1 / second);
      case 'ee':
        return first * Math.pow(10, second);
      case 'and':
        return Number(BigInt(Math.trunc(first)) & BigInt(Math.trunc(second)));
      case 'or':
        return Number(BigInt(Math.trunc(first)) | BigInt(Math.trunc(second)));
      case 'xor':
        return Number(BigInt(Math.trunc(first)) ^ BigInt(Math.trunc(second)));
      case 'nor': {
        const mask = (1n << BigInt(this.programmerWordBits || 64)) - 1n;
        return Number(~(BigInt(Math.trunc(first)) | BigInt(Math.trunc(second))) & mask);
      }
      default:
        return second;
    }
  }

  handleEquals() {
    this.clearOperatorHighlight();

    if (this.isRpnActive) {
      let inputValue = parseFloat(this.displayValue);
      if (!isNaN(inputValue)) {
        this.rpnStack.push(inputValue);
        this.waitingForSecondOperand = true;
        this.showToast(`RPN Stack: [${this.rpnStack.slice(-3).map(n => this.formatDisplayValue(n)).join(', ')}]`);
        return;
      }
    }

    let inputValue = parseFloat(this.displayValue);
    if (isNaN(inputValue)) return;

    // Apple Calculator Repeat Equals logic
    if (this.operator !== null) {
      this.lastOperator = this.operator;
      this.lastSecondOperand = inputValue;

      const result = this.calculate(this.firstOperand, inputValue, this.operator);
      if (result === 'Error') {
        this.handleError();
        return;
      }

      const formattedResult = parseFloat(result.toFixed(10));
      this.addHistory(
        `${this.formatDisplayValue(this.firstOperand)} ${this.getOperatorSymbol(this.operator)} ${this.formatDisplayValue(inputValue)}`,
        formattedResult
      );

      this.expressionTape = `${this.formatDisplayValue(this.firstOperand)} ${this.getOperatorSymbol(this.operator)} ${this.formatDisplayValue(inputValue)} =`;
      this.displayValue = `${formattedResult}`;
      this.firstOperand = formattedResult;
      this.operator = null;
      this.waitingForSecondOperand = false;
      this.isResult = true;
    } else if (this.lastOperator && this.lastSecondOperand !== null) {
      // Repeat last operation on pressing '=' again
      const result = this.calculate(inputValue, this.lastSecondOperand, this.lastOperator);
      if (result === 'Error') {
        this.handleError();
        return;
      }

      const formattedResult = parseFloat(result.toFixed(10));
      this.addHistory(
        `${this.formatDisplayValue(inputValue)} ${this.getOperatorSymbol(this.lastOperator)} ${this.formatDisplayValue(this.lastSecondOperand)}`,
        formattedResult
      );

      this.expressionTape = `${this.formatDisplayValue(inputValue)} ${this.getOperatorSymbol(this.lastOperator)} ${this.formatDisplayValue(this.lastSecondOperand)} =`;
      this.displayValue = `${formattedResult}`;
      this.firstOperand = formattedResult;
      this.isResult = true;
    }

    this.updateDisplay();
  }

  handleClear() {
    this.clearOperatorHighlight();

    if (this.displayValue !== '0' && !this.isResult) {
      // 'C' state: only clear current input
      this.displayValue = '0';
    } else {
      // 'AC' state: clear everything
      this.displayValue = '0';
      this.firstOperand = null;
      this.operator = null;
      this.waitingForSecondOperand = false;
      this.lastOperator = null;
      this.lastSecondOperand = null;
      this.expressionTape = '';
      this.parenStack = [];
      this.isResult = false;
    }

    this.updateDisplay();
  }

  toggleSign() {
    if (this.displayValue === 'Error') return;

    if (this.displayValue === '0') {
      this.displayValue = '-0';
    } else if (this.displayValue === '-0') {
      this.displayValue = '0';
    } else if (this.displayValue.startsWith('-')) {
      this.displayValue = this.displayValue.slice(1);
    } else {
      this.displayValue = '-' + this.displayValue;
    }

    if (this.isResult) {
      this.firstOperand = parseFloat(this.displayValue);
    }

    this.updateDisplay();
  }

  handlePercent() {
    if (this.displayValue === 'Error') return;
    const current = parseFloat(this.displayValue);

    // Apple percentage logic:
    // If pending addition/subtraction: X + Y% = X + (X * Y / 100)
    // If pending multiplication/division: X * Y% = X * (Y / 100)
    // If no pending operator: X% = X / 100
    if (this.operator && this.firstOperand !== null) {
      if (this.operator === '+' || this.operator === '-') {
        const percentVal = this.firstOperand * (current / 100);
        this.displayValue = `${parseFloat(percentVal.toFixed(10))}`;
      } else {
        const percentVal = current / 100;
        this.displayValue = `${parseFloat(percentVal.toFixed(10))}`;
      }
    } else {
      const result = current / 100;
      this.displayValue = `${parseFloat(result.toFixed(10))}`;
      this.firstOperand = parseFloat(result.toFixed(10));
    }

    this.updateDisplay();
  }

  // Parentheses logic
  handleOpenParen() {
    this.parenStack.push({
      firstOperand: this.firstOperand,
      operator: this.operator,
      expressionTape: this.expressionTape
    });

    this.expressionTape += ' (';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  handleCloseParen() {
    if (this.parenStack.length === 0) return;

    // Resolve internal equation first
    let innerValue = parseFloat(this.displayValue);
    if (this.operator && this.firstOperand !== null) {
      innerValue = this.calculate(this.firstOperand, innerValue, this.operator);
      if (innerValue === 'Error') {
        this.handleError();
        return;
      }
    }

    const state = this.parenStack.pop();
    this.firstOperand = state.firstOperand;
    this.operator = state.operator;
    this.expressionTape = state.expressionTape + ` ${parseFloat(innerValue.toFixed(10))})`;
    this.displayValue = `${parseFloat(innerValue.toFixed(10))}`;
    this.waitingForSecondOperand = false;
    this.updateDisplay();
  }

  // Scientific functions
  handleScientific(func) {
    if (this.displayValue === 'Error') return;
    const val = parseFloat(this.displayValue);
    let result = 0;
    let label = '';

    // Angle conversion helper
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    switch (func) {
      // Powers & Roots
      case 'sq':
        result = val * val;
        label = `sqr(${val})`;
        break;
      case 'cube':
        result = Math.pow(val, 3);
        label = `cube(${val})`;
        break;
      case 'sqrt':
        if (val < 0) { this.handleError(); return; }
        result = Math.sqrt(val);
        label = `√(${val})`;
        break;
      case 'cbrt':
        result = Math.cbrt(val);
        label = `∛(${val})`;
        break;
      case 'reciprocal':
        if (val === 0) { this.handleError(); return; }
        result = 1 / val;
        label = `1/(${val})`;
        break;
      case 'factorial':
        if (val < 0 || !Number.isInteger(val)) { this.handleError(); return; }
        result = this.factorial(val);
        label = `fact(${val})`;
        break;
      case 'exp':
        result = Math.exp(val);
        label = `e^(${val})`;
        break;
      case 'pow10':
        result = Math.pow(10, val);
        label = `10^(${val})`;
        break;
      case 'pow2':
        result = Math.pow(2, val);
        label = `2^(${val})`;
        break;
      case 'ln':
        if (val <= 0) { this.handleError(); return; }
        result = Math.log(val);
        label = `ln(${val})`;
        break;
      case 'log10':
        if (val <= 0) { this.handleError(); return; }
        result = Math.log10(val);
        label = `log10(${val})`;
        break;
      case 'log2':
        if (val <= 0) { this.handleError(); return; }
        result = Math.log2(val);
        label = `log2(${val})`;
        break;

      // Trigonometry
      case 'sin':
        result = Math.sin(this.angleMode === 'deg' ? toRad(val) : val);
        label = `sin(${val})`;
        break;
      case 'cos':
        result = Math.cos(this.angleMode === 'deg' ? toRad(val) : val);
        label = `cos(${val})`;
        break;
      case 'tan':
        result = Math.tan(this.angleMode === 'deg' ? toRad(val) : val);
        label = `tan(${val})`;
        break;
      case 'asin':
        if (val < -1 || val > 1) { this.handleError(); return; }
        result = Math.asin(val);
        if (this.angleMode === 'deg') result = toDeg(result);
        label = `sin⁻¹(${val})`;
        break;
      case 'acos':
        if (val < -1 || val > 1) { this.handleError(); return; }
        result = Math.acos(val);
        if (this.angleMode === 'deg') result = toDeg(result);
        label = `cos⁻¹(${val})`;
        break;
      case 'atan':
        result = Math.atan(val);
        if (this.angleMode === 'deg') result = toDeg(result);
        label = `tan⁻¹(${val})`;
        break;

      // Hyperbolic
      case 'sinh':
        result = Math.sinh(val);
        label = `sinh(${val})`;
        break;
      case 'cosh':
        result = Math.cosh(val);
        label = `cosh(${val})`;
        break;
      case 'tanh':
        result = Math.tanh(val);
        label = `tanh(${val})`;
        break;
      case 'asinh':
        result = Math.asinh(val);
        label = `sinh⁻¹(${val})`;
        break;
      case 'acosh':
        if (val < 1) { this.handleError(); return; }
        result = Math.acosh(val);
        label = `cosh⁻¹(${val})`;
        break;
      case 'atanh':
        if (val <= -1 || val >= 1) { this.handleError(); return; }
        result = Math.atanh(val);
        label = `tanh⁻¹(${val})`;
        break;

      default:
        return;
    }

    const formatted = parseFloat(result.toFixed(10));
    this.addHistory(label, formatted);
    this.expressionTape = `${label} =`;
    this.displayValue = `${formatted}`;
    this.isResult = true;
    this.updateDisplay();
  }

  factorial(n) {
    if (n > 170) return Infinity;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  // Memory functions
  handleMemory(action) {
    const val = parseFloat(this.displayValue) || 0;
    switch (action) {
      case 'mc':
        this.memory = 0;
        this.showToast('Memory Cleared');
        break;
      case 'm+':
        this.memory += val;
        this.showToast(`M+ (${this.memory})`);
        break;
      case 'm-':
        this.memory -= val;
        this.showToast(`M- (${this.memory})`);
        break;
      case 'mr':
        this.displayValue = `${parseFloat(this.memory.toFixed(10))}`;
        this.waitingForSecondOperand = false;
        this.showToast(`Recalled ${this.memory}`);
        break;
    }
    this.updateDisplay();
  }

  // Constants
  inputConstant(type) {
    if (type === 'pi') {
      this.displayValue = `${Math.PI}`;
    } else if (type === 'e') {
      this.displayValue = `${Math.E}`;
    } else if (type === 'rand') {
      this.displayValue = `${parseFloat(Math.random().toFixed(8))}`;
    }
    this.waitingForSecondOperand = false;
    this.isResult = false;
    this.updateDisplay();
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'rad' ? 'deg' : 'rad';
    const radBtn = document.getElementById('btn-rad');
    if (radBtn) {
      radBtn.innerText = this.angleMode === 'rad' ? 'Rad' : 'Deg';
    }
    this.updateDisplay();
  }

  toggleSecondFunction() {
    this.isSecondMode = !this.isSecondMode;
    const btn2nd = document.getElementById('btn-2nd');
    if (btn2nd) {
      btn2nd.classList.toggle('active-2nd', this.isSecondMode);
    }

    // Toggle scientific button labels
    document.querySelectorAll('[data-second-value]').forEach((el) => {
      const original = el.dataset.value;
      const secondVal = el.dataset.secondValue;
      const originalHtml = el.dataset.originalHtml || el.innerHTML;
      const secondHtml = el.dataset.secondHtml;

      if (!el.dataset.originalHtml) {
        el.dataset.originalHtml = originalHtml;
      }

      if (this.isSecondMode) {
        el.dataset.value = secondVal;
        el.innerHTML = secondHtml;
      } else {
        el.dataset.value = el.dataset.firstValue || original;
        el.innerHTML = el.dataset.originalHtml;
      }
    });
  }

  // Error handling
  handleError() {
    this.displayValue = 'Error';
    this.expressionTape = '';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.isResult = true;
    this.updateDisplay();
  }

  // Operator UI highlighting
  highlightOperator(btn) {
    this.clearOperatorHighlight();
    if (btn) {
      btn.classList.add('operator-active');
      this.activeOperatorBtn = btn;
    }
  }

  clearOperatorHighlight() {
    if (this.activeOperatorBtn) {
      this.activeOperatorBtn.classList.remove('operator-active');
      this.activeOperatorBtn = null;
    }
  }

  getOperatorSymbol(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      case 'power': return '^';
      case 'yroot': return '√';
      case 'ee': return 'EE';
      default: return '';
    }
  }

  // Display Formatting & Font auto-resizing
  updateDisplay() {
    if (!this.displayEl) return;

    // Toggle AC / C label on all clear buttons
    const clearText = (this.displayValue !== '0' && !this.isResult) ? 'C' : 'AC';
    document.querySelectorAll('[data-action="clear"]').forEach(btn => {
      btn.textContent = clearText;
    });

    // Update angle badge and memory badge
    if (this.radBadgeEl) {
      this.radBadgeEl.textContent = this.angleMode.toUpperCase();
    }
    if (this.memoryBadgeEl) {
      this.memoryBadgeEl.style.display = this.memory !== 0 ? 'inline-block' : 'none';
    }

    // Expression sub-display
    if (this.subDisplayEl) {
      this.subDisplayEl.textContent = this.expressionTape;
    }

    // Format display number with thousands commas
    const formatted = this.formatDisplayValue(this.displayValue);
    this.displayEl.textContent = formatted;

    // Dynamically adjust font size according to string length
    this.adjustDisplayFontSize(formatted);

    // If in-line unit converter is active, update converted output live
    this.updateInlineConversion();

    // If unit converter is open, update converted output
    if (this.currentMode === 'converter' && window.updateConverterLive) {
      window.updateConverterLive(this.displayValue);
    }

    // If programmer mode, refresh radix panels live
    if (this.currentMode === 'programmer') {
      this.updateProgrammerDisplays();
    }
  }

  formatDisplayValue(val) {
    if (val === null || val === undefined) return '0';
    if (val === 'Error') return 'Error';

    const str = val.toString();

    // Programmer Mode formatting
    if (this.currentMode === 'programmer') {
      if (this.programmerRadix === 16) {
        return str.toUpperCase();
      }
      if (this.programmerRadix === 2) {
        return str.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
      }
      if (this.programmerRadix === 8) {
        return str;
      }
    }

    // Preserve typing -0 or decimal points in progress
    if (str === '-0') return '-0';
    if (str === '0.') return '0.';
    if (str === '-0.') return '-0.';

    // Scientific notation check
    if (str.includes('e') || str.includes('E')) {
      return str;
    }

    const parts = str.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Format integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedInteger + decimalPart;
  }

  adjustDisplayFontSize(formattedText) {
    const len = formattedText.length;
    let size = '4.6rem';

    if (this.currentMode === 'scientific') {
      if (len > 20) size = '2.2rem';
      else if (len > 16) size = '2.6rem';
      else if (len > 12) size = '3.2rem';
      else if (len > 9) size = '3.8rem';
      else size = '4.2rem';
    } else {
      if (len > 14) size = '2.2rem';
      else if (len > 11) size = '2.7rem';
      else if (len > 8) size = '3.4rem';
      else if (len > 6) size = '4.0rem';
      else size = '4.6rem';
    }

    this.displayEl.style.fontSize = size;
  }

  // Display swipe to delete last digit (Apple gesture)
  setupDisplaySwipe() {
    let startX = 0;
    let startY = 0;

    const displayContainer = document.querySelector('.calc-display-container');
    if (!displayContainer) return;

    displayContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    displayContainer.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].clientX - startX;
      const diffY = e.changedTouches[0].clientY - startY;

      if (Math.abs(diffX) > 40 && Math.abs(diffY) < 30) {
        this.deleteLastDigit();
      }
    });

    // Mouse drag swipe support
    let isMouseDown = false;
    displayContainer.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      startX = e.clientX;
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const diffX = e.clientX - startX;
      if (Math.abs(diffX) > 40) {
        this.deleteLastDigit();
      }
    });
  }

  deleteLastDigit() {
    if (this.displayValue === 'Error' || this.isResult) {
      this.displayValue = '0';
      this.updateDisplay();
      return;
    }

    if (this.displayValue.length > 1) {
      this.displayValue = this.displayValue.slice(0, -1);
      if (this.displayValue === '-' || this.displayValue === '') {
        this.displayValue = '0';
      }
    } else {
      this.displayValue = '0';
    }

    if (window.calcAudio) window.calcAudio.playClick('clear');
    this.updateDisplay();
  }

  // Copy display value to clipboard
  copyToClipboard() {
    const rawVal = this.displayValue;
    navigator.clipboard.writeText(rawVal).then(() => {
      this.showToast(`Copied: ${this.formatDisplayValue(rawVal)}`);
    }).catch(() => {
      this.showToast('Copied to clipboard');
    });
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 1800);
  }

  // History Tape Management
  addHistory(expression, result) {
    const item = {
      expression,
      result: this.formatDisplayValue(result),
      rawResult: result,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.history.unshift(item);
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('apple_calc_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyListEl) return;
    if (this.history.length === 0) {
      this.historyListEl.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    this.historyListEl.innerHTML = this.history.map((item, index) => `
      <div class="history-item" data-index="${index}">
        <div class="history-expr">${item.expression}</div>
        <div class="history-res">= ${item.result}</div>
        <div class="history-time">${item.time}</div>
      </div>
    `).join('');

    // Clicking an item loads it back into calculator
    this.historyListEl.querySelectorAll('.history-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = el.dataset.index;
        const item = this.history[idx];
        if (item) {
          this.displayValue = `${item.rawResult}`;
          this.expressionTape = item.expression;
          this.firstOperand = item.rawResult;
          this.isResult = true;
          this.updateDisplay();
          this.showToast('Restored calculation');
        }
      });
    });
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('apple_calc_history');
    this.renderHistory();
    this.showToast('History Cleared');
  }

  // Keyboard Navigation
  handleKeyboard(e) {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'SELECT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable ||
      this.currentMode === 'mathnotes'
    ) {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      this.inputDigit(e.key);
    } else if (e.key === '.') {
      e.preventDefault();
      this.inputDecimal();
    } else if (e.key === '+' || e.key === '-') {
      e.preventDefault();
      const btn = document.querySelector(`.calc-btn[data-value="${e.key}"]`);
      this.handleOperator(e.key, btn);
    } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      const btn = document.querySelector('.calc-btn[data-value="*"]');
      this.handleOperator('*', btn);
    } else if (e.key === '/') {
      e.preventDefault();
      const btn = document.querySelector('.calc-btn[data-value="/"]');
      this.handleOperator('/', btn);
    } else if (e.key === '=' || e.key === 'Enter') {
      e.preventDefault();
      this.handleEquals();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.handleClear();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.deleteLastDigit();
    } else if (e.key === '%') {
      e.preventDefault();
      this.handlePercent();
    } else if (e.key === '(') {
      e.preventDefault();
      this.handleOpenParen();
    } else if (e.key === ')') {
      e.preventDefault();
      this.handleCloseParen();
    } else if (e.key === '^') {
      e.preventDefault();
      const btn = document.querySelector('.calc-btn[data-value="power"]');
      this.handleOperator('power', btn);
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      this.inputConstant('pi');
    } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.inputConstant('e');
    }
  }

  setupWindowControls() {
    // Traffic lights controls
    const trafficClose = document.getElementById('btn-traffic-close');
    const trafficMin = document.getElementById('btn-traffic-min');
    const trafficExpand = document.getElementById('btn-traffic-expand');

    if (trafficClose) {
      trafficClose.addEventListener('click', () => {
        this.displayValue = '0';
        this.firstOperand = null;
        this.operator = null;
        this.waitingForSecondOperand = false;
        this.lastOperator = null;
        this.lastSecondOperand = null;
        this.expressionTape = '';
        this.parenStack = [];
        this.isResult = false;
        this.clearOperatorHighlight();
        this.updateDisplay();
        this.showToast('Calculator Reset');
        if (window.calcAudio) window.calcAudio.playClick('clear');
      });
    }

    if (trafficMin) {
      trafficMin.addEventListener('click', () => {
        const basicTab = document.getElementById('tab-basic');
        if (basicTab) basicTab.click();
      });
    }

    if (trafficExpand) {
      trafficExpand.addEventListener('click', () => {
        if (this.currentDevice === 'mac') {
          this.toggleMacExpanded();
        } else {
          const targetMode = this.currentMode === 'scientific' ? 'basic' : 'scientific';
          const targetTab = document.getElementById(`tab-${targetMode}`);
          if (targetTab) targetTab.click();
        }
      });
    }

    // Mac Titlebar - Window Resize Toggle Button
    const macResizeBtn = document.getElementById('mac-window-resize-btn');
    if (macResizeBtn) {
      macResizeBtn.addEventListener('click', () => {
        this.toggleMacExpanded();
      });
    }

    // Mac Draggable Resize Handle
    this.setupMacResizeHandle();

    // Inside iPhone Navigation Bar - History Button
    const iphoneHistoryBtn = document.getElementById('btn-iphone-history');
    if (iphoneHistoryBtn && this.historyDrawerEl) {
      iphoneHistoryBtn.addEventListener('click', () => {
        this.historyDrawerEl.classList.add('open');
      });
    }

    // Mac Titlebar - Split Sidebar History Button
    const macSidebarBtn = document.getElementById('mac-sidebar-btn');
    if (macSidebarBtn && this.historyDrawerEl) {
      macSidebarBtn.addEventListener('click', () => {
        this.historyDrawerEl.classList.toggle('open');
      });
    }

    // Calculator Mode Popover (Both iPhone & Mac button)
    const iphoneCalcMenuBtn = document.getElementById('btn-iphone-calc-menu');
    const macCalcMenuBtn = document.getElementById('mac-calc-menu-btn');
    const popover = document.getElementById('ios-menu-popover');

    const togglePopover = (e) => {
      e.stopPropagation();
      if (popover) popover.classList.toggle('open');
    };

    if (iphoneCalcMenuBtn) iphoneCalcMenuBtn.addEventListener('click', togglePopover);
    if (macCalcMenuBtn) macCalcMenuBtn.addEventListener('click', togglePopover);

    document.addEventListener('click', (e) => {
      if (!popover) return;
      const clickedIphoneBtn = iphoneCalcMenuBtn && iphoneCalcMenuBtn.contains(e.target);
      const clickedMacBtn = macCalcMenuBtn && macCalcMenuBtn.contains(e.target);
      if (!popover.contains(e.target) && !clickedIphoneBtn && !clickedMacBtn) {
        popover.classList.remove('open');
      }
    });

    // Popover Menu Items
    const popBasic = document.getElementById('pop-item-basic');
    const popSci = document.getElementById('pop-item-scientific');
    const popProg = document.getElementById('pop-item-programmer');
    const popNotes = document.getElementById('pop-item-mathnotes');
    const popConvert = document.getElementById('menu-toggle-convert');
    const popRpn = document.getElementById('menu-toggle-rpn');

    if (popBasic) {
      popBasic.addEventListener('click', () => {
        this.switchMode('basic');
        if (popover) popover.classList.remove('open');
      });
    }
    if (popSci) {
      popSci.addEventListener('click', () => {
        this.switchMode('scientific');
        if (popover) popover.classList.remove('open');
      });
    }
    if (popProg) {
      popProg.addEventListener('click', () => {
        this.switchMode('programmer');
        if (popover) popover.classList.remove('open');
      });
    }
    if (popNotes) {
      popNotes.addEventListener('click', () => {
        this.switchMode('mathnotes');
        if (popover) popover.classList.remove('open');
      });
    }
    if (popConvert) {
      popConvert.addEventListener('click', () => {
        this.toggleConvertMode();
        if (popover) popover.classList.remove('open');
      });
    }
    if (popRpn) {
      popRpn.addEventListener('click', () => {
        this.toggleRpnMode();
        if (popover) popover.classList.remove('open');
      });
    }

    // Programmer Radix Display Rows
    document.querySelectorAll('.radix-row').forEach(row => {
      row.addEventListener('click', () => {
        const radix = parseInt(row.dataset.radix, 10);
        this.setProgrammerRadix(radix);
      });
    });

    // Programmer Word Size Pills
    document.querySelectorAll('.word-size-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const bits = parseInt(btn.dataset.bits, 10);
        this.setProgrammerWordSize(bits);
      });
    });

    // In-line Converter Unit Selectors and Swap Button
    const inSource = document.getElementById('inline-source-unit');
    const inTarget = document.getElementById('inline-target-unit');
    const inSwap = document.getElementById('inline-swap-btn');

    if (inSource && inTarget) {
      inSource.addEventListener('change', () => this.updateInlineConversion());
      inTarget.addEventListener('change', () => this.updateInlineConversion());
    }
    if (inSwap) {
      inSwap.addEventListener('click', () => {
        const tmp = inSource.value;
        inSource.value = inTarget.value;
        inTarget.value = tmp;
        this.updateInlineConversion();
        if (window.calcAudio) window.calcAudio.playClick('operator');
      });
    }

    // Math Notes View controls
    const closeNotesBtn = document.getElementById('btn-close-notes');
    if (closeNotesBtn) {
      closeNotesBtn.addEventListener('click', () => {
        this.switchMode('basic');
      });
    }

    const clearNotesBtn = document.getElementById('btn-clear-notes');
    const notesTextarea = document.getElementById('notes-textarea');
    const notesResults = document.getElementById('notes-results-panel');

    if (clearNotesBtn && notesTextarea) {
      clearNotesBtn.addEventListener('click', () => {
        notesTextarea.value = '';
        notesTextarea.focus();
        this.evaluateNotes('', notesResults);
      });
    }

    if (notesTextarea && notesResults) {
      notesTextarea.addEventListener('input', () => this.evaluateNotes(notesTextarea.value, notesResults));
      if (notesTextarea.value) {
        this.evaluateNotes(notesTextarea.value, notesResults);
      }
    }

    // Quick Math Toolbar buttons (insert symbol at cursor)
    document.querySelectorAll('.notes-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const toInsert = btn.dataset.insert;
        if (!notesTextarea || !toInsert) return;

        const start = notesTextarea.selectionStart !== undefined ? notesTextarea.selectionStart : notesTextarea.value.length;
        const end = notesTextarea.selectionEnd !== undefined ? notesTextarea.selectionEnd : notesTextarea.value.length;
        const text = notesTextarea.value;

        notesTextarea.value = text.substring(0, start) + toInsert + text.substring(end);
        notesTextarea.selectionStart = notesTextarea.selectionEnd = start + toInsert.length;
        notesTextarea.focus();

        if (notesResults) {
          this.evaluateNotes(notesTextarea.value, notesResults);
        }
      });
    });

    // Mac Mode Switcher segmented control
    document.querySelectorAll('.mac-seg-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchMode(tab.dataset.mode);
      });
    });

    const macHistoryBtn = document.getElementById('mac-history-btn');
    if (macHistoryBtn && this.historyDrawerEl) {
      macHistoryBtn.addEventListener('click', () => {
        this.historyDrawerEl.classList.toggle('open');
      });
    }

    // Device Switcher buttons (iPhone vs Mac)
    const deviceBtnIphone = document.getElementById('device-btn-iphone');
    const deviceBtnMac = document.getElementById('device-btn-mac');

    if (deviceBtnIphone) {
      deviceBtnIphone.addEventListener('click', () => this.switchDevice('iphone'));
    }
    if (deviceBtnMac) {
      deviceBtnMac.addEventListener('click', () => this.switchDevice('mac'));
    }

    // Rotate iPhone Button
    const rotateBtn = document.getElementById('btn-rotate-phone');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => this.toggleOrientation());
    }

    // Dynamic Island interactive click
    const dynamicIsland = document.getElementById('dynamic-island');
    if (dynamicIsland) {
      dynamicIsland.addEventListener('click', () => {
        this.showToast(`Calc: ${this.formatDisplayValue(this.displayValue)}`);
        if (window.calcAudio) window.calcAudio.playClick('operator');
      });
    }

    // History drawer controls (Inside Close and Clear)
    const historyCloseBtn = document.getElementById('history-close-btn');
    const historyClearBtn = document.getElementById('history-clear-btn');

    if (historyCloseBtn && this.historyDrawerEl) {
      historyCloseBtn.addEventListener('click', () => {
        this.historyDrawerEl.classList.remove('open');
      });
    }
    if (historyClearBtn) {
      historyClearBtn.addEventListener('click', () => this.clearHistory());
    }

    // Sound toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn && window.calcAudio) {
      soundBtn.addEventListener('click', () => {
        const enabled = window.calcAudio.toggleSound();
        soundBtn.classList.toggle('muted', !enabled);
        soundBtn.title = enabled ? 'Mute Sound' : 'Unmute Sound';
        this.showToast(enabled ? 'Sound Enabled' : 'Sound Muted');
      });
    }

    // Theme toggle (Dark / Light)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('light-theme');
        themeBtn.title = isDark ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        this.showToast(isDark ? 'Light Mode' : 'Dark Mode');
      });
    }
  }

  initClock() {
    const updateTime = () => {
      const clockEl = document.getElementById('status-clock');
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    };
    updateTime();
    if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      const timer = setInterval(updateTime, 10000);
      if (timer && timer.unref) timer.unref();
    }
  }

  switchDevice(device) {
    this.currentDevice = device;

    // Reset any custom inline drag styles or expanded classes
    if (this.calculatorCard) {
      this.calculatorCard.style.width = '';
      this.calculatorCard.style.height = '';
      this.calculatorCard.classList.remove('mac-expanded');
    }

    // Toggle active pills
    const iphoneBtn = document.getElementById('device-btn-iphone');
    const macBtn = document.getElementById('device-btn-mac');
    if (iphoneBtn && macBtn) {
      iphoneBtn.classList.toggle('active', device === 'iphone');
      macBtn.classList.toggle('active', device === 'mac');
    }

    document.body.classList.toggle('device-mac-active', device === 'mac');

    if (device === 'mac') {
      this.isLandscape = false;
    } else if (device === 'iphone' && this.currentMode === 'programmer') {
      this.switchMode('basic');
    }

    this.applyCardClasses();
    this.showToast(device === 'iphone' ? 'iPhone Edition' : 'Mac Edition');
  }

  toggleOrientation() {
    if (this.currentDevice !== 'iphone') return;
    this.isLandscape = !this.isLandscape;

    if (this.isLandscape) {
      this.switchMode('scientific');
      this.showToast('Landscape Scientific Mode');
    } else {
      this.showToast('Portrait Mode');
    }

    this.applyCardClasses();
  }

  applyCardClasses() {
    if (!this.calculatorCard) return;
    const classes = [
      'calculator-card',
      `device-${this.currentDevice}`,
      `mode-${this.currentMode}`
    ];
    if (this.currentDevice === 'iphone' && this.isLandscape) {
      classes.push('orientation-landscape');
    }
    this.calculatorCard.className = classes.join(' ');
  }

  toggleConvertMode() {
    this.isConvertActive = !this.isConvertActive;
    const checkIcon = document.getElementById('convert-check-icon');
    if (checkIcon) checkIcon.textContent = this.isConvertActive ? '✓' : '';

    const inlineConverter = document.getElementById('inline-converter');
    const standardDisplay = document.getElementById('standard-display-container');
    if (inlineConverter && standardDisplay) {
      if (this.isConvertActive) {
        inlineConverter.style.display = 'flex';
        standardDisplay.style.display = 'none';
        this.updateInlineConversion();
      } else {
        inlineConverter.style.display = 'none';
        standardDisplay.style.display = 'flex';
      }
    }
    this.showToast(this.isConvertActive ? 'Currency Converter ON' : 'Converter OFF');
  }

  updateInlineConversion() {
    if (!this.isConvertActive) return;
    const srcValEl = document.getElementById('convert-source-val');
    const tgtValEl = document.getElementById('convert-target-val');
    const srcUnitEl = document.getElementById('inline-source-unit');
    const tgtUnitEl = document.getElementById('inline-target-unit');
    if (!srcValEl || !tgtValEl || !srcUnitEl || !tgtUnitEl) return;

    const rawVal = this.displayValue === 'Error' ? '0' : this.displayValue;
    srcValEl.textContent = this.formatDisplayValue(rawVal);

    if (window.UnitConverter) {
      const converted = window.UnitConverter.convert(rawVal, 'currency', srcUnitEl.value, tgtUnitEl.value);
      tgtValEl.textContent = this.formatDisplayValue(converted);
    }
  }

  evaluateNotes(text, resultsContainer) {
    if (!resultsContainer) return;
    const lines = text.split('\n');
    const variables = {};

    const resHtml = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Check for assignment: e.g. x = 25 or radius = 5
      const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^=]+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valExpr = assignMatch[2].trim();
        try {
          const val = this.evalMathExpr(valExpr, variables);
          if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
            variables[varName] = val;
            return `<div class="notes-res-line">${varName} = <strong>${this.formatDisplayValue(parseFloat(val.toFixed(8)))}</strong></div>`;
          }
        } catch (e) {}
      }

      // Check for calculation ending with equals or containing equals
      if (trimmed.includes('=')) {
        const parts = trimmed.split('=');
        if (parts.length > 0 && parts[0].trim()) {
          const expr = parts[0].trim();
          try {
            const ans = this.evalMathExpr(expr, variables);
            if (typeof ans === 'number' && !isNaN(ans) && isFinite(ans)) {
              return `<div class="notes-res-line">${expr} = <strong>${this.formatDisplayValue(parseFloat(ans.toFixed(8)))}</strong></div>`;
            }
          } catch (e) {}
        }
      } else {
        // Line without equals: try evaluating as expression
        try {
          const ans = this.evalMathExpr(trimmed, variables);
          if (typeof ans === 'number' && !isNaN(ans) && isFinite(ans)) {
            return `<div class="notes-res-line">${trimmed} = <strong>${this.formatDisplayValue(parseFloat(ans.toFixed(8)))}</strong></div>`;
          }
        } catch (e) {}
      }
      return `<div class="notes-res-line">${trimmed}</div>`;
    }).filter(Boolean).join('');

    resultsContainer.innerHTML = resHtml || '<div class="notes-instructions">Calculations will appear here.</div>';
  }

  evalMathExpr(expr, variables = {}) {
    let jsExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/π/g, 'Math.PI')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\bsqrt\(/gi, 'Math.sqrt(')
      .replace(/\bcbrt\(/gi, 'Math.cbrt(')
      .replace(/\bsin\(/gi, 'Math.sin(')
      .replace(/\bcos\(/gi, 'Math.cos(')
      .replace(/\btan\(/gi, 'Math.tan(')
      .replace(/\babs\(/gi, 'Math.abs(')
      .replace(/\bln\(/gi, 'Math.log(')
      .replace(/\blog\(/gi, 'Math.log10(');

    // Replace variable names with their values
    Object.keys(variables).forEach(v => {
      const reg = new RegExp(`\\b${v}\\b`, 'g');
      jsExpr = jsExpr.replace(reg, `(${variables[v]})`);
    });

    // Verify safe characters only
    const stripped = jsExpr.replace(/Math\.(sqrt|cbrt|sin|cos|tan|abs|log|log10|PI|E)/g, '');
    if (/^[0-9+\-*/().%\s^,]+$/.test(stripped)) {
      return Function(`'use strict'; return (${jsExpr})`)();
    }
    return null;
  }

  switchMode(mode) {
    if (this.calculatorCard) {
      this.calculatorCard.style.width = '';
      this.calculatorCard.style.height = '';
    }

    if (mode === 'converter') {
      this.isConvertActive = true;
      this.currentMode = 'basic';
    } else if (mode === 'basic') {
      this.currentMode = 'basic';
    } else {
      this.currentMode = mode;
    }

    // Update checkmarks in iOS & macOS Sequoia popover
    const checkBasic = document.getElementById('check-basic');
    const checkSci = document.getElementById('check-scientific');
    const checkProg = document.getElementById('check-programmer');
    const checkNotes = document.getElementById('check-mathnotes');
    const checkConvert = document.getElementById('check-convert');
    const checkRpn = document.getElementById('check-rpn');
    const convertBtn = document.getElementById('menu-toggle-convert');

    if (checkBasic) checkBasic.textContent = this.currentMode === 'basic' ? '✓' : '';
    if (checkSci) checkSci.textContent = this.currentMode === 'scientific' ? '✓' : '';
    if (checkProg) checkProg.textContent = this.currentMode === 'programmer' ? '✓' : '';
    if (checkNotes) checkNotes.textContent = this.currentMode === 'mathnotes' ? '✓' : '';
    if (checkConvert) checkConvert.textContent = this.isConvertActive ? '✓' : '';
    if (checkRpn) checkRpn.textContent = this.isRpnActive ? '✓' : '';
    if (convertBtn) convertBtn.classList.toggle('convert-active', this.isConvertActive);

    // Update Mac segmented tabs if present
    document.querySelectorAll('.mac-seg-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });

    const mathNotesView = document.getElementById('math-notes-view');
    const keypadWrapper = document.getElementById('keypad-wrapper');
    const standardDisplay = document.getElementById('standard-display-container');
    const inlineConverter = document.getElementById('inline-converter');
    const progRadixPanel = document.getElementById('programmer-radix-panel');
    const progKeypad = document.getElementById('programmer-keypad');

    if (this.currentMode === 'mathnotes') {
      if (mathNotesView) mathNotesView.style.display = 'flex';
      if (keypadWrapper) keypadWrapper.style.display = 'none';
      if (standardDisplay) standardDisplay.style.display = 'none';
      if (inlineConverter) inlineConverter.style.display = 'none';
    } else if (this.currentMode === 'programmer') {
      if (mathNotesView) mathNotesView.style.display = 'none';
      if (keypadWrapper) keypadWrapper.style.display = 'flex';
      if (progKeypad) progKeypad.style.display = 'flex';
      if (progRadixPanel) progRadixPanel.style.display = 'flex';
      if (this.isConvertActive) {
        if (inlineConverter) inlineConverter.style.display = 'flex';
        if (standardDisplay) standardDisplay.style.display = 'none';
        this.updateInlineConversion();
      } else {
        if (inlineConverter) inlineConverter.style.display = 'none';
        if (standardDisplay) standardDisplay.style.display = 'flex';
      }
      this.updateProgrammerDisplays();
      this.updateProgrammerKeyStates();
    } else {
      if (mathNotesView) mathNotesView.style.display = 'none';
      if (keypadWrapper) keypadWrapper.style.display = 'flex';
      if (progKeypad) progKeypad.style.display = 'none';
      if (progRadixPanel) progRadixPanel.style.display = 'none';
      if (this.isConvertActive) {
        if (inlineConverter) inlineConverter.style.display = 'flex';
        if (standardDisplay) standardDisplay.style.display = 'none';
        this.updateInlineConversion();
      } else {
        if (inlineConverter) inlineConverter.style.display = 'none';
        if (standardDisplay) standardDisplay.style.display = 'flex';
      }
    }

    this.applyCardClasses();
    this.updateDisplay();
  }

  // PROGRAMMER MODE & RPN LOGIC (macOS Sequoia)
  getProgrammerValueBigInt() {
    const numStr = (this.displayValue || '0').replace(/,/g, '').trim();
    if (numStr === 'Error' || numStr === 'NaN' || numStr === '') return 0n;
    let val = 0n;
    try {
      if (this.programmerRadix === 16) {
        val = BigInt('0x' + numStr);
      } else if (this.programmerRadix === 8) {
        val = BigInt('0o' + numStr);
      } else if (this.programmerRadix === 2) {
        val = BigInt('0b' + numStr.replace(/\s+/g, ''));
      } else {
        const intPart = numStr.split('.')[0] || '0';
        val = BigInt(intPart);
      }
    } catch (e) {
      val = 0n;
    }
    const mask = (1n << BigInt(this.programmerWordBits || 64)) - 1n;
    return val & mask;
  }

  updateProgrammerDisplays() {
    const val = this.getProgrammerValueBigInt();
    const hexEl = document.getElementById('radix-val-hex');
    const decEl = document.getElementById('radix-val-dec');
    const octEl = document.getElementById('radix-val-oct');
    const binEl = document.getElementById('radix-val-bin');
    const asciiEl = document.getElementById('ascii-preview');

    if (hexEl) hexEl.textContent = val.toString(16).toUpperCase();
    if (decEl) decEl.textContent = val.toString(10);
    if (octEl) octEl.textContent = val.toString(8);
    if (binEl) {
      const rawBin = val.toString(2);
      const padded = rawBin.padStart(Math.max(8, Math.ceil(rawBin.length / 4) * 4), '0');
      binEl.textContent = padded.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
    }
    if (asciiEl) {
      if (val >= 32n && val <= 126n) {
        const ch = String.fromCharCode(Number(val));
        asciiEl.textContent = `ASCII: '${ch}' (U+${val.toString(16).toUpperCase().padStart(4, '0')})`;
      } else {
        asciiEl.textContent = "ASCII: '\\0'";
      }
    }
  }

  setProgrammerRadix(radix) {
    const val = this.getProgrammerValueBigInt();
    this.programmerRadix = radix;

    // Update active highlight on radix display rows
    document.querySelectorAll('.radix-row').forEach(row => {
      row.classList.toggle('active', parseInt(row.dataset.radix, 10) === radix);
    });

    // Update active highlight on keypad radix buttons
    document.querySelectorAll('.btn-prog-radix').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === radix);
    });

    // Convert display value to new radix
    if (radix === 16) {
      this.displayValue = val.toString(16).toUpperCase();
    } else if (radix === 8) {
      this.displayValue = val.toString(8);
    } else if (radix === 2) {
      this.displayValue = val.toString(2);
    } else {
      this.displayValue = val.toString(10);
    }

    this.updateProgrammerKeyStates();
    this.updateDisplay();
  }

  setProgrammerWordSize(bits) {
    this.programmerWordBits = bits;
    document.querySelectorAll('.word-size-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.bits, 10) === bits);
    });
    const val = this.getProgrammerValueBigInt();
    if (this.programmerRadix === 16) {
      this.displayValue = val.toString(16).toUpperCase();
    } else if (this.programmerRadix === 8) {
      this.displayValue = val.toString(8);
    } else if (this.programmerRadix === 2) {
      this.displayValue = val.toString(2);
    } else {
      this.displayValue = val.toString(10);
    }
    this.updateDisplay();
    this.showToast(`${bits}-bit Word Size`);
  }

  updateProgrammerKeyStates() {
    const r = this.programmerRadix;
    // Hex buttons A-F
    document.querySelectorAll('.btn-prog-hex').forEach(btn => {
      btn.classList.toggle('key-disabled', r !== 16);
      btn.disabled = r !== 16;
    });

    // Numeric buttons
    document.querySelectorAll('#programmer-keypad .btn-number').forEach(btn => {
      const v = btn.dataset.value;
      if (v === '.') {
        btn.classList.add('key-disabled');
        btn.disabled = true;
      } else {
        const digit = parseInt(v, 10);
        const disabled = (r === 2 && digit > 1) || (r === 8 && digit > 7);
        btn.classList.toggle('key-disabled', disabled);
        btn.disabled = disabled;
      }
    });
  }

  inputHexDigit(char) {
    if (this.programmerRadix !== 16) {
      this.setProgrammerRadix(16);
    }
    this.clearOperatorHighlight();

    if (this.waitingForSecondOperand || this.isResult) {
      this.displayValue = char;
      this.waitingForSecondOperand = false;
      this.isResult = false;
    } else if (this.displayValue === '0') {
      this.displayValue = char;
    } else {
      this.displayValue += char;
    }
    this.updateDisplay();
  }

  handleBitwise(op) {
    const bits = BigInt(this.programmerWordBits || 64);
    const mask = (1n << bits) - 1n;
    let val = this.getProgrammerValueBigInt();

    switch (op) {
      case 'not':
        val = (~val) & mask;
        this.setProgrammerDisplayFromBigInt(val);
        break;
      case 'twos':
        val = ((-val) & mask);
        this.setProgrammerDisplayFromBigInt(val);
        break;
      case 'lsh':
        val = (val << 1n) & mask;
        this.setProgrammerDisplayFromBigInt(val);
        break;
      case 'rsh':
        val = (val >> 1n) & mask;
        this.setProgrammerDisplayFromBigInt(val);
        break;
      case 'rol': {
        const highBit = (val >> (bits - 1n)) & 1n;
        val = ((val << 1n) | highBit) & mask;
        this.setProgrammerDisplayFromBigInt(val);
        break;
      }
      case 'ror': {
        const lowBit = val & 1n;
        val = ((val >> 1n) | (lowBit << (bits - 1n))) & mask;
        this.setProgrammerDisplayFromBigInt(val);
        break;
      }
      case 'and':
      case 'or':
      case 'xor':
      case 'nor':
        this.firstOperand = Number(val);
        this.operator = op;
        this.waitingForSecondOperand = true;
        this.expressionTape = `${this.displayValue} ${op.toUpperCase()}`;
        this.updateDisplay();
        break;
    }
  }

  setProgrammerDisplayFromBigInt(val) {
    if (this.programmerRadix === 16) {
      this.displayValue = val.toString(16).toUpperCase();
    } else if (this.programmerRadix === 8) {
      this.displayValue = val.toString(8);
    } else if (this.programmerRadix === 2) {
      this.displayValue = val.toString(2);
    } else {
      this.displayValue = val.toString(10);
    }
    this.updateDisplay();
  }

  toggleRpnMode() {
    this.isRpnActive = !this.isRpnActive;
    const rpnBadge = document.getElementById('rpn-badge');
    if (rpnBadge) rpnBadge.style.display = this.isRpnActive ? 'inline-block' : 'none';
    const checkRpn = document.getElementById('check-rpn');
    if (checkRpn) checkRpn.textContent = this.isRpnActive ? '✓' : '';
    this.showToast(this.isRpnActive ? 'RPN Mode ON' : 'RPN Mode OFF');
  }

  setupMacResizeHandle() {
    const handle = document.getElementById('mac-resize-handle');
    const card = this.calculatorCard;
    if (!handle || !card) return;

    let startX = 0, startY = 0, startW = 0, startH = 0;

    const onPointerMove = (e) => {
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

      const newW = Math.max(270, Math.min(window.innerWidth * 0.96, startW + (clientX - startX)));
      const newH = Math.max(380, Math.min(window.innerHeight * 0.92, startH + (clientY - startY)));

      card.style.width = `${newW}px`;
      card.style.height = `${newH}px`;
      card.classList.remove('mac-expanded');
    };

    const onPointerUp = () => {
      handle.classList.remove('active');
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    const onPointerDown = (e) => {
      if (this.currentDevice !== 'mac') return;
      e.preventDefault();
      startX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      startY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
      const rect = card.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      handle.classList.add('active');

      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    };

    handle.addEventListener('mousedown', onPointerDown);
    handle.addEventListener('touchstart', onPointerDown, { passive: false });
  }

  toggleMacExpanded() {
    if (this.currentDevice !== 'mac') return;
    const card = this.calculatorCard;
    if (!card) return;
    card.style.width = '';
    card.style.height = '';
    const isExpanded = card.classList.toggle('mac-expanded');
    this.showToast(isExpanded ? 'Calculator Resized (Large)' : 'Calculator Resized (Standard)');
    if (window.calcAudio) window.calcAudio.playClick('operator');
  }
}

// Global initialization
window.AppleCalculator = AppleCalculator;

document.addEventListener('DOMContentLoaded', () => {
  window.appleCalc = new AppleCalculator();

  // Initialize Converter UI logic
  initConverterLogic();
});

// Converter interaction logic
function initConverterLogic() {
  const categorySelect = document.getElementById('converter-category');
  const fromSelect = document.getElementById('converter-from');
  const toSelect = document.getElementById('converter-to');
  const fromValEl = document.getElementById('converter-from-val');
  const toValEl = document.getElementById('converter-to-val');
  const swapBtn = document.getElementById('converter-swap');

  if (!categorySelect || !fromSelect || !toSelect) return;

  function populateCategories() {
    categorySelect.innerHTML = Object.keys(UnitConverter.categories).map(catKey => `
      <option value="${catKey}">${UnitConverter.categories[catKey].name}</option>
    `).join('');
    populateUnits();
  }

  function populateUnits() {
    const catKey = categorySelect.value;
    const cat = UnitConverter.categories[catKey];
    if (!cat) return;

    const unitKeys = Object.keys(cat.units);
    fromSelect.innerHTML = unitKeys.map(k => `<option value="${k}">${cat.units[k].name}</option>`).join('');
    toSelect.innerHTML = unitKeys.map(k => `<option value="${k}">${cat.units[k].name}</option>`).join('');

    // Default target unit to second option if available
    if (unitKeys.length > 1) {
      toSelect.selectedIndex = 1;
    }

    updateConversion();
  }

  function updateConversion() {
    const currentCalcValue = window.appleCalc ? window.appleCalc.displayValue : '1';
    fromValEl.textContent = `${window.appleCalc ? window.appleCalc.formatDisplayValue(currentCalcValue) : currentCalcValue} ${fromSelect.value}`;

    const converted = UnitConverter.convert(
      currentCalcValue,
      categorySelect.value,
      fromSelect.value,
      toSelect.value
    );

    toValEl.textContent = `${window.appleCalc ? window.appleCalc.formatDisplayValue(converted) : converted} ${toSelect.value}`;
  }

  categorySelect.addEventListener('change', populateUnits);
  fromSelect.addEventListener('change', updateConversion);
  toSelect.addEventListener('change', updateConversion);

  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      updateConversion();
      if (window.calcAudio) window.calcAudio.playClick('operator');
    });
  }

  window.initConverterUI = populateCategories;
  window.updateConverterLive = updateConversion;

  populateCategories();
}

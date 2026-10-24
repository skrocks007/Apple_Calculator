// Automated Verification Test Suite for Apple Calculator Engine & Unit Converter

const fs = require('fs');

// Mock browser globals for Node.js test environment
global.window = {
  addEventListener: () => {}
};
global.document = {
  getElementById: (id) => ({
    id,
    textContent: '',
    innerText: '',
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    querySelectorAll: () => []
  }),
  querySelector: () => ({
    addEventListener: () => {},
    querySelectorAll: () => []
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => '[]',
  setItem: () => {}
};
global.navigator = {
  clipboard: {
    writeText: async () => {}
  }
};

// Load audio.js, converter.js, app.js
require('./audio.js');
require('./converter.js');
require('./app.js');

const calc = new window.AppleCalculator();

console.log('--- RUNNING CALCULATOR VERIFICATION SUITE ---');

let passed = 0;
let total = 0;

function assert(description, actual, expected) {
  total++;
  if (actual === expected) {
    console.log(`✅ [PASS] ${description} -> ${actual}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${description} -> Expected: ${expected}, Got: ${actual}`);
  }
}

// 1. Basic Addition: 7 + 8 = 15
calc.handleClear();
calc.inputDigit('7');
calc.handleOperator('+', null);
calc.inputDigit('8');
calc.handleEquals();
assert('7 + 8 = 15', calc.displayValue, '15');

// 2. Multiplication: 15 * 4 = 60
calc.handleOperator('*', null);
calc.inputDigit('4');
calc.handleEquals();
assert('15 * 4 = 60', calc.displayValue, '60');

// 3. Repeat Equals: 60 * 4 = 240
calc.handleEquals();
assert('Repeat equals (60 * 4)', calc.displayValue, '240');

// 4. Percentage Addition: 100 + 10% = 110
calc.handleClear();
calc.inputDigit('1');
calc.inputDigit('0');
calc.inputDigit('0');
calc.handleOperator('+', null);
calc.inputDigit('1');
calc.inputDigit('0');
calc.handlePercent();
assert('100 + 10% display intermediate', calc.displayValue, '10');
calc.handleEquals();
assert('100 + 10% final result', calc.displayValue, '110');

// 5. Standalone Percentage: 50% = 0.5
calc.handleClear();
calc.inputDigit('5');
calc.inputDigit('0');
calc.handlePercent();
assert('50% = 0.5', calc.displayValue, '0.5');

// 6. Sign Toggle: 42 -> -42 -> 42
calc.handleClear();
calc.inputDigit('4');
calc.inputDigit('2');
calc.toggleSign();
assert('Sign toggle negative', calc.displayValue, '-42');
calc.toggleSign();
assert('Sign toggle positive', calc.displayValue, '42');

// 7. Decimals & Comma Formatting
assert('Number formatting 1234567', calc.formatDisplayValue('1234567'), '1,234,567');
assert('Decimal formatting 1234.56', calc.formatDisplayValue('1234.56'), '1,234.56');

// 8. Scientific: Square Root
calc.handleClear();
calc.inputDigit('1');
calc.inputDigit('4');
calc.inputDigit('4');
calc.handleScientific('sqrt');
assert('sqrt(144) = 12', calc.displayValue, '12');

// 9. Scientific: Factorial
calc.handleClear();
calc.inputDigit('5');
calc.handleScientific('factorial');
assert('5! = 120', calc.displayValue, '120');

// 10. Scientific: Exponent x^y (2 ^ 5 = 32)
calc.handleClear();
calc.inputDigit('2');
calc.handleOperator('power', null);
calc.inputDigit('5');
calc.handleEquals();
assert('2 ^ 5 = 32', calc.displayValue, '32');

// 11. Scientific: Trigonometry in DEG mode
calc.angleMode = 'deg';
calc.handleClear();
calc.inputDigit('3');
calc.inputDigit('0');
calc.handleScientific('sin');
assert('sin(30 deg) = 0.5', calc.displayValue, '0.5');

// 12. Unit Converter: Length
const lengthConvert = window.UnitConverter.convert(5, 'length', 'km', 'm');
assert('5 km to meters', lengthConvert, '5000');

// 13. Unit Converter: Temperature
const tempConvert = window.UnitConverter.convert(100, 'temperature', 'c', 'f');
assert('100 C to Fahrenheit', tempConvert, '212');

// 14. Unit Converter: Weight
const weightConvert = window.UnitConverter.convert(1, 'weight', 'kg', 'lb');
assert('1 kg to pounds (approx 2.20462)', parseFloat(weightConvert).toFixed(2), '2.20');

// 15. Division by Zero
calc.handleClear();
calc.inputDigit('9');
calc.handleOperator('/', null);
calc.inputDigit('0');
calc.handleEquals();
assert('Division by 0 -> Error', calc.displayValue, 'Error');

// 16. Parentheses: ( 3 + 5 ) * 2 = 16
calc.handleClear();
calc.handleOpenParen();
calc.inputDigit('3');
calc.handleOperator('+', null);
calc.inputDigit('5');
calc.handleCloseParen();
assert('Parentheses (3+5) evaluated', calc.displayValue, '8');
calc.handleOperator('*', null);
calc.inputDigit('2');
calc.handleEquals();
assert('(3 + 5) * 2 = 16', calc.displayValue, '16');

// 17. Constants & Logarithms
calc.handleClear();
calc.inputConstant('e');
calc.handleScientific('ln');
assert('ln(e) = 1', calc.displayValue, '1');

calc.handleClear();
calc.inputDigit('1');
calc.inputDigit('0');
calc.inputDigit('0');
calc.handleScientific('log10');
assert('log10(100) = 2', calc.displayValue, '2');

// 18. Reciprocal 1/4 = 0.25
calc.handleClear();
calc.inputDigit('4');
calc.handleScientific('reciprocal');
assert('1 / 4 = 0.25', calc.displayValue, '0.25');

// 19. Swipe delete digit behavior
calc.handleClear();
calc.inputDigit('1');
calc.inputDigit('2');
calc.inputDigit('3');
assert('Input 123', calc.displayValue, '123');
calc.deleteLastDigit();
assert('Delete last digit -> 12', calc.displayValue, '12');
calc.deleteLastDigit();
assert('Delete last digit -> 1', calc.displayValue, '1');
calc.deleteLastDigit();
assert('Delete last digit -> 0', calc.displayValue, '0');

// 20. Leading Zero prevention
calc.handleClear();
calc.inputDigit('0');
calc.inputDigit('0');
calc.inputDigit('7');
assert('Leading zero handling -> 7', calc.displayValue, '7');

// 21. Programmer Mode: Radix conversions (Dec 255 -> Hex FF -> Oct 377 -> Bin 11111111)
calc.switchMode('programmer');
calc.handleClear();
calc.setProgrammerRadix(10);
calc.inputDigit('2');
calc.inputDigit('5');
calc.inputDigit('5');
assert('Programmer Dec 255', calc.displayValue, '255');
calc.setProgrammerRadix(16);
assert('Programmer Dec 255 to Hex', calc.displayValue, 'FF');
calc.setProgrammerRadix(8);
assert('Programmer Dec 255 to Oct', calc.displayValue, '377');
calc.setProgrammerRadix(2);
assert('Programmer Dec 255 to Bin', calc.displayValue, '11111111');

// 22. Hex Digits Input (AF)
calc.handleClear();
calc.setProgrammerRadix(16);
calc.inputHexDigit('A');
calc.inputHexDigit('F');
assert('Hex input AF', calc.displayValue, 'AF');
calc.setProgrammerRadix(10);
assert('Hex AF to Dec 175', calc.displayValue, '175');

// 23. Bitwise Operations: AND (12 & 10 = 8)
calc.handleClear();
calc.setProgrammerRadix(10);
calc.inputDigit('1');
calc.inputDigit('2');
calc.handleBitwise('and');
calc.inputDigit('1');
calc.inputDigit('0');
calc.handleEquals();
assert('Bitwise 12 AND 10 = 8', calc.displayValue, '8');

// 24. Bitwise Operations: OR (12 | 10 = 14)
calc.handleClear();
calc.inputDigit('1');
calc.inputDigit('2');
calc.handleBitwise('or');
calc.inputDigit('1');
calc.inputDigit('0');
calc.handleEquals();
assert('Bitwise 12 OR 10 = 14', calc.displayValue, '14');

// 25. Bitwise Operations: Shift Left (5 << 1 = 10)
calc.handleClear();
calc.inputDigit('5');
calc.handleBitwise('lsh');
assert('Bitwise 5 << 1 = 10', calc.displayValue, '10');

// 26. Bitwise NOT with 8-bit Word Mask
calc.handleClear();
calc.setProgrammerWordSize(8);
calc.inputDigit('0');
calc.handleBitwise('not');
assert('8-bit Bitwise NOT 0 = 255', calc.displayValue, '255');
calc.setProgrammerWordSize(64);

// 27. RPN Mode Stack Calculation: 10 Enter 5 + = 15, then 3 * = 45
calc.switchMode('basic');
calc.handleClear();
calc.isRpnActive = true;
calc.rpnStack = [];
calc.inputDigit('1');
calc.inputDigit('0');
calc.handleEquals(); // pushes 10 to stack
assert('RPN push 10', calc.rpnStack[0], 10);
calc.inputDigit('5');
calc.handleOperator('+', null); // 10 + 5 = 15
assert('RPN 10 + 5 = 15', calc.displayValue, '15');
assert('RPN stack top is 15', calc.rpnStack[0], 15);
calc.inputDigit('3');
calc.handleOperator('*', null); // 15 * 3 = 45
assert('RPN 15 * 3 = 45', calc.displayValue, '45');
calc.isRpnActive = false;

console.log(`\nResults: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log('🌟 ALL CALCULATOR ENGINE TESTS PASSED PERFECTLY!');
}

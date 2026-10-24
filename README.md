#  Apple Calculator — iOS 18 & macOS Sequoia Edition

A pixel-perfect, highly responsive web replica of Apple's flagship Calculator, engineered with vanilla HTML5, CSS3, and modern JavaScript. Features both **iPhone (iOS 18)** and **Mac (macOS Sequoia)** experiences, including portrait & landscape scientific modes, interactive **Math Notes**, an **in-line Unit & Currency Converter**, a full **macOS Programmer Mode**, and **RPN Mode**.

[![Tests Passing](https://img.shields.io/badge/tests-42%2F42%20passing-brightgreen.svg)](file:///test_calculator.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-none-orange.svg)]()
[![Platform: Web](https://img.shields.io/badge/platform-web%20%7C%20mobile%20%7C%20desktop-lightgrey.svg)]()

---

## 🌟 Live Demo

🔗 **Live on GitHub Pages:** [https://skrocks007.github.io/Apple_Calculator/](https://skrocks007.github.io/Apple_Calculator/)

*(To enable on your repo: Go to **Settings** > **Pages** > Select branch `main` and `/ (root)` > Save).*

---

## ✨ Features & Highlights

### 📱 iPhone Edition (iOS 18)
- **Authentic Chassis**: Fixed-dimension iPhone chassis with Dynamic Island, native status bar, and anchored home indicator.
- **Dynamic Orientation**: Rotate smoothly between **Portrait** and **Landscape** orientations.
- **Portrait Scientific Mode**: Dual-grid layout featuring a 6×5 scientific function pad alongside a 4×5 numeric pad with a dedicated backspace key.
- **Swipe-to-Delete**: Native Apple gesture—swipe left or right across the display numbers to erase the last digit.
- **In-App Slide-Up History Tape**: Tap the top-left clock button to slide up calculation history. Tap any past calculation to restore it back onto the display.

### 💻 Mac Edition (macOS Sequoia)
- **Sequoia Design Language**: Dark charcoal matte finish (`#202022`), 18px rounded corners, and seamless window header without hard divider lines.
- **Traffic Lights & Sidebar Toggle**: Functional red (close/reset), yellow (minimize), and green (zoom/expand) window controls, plus the split sidebar button for calculation history.
- **10-Column Scientific Mode**: 10 columns × 5 rows with squircle pill buttons (`#323235` scientific, `#4A4A4E` numeric/functions, `#FF9F0A` operators).
- **Interactive Window Resizing**:
  - **Draggable Corner Handle**: Grab the bottom-right corner gripper to freely resize the window.
  - **Native Edge Resizing**: Native browser window drag support (`resize: both`).
  - **One-Click Zoom**: Click the green traffic light button or titlebar resize icon to toggle between **Standard** and **Large** views.

---

## 🧮 Calculator Modes

| Mode | iPhone (iOS 18) | Mac (macOS Sequoia) | Description |
| :--- | :---: | :---: | :--- |
| **Basic** | ✅ | ✅ | Standard 4-column arithmetic with repeat-equals logic and percentage calculations. |
| **Scientific** | ✅ | ✅ | Trigonometry (`sin`, `cos`, `tan`, inverses, hyperbolics), logarithms (`ln`, `log10`, `log2`), roots, powers, factorials, and angle modes (DEG/RAD). |
| **Programmer** | — | ✅ | Multi-radix real-time views (**HEX**, **DEC**, **OCT**, **BIN**), word sizes (64/32/16/8-bit), bitwise operators (`AND`, `OR`, `XOR`, `NOR`, `NOT`, `2's`, shifts, rotates), and live ASCII preview. |
| **Math Notes** | ✅ | ✅ | Interactive scratchpad that evaluates expressions live (`25 * 4 = 100`, `sqrt(144) + 8 = 20`), supports variables (`x = 10`, `x * 5 = 50`), dedicated vertical scroll, and a quick math symbols toolbar. |
| **Convert** | ✅ | ✅ | In-line unit and currency converter for Currency (USD, EUR, GBP, JPY, etc.), Length, Weight, Temperature, Data, and Speed with instant swap. |
| **RPN Mode** | — | ✅ | Reverse Polish Notation stack-based calculation engine with live stack feedback and `RPN` status badge. |

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Key | Action |
| :--- | :--- | :--- | :--- |
| `0` – `9` | Enter Digits | `Enter` / `=` | Calculate Result / Repeat Equals |
| `+`, `-`, `*`, `/` | Arithmetic Operators | `Esc` | Clear (AC / C) |
| `.` | Decimal Point | `Backspace` | Delete Last Digit |
| `%` | Percentage | `(` / `)` | Parentheses |
| `^` | Power ($x^y$) | `p` / `P` | Constant $\pi$ (Pi) |
| `e` | Constant $e$ (Euler) | `Ctrl + C` / Click | Copy Display to Clipboard |

---

## 🎵 Audio & Haptic Feedback

- Synthesized Web Audio API sound generator with zero external audio assets.
- Distinct acoustic profiles for **Number keys**, **Operators**, and **Clear**.
- Sound can be toggled on or muted via the speaker button in the header bar.

---

## 🚀 Getting Started

### Prerequisites
None! The project uses pure standard web technologies. All you need is any modern web browser.

### Clone & Run Locally
```bash
# 1. Clone the repository
git clone https://github.com/skrocks007/Apple_Calculator.git
cd Apple_Calculator

# 2. Start a local server (any of the following):
# Using Python:
python -m http.server 8088

# Or using Node.js:
npx serve . -l 8088
```

Open your browser and navigate to:
👉 **[http://localhost:8088/](http://localhost:8088/)**

---

## 🧪 Automated Testing

The project includes an automated test suite verifying 42 calculations, operator precedence, percentage rules, programmer conversions, bitwise logic, and RPN operations.

To run the verification suite:
```bash
node test_calculator.js
```

**Output:**
```text
--- RUNNING CALCULATOR VERIFICATION SUITE ---
✅ [PASS] 7 + 8 = 15 -> 15
✅ [PASS] 15 * 4 = 60 -> 60
...
Results: 42 / 42 tests passed.
🌟 ALL CALCULATOR ENGINE TESTS PASSED PERFECTLY!
```

---

## 📁 File Structure

```text
Apple_Calculator/
├── index.html            # Main markup with iPhone & Mac window shells, popovers, keypads
├── style.css             # Unified iOS 18 & macOS Sequoia design tokens, animations, layouts
├── app.js                # Core calculator engine, state machines, RPN, Math Notes, Programmer
├── converter.js          # Live unit and currency conversion engine
├── audio.js              # Web Audio API sound generator for clicks and haptics
├── test_calculator.js    # 42 automated tests for engine validation
├── favicon.svg           # Scalable pocket calculator vector favicon
└── README.md             # Project documentation
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

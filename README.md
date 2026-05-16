# Formula EV Systems Architect (FB-2026)

An interactive, industrial-grade systems architecture diagram and rule compliance checker for the **FB-2026 Formula Student Electric Vehicle** Low Voltage (LV) systems. 

This tool provides a "living schematic" that allows engineers to probe the internal logic, hardware interfaces, and regulatory compliance of the vehicle's electronic architecture.



## 🏎️ Key Features

### 1. Interactive Production Schematics
- **Dynamic Graph Visualization**: Explore the interconnected web of ECUs, sensors, actuators, and safety devices.
- **Bi-directional Highlighting**: Select a node to instantly see its upstream power sources and downstream data sinks.
- **Smart Filtering**: Toggle visibility of different signal types (CAN, I2C, Analog, PWM, Hardwired Safety, etc.) through the topbar legend.
- **System Search**: Quickly locate specific components (e.g., "IMD", "VCU", "APPS") using the integrated probe system.

### 2. Regulatory Compliance (FS-Rules 2026)
- **Deep Rule Integration**: Many components are cross-referenced with the FSAE/FSG 2026 rulebook (e.g., EV6.3 for IMD, T11.4 for SDC).
- **Compliance Tooltips**: Click rules in the component details panel to see verbatim regulatory requirements and design implications.

### 3. Component Deep-Dives
- **Hardware Specs**: Access procurement links, pinouts, physical dimensions, and estimated costs.
- **Functional Descriptions**: Understand the "Purpose" and "Logic" behind every module in the LV system.
- **BOM Management**: View real-world product identifiers (e.g., Bender iso165C, STM32F405).

## 🛠️ Tech Stack

- **Framework**: [React 19](https://reactjs.org/) (Functional Components + Hooks)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Cyberpunk/Industrial aesthetic)
- **Animations**: [Motion](https://motion.dev/) (Smooth transitions, interactive dragging, and focus states)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Data Model**: Strictly typed TypeScript interfaces for Nodes and Edges.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/formula-ev-architect.git
   cd formula-ev-architect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📂 Project Structure

```text
src/
├── components/     # UI components (Modals, Panels)
├── constants.ts    # Central truth for all Nodes and Edges (the schematic data)
├── rule-details.ts # Verbatim FS Rules documentation
├── types.ts        # TypeScript interfaces for the system graph
├── App.tsx         # Main interactive canvas logic
└── index.css       # Custom glassmorphism and theme variables
```

## 🛡️ Safety Warning

This tool is a design-intent visualization for **Formula Student Competition** use. It does not replace formal electrical testing, HV isolation verification, or safety marshaling procedures. Always consult the official Formula Student Rulebook and your team's technical leads when implementing high-voltage systems.

## 📄 License

This project is licensed under the Apache-2.0 License.

---
*Built for Ruhuna Racing | Formula Student EB-2026 Campaign*

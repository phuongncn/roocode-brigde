# Roo Code Bridge 🌉🤖

**Transform Your AI Coding Experience: Claude/Antigravity as the Brains, Roo Code as the Brawn, and Telegram as a Bonus Remote Control!**

## 🛑 The Pain
- **High API Fees:** Running complex coding tasks through premium models like Claude Sonnet or GPT continuously can burn a hole in your pocket.
- **Micro-Management:** Waiting for the AI, reading through every file it changes, and telling it what to do next is exhausting.
- **Tethered to the Desk:** You have to sit at your computer to monitor the AI's progress.

## 💡 The Solution
**Roo Code Bridge** is a VSCode extension that creates an automated Manager-Worker loop:
1. **The Manager (Claude Code / Antigravity):** Creates a master plan and reviews the work.
2. **The Worker (Roo Code + Local/Cheaper AI):** Executes the plan, writes the code, and reports back.
3. **The Telegram Bonus:** A fast way to directly tell Roo what to do from your phone!

By offloading the heavy lifting (writing lines of code, replacing files) to Roo Code paired with a local AI (like Qwen 3.5) or a cheaper API, you slash your API costs dramatically while maintaining top-tier code quality!

---

## 🌊 How It Works (The Flow)

1. You prompt **Claude Code** or **Antigravity** with a task.
2. The Manager writes a detailed plan into the `.plan/` folder and uses the MCP Server to send the task to **Roo Code**.
3. **Roo Code** starts working autonomously.
4. **Signaling Completion (Highly Recommended):** Once Roo is done, it signalizes completion by renaming the plan file (e.g., adding `-done` to the filename). *(Note: The MCP `report_done` tool sometimes works and sometimes doesn't, so we highly recommend having your manager rely on the change filename method!)* 
5. The Manager reviews the code. If there are bugs, it updates the plan and sends Roo back to work. If it's perfect, the loop finishes.
6. **Telegram Integration:** As a bonus, you can chat with your Telegram bot to control Roo directly. *(Note: Currently, Telegram only sends prompts to Roo, not to Claude/Antigravity. Hopefully, someone from the community can help build that out!)*

---

## 🛠️ Installation & Setup

### 1. Install the Extension
- **VSIX:** Download the released `.vsix` file. In VSCode, press `F1` > type `Extensions: Install from VSIX...` and select the file.
- **Source:** Clone this repo, run `npm install`, then in VSCode press `F1` > `Extensions: Install from Location...` and select the repository folder.

### 2. Configure Roo Code MCP
You need to connect Roo Code to the Bridge. Go to **Roo Settings > MCP Tab > Edit Globally** and add:

```json
{
  "mcpServers": {
    "roocode-bridge": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:3457/mcp",
      "alwaysAllow": ["report_done"],
      "timeout": 10
    }
  }
}
```

### 3. Setup the Polling Script
Place `poll-roo-bridge.ps1` somewhere accessible in your system. This script helps the manager check on Roo's progress if you don't solely rely on the file-rename method.

### 4. Setup The Manager (Claude / Antigravity)
Rename the provided template:
- `CLAUDE.md.example` ➡️ `CLAUDE.md` (if using Claude Code)
- `GEMINI.md.example` ➡️ `GEMINI.md` (if using Antigravity)

Place it in your project's workspace folder (or globally in your system config).
*Instruct the Manager to monitor for that `-done` filename change!*

### 5. Telegram Setup (Optional Bonus)
1. Open VSCode Settings (`Ctrl + ,`).
2. Search for `Roo Code Bridge`.
3. Enter your **Telegram Bot Token** and **Allowed Chat ID** (to ensure only you can control it).
4. Start chatting with your bot to control Roo from anywhere! *(Again, it talks to Roo, it cannot command Claude/Antigravity yet!)*

---

## 🤝 Contributing
Feel free to submit issues, pull requests, and ideas! Let's build the ultimate autonomous coding agent loop together. If you know how to wire up Telegram commands to trigger Claude/Antigravity, we'd love a PR!

## 📜 License
MIT License - use it, modify it, make it yours!

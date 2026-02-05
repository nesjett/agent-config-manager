# 🤖 Agent Config Manager (ACM)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Deno](https://img.shields.io/badge/deno-v2.0-black)
![Platform](https://img.shields.io/badge/platform-macos%20|%20linux%20|%20windows-lightgrey)

A CLI tool that helps developers transfer AI agent configurations across
different platforms. Copy skills, tools, rules, instructions, and other agent
setup configurations from one agent or platform to another—whether that's from
GitHub Copilot to Cursor, Claude, or any other AI assistant.

## ✨ Features

- 🌍 **Cross-Platform Support**: Transfer agent configurations between different
  AI assistants and IDEs
- 🧰 **Comprehensive Configuration Transfer**: Copy skills, tools, rules,
  instructions, context, and system prompts
- ✅ **Configuration Validation**: Verify compatibility and identify potential
  issues before transfer
- 🔄 **Format Conversion**: Automatically convert configurations between
  different platform formats
- 💾 **Backup & Restore**: Create backups of your agent configurations before
  making changes
- 🧪 **Dry Run Mode**: Preview changes without applying them
- 📦 **Single Executable**: No runtime dependencies required—just download and
  run

## 📦 Installation

Requires [Deno](https://deno.land/) 2.0+ to build from source, or download a
pre-built binary.

**Pre-built Binaries**\
Download from
[Releases](https://github.com/nesjett/agent-config-manager/releases), simplify
make it executable:

```bash
chmod +x acm
alias acm="./acm"
```

**From Source**

```bash
git clone https://github.com/nesjett/agent-config-manager.git
cd agent-config-manager
deno task build
```

**Run Directly**

```bash
deno task dev -- copy --from copilot --to cursor
```

## 🚀 Quick Start

Copy an agent's setup from one platform to another:

```bash
acm copy --from copilot --to cursor
```

## 🧰 Commands

Run `acm --help` for a list of commands, or `acm <command> --help` for detailed
usage.

Common commands:

- `copy`: Transfer configuration between platforms
- `export`: Export configuration to a file
- `import`: Import configuration from a file
- `list`: Show supported platforms and options
- `backup`: Create a backup of agent configuration

## 🧩 Supported Platforms

| Platform           | Configuration Files                                       |
| ------------------ | --------------------------------------------------------- |
| **GitHub Copilot** | `.github/copilot-instructions.md`                         |
| **Cursor**         | `.cursor/rules/*.mdc`, `.cursorrules`, `.cursor/mcp.json` |
| **Claude**         | `CLAUDE.md`, `.claude/commands/*.md`, `.claude/mcp.json`  |
| **Windsurf**       | `.windsurfrules`, `.windsurf/mcp.json`                    |

## 🔁 Transferable Configuration Elements

- **Instructions** - System prompts and instructions (CLAUDE.md, .cursorrules,
  etc.)
- **Rules** - Platform-specific rules and constraints
- **Skills** - Custom commands and skills
- **Tools** - Tool configurations and integrations
- **MCP Servers** - Model Context Protocol server configurations
- **Context** - Additional context and settings
- **Shortcuts** - Keyboard shortcuts and hotkeys

## 🧾 Configuration Format

Configurations are stored in JSON format with the following structure:

```json
{
  "version": "1.0.0",
  "platform": "cursor",
  "timestamp": "2026-02-01T12:00:00Z",
  "config": {
    "skills": [
      {
        "name": "test",
        "command": "/test",
        "content": "Run all tests in the project"
      }
    ],
    "rules": [
      {
        "name": "code-style",
        "content": "Always use TypeScript strict mode",
        "enabled": true
      }
    ],
    "instructions": ["Use functional programming patterns"],
    "mcpServers": [
      {
        "name": "filesystem",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
      }
    ],
    "context": {},
    "shortcuts": {}
  }
}
```

## 🧪 Examples

### Transfer from Copilot to Cursor

```bash
acm copy --from copilot --to cursor --output ./cursor-config.json
acm import ./cursor-config.json --to cursor
```

### Create a Backup Before Transfer

```bash
acm backup cursor --output ./backups/cursor-before-transfer.json
acm copy --from copilot --to cursor
```

### Merge Configurations

```bash
acm import ./new-skills.json --to claude --merge
```

## 🧩 API Usage

Use `agent-config-manager` programmatically in your Deno projects:

```typescript
import { getPlatformHandler } from './src/platforms/mod.ts';

// Get platform handlers
const cursorHandler = getPlatformHandler('cursor');
const claudeHandler = getPlatformHandler('claude');

// Export from one platform
const config = await cursorHandler.export();

// Import to another platform
await claudeHandler.import(config, false); // false = replace, true = merge
```

## 🛠️ Development

```bash
# Run in development mode
deno task dev

# Run with arguments
deno task dev copy --from cursor --to claude

# Type check
deno task check

# Lint
deno task lint

# Format
deno task fmt

# Run tests
deno task test
```

## 🏗️ Build Tasks

| Task                        | Description                   |
| --------------------------- | ----------------------------- |
| `deno task build`           | Build for current platform    |
| `deno task build:all`       | Build for all platforms       |
| `deno task build:linux`     | Build for Linux x64           |
| `deno task build:macos`     | Build for macOS Intel         |
| `deno task build:macos-arm` | Build for macOS Apple Silicon |
| `deno task build:windows`   | Build for Windows x64         |

## 🔒 Security Considerations

- **Backup**: Always create a backup before transferring critical configurations
- **Permissions**: Ensure you have write permissions in the target directories
- **File Safety**: The tool only reads and writes configuration files in
  standard locations

## 🩺 Troubleshooting

### Configuration Not Found

Ensure you're in the correct directory or provide the full path to your
configuration file:

```bash
acm export copilot --output /full/path/to/config.json
```

### Import Fails

Try merging instead of replacing:

```bash
acm import ./config.json --to cursor --merge
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 💬 Support

For issues, questions, or feature requests, please open an issue on GitHub.

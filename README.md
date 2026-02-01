# Agent Setup Copier (ASC)

A CLI tool that helps developers transfer AI agent configurations across different platforms. Copy skills, tools, rules, instructions, and other agent setup configurations from one agent or platform to another—whether that's from GitHub Copilot to Cursor, Claude, or any other AI assistant.

## Features

- **Cross-Platform Support**: Transfer agent configurations between different AI assistants and IDEs
- **Comprehensive Configuration Transfer**: Copy skills, tools, rules, instructions, context, and system prompts
- **Configuration Validation**: Verify compatibility and identify potential issues before transfer
- **Format Conversion**: Automatically convert configurations between different platform formats
- **Backup & Restore**: Create backups of your agent configurations before making changes
- **Dry Run Mode**: Preview changes without applying them
- **Single Executable**: No runtime dependencies required—just download and run

## Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/nesjett/agent-setup-copier/releases) page:

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `asc-macos-arm` |
| macOS (Intel) | `asc-macos` |
| Linux (x64) | `asc-linux` |
| Windows (x64) | `asc-windows.exe` |

After downloading, make it executable (macOS/Linux):

```bash
chmod +x asc-macos-arm
sudo mv asc-macos-arm /usr/local/bin/asc
```

### Build from Source

Requires [Deno](https://deno.land/) 2.0 or later.

```bash
# Clone the repository
git clone https://github.com/nesjett/agent-setup-copier.git
cd agent-setup-copier

# Build for your current platform
deno task build

# Or build for all platforms
deno task build:all
```

The compiled binaries will be in the `dist/` directory.

### Run without Installing

```bash
# Run directly with Deno
deno run --allow-read --allow-write --allow-env src/main.ts

# Or use the dev task
deno task dev
```

## Quick Start

### Basic Usage

Copy an agent's entire setup from one platform to another:

```bash
asc copy --from copilot --to cursor
```

### Detect Platforms

See which platforms are configured in your current project:

```bash
asc list --detect
```

## Commands

### `copy`

Transfer an agent configuration from a source to a destination.

```bash
asc copy [options]
```

**Options:**
- `--from <platform>` - Source platform (copilot, cursor, claude, windsurf)
- `--to <platform>` - Destination platform
- `--config <path>` - Path to source configuration file
- `--output <path>` - Where to save the transferred configuration
- `--dry-run` - Preview changes without applying them
- `--validate` - Only validate compatibility without transferring

**Examples:**
```bash
asc copy --from copilot --to cursor --output ./cursor-config
asc copy --config ./my-agent.json --to claude --dry-run
```

### `export`

Export an agent's current configuration from a platform or file.

```bash
asc export <platform> [options]
```

**Options:**
- `--output <path>` - Where to save the exported configuration
- `--format <format>` - Output format (json, yaml)

**Examples:**
```bash
asc export copilot --output ./copilot-setup.json
asc export cursor --format yaml
```

### `import`

Import a configuration file into an agent or platform.

```bash
asc import <path> [options]
```

**Options:**
- `--to <platform>` - Target platform for import
- `--merge` - Merge with existing configuration instead of replacing
- `--validate` - Validate before importing

**Examples:**
```bash
asc import ./agent-config.json --to claude
asc import ./cursor-setup.yaml --to cursor --merge
```

### `list`

Show available platforms and supported configuration elements.

```bash
asc list [options]
```

**Options:**
- `--platforms` - List all supported platforms
- `--elements` - List all transferable configuration elements
- `--mappings` - Show platform configuration file mappings
- `--detect` - Detect platforms in current directory

**Examples:**
```bash
asc list                  # Show all information
asc list --platforms      # List supported platforms
asc list --detect         # Detect configured platforms
asc list --mappings       # Show file mappings
```

### `backup`

Create a backup of an agent's configuration.

```bash
asc backup <platform> [options]
```

**Options:**
- `--output <path>` - Where to save the backup
- `--timestamp` - Include timestamp in backup filename

**Examples:**
```bash
asc backup copilot --timestamp
asc backup cursor --output ./backups/cursor-backup.json
```

## Supported Platforms

| Platform | Configuration Files |
|----------|---------------------|
| **GitHub Copilot** | `.github/copilot-instructions.md` |
| **Cursor** | `.cursor/rules/*.mdc`, `.cursorrules`, `.cursor/mcp.json` |
| **Claude** | `CLAUDE.md`, `.claude/commands/*.md`, `.claude/mcp.json` |
| **Windsurf** | `.windsurfrules`, `.windsurf/mcp.json` |

## Transferable Configuration Elements

- **Instructions** - System prompts and instructions (CLAUDE.md, .cursorrules, etc.)
- **Rules** - Platform-specific rules and constraints
- **Skills** - Custom commands and skills
- **Tools** - Tool configurations and integrations
- **MCP Servers** - Model Context Protocol server configurations
- **Context** - Additional context and settings
- **Shortcuts** - Keyboard shortcuts and hotkeys

## Configuration Format

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

## Examples

### Transfer from Copilot to Cursor

```bash
asc copy --from copilot --to cursor --output ./cursor-config.json
asc import ./cursor-config.json --to cursor
```

### Create a Backup Before Transfer

```bash
asc backup cursor --output ./backups/cursor-before-transfer.json
asc copy --from copilot --to cursor
```

### Merge Configurations

```bash
asc import ./new-skills.json --to claude --merge
```

## API Usage

Use `agent-setup-copier` programmatically in your Deno projects:

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

## Development

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

## Build Tasks

| Task | Description |
|------|-------------|
| `deno task build` | Build for current platform |
| `deno task build:all` | Build for all platforms |
| `deno task build:linux` | Build for Linux x64 |
| `deno task build:macos` | Build for macOS Intel |
| `deno task build:macos-arm` | Build for macOS Apple Silicon |
| `deno task build:windows` | Build for Windows x64 |

## Project Structure

```
singleagentsetup-sas/
├── deno.json              # Deno configuration with build tasks
├── README.md              # Documentation
├── .gitignore             # Git ignore rules
├── dist/                  # Compiled executables (~71MB each)
│   ├── asc                # macOS/Linux binary
│   ├── asc-linux
│   ├── asc-macos
│   ├── asc-macos-arm
│   └── asc-windows.exe
└── src/
    ├── main.ts            # CLI entry point
    ├── types.ts           # TypeScript interfaces
    ├── commands/          # CLI commands
    │   ├── backup.ts
    │   ├── copy.ts
    │   ├── export.ts
    │   ├── import.ts
    │   └── list.ts
    ├── platforms/         # Platform handlers
    │   ├── base.ts
    │   ├── cursor.ts
    │   ├── claude.ts
    │   ├── copilot.ts
    │   └── windsurf.ts
    └── utils/
        └── colors.ts      # Terminal colors
```

## Security Considerations

- **Backup**: Always create a backup before transferring critical configurations
- **Permissions**: Ensure you have write permissions in the target directories
- **File Safety**: The tool only reads and writes configuration files in standard locations

## Troubleshooting

### Configuration Not Found

Ensure you're in the correct directory or provide the full path to your configuration file:

```bash
asc export copilot --output /full/path/to/config.json
```

### Import Fails

Try merging instead of replacing:

```bash
asc import ./config.json --to cursor --merge
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

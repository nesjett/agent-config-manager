# Agent Setup Copier (ASC)

A CLI tool that helps developers transfer AI agent configurations across different platforms. Copy skills, tools, rules, instructions, and other agent setup configurations from one agent or platform to another—whether that's from GitHub Copilot to Cursor, Claude, or any other AI assistant.

## Features

- **Cross-Platform Support**: Transfer agent configurations between different AI assistants and IDEs
- **Comprehensive Configuration Transfer**: Copy skills, tools, rules, instructions, context, and system prompts
- **Configuration Validation**: Verify compatibility and identify potential issues before transfer
- **Format Conversion**: Automatically convert configurations between different platform formats
- **Backup & Restore**: Create backups of your agent configurations before making changes
- **Dry Run Mode**: Preview changes without applying them
- **Interactive Setup**: Step-by-step wizard for configuring transfers

## Installation

```bash
npm install -g agent-setup-copier
```

Or use it directly with npx:

```bash
npx agent-setup-copier
```

## Quick Start

### Basic Usage

Copy an agent's entire setup from one platform to another:

```bash
asc copy --from copilot --to cursor
```

### Interactive Mode

Start the interactive wizard to guide you through the setup transfer:

```bash
asc
```

## Commands

### `copy`

Transfer an agent configuration from a source to a destination.

```bash
asc copy [options]
```

**Options:**
- `--from <platform>` - Source platform (copilot, cursor, claude, custom)
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
- `--format <format>` - Output format (json, yaml, env)

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

### `validate`

Validate a configuration file for correctness and compatibility.

```bash
asc validate <path> [options]
```

**Options:**
- `--target <platform>` - Check compatibility with a specific platform
- `--strict` - Apply stricter validation rules

**Examples:**
```bash
asc validate ./my-agent.json
asc validate ./config.json --target cursor --strict
```

### `list`

Show available platforms and supported configuration elements.

```bash
asc list [options]
```

**Options:**
- `--platforms` - List all supported platforms
- `--elements` - List all transferable configuration elements
- `--mappings` - Show platform-to-platform field mappings

**Examples:**
```bash
asc list --platforms
asc list --elements --mappings
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

- **GitHub Copilot** - Through VS Code settings
- **Cursor** - Through `.cursor` directory configuration
- **Claude** - Through Claude AI web interface exports
- **Custom Platforms** - Define your own platform mappings

## Transferable Configuration Elements

- Skills and custom commands
- Tools and integrations
- System rules and constraints
- Prompts and instructions
- Context and background information
- Hotkeys and shortcuts
- Extensions and plugins
- Custom behaviors
- API keys and credentials (encrypted)

## Configuration Format

Configurations are stored in JSON format with the following structure:

```json
{
  "version": "1.0.0",
  "platform": "copilot",
  "timestamp": "2026-02-01T12:00:00Z",
  "config": {
    "skills": [...],
    "tools": [...],
    "rules": [...],
    "instructions": [...],
    "context": {...},
    "shortcuts": {...}
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

### Validate Compatibility

```bash
asc validate ./my-copilot-config.json --target cursor --strict
```

### Merge Configurations

```bash
asc import ./new-skills.json --to claude --merge
```

## API Usage

Use `agent-setup-copier` programmatically in your own Node.js projects:

```javascript
const { AgentSetupCopier } = require('agent-setup-copier');

const copier = new AgentSetupCopier();

// Copy configuration
const config = await copier.copy({
  from: 'copilot',
  to: 'cursor'
});

// Export configuration
const exported = await copier.export('copilot');

// Import configuration
await copier.import('./config.json', { to: 'claude' });

// Validate configuration
const isValid = await copier.validate('./config.json', { target: 'cursor' });
```

## Configuration File

Create an `.ascrc.json` file in your project root to set default options:

```json
{
  "defaultSource": "copilot",
  "defaultTarget": "cursor",
  "backupBeforeTransfer": true,
  "validateBeforeImport": true,
  "outputDir": "./agent-configs"
}
```

## Security Considerations

- **Credentials**: API keys and sensitive credentials are encrypted when stored
- **Backup**: Always create a backup before transferring critical configurations
- **Permissions**: Ensure you have permission to copy configurations from your source platform
- **Validation**: Validate configurations before importing to prevent errors

## Troubleshooting

### Configuration Not Found

Ensure you're in the correct directory or provide the full path to your configuration file:

```bash
asc export copilot --output /full/path/to/config.json
```

### Compatibility Issues

Use the validate command to check for compatibility:

```bash
asc validate ./config.json --target cursor --strict
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

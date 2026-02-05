# Contributing to Agent Config Manager (ACM)

Thanks for taking the time to contribute! This project is a Deno (2.x) CLI that
transfers AI agent configuration between platforms.

## Ways to contribute

- **Bug reports**: include repro steps, expected vs actual behavior, and your
  OS.
- **Fixes**: small, focused PRs are easiest to review.
- **New platforms**: add a platform handler under `src/platforms/`.
- **New commands**: add a command implementation under `src/commands/`.
- **Docs**: improve usage examples, platform notes, edge cases.

## Development setup

### Prerequisites

- **Deno 2.0+**

### Common tasks

```bash
# Run in development mode

deno task dev

# Type check

deno task check

# Lint

deno task lint

# Format

deno task fmt

# Tests

deno task test
```

Run the CLI with arguments via the `dev` task:

```bash
deno task dev -- copy --from copilot --to cursor
```

### Building

```bash
# Build a local binary

deno task build

# Build all target binaries

deno task build:all
```

## Project structure (high level)

- `src/main.ts`: CLI entrypoint
- `src/commands/`: command implementations (`copy`, `export`, `import`, `list`,
  `backup`)
- `src/platforms/`: platform adapters (how to read/write each platform’s config)
- `src/utils/`: shared helpers (colors, git, etc.)
- `src/types.ts`: shared types and config schema

## Adding a new platform

1. Create a new handler in `src/platforms/<platform>.ts`.
2. Export it from `src/platforms/mod.ts`.
3. Update any platform type unions / validation in `src/types.ts` (and/or the
   command argument validation).
4. Implement at least:
   - export (read platform config → normalized config)
   - import (normalized config → platform files), supporting replace vs merge if
     applicable
5. Document the platform in the README Supported Platforms table.

Design goals for platform handlers:

- Prefer **deterministic** output (stable ordering, stable formatting).
- Avoid writing files when **no changes** are required.
- Keep file operations inside standard platform config locations.

## Adding or changing commands

- Commands live in `src/commands/` and are wired up via `src/commands/mod.ts`.
- Keep flags consistent across commands (`--from`, `--to`, `--output`,
  `--merge`, `--dry-run` where applicable).
- If you change CLI output, keep it readable and consistent with existing color
  conventions.

## Code style

- Use `deno fmt` and `deno lint`.
- TypeScript should remain strict (see `deno.json` `compilerOptions`).
- Keep PRs small and focused; avoid drive-by refactors.

## Testing expectations

- Add or update tests when you change behavior.
- Platform handlers should be tested with representative fixtures (minimal but
  realistic).

## Pull request guidelines

- **Describe the problem** and the solution.
- Include **manual test steps** (example commands and expected outputs).
- If you touch file IO paths, mention the affected platforms/locations.
- Keep backwards compatibility unless the change is clearly justified.

## Reporting security issues

If you believe you’ve found a security issue (e.g., path traversal, unsafe file
writes), please avoid opening a public issue.

- Prefer reporting via GitHub Security Advisories, or contact the maintainer
  privately.

# CLAUDE.md - MCP Syncthing Server

**Inherits from:** `/home/zdendys/CLAUDE.md`

---

## Project Overview

MCP server providing Syncthing REST API control for Claude Code.

**Purpose:** Simplify Syncthing diagnostics and control within Claude Code sessions.

**Technology Stack:**
- TypeScript 5.7+
- Node.js 18+
- MCP SDK 1.0.4+
- Native fetch API

---

## Project Structure

```
~/mcp-servers/syncthing/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (gitignored)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # User documentation
├── CLAUDE.md             # This file - Claude instructions
├── STATUS.md             # Current project state
└── .gitignore
```

---

## Development Workflow

### Building
```bash
cd ~/mcp-servers/syncthing
npm install
npm run build
```

### Testing
```bash
# Manual test via stdio
export SYNCTHING_API_KEY="key"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Adding New Tools

1. Add tool definition to `TOOLS` array in `src/index.ts`
2. Add case handler in `CallToolRequestSchema` switch statement
3. Update README.md with new tool documentation
4. Rebuild: `npm run build`
5. Test manually before committing

---

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit return types preferred
- Use async/await (no callbacks)
- Handle all errors explicitly

### API Calls
- Always use `syncthingApi()` helper function
- Validate input parameters before API call
- Return JSON.stringify() with pretty formatting
- Catch and format errors consistently

### Error Handling
```typescript
try {
  // API call
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: `[ERROR] ${errorMessage}` }],
    isError: true,
  };
}
```

### NO EMOJI IN CODE
- Use [OK], [ERROR], [INFO] prefixes
- Windows cp1250 compatibility required

---

## Environment Configuration

### Required Variables
- `SYNCTHING_API_KEY` - API key from Syncthing settings (REQUIRED)
- `SYNCTHING_API_URL` - API endpoint (default: http://localhost:8384)

### Claude Desktop Config
Location: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "syncthing": {
      "command": "node",
      "args": ["/home/zdendys/mcp-servers/syncthing/dist/index.js"],
      "env": {
        "SYNCTHING_API_KEY": "...",
        "SYNCTHING_API_URL": "http://localhost:8384"
      }
    }
  }
}
```

---

## Available Tools (Current)

### Monitoring
- `syncthing_get_status` - System status
- `syncthing_list_folders` - All folders
- `syncthing_get_folder_status` - Folder details
- `syncthing_get_folder_errors` - Folder errors
- `syncthing_get_file_info` - File details (local vs global)
- `syncthing_list_devices` - Device list
- `syncthing_get_connections` - Connection status

### Control
- `syncthing_scan_folder` - Trigger rescan

---

## Future Enhancements (Roadmap)

### Phase 2 - More Control Tools
- `syncthing_override_changes` - Override local changes
- `syncthing_pause_folder` - Pause folder sync
- `syncthing_resume_folder` - Resume folder sync
- `syncthing_restart` - Restart Syncthing

### Phase 3 - Configuration Tools
- `syncthing_add_folder` - Add new folder
- `syncthing_remove_folder` - Remove folder
- `syncthing_add_device` - Add new device
- `syncthing_get_config` - Get full config

### Phase 4 - Advanced Features
- `syncthing_get_logs` - Fetch recent logs
- `syncthing_get_db_completion` - Sync completion percentage
- `syncthing_get_need_summary` - Summary of pending files

---

## Testing Checklist

Before marking any task complete:
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Tool appears in MCP tools list
- [ ] Tool executes without crashing
- [ ] Error handling works (invalid parameters, API errors)
- [ ] README.md updated with new tool
- [ ] STATUS.md updated with implementation notes

---

## Troubleshooting

### Build Errors
```bash
# Clean rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

### Runtime Errors
- Check `SYNCTHING_API_KEY` is set
- Verify Syncthing is running: `ps aux | grep syncthing`
- Test API manually: `curl -H "X-API-Key: key" http://localhost:8384/rest/system/status`

### MCP Not Loading
- Check Claude Desktop config syntax (valid JSON)
- Restart Claude Desktop completely
- Check stderr logs: Look for [ERROR] or [INFO] messages

---

**Version:** 2026-01-08
**Status:** Initial implementation complete, ready for use

# MCP Server for Syncthing

MCP (Model Context Protocol) server providing tools for controlling and monitoring Syncthing via its REST API.

## Features

### Monitoring Tools
- `syncthing_get_status` - Get overall system status (version, uptime, system info)
- `syncthing_list_folders` - List all configured folders with IDs, labels, and paths
- `syncthing_get_folder_status` - Get detailed folder status (sync state, errors, byte counts)
- `syncthing_get_folder_errors` - Get list of errors for a specific folder
- `syncthing_get_file_info` - Get file information (local vs global versions)
- `syncthing_list_devices` - List all configured devices
- `syncthing_get_connections` - Get current connection status for all devices

### Control Tools
- `syncthing_scan_folder` - Trigger folder/subfolder scan to detect changes

## Installation

### 1. Install Dependencies

```bash
cd ~/mcp-servers/syncthing
npm install
npm run build
```

### 2. Set System Environment Variables

**Option A: System-wide (Recommended)**

Add to `/etc/environment`:
```bash
SYNCTHING_API_KEY="your-api-key-here"
SYNCTHING_API_URL="http://localhost:8384"
```

Then logout/login for changes to take effect.

**Option B: User profile**

Add to `~/.profile` (NOT `~/.bashrc`):
```bash
export SYNCTHING_API_KEY="your-api-key-here"
export SYNCTHING_API_URL="http://localhost:8384"
```

Then logout/login for changes to take effect.

**Note:** `~/.bashrc` only works for terminal sessions, not GUI apps like Claude Desktop.

To find your API key:
- Open Syncthing web UI (usually http://localhost:8384)
- Go to Actions > Settings > General
- Copy the API Key

### 3. Configure Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "syncthing": {
      "command": "node",
      "args": ["/home/zdendys/mcp-servers/syncthing/dist/index.js"]
    }
  }
}
```

**Note:** Environment variables are loaded from system, not hardcoded in config.

### 4. Restart Claude Desktop

The MCP tools will be available in your next Claude Code session.

## Usage Examples

### Check System Status
```typescript
syncthing_get_status()
```

### List All Folders
```typescript
syncthing_list_folders()
```

### Get Folder Status
```typescript
syncthing_get_folder_status({ folder: "zoaz2-u7tor" })
```

### Check File Information
```typescript
syncthing_get_file_info({
  folder: "zoaz2-u7tor",
  file: "minecraft/client-mods-1.21.1.zip"
})
```

### Trigger Folder Scan
```typescript
syncthing_scan_folder({ folder: "zoaz2-u7tor" })
// Or scan specific subfolder:
syncthing_scan_folder({ folder: "zoaz2-u7tor", sub: "minecraft" })
```

### Check Connection Status
```typescript
syncthing_get_connections()
```

## Troubleshooting

### API Key Not Set
If you see: `[ERROR] SYNCTHING_API_KEY environment variable is not set`

Solution: Make sure environment variable is set in Claude Desktop config.

### Connection Refused
If you see: `Syncthing API error: connect ECONNREFUSED`

Solution:
- Verify Syncthing is running: `ps aux | grep syncthing`
- Check API URL is correct (default: http://localhost:8384)
- Verify Syncthing web UI is accessible in browser

### API Key Invalid
If you see: `Syncthing API error: 403 Forbidden`

Solution: Double-check your API key in Syncthing settings.

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Test Tools Manually
```bash
export SYNCTHING_API_KEY="your-key"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Architecture

- **Language**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **API Client**: Native fetch API
- **Transport**: stdio (standard input/output)

## Security Notes

- API key is loaded from environment variables (never hardcoded)
- All API communication happens locally (default: localhost:8384)
- No external network requests
- Read-only operations are safe; write operations (scan) require user approval in Claude Code

## License

MIT

## Authors

- Zdendys (Project Manager)
- Nyara (AI Assistant)

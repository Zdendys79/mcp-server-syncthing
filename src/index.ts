#!/usr/bin/env node

/**
 * MCP Server for Syncthing API
 *
 * Provides tools for controlling and monitoring Syncthing via its REST API.
 * API key is loaded from SYNCTHING_API_KEY environment variable.
 * API URL is loaded from SYNCTHING_API_URL environment variable (default: http://localhost:8384)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration from environment variables
const API_KEY: string = (() => {
  const key = process.env.SYNCTHING_API_KEY;
  if (!key) {
    console.error("[ERROR] SYNCTHING_API_KEY environment variable is not set");
    process.exit(1);
  }
  return key;
})();
const API_URL = process.env.SYNCTHING_API_URL || "http://localhost:8384";

// Helper function for API calls
async function syncthingApi(endpoint: string, method: string = "GET", body?: any): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Syncthing API error: ${response.status} ${response.statusText}`);
  }

  // Some endpoints return empty response
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "syncthing_get_status",
    description: "Get overall Syncthing system status including version, uptime, and system info",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "syncthing_list_folders",
    description: "List all configured folders with their IDs, labels, and paths",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "syncthing_get_folder_status",
    description: "Get detailed status of a specific folder including sync state, errors, and byte counts",
    inputSchema: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder ID",
        },
      },
      required: ["folder"],
    },
  },
  {
    name: "syncthing_get_folder_errors",
    description: "Get list of errors for a specific folder",
    inputSchema: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder ID",
        },
      },
      required: ["folder"],
    },
  },
  {
    name: "syncthing_get_file_info",
    description: "Get detailed information about a specific file including local and global versions",
    inputSchema: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder ID",
        },
        file: {
          type: "string",
          description: "Relative path to file within folder",
        },
      },
      required: ["folder", "file"],
    },
  },
  {
    name: "syncthing_scan_folder",
    description: "Trigger a scan of a folder or subfolder to detect changes",
    inputSchema: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Folder ID",
        },
        sub: {
          type: "string",
          description: "Optional subfolder path to scan (relative to folder root)",
        },
      },
      required: ["folder"],
    },
  },
  {
    name: "syncthing_list_devices",
    description: "List all configured devices with their IDs and connection status",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "syncthing_get_connections",
    description: "Get current connection status for all devices",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// Create and configure MCP server
const server = new Server(
  {
    name: "mcp-server-syncthing",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "syncthing_get_status": {
        const status = await syncthingApi("/rest/system/status");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case "syncthing_list_folders": {
        const folders = await syncthingApi("/rest/config/folders");
        const formatted = folders.map((f: any) => ({
          id: f.id,
          label: f.label,
          path: f.path,
          type: f.type,
        }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case "syncthing_get_folder_status": {
        if (!args || typeof args.folder !== "string") {
          throw new Error("folder parameter is required");
        }
        const status = await syncthingApi(`/rest/db/status?folder=${args.folder}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case "syncthing_get_folder_errors": {
        if (!args || typeof args.folder !== "string") {
          throw new Error("folder parameter is required");
        }
        const errors = await syncthingApi(`/rest/folder/errors?folder=${args.folder}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errors, null, 2),
            },
          ],
        };
      }

      case "syncthing_get_file_info": {
        if (!args || typeof args.folder !== "string" || typeof args.file !== "string") {
          throw new Error("folder and file parameters are required");
        }
        const fileInfo = await syncthingApi(
          `/rest/db/file?folder=${args.folder}&file=${encodeURIComponent(args.file)}`
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(fileInfo, null, 2),
            },
          ],
        };
      }

      case "syncthing_scan_folder": {
        if (!args || typeof args.folder !== "string") {
          throw new Error("folder parameter is required");
        }
        let endpoint = `/rest/db/scan?folder=${args.folder}`;
        if (args.sub && typeof args.sub === "string") {
          endpoint += `&sub=${encodeURIComponent(args.sub)}`;
        }
        await syncthingApi(endpoint, "POST");
        return {
          content: [
            {
              type: "text",
              text: `Scan triggered for folder: ${args.folder}${args.sub ? ` (subfolder: ${args.sub})` : ""}`,
            },
          ],
        };
      }

      case "syncthing_list_devices": {
        const devices = await syncthingApi("/rest/config/devices");
        const formatted = devices.map((d: any) => ({
          deviceID: d.deviceID,
          name: d.name,
          addresses: d.addresses,
        }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case "syncthing_get_connections": {
        const connections = await syncthingApi("/rest/system/connections");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(connections, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `[ERROR] ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[INFO] Syncthing MCP Server running");
  console.error(`[INFO] API URL: ${API_URL}`);
}

main().catch((error) => {
  console.error("[FATAL]", error);
  process.exit(1);
});

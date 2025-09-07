import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod'

const server = new McpServer({
    name: 'chaicode-server',
    version: '1.0.0',
})

// registering tool
server.registerTool(
    'addTwoNumbers',
    {
        title: 'Add Two Numbers',
        description: 'This tool add two numbers together',
        inputSchema: {
            num1: z.number().describe('The first number to add'),
            num2: z.number().describe('The second number to add'),
        }
    },
    async ({ num1, num2 }) => {
        return {
            content: [{ type: 'text', text: `The sum of ${num1} and ${num2} is ${num1 + num2}` }]
        }
    }
)

const transport = new StdioServerTransport();
await server.connect(transport);

console.log('MCP Server is running...');

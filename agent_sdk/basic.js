import 'dotenv/config'
import { Agent, run, tool } from '@openai/agents'
import z from 'zod'

// defining tool to fetch current time
const getCurrentTimeTool = tool({
    name: 'get_current_time',
    description: 'This tool returns the current time',
    parameters: z.object({}),
    async execute() {
        return new Date().toString();
    }
})

// defining tool to fetch menu
const getMenuTool = tool({
    name: 'get_menu',           //try to keep the name in underscore
    description: 'Fetches and returns the menu items',
    parameters: z.object({}),
    async execute() {
        return {
            Drinks: {
                Chai: 'INR 50',
                Coffee: 'INR 70',
            },
            Veg: {
                DalMakhni: 'INR 250',
                Panner: 'INR 400',
            },
        }
    }
})

//creating cooking Agent
const cookingAgent = new Agent({
    name: 'Cooking Agent',
    model: 'gpt-4.1-mini',
    tools: [getCurrentTimeTool, getMenuTool],
    instructions: `
        You are a helpful cooking assistant.
        IMPORTANT: When users ask about food options, recipes, or best food to eat,
        you MUST use the provided tools (get_menu, get_current_time) instead of making up answers.
    `
})

//creating coding agent
const codingAgent = new Agent({
    name: 'Coding Agent',
    description: ` You are an expert coding assistant particularly in Javascript`
})

//creating gateway agent to orchestrate
const gatewayAgent = Agent.create({
    name: 'Triage Agent',
    instructions: `
        You are a triage agent. 
        IMPORTANT: Do NOT answer queries yourself. 
        Your only job is to decide whether the query is about coding or food.
        - If it's food/cooking/recipes/menu/time related → ALWAYS handoff to Cooking Agent.
        - If it's coding/programming/JavaScript related → ALWAYS handoff to Coding Agent.
        Never answer directly.
    `,
    handoffs: [codingAgent, cookingAgent]
})

async function chatWithAgent(query) {
    const result = await run(gatewayAgent, query);
    console.log(`History`, result.history);
    console.log(result.lastAgent.name);
    console.log(result.finalOutput);
}

chatWithAgent(`What's the best food from menu to eat at current time ?`)
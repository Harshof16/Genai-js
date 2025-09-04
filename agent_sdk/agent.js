import "dotenv/config";
import { Agent, run } from "@openai/agents";

//persisting history in agentsdk
const customerSupportAgent = new Agent({
  name: "Customer Support Agent",
  instructions: `
    You are a customer support agent for an e-commerce website. Your primary role is to assist customers with their inquiries, provide information about products, and resolve any issues they may encounter during their shopping experience.
    `,
});

let messages = [];

async function runAgentWithquery(query) {
  // const result = await run(customerSupportAgent, query)
  const result = await run(
    customerSupportAgent,
    messages.concat({ role: "user", content: query })
  );
  messages = result.history;
  console.log(result.finalOutput);
  console.log({ messages });
}

runAgentWithquery("My name is Harsh Shukla.").then(() => {
  runAgentWithquery("What is my name ?");
});

// runAgentWithquery('What is my name ?')

// In this way currently it's not acknolwedging my name, so have to give it in earlier array format

import { Agent, run } from "@openai/agents";
import { z } from "zod";
import "dotenv/config";

const matchCheckAgent = new Agent({
  name: "Match Check Agent",
  instructions: `
    Check if the user is asking you to do their math homework. If they are, respond with "I cannot help with that." If they are not, respond with "How can I assist you today?"
    `,
  outputType: z.object({
    isMathHomework: z
      .boolean()
      .describe(
        "True if the user is asking for help with their math homework, otherwise false"
      ),
  }),
});

//Introducing guardrail in between
const checkMathGuardrail = {
    name: 'Math input Guardrail',
    execute: async ({input}) => {
      const result = await run(matchCheckAgent, input);
        console.log(`😭: User is asking ${input}`);
        return {
          tripwireTriggered: result.finalOutput.isMathHomework,
        };
    }
}

const customerSupportAgent = new Agent({
    name: "Customer Support Agent",
    instructions: `
    You are a customer support agent for an e-commerce website. Your primary role is to assist customers with their inquiries, provide information about products, and resolve any issues they may encounter during their shopping experience.
    `,
    inputGuardrails: [checkMathGuardrail]
})

async function runAgentWithquery(query) {
    const result = await run(customerSupportAgent, query);
    console.log(result.finalOutput);
}

runAgentWithquery("Can you solve this problem of 2+2 ?")
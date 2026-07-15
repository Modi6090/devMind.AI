import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { defaultTools } from "./tools";

export interface AgentInput {
  input: string;
  chatHistory?: { role: string; content: string }[];
}

/**
 * Initializes and runs the DevMind Agentic Loop.
 * The AI can think, act (using tools), and observe the results.
 */
export async function runAgenticLoop({ input, chatHistory = [] }: AgentInput) {
  // 1. Initialize the LLM
  const model = new ChatOpenAI({
    modelName: "gpt-4o", // Using the latest model capable of parallel function calling
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 2. Define the Prompt Template for the Agent
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are devMind.AI, a highly capable advanced AI software engineer and developer assistant.
You have access to a set of powerful tools to help the user build, debug, and understand software.

Always follow these guidelines:
1. Think step-by-step about how to solve the user's problem.
2. Use the 'read_file' tool to inspect code before making modifications.
3. Use the 'run_command' tool to verify tests, lint code, or install missing dependencies.
4. Use the 'write_file' tool carefully to write high-quality, bug-free code.
5. If you do not know the answer or need up-to-date info, use the 'search_web' tool.

Work autonomously. You are operating in an agentic loop (Think -> Act -> Observe -> React).
If a command fails, observe the error, correct your approach, and try again.`
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // 3. Create the Agent
  const agent = await createOpenAIToolsAgent({
    llm: model,
    tools: defaultTools,
    prompt,
  });

  // 4. Create the Executor (The Loop)
  const agentExecutor = new AgentExecutor({
    agent,
    tools: defaultTools,
    maxIterations: 5, // Prevent infinite loops
    verbose: true, // Log the think/act/observe steps
  });

  // 5. Format Chat History for LangChain
  const formattedHistory = chatHistory.map((msg) => {
    return msg.role === "user" 
      ? ["human", msg.content]
      : ["ai", msg.content];
  });

  // 6. Execute the Agentic Loop
  const result = await agentExecutor.invoke({
    input,
    chat_history: formattedHistory,
  });

  return {
    output: result.output,
  };
}

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Helper to resolve paths relative to the project root
const getAbsolutePath = (relativePath: string) => {
  return path.resolve(process.cwd(), relativePath);
};

export const readFileTool = new DynamicStructuredTool({
  name: "read_file",
  description: "Reads the content of a file from the local file system. Provide the file path.",
  schema: z.object({
    filePath: z.string().describe("The path to the file to read, relative to the project root."),
  }),
  func: async ({ filePath }) => {
    try {
      const fullPath = getAbsolutePath(filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      return content;
    } catch (error) {
      return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

export const writeFileTool = new DynamicStructuredTool({
  name: "write_file",
  description: "Writes content to a file on the local file system. It will overwrite the file if it exists.",
  schema: z.object({
    filePath: z.string().describe("The path where the file should be written."),
    content: z.string().describe("The content to write to the file."),
  }),
  func: async ({ filePath, content }) => {
    try {
      const fullPath = getAbsolutePath(filePath);
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      return `Error writing file: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

export const runCommandTool = new DynamicStructuredTool({
  name: "run_command",
  description: "Executes a shell command on the local terminal. Use this to install dependencies, run tests, or execute scripts.",
  schema: z.object({
    command: z.string().describe("The shell command to execute."),
  }),
  func: async ({ command }) => {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
      let result = "";
      if (stdout) result += `STDOUT:\n${stdout}\n`;
      if (stderr) result += `STDERR:\n${stderr}\n`;
      return result || "Command executed successfully with no output.";
    } catch (error: any) {
      return `Error executing command: ${error.message}\n${error.stdout ? `STDOUT: ${error.stdout}` : ""}\n${error.stderr ? `STDERR: ${error.stderr}` : ""}`;
    }
  },
});

export const searchWebTool = new DynamicStructuredTool({
  name: "search_web",
  description: "Searches the web for up-to-date information, documentation, or answers to errors.",
  schema: z.object({
    query: z.string().describe("The search query to look up on the web."),
  }),
  func: async ({ query }) => {
    try {
      // Stubbing a web search. In a real environment, you'd integrate Tavily, Google Custom Search, or DuckDuckGo API here.
      // For demonstration, we simulate an API call or return a mock indicating web search is connected.
      return `Simulated Web Search Results for '${query}': \n1. Found relevant documentation.\n2. GitHub issues matching the query.\n(Note: Connect a real Search API provider in production)`;
    } catch (error) {
      return `Error searching the web: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

export const defaultTools = [readFileTool, writeFileTool, runCommandTool, searchWebTool];

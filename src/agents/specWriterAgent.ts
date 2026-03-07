/**
 * specWriterAgent.ts
 * Converts the user request into a formal, concise spec written ONCE at init.
 * Injected into every critic and refactor prompt forever — prevents requirement drift.
 */
import { dict_string_agent_name_to_string_model_name } from "../state";
import { get_string_full_context_for_llm_injection }   from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";
import { string_prompt_all_conventions }                                           from "../utils/prompts";


export async function run_string_spec_writer_agent_on_string_user_request(
  string_user_request: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name(
    "run_string_spec_writer_agent_on_string_user_request", { string_user_request }
  );

  const string_model   = dict_string_agent_name_to_string_model_name["spec_writer"];
  const string_context = get_string_full_context_for_llm_injection();

  const string_system_prompt = `You are a software requirements analyst.
Analyze the description and write a concise formal spec for a JavaScript app.
Think about ALL functions needed, including state management helpers.
Format strictly:

FUNCTIONS: list each required function name (snake_case) and one-line description
CONSTRAINTS: rules, edge cases, naming conventions

Max 25 lines. No prose. No examples. No test or framework functions.

${string_context}`;

  const string_user_prompt = `User request: "${string_user_request}"\nWrite the formal spec.
  
  ${string_prompt_all_conventions}
  `;

  const string_spec = await call_string_llm_for_string_agent_with_string_model(
    "spec_writer", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name(
    "run_string_spec_writer_agent_on_string_user_request",
    { int_spec_chars: string_spec.length }
  );
  return string_spec;
}

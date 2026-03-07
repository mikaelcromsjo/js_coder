/**
 * coderAgent.ts
 * On init: outputs full JS (all functions) — this is the only time a full file is emitted.
 * All subsequent changes go through refactorAgent which outputs diffs only.
 */
import { dict_string_agent_name_to_string_model_name } from "../state";
import { get_string_full_context_for_llm_injection }   from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import { string_prompt_all_conventions }               from "../utils/prompts";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_coder_agent_on_string_plan(string_plan: string): Promise<string> {
  init_fn_debug_log_for_string_function_name("run_string_coder_agent_on_string_plan", {
    int_plan_chars: string_plan.length,
  });

  const string_model   = dict_string_agent_name_to_string_model_name["coder"];
  const string_context = get_string_full_context_for_llm_injection();

  const string_system_prompt =
`You are an expert JavaScript developer generating an app from a plan.
OUTPUT RULES:
- Output raw JavaScript only. No markdown. No explanation.
- Output ALL functions required by the plan — this is the initial generation.
- Each function must use module.exports at the bottom.
- No imports. Use only Node.js built-ins if needed.

${string_prompt_all_conventions}

${string_context}

PLAN:\n${string_plan}
`;

  const string_user_prompt = `\n\nWrite the complete JavaScript implementation.`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "coder", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name("run_string_coder_agent_on_string_plan", {
    int_result_chars: string_result.length,
  });
  return string_result;
}

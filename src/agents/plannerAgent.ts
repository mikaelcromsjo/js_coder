import { dict_string_agent_name_to_string_model_name } from "../state";
import { get_string_full_context_for_llm_injection }        from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_planner_agent_on_string_user_request(
  string_user_request: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name("run_string_planner_agent_on_string_user_request", { string_user_request });

  const string_model   = dict_string_agent_name_to_string_model_name["planner"];
  const string_context = get_string_full_context_for_llm_injection();

  const string_system_prompt = `You are a software architect. Output a numbered implementation plan. Plain text only. No code. Each step = one atomic task.\n\n${string_context}`;
  const string_user_prompt   = `Plan this JavaScript app: "${string_user_request}"`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "planner", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name("run_string_planner_agent_on_string_user_request", { int_result_chars: string_result.length, string_preview: string_result.slice(0, 6000) });
  return string_result;
}

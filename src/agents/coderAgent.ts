import { dict_string_agent_name_to_string_model_name } from "../state";
import { get_string_full_context_for_llm_injection }        from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import { string_prompt_all_conventions }                      from "../utils/prompts";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_coder_agent_on_string_plan(
  string_plan: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name("run_string_coder_agent_on_string_plan", { int_plan_chars: string_plan.length });

  const string_model   = dict_string_agent_name_to_string_model_name["coder"];
  const string_context = get_string_full_context_for_llm_injection();

  const string_system_prompt = `You are an expert JavaScript developer. Output ONLY raw JavaScript. No markdown. No explanation. Follow all RULES exactly.\n\n${string_prompt_all_conventions}\n\n${string_context}`;
  const string_user_prompt   = `Write complete JavaScript for this plan:\n${string_plan}`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "coder", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name("run_string_coder_agent_on_string_plan", { int_result_chars: string_result.length, string_preview: string_result.slice(0, 6000) });
  return string_result;
}

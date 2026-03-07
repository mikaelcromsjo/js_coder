import { dict_string_agent_name_to_string_model_name, string_formal_spec, string_original_requirement } from "../state";
import { get_string_full_context_for_llm_injection }         from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import { string_prompt_all_conventions }                      from "../utils/prompts";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_critic_agent_on_string_js_code(
  string_js_code: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name("run_string_critic_agent_on_string_js_code", {
    int_code_chars: string_js_code.length,
  });

  const string_model   = dict_string_agent_name_to_string_model_name["critic"];
  const string_context = get_string_full_context_for_llm_injection();

  const string_system_prompt = `You are a senior code reviewer.
Reply EXACTLY "PASS" if code is correct and satisfies the spec.
Otherwise reply a numbered list of specific problems only. No preamble.

ORIGINAL REQUIREMENT: ${string_original_requirement}
FORMAL SPEC:
${string_formal_spec || "(no spec yet)"}
${string_prompt_all_conventions}
${string_context}`;

  const string_user_prompt = `Review this JavaScript code:\n${string_js_code}`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "critic", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name("run_string_critic_agent_on_string_js_code", {
    string_verdict: string_result.slice(0, 4000),
  });
  return string_result;
}

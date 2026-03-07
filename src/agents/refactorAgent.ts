import { dict_string_agent_name_to_string_model_name, string_formal_spec, string_original_requirement } from "../state";
import { call_string_llm_for_string_agent_with_string_model }                        from "../utils/llmCall";
import { string_prompt_all_conventions }                                              from "../utils/prompts";
import { get_string_optimized_context_for_string_instruction_and_string_js_code }    from "../context/resolveTargetFunctions";
import { get_string_full_context_for_llm_injection }                                 from "../context";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_refactor_agent_on_string_js_code_and_string_critique(
  string_js_code:           string,
  string_critique_or_error: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name(
    "run_string_refactor_agent_on_string_js_code_and_string_critique",
    { int_code_chars: string_js_code.length, string_critique_or_error }
  );

  const string_model = dict_string_agent_name_to_string_model_name["refactor"];

  const string_context = string_js_code.length > 0
    ? await get_string_optimized_context_for_string_instruction_and_string_js_code(
        string_critique_or_error, string_js_code
      )
    : get_string_full_context_for_llm_injection();

  const string_system_prompt =
    `You are an expert JavaScript developer fixing or updating code.
Output ONLY the complete corrected raw JavaScript file. No markdown. No explanation.
Apply the instruction. Keep all other functions unchanged.
Always satisfy the original requirement and formal spec below.

ORIGINAL REQUIREMENT: ${string_original_requirement}
FORMAL SPEC:
${string_formal_spec || "(no spec yet)"}
${string_prompt_all_conventions}
${string_context}`;

  const string_user_prompt =
    `Full current code:\n${string_js_code}\n\nInstruction:\n${string_critique_or_error}\n\nReturn complete updated JavaScript file.`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "refactor", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name(
    "run_string_refactor_agent_on_string_js_code_and_string_critique",
    { int_result_chars: string_result.length }
  );
  return string_result;
}

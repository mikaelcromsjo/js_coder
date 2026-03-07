import { get_string_full_context_for_llm_injection }        from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import { string_prompt_all_conventions }                      from "../utils/prompts";
import { dict_string_agent_name_to_string_model_name, string_formal_spec, string_original_requirement } from "../state";
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

  const string_system_prompt = `You are a software architect generating a step-by-step implementation plan.
Use the formal spec as your source of truth — do not add functions not in the spec.

IMPORTANT:
- Plan only functions listed in the FORMAL SPEC
- Do NOT add test state functions (set_bool_*, get_bool_*) — those are injected by the framework
- Do NOT add import steps unless a non-built-in module is explicitly required
- Each step = one function: name it, describe its single job, list its inputs/outputs
- End with: "Create main execution block guarded by require.main === module".\n\n

${string_prompt_all_conventions}\n\n
${string_context}\n\n

ORIGINAL REQUIREMENT: ${string_original_requirement}
FORMAL SPEC:
${string_formal_spec || "(no spec yet)"}
`;


  const string_user_prompt   = `Plan this JavaScript app: "${string_user_request}"`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "planner", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name("run_string_planner_agent_on_string_user_request", { int_result_chars: string_result.length, string_preview: string_result.slice(0, 60) });
  return string_result;
}

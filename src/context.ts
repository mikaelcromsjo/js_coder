import {
  string_current_app_name,
  string_current_app_description,
  string_current_js_output_file_path,
  int_current_revision_number,
  bool_last_test_passed,
  string_last_test_error_message,
  string_last_test_stdout,
  dict_string_agent_name_to_string_model_name,
  list_string_all_prompts_sent,
  list_string_all_llm_responses_received,
  int_max_heal_attempts,
  int_current_heal_attempt_number,
  string_last_generated_js_code,
  string_active_llm_provider,
} from "./state";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "./debug/debugLogger";

export function get_string_full_context_for_llm_injection(): string {
  init_fn_debug_log_for_string_function_name("get_string_full_context_for_llm_injection");

  const int_total_prompts = list_string_all_prompts_sent.length;
  const string_agent_models = Object.entries(dict_string_agent_name_to_string_model_name)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  const string_context = `
=== AGEF CONTEXT ===
provider=${string_active_llm_provider} | app=${string_current_app_name} | revision=${int_current_revision_number}
output=${string_current_js_output_file_path}
test_passed=${bool_last_test_passed} | heal=${int_current_heal_attempt_number}/${int_max_heal_attempts}
test_error=${string_last_test_error_message || "none"}
test_stdout=${string_last_test_stdout.slice(0, 150) || "none"}
prompts_sent=${int_total_prompts} | responses=${list_string_all_llm_responses_received.length}
description=${string_current_app_description}
agents:
${string_agent_models}
last_code_tail=${string_last_generated_js_code.slice(-400) || "none"}
=== END CONTEXT ===`.trim();

  exit_fn_debug_log_for_string_function_name("get_string_full_context_for_llm_injection", {
    int_context_chars: string_context.length,
  });
  return string_context;
}

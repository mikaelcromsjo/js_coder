import { dict_string_agent_name_to_string_model_name } from "../state";
import { get_string_full_context_for_llm_injection }        from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import { string_prompt_all_conventions }                      from "../utils/prompts";
import { string_prompt_tester }                      from "../utils/promptsTester";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_test_writer_agent_on_string_js_code_and_string_file_path(
  string_js_code: string, string_app_file_path: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name("run_string_test_writer_agent_on_string_js_code_and_string_file_path", { string_app_file_path, int_code_chars: string_js_code.length });

  const string_model   = dict_string_agent_name_to_string_model_name["test_writer"];
  const string_context = get_string_full_context_for_llm_injection();

  const string_system_prompt = `You are a test engineer. Use ONLY Node.js built-in assert module. Output ONLY raw JavaScript test code. Use require() to import from the app file. Write minimum 3 assert statements.\n\n${string_prompt_all_conventions}\n\n${string_prompt_tester}\n\n${string_context}`;
  const string_user_prompt   = `Write tests for app at: ${string_app_file_path}\n\nCode:\n${string_js_code}`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "test_writer", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name("run_string_test_writer_agent_on_string_js_code_and_string_file_path", { int_result_chars: string_result.length, string_preview: string_result.slice(0, 6000) });
  return string_result;
}

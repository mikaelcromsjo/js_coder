import { dict_string_agent_name_to_string_model_name } from "../state";
import { get_string_full_context_for_llm_injection } from "../context";
import { call_string_llm_for_string_agent_with_string_model } from "../utils/llmCall";
import { string_prompt_all_conventions } from "../utils/prompts";
import { string_prompt_tester } from "../utils/promptTester";
import { get_list_string_signature_registry_from_string_js_code } from "../context/codeAnalyzer";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function get_bool_test_references_undeclared_vars(
  string_test_code: string,
  list_string_exports: string[]
): boolean {
  const regex_declared = /(?:const|let)\s+(\w+)\s*=/g;
  const list_string_declared: string[] = ["app", "assert", "require", "run_bool_assert_test"];
  let match_decl: RegExpExecArray | null;
  while ((match_decl = regex_declared.exec(string_test_code)) !== null) {
    list_string_declared.push(match_decl[1]);
  }

  const regex_asserted = /assert\.\w+\(([^)]+)\)/g;
  let match_assert: RegExpExecArray | null;
  while ((match_assert = regex_asserted.exec(string_test_code)) !== null) {
    const list_string_tokens = match_assert[1]
      .split(/[\s,.()+\-*/]/)
      .filter((str_t) => /^[a-z][a-z0-9_]+$/.test(str_t));
    for (const string_token of list_string_tokens) {
      const bool_is_known =
        list_string_declared.includes(string_token) ||
        list_string_exports.includes(string_token);
      if (!bool_is_known) return true;
    }
  }
  return false;
}

export async function run_string_test_writer_agent_on_string_js_code_and_string_file_path(
  string_js_code: string,
  string_app_file_path: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name(
    "run_string_test_writer_agent_on_string_js_code_and_string_file_path",
    { string_app_file_path, int_code_chars: string_js_code.length }
  );

  const string_model       = dict_string_agent_name_to_string_model_name["test_writer"];
  const string_context     = get_string_full_context_for_llm_injection();
  const list_string_signatures = get_list_string_signature_registry_from_string_js_code(string_js_code);

  const string_system_prompt = [
    "You are a test engineer. Output ONLY raw JavaScript. No markdown fences.",
    "Use Node.js built-in assert module only. No test frameworks.",
    string_prompt_all_conventions,
    string_prompt_tester,
    string_context,
  ].join("\n\n");

  const string_user_prompt = [
    `App file: ${string_app_file_path}`,
    "EXPORTED FUNCTION SIGNATURES — test ONLY these, no others:",
    list_string_signatures.join("\n"),
    "INSTRUCTION: write arrange/act/assert tests wrapped in run_bool_assert_test for each exported function.",
    "Declare all inputs locally inside each callback. Never reference variables not declared in this test file.",
  ].join("\n\n");

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "test_writer", string_model, string_system_prompt, string_user_prompt
  );

  const list_string_export_names = list_string_signatures.map(
    (str_sig) => str_sig.split("(")[0].trim()
  );

  const bool_has_undeclared = get_bool_test_references_undeclared_vars(
    string_result,
    list_string_export_names
  );

  if (bool_has_undeclared) {
    const string_error_message =
      "run_str_test_writer_agent: test references undeclared variables — regeneration required";
    console.error(string_error_message);
    throw new Error(string_error_message);
  }

  exit_fn_debug_log_for_string_function_name(
    "run_string_test_writer_agent_on_string_js_code_and_string_file_path",
    { int_result_chars: string_result.length, string_preview: string_result.slice(0, 300) }
  );
  return string_result;
}

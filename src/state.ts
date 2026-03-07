import { init_fn_debug_log_for_string_function_name } from "./debug/debugLogger";

// ── App identity ──────────────────────────────────────────────────────────────
export let string_current_app_name:                  string   = "";
export let string_current_app_description:           string   = "";
export let string_original_requirement:              string   = "";  // NEVER overwritten after init
export let string_formal_spec:                       string   = "";  // Written once by spec agent
export let string_current_js_output_file_path:       string   = "";

// ── Revision tracking ─────────────────────────────────────────────────────────
export let int_current_revision_number:              number   = 0;
export let int_last_passing_revision_number:         number   = 0;
export let string_last_generated_js_code:            string   = "";

// ── Test state ────────────────────────────────────────────────────────────────
export let bool_last_test_passed:                    boolean  = false;
export let string_last_test_error_message:           string   = "";
export let string_last_test_stdout:                  string   = "";
export let bool_last_syntax_check_passed:            boolean  = false;

// ── Prompt/response history ───────────────────────────────────────────────────
export let list_string_all_prompts_sent:             string[] = [];
export let list_string_all_llm_responses_received:   string[] = [];

// ── Provider + models ─────────────────────────────────────────────────────────
export let string_active_llm_provider:               string   = process.env.LLM_PROVIDER      ?? "novita";
export let string_embedding_provider:                string   = process.env.EMBEDDING_PROVIDER ?? "novita";
export let string_embedding_model:                   string   = process.env.EMBEDDING_MODEL    ?? "baai/bge-m3";

export let dict_string_agent_name_to_string_model_name: Record<string, string> = {
  planner:      process.env.PLANNER_MODEL      ?? "meta-llama/llama-3.3-70b-instruct",
  coder:        process.env.CODER_MODEL        ?? "meta-llama/llama-3.3-70b-instruct",
  critic:       process.env.CRITIC_MODEL       ?? "meta-llama/llama-3.3-70b-instruct",
  refactor:     process.env.REFACTOR_MODEL     ?? "meta-llama/llama-3.3-70b-instruct",
  test_writer:  process.env.TEST_WRITER_MODEL  ?? "meta-llama/llama-3.3-70b-instruct",
  spec_writer:  process.env.SPEC_WRITER_MODEL  ?? "meta-llama/llama-3.3-70b-instruct",
};

// ── Context level: 1=focused | 2=focused+neighbours | 3=full ────────────────
export let int_context_level:                        number   = Number(process.env.CONTEXT_LEVEL ?? 1);

// ── Self-heal config ──────────────────────────────────────────────────────────
export let int_max_heal_attempts:                    number   = Number(process.env.MAX_HEAL_ATTEMPTS ?? 3);
export let int_current_heal_attempt_number:          number   = 0;

// ── Setters ───────────────────────────────────────────────────────────────────
export function set_string_current_app_name(v: string): void { init_fn_debug_log_for_string_function_name("set_string_current_app_name", { v }); string_current_app_name = v; }
export function set_string_current_app_description(v: string): void { string_current_app_description = v; }
export function set_string_original_requirement(v: string): void { init_fn_debug_log_for_string_function_name("set_string_original_requirement", { v }); string_original_requirement = v; }
export function set_string_formal_spec(v: string): void { init_fn_debug_log_for_string_function_name("set_string_formal_spec", { int_len: v.length }); string_formal_spec = v; }
export function set_string_current_js_output_file_path(v: string): void { string_current_js_output_file_path = v; }
export function set_int_current_revision_number(v: number): void { int_current_revision_number = v; }
export function set_int_last_passing_revision_number(v: number): void { init_fn_debug_log_for_string_function_name("set_int_last_passing_revision_number", { v }); int_last_passing_revision_number = v; }
export function set_string_last_generated_js_code(v: string): void { init_fn_debug_log_for_string_function_name("set_string_last_generated_js_code", { int_len: v.length }); string_last_generated_js_code = v; }
export function set_bool_last_test_passed(v: boolean): void { init_fn_debug_log_for_string_function_name("set_bool_last_test_passed", { v }); bool_last_test_passed = v; }
export function set_string_last_test_error_message(v: string): void { string_last_test_error_message = v; }
export function set_string_last_test_stdout(v: string): void { string_last_test_stdout = v; }
export function set_bool_last_syntax_check_passed(v: boolean): void { init_fn_debug_log_for_string_function_name("set_bool_last_syntax_check_passed", { v }); bool_last_syntax_check_passed = v; }
export function set_int_current_heal_attempt_number(v: number): void { int_current_heal_attempt_number = v; }
export function set_int_context_level(v: number): void { init_fn_debug_log_for_string_function_name("set_int_context_level", { v }); int_context_level = v; }
export function push_string_to_list_all_prompts_sent(v: string): void { list_string_all_prompts_sent.push(v); }
export function push_string_to_list_all_llm_responses_received(v: string): void { list_string_all_llm_responses_received.push(v); }
export function increment_int_current_revision_number(): void { init_fn_debug_log_for_string_function_name("increment_int_current_revision_number", { int_current: int_current_revision_number }); int_current_revision_number += 1; }

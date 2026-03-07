import { db }                              from "./db";
import { get_string_current_iso_timestamp } from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function save_string_prompt_log_to_sqlite(
  string_agent_name:    string,
  string_model_name:    string,
  string_prompt_sent:   string,
  string_llm_response:  string
): void {
  init_fn_debug_log_for_string_function_name("save_string_prompt_log_to_sqlite", {
    string_agent_name,
    string_model_name,
    int_prompt_chars:   string_prompt_sent.length,
    int_response_chars: string_llm_response.length,
  });
  db.prepare(`
    INSERT INTO prompts
      (string_agent_name, string_model_name, string_prompt_sent, string_llm_response, string_timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(string_agent_name, string_model_name, string_prompt_sent, string_llm_response, get_string_current_iso_timestamp());
  exit_fn_debug_log_for_string_function_name("save_string_prompt_log_to_sqlite");
}

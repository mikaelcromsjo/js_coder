import {
  push_string_to_list_all_prompts_sent,
  push_string_to_list_all_llm_responses_received,
} from "../state";
import { save_string_prompt_log_to_sqlite } from "../storage/savePromptLog";
import {
  get_string_active_provider_name,
  create_openai_client_for_string_provider_name,
} from "./llmProviders";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function call_string_llm_for_string_agent_with_string_model(
  string_agent_name: string,
  string_model_name: string,
  string_system_prompt: string,
  string_user_prompt: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name("call_string_llm_for_string_agent_with_string_model", {
    string_agent_name,
    string_model_name,
    int_system_chars: string_system_prompt.length,
    int_user_chars:   string_user_prompt.length,
  });

  const string_provider = get_string_active_provider_name();
  const openai_client   = create_openai_client_for_string_provider_name(string_provider);
  const string_log_key  = `[${string_provider}/${string_agent_name}/${string_model_name}]`;

  push_string_to_list_all_prompts_sent(`${string_log_key} ${string_system_prompt}\n${string_user_prompt}`);

  try {
    const response = await openai_client.chat.completions.create({
      model:       string_model_name,
      temperature: 0.2,
      messages: [
        { role: "system", content: string_system_prompt },
        { role: "user",   content: string_user_prompt   },
      ],
    });

    const string_llm_response = response.choices[0]?.message?.content?.trim() ?? "";

    push_string_to_list_all_llm_responses_received(string_llm_response);
    save_string_prompt_log_to_sqlite(
      string_agent_name,
      `${string_provider}/${string_model_name}`,
      `${string_log_key} ${string_system_prompt}\n${string_user_prompt}`,
      string_llm_response
    );

    exit_fn_debug_log_for_string_function_name("call_string_llm_for_string_agent_with_string_model", {
      int_response_chars: string_llm_response.length,
      string_preview:     string_llm_response.slice(0, 6000),
    });
    return string_llm_response;

  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("call_string_llm_for_string_agent_with_string_model", string_error);
    throw error;
  }
}

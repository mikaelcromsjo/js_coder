import OpenAI from "openai";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export type TStringProviderName = "openai" | "novita" | "deepinfra" | "ollama";

const dict_string_provider_to_string_base_url: Record<TStringProviderName, string> = {
  novita:    process.env.NOVITA_API_URL    ?? "https://api.novita.ai/v3/openai",
  deepinfra: process.env.DEEP_INFRA_API_URL ?? "https://api.deepinfra.com/v1/openai",
  ollama:    process.env.OLLAMA_API_URL    ?? "http://localhost:11434/v1",
  openai:    "https://api.openai.com/v1",
};

const dict_string_provider_to_string_api_key: Record<TStringProviderName, string> = {
  novita:    process.env.NOVITA_API_KEY  ?? "",
  deepinfra: process.env.DEEP_INFRA_KEY  ?? "",
  ollama:    process.env.OLLAMA_API_KEY  ?? "ollama",
  openai:    process.env.OPENAI_API_KEY  ?? "",
};

export function get_string_active_provider_name(): TStringProviderName {
  init_fn_debug_log_for_string_function_name("get_string_active_provider_name");
  const string_provider = (process.env.LLM_PROVIDER ?? "novita").toLowerCase() as TStringProviderName;
  const list_string_valid: TStringProviderName[] = ["openai", "novita", "deepinfra", "ollama"];
  if (!list_string_valid.includes(string_provider)) {
    throw new Error(`Unknown LLM_PROVIDER="${string_provider}". Valid: ${list_string_valid.join(", ")}`);
  }
  exit_fn_debug_log_for_string_function_name("get_string_active_provider_name", { string_provider });
  return string_provider;
}

export function create_openai_client_for_string_provider_name(
  string_provider: TStringProviderName
): OpenAI {
  init_fn_debug_log_for_string_function_name("create_openai_client_for_string_provider_name", { string_provider });
  const string_base_url = dict_string_provider_to_string_base_url[string_provider];
  const string_api_key  = dict_string_provider_to_string_api_key[string_provider];
  const openai_client   = new OpenAI({ apiKey: string_api_key, baseURL: string_base_url, logLevel: 'error', });
  exit_fn_debug_log_for_string_function_name("create_openai_client_for_string_provider_name", { string_base_url });
  return openai_client;
}

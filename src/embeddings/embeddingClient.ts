/**
 * embeddingClient.ts
 * Calls the embeddings API (Novita/OpenAI-compatible) and returns float[] vector.
 * Novita uses: https://api.novita.ai/v3/openai/embeddings  (same key as chat)
 * Model: baai/bge-m3 (recommended for code — multilingual, strong semantic)
 */
import OpenAI from "openai";
import {
  string_embedding_model,
} from "../state";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

function create_embedding_openai_client(): OpenAI {
  const string_provider = (process.env.EMBEDDING_PROVIDER ?? "novita").toLowerCase();
  const dict_string_provider_to_string_url: Record<string, string> = {
    novita:    process.env.NOVITA_EMBEDDING_URL  ?? "https://api.novita.ai/v3/openai",
    openai:    "https://api.openai.com/v1",
    deepinfra: process.env.DEEP_INFRA_API_URL    ?? "https://api.deepinfra.com/v1/openai",
    ollama:    process.env.OLLAMA_API_URL         ?? "http://localhost:11434/v1",
  };
  const dict_string_provider_to_string_key: Record<string, string> = {
    novita:    process.env.NOVITA_API_KEY   ?? "",
    openai:    process.env.OPENAI_API_KEY   ?? "",
    deepinfra: process.env.DEEP_INFRA_KEY   ?? "",
    ollama:    "ollama",
  };
  return new OpenAI({
    apiKey:  dict_string_provider_to_string_key[string_provider]  ?? "",
    baseURL: dict_string_provider_to_string_url[string_provider] ?? "https://api.novita.ai/v3/openai",
  });
}

export async function get_list_float_embedding_for_string_text(
  string_text: string
): Promise<number[]> {
  init_fn_debug_log_for_string_function_name("get_list_float_embedding_for_string_text", {
    int_text_chars: string_text.length,
    string_model:   string_embedding_model,
  });
  try {
    const openai_client = create_embedding_openai_client();
    const response = await openai_client.embeddings.create({
      model: string_embedding_model,
      input: string_text.slice(0, 8000),  // guard token limit
    });
    const list_float_vector = response.data[0]?.embedding ?? [];
    exit_fn_debug_log_for_string_function_name("get_list_float_embedding_for_string_text", {
      int_dimensions: list_float_vector.length,
    });
    return list_float_vector;
  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("get_list_float_embedding_for_string_text", string_error);
    throw error;
  }
}

export async function get_list_list_float_embeddings_for_list_string_texts(
  list_string_texts: string[]
): Promise<number[][]> {
  init_fn_debug_log_for_string_function_name("get_list_list_float_embeddings_for_list_string_texts", {
    int_count: list_string_texts.length,
  });
  const list_list_float = await Promise.all(
    list_string_texts.map((s) => get_list_float_embedding_for_string_text(s))
  );
  exit_fn_debug_log_for_string_function_name("get_list_list_float_embeddings_for_list_string_texts", {
    int_count: list_list_float.length,
  });
  return list_list_float;
}

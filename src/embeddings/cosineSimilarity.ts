/**
 * cosineSimilarity.ts
 * Pure math — no external dependencies.
 * Returns float 0..1 (1 = identical, 0 = unrelated)
 */
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function get_float_cosine_similarity_between_list_float_vectors(
  list_float_vec_a: number[],
  list_float_vec_b: number[]
): number {
  init_fn_debug_log_for_string_function_name(
    "get_float_cosine_similarity_between_list_float_vectors",
    { int_dim_a: list_float_vec_a.length, int_dim_b: list_float_vec_b.length }
  );

  if (list_float_vec_a.length !== list_float_vec_b.length || list_float_vec_a.length === 0) return 0;

  let float_dot_product  = 0;
  let float_magnitude_a  = 0;
  let float_magnitude_b  = 0;

  for (let int_i = 0; int_i < list_float_vec_a.length; int_i++) {
    float_dot_product += list_float_vec_a[int_i] * list_float_vec_b[int_i];
    float_magnitude_a += list_float_vec_a[int_i] ** 2;
    float_magnitude_b += list_float_vec_b[int_i] ** 2;
  }

  float_magnitude_a = Math.sqrt(float_magnitude_a);
  float_magnitude_b = Math.sqrt(float_magnitude_b);

  if (float_magnitude_a === 0 || float_magnitude_b === 0) return 0;

  const float_similarity = float_dot_product / (float_magnitude_a * float_magnitude_b);

  exit_fn_debug_log_for_string_function_name(
    "get_float_cosine_similarity_between_list_float_vectors",
    { float_similarity: float_similarity.toFixed(4) }
  );
  return float_similarity;
}

export function get_list_string_top_int_n_similar_keys_for_list_float_query_vector(
  list_float_query_vector:                    number[],
  dict_string_key_to_list_float_vector:       Record<string, number[]>,
  int_top_n:                                  number,
  float_min_similarity_threshold:             number = 0.3
): string[] {
  init_fn_debug_log_for_string_function_name(
    "get_list_string_top_int_n_similar_keys_for_list_float_query_vector",
    { int_candidates: Object.keys(dict_string_key_to_list_float_vector).length, int_top_n }
  );

  const list_dict_scored = Object.entries(dict_string_key_to_list_float_vector)
    .map(([string_key, list_float_vec]) => ({
      string_key,
      float_score: get_float_cosine_similarity_between_list_float_vectors(
        list_float_query_vector, list_float_vec
      ),
    }))
    .filter((d) => d.float_score >= float_min_similarity_threshold)
    .sort((a, b) => b.float_score - a.float_score)
    .slice(0, int_top_n);

  const list_string_keys = list_dict_scored.map((d) => d.string_key);

  exit_fn_debug_log_for_string_function_name(
    "get_list_string_top_int_n_similar_keys_for_list_float_query_vector",
    { list_string_keys: list_string_keys.join(",") }
  );
  return list_string_keys;
}

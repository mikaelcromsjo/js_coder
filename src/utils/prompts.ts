export const string_prompt_all_conventions = `
NAMES:
var prefix = type: str_ int_ float_ bool_ list_[type]_ dict_[kType]_to_[vType]_ fn_
fn = verb + returnType + concept (snake_case)
  get_str_foobar()
  get_bool_foobar()
  get_dict_foobar()
  run_foobar()
  save_foobar_to_sqlite()
  set_bool_foobar()
input types live in parameter names only — never encode inputs in fn name
  Example: get_str_color(float_value, dict_color_map)
never duplicate a fn by adding params — extend the signature, keep the name
never: x, res, data, temp, obj, val, i, handle(), process(), run(), update()

VERBS:
get_    → returns a value, no side effects
run_    → side effect, returns bool success
save_   → persists data to file or db
set_    → mutates a state variable
try_    → async operation that may throw
log_    → writes to console/stderr only

FUNCTIONS:
max 25 lines | one job | no nesting | no classes | no this | export all
mutable state only in state.js | every mutable global has set_<name>() setter
before export: remove all dead code | every exported fn must be called or be a test hook
never keep two fns that do the same job with different signatures — merge them

TYPES:
flat only | max 2 levels deep | Record<string,string> for dicts
no Map | no Set | no Symbol

ASYNC: async/await only | no .then() | always try/catch

IMPORTS: one per line | no wildcards | no unused

ERRORS:
never empty catch | always log before throw
never throw inside a Promise .then() callback — errors will not propagate

JS OUTPUT FORMAT:
raw JS only | no markdown fences | no TypeScript | const/let never var
function declarations | module.exports = { fn1, fn2, ... } at bottom
never execute code at top level | guard self-tests: if (require.main === module) { ... }
never use fs.existsSync on fs/promises | use fs.mkdir({ recursive: true }) instead
`.trim();
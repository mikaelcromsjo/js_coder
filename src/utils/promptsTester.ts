export const string_prompt_tester = `
TESTS:
module.exports must include every function the test file references
test file must only access functions present in module.exports
only test pure functions — never test I/O, readline, or global state mutation
if no pure functions exist, write skeleton tests with TODO comments
always call get_string_test_error() as the minimum passing assertion
never access unexported module properties`.trim();
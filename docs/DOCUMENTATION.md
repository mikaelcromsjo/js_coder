# AGEF v3 — Agentic Generation Environment & Framework

## CLI Usage

```bash
# First time: initialise a new app
agef --init "create a calculator with + and -"

# Auto-names the app "create-a-calculator" from description.
# Use --name for a custom name:
agef --init "create a calculator with + and -" --name my-calc

# Update the active app — no flags needed
agef "add * and /"
agef "remove -"
agef "add input validation and error messages"

# Utility commands
agef --status         # show which app is currently active
agef --reset          # clear the active session (start fresh)
agef --help           # print usage
```

## How Session Persistence Works

When you run `agef --init`, the app name is saved to `.agef-session` in your
current directory. Every subsequent `agef "<instruction>"` call reads that file
to know which app to update. The full code history lives in `agef.db` (SQLite).

## Install as Global CLI

```bash
npm install
npm run build         # compiles TypeScript to dist/ + chmod bin/agef.js
npm link              # registers "agef" as a global command (Windows: run as Admin)
```

On Windows if npm link requires admin, alternative:
```powershell
npm run build
$env:PATH += ";$(pwd)\bin"   # adds bin to PATH for current session only
```

## Architecture

```
src/
├── cli.ts                           CLI entry: parses args, routes to pipeline
├── index.ts                         Dev entry: delegates to cli.ts
├── state.ts                         ALL global mutable state + set_() setters
├── context.ts                       get_string_full_context_for_llm_injection()
├── debug/debugLogger.ts             init_fn / exit_fn / error_fn debug logger
├── utils/
│   ├── prompts.ts                   string_prompt_all_conventions
│   ├── promptsTester.ts             string_prompt_tester
│   ├── llmCall.ts                   Single LLM call (auto-logs all)
│   ├── llmProviders.ts              Provider factory: novita/deepinfra/ollama/openai
│   ├── fileWriter.ts                Write JS/test files to disk
│   └── time.ts                      ISO timestamp
├── agents/
│   ├── plannerAgent.ts              user request → numbered plan
│   ├── coderAgent.ts                plan → raw JS
│   ├── criticAgent.ts               code → "PASS" | critique
│   ├── refactorAgent.ts             code + critique/instruction → updated code
│   └── testWriterAgent.ts           code → Node.js assert tests
├── runner/
│   ├── generateAppPipeline.ts       7-step init pipeline
│   └── updateAppPipeline.ts         5-step update pipeline (loads latest from DB)
├── tester/runTest.ts                child_process node test runner
├── healer/selfHealLoop.ts           refactor → test loop
└── storage/
    ├── db.ts                        SQLite init
    ├── sessionStore.ts              .agef-session file (active app name)
    ├── saveRevision.ts              Code + context snapshot per revision
    ├── savePromptLog.ts             Every prompt + response
    ├── saveTestResult.ts            Test results per revision
    └── saveRefactorLog.ts           Refactor from/to/reason log
```

## Pipelines

### Init (agef --init)
```
user request → planner → coder → critic → refactor? → testWriter → testRunner → selfHeal?
```

### Update (agef "instruction")
```
load latest code from SQLite
  → refactor(code, instruction) → critic → refactor? → testWriter → testRunner → selfHeal?
```

## Providers (.env)

| LLM_PROVIDER | Base URL                              |
|--------------|---------------------------------------|
| novita       | https://api.novita.ai/v3/openai       |
| deepinfra    | https://api.deepinfra.com/v1/openai   |
| ollama       | http://localhost:11434/v1             |
| openai       | https://api.openai.com/v1             |

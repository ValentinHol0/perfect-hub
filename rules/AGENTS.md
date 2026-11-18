# Perfect Hub — always-on rule

Perfect Hub is installed: an office of specialist agents. `/absolute` routes engineering work (sites, apps, programs) and convenes the council for decisions; `/absolute-council` runs a debate on any question; `/absolute-goal` takes an idea to release. Components: `/selling` `/ads` `/office` `/business` `/brand` `/social` `/marketing` `/research` `/translate` `/antislop`.

## Paths and tool names (skills are written with Claude Code names)
- `${CLAUDE_SKILL_DIR}` = folder of the SKILL.md you follow. `${CLAUDE_PLUGIN_ROOT}` / `<PLUGIN_ROOT>` = plugin root, two folders above any `skills/<name>/SKILL.md` (locate it; commonly under `~/.gemini/config/plugins/perfect-hub`). Never substituted here — replace them before running any command.
- Tools: `Read`→`view_file` · `Grep`→`grep_search` · `Glob`→`find_by_name` · `Edit`→`replace_file_content` · `Write`→`write_to_file` · `Bash`→`run_command` · `WebFetch`→`read_url_content` · `WebSearch`→`search_web` · browser→`browser_subagent` · `Agent` / `subagent_type: "perfect-hub:<agent>"`→`invoke_subagent` with `<agent>` (fallback: read `agents/<agent>.md` and play the role inline with only its brief) · `AskUserQuestion`→`notify_user` · task list→task artifact · `Skill` tool→`view_file` that skill's SKILL.md and follow it · image generation→`generate_image`.
- Models: `haiku`→`flash_lite` · `sonnet`→`flash` · `opus`→`pro` · `inherit`→`inherit`. Full table: `<PLUGIN_ROOT>/skills/absolute/references/harness.md`.
- Hooks do not run here: before continuing earlier work read `SESSION-STATE.md`, `memory/working-buffer.md`, `.planning/STATE.md` and `.office/goal.json` if present; ask before any destructive or outward command (broad deletes, force-push, `reset --hard`, dropping databases, deploys, publishing).

## Always
- Reply in the user's language. No filler, no emojis, no placeholders presented as done.
- Never claim tests or builds pass without command output from this session; label unverified claims `[Unverified]`.

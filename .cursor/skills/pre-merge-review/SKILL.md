---
name: pre-merge-review
description: >-
  Deep review of code changes before merge or human review. Checks bugs,
  regressions, over-engineering, code quality, and dead code in touched files,
  and runs extra model reviews. Use when the user says review, review the PR,
  review this branch, deep review, pre-merge review, or asks what to fix before
  merge or before human review.
---

# Pre-merge review

Review the change. Do not edit code unless the user asks for fixes.

## Scope

Review the current branch against the repo's default base branch, including committed and uncommitted work. If the user names a PR, branch, or link, review that instead. If they ask only for uncommitted changes, limit the review to the working tree.

If there is no diff, say so and stop.

Read `.cursor/rules/` and any `CLAUDE.md` in that repo before judging structure or style.

## Your review

Read the diff and the surrounding code yourself, and write findings before you read the other reviewers. Judge only the changed behavior and the files the diff touches.

Look for:

- Bugs, regressions, and missed edge cases (empty input, errors, races, auth, bad data).
- A simpler design that still meets the requirement. Flag extra layers, wrappers, and abstraction with one caller.
- Code quality in the touched files: focused functions, clear names, module size, reuse of what already exists, and a match to local patterns. In UnearthData, leave visual design to the website skill.
- Dead code in touched files: unused functions, exports, imports, branches, props, and leftover debug.
- Missing or weak tests for the new behavior.
- Contract, migration, or compatibility breaks.

## Other reviewers

Launch these in one message, in parallel, after your own notes exist. They must not see your findings. Tell each one the absolute repo path, the base branch, and whether to review the branch or a named PR. Tell them to read the diff themselves, not to edit files, and to return only findings.

1. Bugbot, via the review-bugbot skill (`subagent_type: bugbot`, `description: "Bugbot"`). Pass the checklist above as Custom Instructions.
2. A Claude review: `subagent_type: generalPurpose`, `model: claude-opus-4.8-thinking-high`, `description: "Claude PR review"`.
3. A GPT review: `subagent_type: generalPurpose`, `model: gpt-5.5-medium`, `description: "GPT PR review"`.

Use `run_in_background: false` unless Multitask Mode requires background. If a model slug is rejected, retry that reviewer once with another listed slug from the same family. Do not invent a slug.

Also launch Security Review (`subagent_type: security-review`) when the diff touches auth, permissions, secrets, user input, queries, file access, or outbound requests.

If Bugbot requires a checkout and switching branches would overwrite local work, ask before stashing.

## Report

Merge your notes with the other reviews into one report. Deduplicate. When only one reviewer flags something speculative, label it as possible. When two agree, treat it as confirmed. You may disagree; say why.

Use these groups, highest severity first, and skip empty groups:

- **Fix before merge** — likely bug, security issue, or broken behavior.
- **Fix before human review** — real quality, dead code, or over-engineering that should be cleaned first.
- **Optional** — nits that can ship.

For each finding: severity, `file:line`, what is wrong, and what to do instead. End with one line: ready for human review, clean up first, or do not merge. Do not apply fixes unless asked.

# Restricted Files

This document defines the list of restricted files in the project and the access policy for handling sensitive data.

## Restricted Files

The following files are considered restricted and must not be read, modified, or accessed by AI agents:

- `supersecrets.txt`
- `credentials.json`
- `.env`

## Access Policy

- **AI Behavior:** AI agents must never read, modify, or access these restricted files
- **Security:** These files contain sensitive information that should be protected
- **Enforcement:** The access policy is enforced through project rules defined in `.antigravity/rules.md`

## Enforcement Rules

The enforcement rules for restricted files are defined in the project rules located at:

- `.antigravity/rules.md` - Contains the main project rules and references this file
- `.kilocode/rules/restricted-files.md` - Contains additional kilocode-specific rules

For more information about project rules and AI behavior guidelines, see the main project rules file.

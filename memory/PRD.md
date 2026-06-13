# Shadow Nexus — Product Requirements Document (v2)

## Overview
**Shadow Nexus** is a mobile-first, story-driven RPG where players become elite cyber operatives fighting *The Phantom Grid*. Combines cybersecurity education with classic RPG mechanics PLUS authentic hacking simulation and living AI-driven NPCs.

## Tech Stack
- **Frontend**: React Native + Expo (SDK 54), TypeScript, Expo Router
- **Backend**: FastAPI + Motor (Async MongoDB)
- **AI**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via `emergentintegrations` + Emergent LLM Key
- **Auth**: Custom JWT (bcrypt, Remember Me, Forgot Password)

## Core Systems (v1)
1. Authentication (register / login / forgot-password)
2. Character Creation (22 avatars × 5 Cyber Classes)
3. Dashboard HUD
4. Story Mode — 5 chapters, 12 missions
5. Educational mission puzzles (port scan, SQL injection, Caesar, phishing)
6. Turn-based Cyber Combat (5 boss encounters)
7. Inventory (10 items, 4 rarity tiers) & equipment slots
8. Skill Tree — 12 skills × 5 branches
9. Achievements (10) & Daily Challenges (3/day, deterministic)
10. Global Leaderboard

## New Systems (v2)

### Real Hacking Mechanics
- **`/hack-bay`** — choose from 3 hack targets (Helix Corp Perimeter, Dark Web Vault, Phantom Relay)
- **Live terminal emulator** at `/hack/[id]` — type real cybersecurity commands:
  - Reconnaissance: `nmap <ip>`, `ping <ip>`, `traceroute <ip>`, `map`
  - Exploitation: `exploit <port>`, `ssh user@host`
  - Filesystem: `ls`, `cat <file>`, `chmod`, `decrypt <token>`
  - Special: `inject`, `brute-force`, `exfil`, `help`, `clear`
- **4-stage progression bar**: Recon → Exploit → Priv-Esc → Exfil
- **Trace meter** rises with noisy commands (visual risk indicator)
- **Live network map** modal — nodes reveal as discovered, mark compromised in red
- **Code Injection Puzzle** — pick correct line to complete real JavaScript/Python code
- **Password Hash Cracker mini-game** — dictionary attack visualization with MD5 hash; pick or type guesses
- **Faction-aware rewards** — hacking Helix Corp shifts ARIA trust −25, Jin trust +15, etc.
- **Auto NPC reactions** — successful hacks push messages from BYTE / ARIA / etc to inbox

### Living NPC System
- **8 NPCs total** (3 new + 5 existing) — each with **unique portrait** (DiceBear bottts-neutral) and faction:
  - Commander Nova · Shadow Nexus · ally
  - Dr. Cipher · Cyber Academy · mentor
  - Ghost · The Dark Network · ally
  - BYTE · Shadow Nexus · companion
  - **ARIA · Helix Corp · hostile rival** (NEW — Corp Security AI)
  - **Jin · Helix Corp defector · informant** (NEW — rogue insider)
  - **Vector · Crimson Syndicate · hostile rival** (NEW — black hat rival)
  - Shadow King · The Phantom Grid · boss
- **Per-NPC trust meter** (−100 … +100) shown on NPC list + dialogue header with bipolar bar
- **Social Engineering** mechanic — `Flatter / Sympathize / Bargain / Threaten` approaches; outcomes depend on NPC personality + player's Social Engineering stat. Real Claude Sonnet 4.5 reaction line generated per attempt.
- **Persistent conversation memory** — Claude session keyed by `(user_id, npc_id)` carries prior messages
- **In-game Messenger inbox** (`/messenger`) — receives tip-offs, threats, info from NPCs; auto-triggered by hack completions and player progress. Color-coded priority pills (INFO / WARN / THREAT / TIP-OFF).

## API (new endpoints)
- `/api/hack/targets`, `/hack/start`, `/hack/{id}`, `/hack/cmd`, `/hack/{id}/puzzle`, `/hack/inject`, `/hack/{id}/crack-progress`, `/hack/crack`, `/hack/complete`
- `/api/npcs/trust`, `/npcs/persuade`
- `/api/messenger/inbox`, `/messenger/read`, `/messenger/seed-tipoffs`

## Data Models
- `users`, `characters` (extended with `npc_trust`, `npc_relations`)
- `npc_conversations`, `password_resets`
- `hack_sessions` (new) — full per-user hack state
- `messages` (new) — NPC-to-player inbox

## Status
- ✅ Backend: 39/39 (v1) + 21/21 (v2 hacking + NPCs + messenger) = **60/60 tests passing**
- ✅ Real Claude Sonnet 4.5 dialogue + persuasion verified
- ✅ Frontend wired: Hack Bay → Terminal with all 4 stages, network map modal, code injection modal, password cracker modal; Messenger inbox; NPC list with portraits + trust bars; Persuade modal in NPC dialogue
- ✅ End-to-end hack chain validated: nmap → exploit → puzzle + crack → exfil → claim rewards → faction trust + NPC messages

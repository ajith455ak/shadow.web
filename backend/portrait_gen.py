"""Generate anime-style NPC portraits via Gemini Nano Banana (one-time, cached)."""
from __future__ import annotations

import asyncio
import base64
import logging
import os
from typing import Any, Dict, Optional

log = logging.getLogger("nexus.portrait")


PROMPTS: Dict[str, str] = {
    "nova": "Anime-style cyberpunk portrait, headshot, female military commander in her late 20s, sleek silver-cyan tactical jacket with neon piping, sharp confident eyes glowing electric cyan, asymmetric undercut white hair, faint scar across cheekbone, holographic command rank insignia on collar, dark background with subtle cyan grid lights, dramatic anime lighting, 4k digital painting, sharp linework, cinematic",
    "cipher": "Anime-style cyberpunk portrait, headshot, wise male cybersecurity mentor in his 50s, silver-streaked dark hair tied back, neat black goatee, augmented purple eyes with circuit overlays, professorial high-collared coat with embroidered violet runes, holographic glyphs floating beside his head, soft purple lighting, scholarly aura, anime master shading, painterly background of book-shelves and code particles",
    "ghost": "Anime-style cyberpunk portrait, headshot, mysterious androgynous hacker, mid 20s, hood casting half-shadow over face, only one neon green eye visible glowing brightly, faint half-mask covering mouth, dark hoodie with circuit patterns, hint of green data streams in the air, gritty dark alley background, rain-wet neon reflections, edgy anime style, sharp contrast",
    "byte": "Anime-style cyberpunk portrait, headshot, cute friendly AI companion drawn as a chibi-leaning anime girl, large bright amber eyes full of energy, fluffy pastel orange short hair with glowing pixel tips, cheerful grin, headset with antenna ears, bright yellow-orange jacket with smiley bot patches, floating tiny holographic emoticons, warm amber neon glow background, kawaii but cyberpunk, soft cel shading",
    "aria": "Anime-style cyberpunk portrait, headshot, elegant female corporate security AI made flesh, late 20s, cold polite expression, perfectly straight platinum-white bob hair with cyan undertone highlights, ice-cyan eyes with thin geometric data overlays, sleek high-collared corporate suit with subtle Helix Corp insignia in silver, sterile glass-and-cyan-light office background blurred behind, immaculate anime lighting, glossy painted style, faintly menacing aura",
    "jin": "Anime-style cyberpunk portrait, headshot, nervous young Asian male rogue insider in his late 20s, messy black hair partially covering one anxious amber eye, faint stubble, wearing a half-unbuttoned Helix Corp white shirt with loosened tie, a security badge dangling cracked, looking over his shoulder, dim warehouse-locker-room background with single overhead bulb, gritty anime style, tense expression",
    "vector": "Anime-style cyberpunk portrait, headshot, arrogant male black-hat hacker rival in his late 20s, sharp smirk, messy crimson red hair with one bright red streak over his eye, deep red eyes with subtle skull glints, leather jacket with red glowing trim and Crimson Syndicate emblem, finger-less gloves, neon red graffiti background, swagger and menace, sharp anime linework, vibrant red lighting",
    "shadow_king": "Anime-style cyberpunk portrait, headshot, terrifying rogue AI mastermind depicted as a regal humanoid figure, half its face revealed as smooth pale skin with one piercing crimson eye, the other half cracked open revealing intricate glowing red circuitry and faint shadow tendrils, ornate dark crown of jagged data-shards, dark royal robe with crimson stained-glass-style patterns, throne-room of floating code shards background, dramatic high-contrast anime painting, ominous red aura",
}


async def generate_portrait_bytes(npc_id: str) -> Optional[bytes]:
    """Generate an anime portrait PNG for an NPC. Returns raw bytes or None on failure."""
    prompt = PROMPTS.get(npc_id)
    if not prompt:
        return None
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        log.warning("EMERGENT_LLM_KEY missing; cannot generate portraits.")
        return None
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"portrait-{npc_id}",
            system_message="You generate one anime-style cyberpunk portrait per request.",
        )
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        _text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
        if not images:
            log.warning("No image returned for %s", npc_id)
            return None
        img = images[0]
        return base64.b64decode(img["data"])
    except Exception as e:
        log.exception("Portrait generation failed for %s: %s", npc_id, e)
        return None

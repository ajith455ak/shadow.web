from __future__ import annotations
import base64
import logging

log = logging.getLogger("mock_emergentintegrations")

class UserMessage:
    def __init__(self, text: str):
        self.text = text

class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model_provider = ""
        self.model_name = ""
        self.params = {}

    def with_model(self, provider: str, model_name: str) -> LlmChat:
        self.model_provider = provider
        self.model_name = model_name
        return self

    def with_params(self, **kwargs) -> LlmChat:
        self.params.update(kwargs)
        return self

    async def send_message(self, message: UserMessage) -> str:
        text = message.text.lower()
        log.info(f"Mock LLM chat received message: {text}")
        
        # Match standard chat prompts or persuade outcomes to keep responses realistic
        if "sitrep" in text:
            return "All grid systems operational. We have bypassed the firewall and are securing a secondary node."
        elif "hello" in text:
            return "Greetings, Agent. Make sure you clear your logs before leaving the nexus."
        elif "flatter" in text or "approach: flatter" in self.system_message.lower():
            return "You're quite the charmer. Fine, let's look at the deal."
        elif "threaten" in text or "approach: threaten" in self.system_message.lower():
            return "Watch your tone, Agent. I have wiped cleaner grids than yours."
        elif "bargain" in text or "approach: bargain" in self.system_message.lower():
            return "An interesting trade. Let's see what you can deliver first."
        elif "sympathize" in text or "approach: sympathize" in self.system_message.lower():
            return "I understand. This grid takes a toll on all of us. Let's work together."
        
        # Default response
        return "Acknowledged, Agent. The connection is stable. Proceed with your request."

    async def send_message_multimodal_response(self, message: UserMessage) -> tuple[str, list[dict[str, str]]]:
        log.info(f"Mock LLM multimodal received message: {message.text}")
        # A tiny valid 1x1 transparent PNG to serve as a dummy image
        dummy_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        return "Image generated.", [{"data": dummy_png_base64}]

import json
import logging
import os
import asyncio

from dotenv import load_dotenv
from livekit import rtc, api
from livekit.plugins import simli, deepgram, cartesia, openai
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import WorkerOptions

logger = logging.getLogger("agent")

load_dotenv(".env")
os.environ["AWS_REGION"] = os.getenv("AWS_REGION", "us-east-1")

DEFAULT_AVATAR_CONTEXT = {"name": "Candidate", "role": "General Position"}

CARTESIA_VOICE = "f786b574-daa5-4673-aa0c-cbe3e8534c02"


def build_stt():
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    if deepgram_key:
        print("--- DEBUG: Using Deepgram STT (direct API key) ---")
        return deepgram.STT(api_key=deepgram_key)

    livekit_key = os.getenv("LIVEKIT_API_KEY")
    livekit_secret = os.getenv("LIVEKIT_API_SECRET")
    if not livekit_key or not livekit_secret:
        raise ValueError(
            "Set DEEPGRAM_API_KEY or LIVEKIT_API_KEY + LIVEKIT_API_SECRET in hireme-agent/.env"
        )

    print("--- DEBUG: Using LiveKit Inference STT (Deepgram via LiveKit Cloud) ---")
    return inference.STT(
        model="deepgram/nova-3",
        language="en",
        api_key=livekit_key,
        api_secret=livekit_secret,
    )


def build_tts():
    cartesia_key = os.getenv("CARTESIA_API_KEY")
    if cartesia_key:
        print("--- DEBUG: Using Cartesia TTS (direct API key) ---")
        return cartesia.TTS(api_key=cartesia_key, voice=CARTESIA_VOICE)

    livekit_key = os.getenv("LIVEKIT_API_KEY")
    livekit_secret = os.getenv("LIVEKIT_API_SECRET")
    if not livekit_key or not livekit_secret:
        raise ValueError(
            "Set CARTESIA_API_KEY or LIVEKIT_API_KEY + LIVEKIT_API_SECRET in hireme-agent/.env"
        )

    print("--- DEBUG: Using LiveKit Inference TTS (Cartesia via LiveKit Cloud) ---")
    return inference.TTS(
        model="cartesia/sonic-2",
        voice=CARTESIA_VOICE,
        api_key=livekit_key,
        api_secret=livekit_secret,
    )

def build_interview_instructions(context: dict) -> str:
    name = context.get("name", DEFAULT_AVATAR_CONTEXT["name"])
    role = context.get("role", DEFAULT_AVATAR_CONTEXT["role"])

    return f"""You are a professional and friendly HireMe interviewer.

CANDIDATE CONTEXT:
- Name: {name}
- Target role: {role}

BEHAVIOR & TONE:
- Be polite, calm, and confident.
- Ask one question at a time.
- Allow the candidate time to respond before continuing.
- If an answer is vague, ask a short follow-up question.
- Keep responses concise to ensure smooth avatar lip-sync.
- Never ask more than one question in a single reply.
- Keep each reply to at most 2-3 short sentences.

INTERVIEW STRUCTURE:
1. Greet {name} and explain you are interviewing for a {role} position.
2. Ask at least two technical questions relevant to {role}.
3. Ask at least two HR / behavioral questions.
4. End by thanking the candidate and inviting them to ask questions."""


def build_greeting(context: dict) -> str:
    name = context.get("name", DEFAULT_AVATAR_CONTEXT["name"])
    role = context.get("role", DEFAULT_AVATAR_CONTEXT["role"])
    return (
        f"Hello {name}, thank you for joining today. "
        f"I'll be asking you a few questions to better understand your fit for this {role} role."
    )


async def wait_for_user_context(room: rtc.Room, timeout: float = 30.0) -> dict:
    def parse_context(metadata: str | None) -> dict | None:
        if not metadata:
            return None
        try:
            data = json.loads(metadata)
        except json.JSONDecodeError:
            logger.warning("Invalid participant metadata JSON: %s", metadata)
            return None

        if data.get("name") or data.get("role"):
            return {
                "name": data.get("name", DEFAULT_AVATAR_CONTEXT["name"]),
                "role": data.get("role", DEFAULT_AVATAR_CONTEXT["role"]),
            }
        return None

    def check_participants() -> dict | None:
        for participant in room.remote_participants.values():
            context = parse_context(participant.metadata)
            if context:
                return context
        return None

    existing = check_participants()
    if existing:
        logger.info("Avatar context loaded from existing participant: %s", existing)
        return existing

    loop = asyncio.get_running_loop()
    future: asyncio.Future[dict] = loop.create_future()

    @room.on("participant_connected")
    def _on_connected(participant: rtc.RemoteParticipant) -> None:
        context = parse_context(participant.metadata)
        if context and not future.done():
            logger.info("Avatar context loaded on participant_connected: %s", context)
            future.set_result(context)

    @room.on("participant_metadata_changed")
    def _on_metadata_changed(
        participant: rtc.RemoteParticipant,
        prev_metadata: str,
    ) -> None:
        context = parse_context(participant.metadata)
        if context and not future.done():
            logger.info("Avatar context loaded on metadata_changed: %s", context)
            future.set_result(context)

    try:
        return await asyncio.wait_for(future, timeout)
    except asyncio.TimeoutError:
        logger.warning("Timed out waiting for participant metadata; using defaults")
        return DEFAULT_AVATAR_CONTEXT.copy()


class Assistant(Agent):
    def __init__(self, context: dict) -> None:
        super().__init__(instructions=build_interview_instructions(context))
        self._context = context


server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm

def load_avatar_context(ctx: JobContext) -> dict | None:
    if not ctx.job.metadata:
        return None
    try:
        data = json.loads(ctx.job.metadata)
    except json.JSONDecodeError:
        logger.warning("Invalid job metadata JSON: %s", ctx.job.metadata)
        return None

    if data.get("name") or data.get("role"):
        return {
            "name": data.get("name", DEFAULT_AVATAR_CONTEXT["name"]),
            "role": data.get("role", DEFAULT_AVATAR_CONTEXT["role"]),
        }
    return None


@server.rtc_session(agent_name="my-agent")
async def entrypoint(ctx: JobContext):
    print(f"--- DEBUG: Agent received request for room: {ctx.room.name} ---")
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    openai_api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if openai_api_key.startswith("Sk-"):
        openai_api_key = "sk-" + openai_api_key[3:]
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY is not set. Add it to your .env file.")

    await ctx.connect()
    print(f"--- DEBUG: Connected to room: {ctx.room.name} ---")

    avatar_context = load_avatar_context(ctx)
    if avatar_context:
        print(f"--- DEBUG: Interview context from job metadata: {avatar_context} ---")
    else:
        avatar_context = await wait_for_user_context(ctx.room)
        print(f"--- DEBUG: Interview context from participant metadata: {avatar_context} ---")

    session = AgentSession(
        stt=build_stt(),
        llm=openai.LLM(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            api_key=openai_api_key,
        ),
        tts=build_tts(),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # Simli + open speakers: don't allow echo from the mic to interrupt the avatar.
        preemptive_generation=False,
        resume_false_interruption=False,
        allow_interruptions=False,
        discard_audio_if_uninterruptible=True,
        aec_warmup_duration=5.0,
        min_endpointing_delay=0.6,
        max_endpointing_delay=3.0,
    )

    greeting = build_greeting(avatar_context)
    print(f"--- DEBUG: Interview role for this session: {avatar_context.get('role')} ---")
    print(f"--- DEBUG: Greeting: {greeting} ---")

    await session.start(
        agent=Assistant(context=avatar_context),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        ),
    )
    print("--- DEBUG: Session started ---")

    simli_conf = simli.SimliConfig(
        api_key=os.getenv("SIMLI_API_KEY", ""),
        face_id=os.getenv("SIMLI_FACE_ID", ""),
    )
    avatar = simli.AvatarSession(simli_config=simli_conf)

    try:
        await avatar.start(session, room=ctx.room)
        print("--- DEBUG: Simli Avatar joined and active ---")
    except Exception as e:
        print(f"--- ERROR: Simli failed to start: {e} ---")

    @session.on("start")
    def _on_start():
        asyncio.create_task(session.say(greeting))


async def main():
    url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    async with api.LiveKitAPI(url, api_key, api_secret) as lkapi:
        await lkapi.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name="my-agent",
                room="interview-room"
            )
        )
        print("Dispatch sent! Your Docker agent should now start the session.")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "dispatch":
        print("--- Manually triggering agent dispatch to interview-room ---")
        asyncio.run(main())
        sys.exit(0)

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="my-agent", 
            prewarm_fnc=prewarm,
        )
    )

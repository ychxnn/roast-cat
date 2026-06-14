// Every roast has a documented reason. No roast without evidence.
// Tone: factual core + one-line meme kicker. Screenshot-worthy.

const ROASTS = {

  // ── Trigger: session > 60 min ─────────────────────────────────────────────
  contextRot60: [
    "you've been in this session for over an hour. transformer attention degrades as context fills — the model is already deprioritizing what you told it early on. this is documented behaviour, not a vibe.",
    "60 minutes, one context window. the AI answering you now is not statistically the same as the one you briefed at the start. constraints get buried. decisions get overridden silently.",
    "past the 60-min mark, context rot sets in. the model starts ignoring earlier instructions — not because it wants to, but because attention is finite. everything you set up at the start is competing with noise.",
  ],

  // ── Trigger: session > 90 min ─────────────────────────────────────────────
  contextRot90: [
    "90 minutes in one chat. researchers who study long-context AI behaviour call this the 'middle token problem' — the model loses track of what's in the middle of a long context. your earliest constraints are effectively gone.",
    "you're past 90 minutes in a single session. the AI has seen so many failed attempts, corrections, and pivots that its output quality is measurably lower than minute one. start a new chat. seriously.",
    "hour and a half. one context. the AI is now hallucinating functions it wrote 30 messages ago. this is not pessimism — it's what transformer attention does at this context length.",
  ],

  // ── Trigger: session > 2hr ────────────────────────────────────────────────
  contextRot120: [
    "two hours. the context window is a landfill at this point. every new output is being generated with degraded attention over a mountain of failed attempts and contradictory instructions. new chat. now.",
    "you've been in this session for 2 hours. if the outputs are getting worse and weirder, that's not the model failing — that's context rot peaking. the fix is a new session, not more prompting.",
    "2 hours, one AI session. whatever you started trying to build is buried under so much context noise the model is essentially guessing. close this. open a new one. write a clean brief.",
  ],

  // ── Trigger: 90-min cognitive wall ────────────────────────────────────────
  cogWall: [
    "90 minutes of continuous focus. cognitive load research consistently finds performance degrades past this threshold — not because you're tired, but because working memory genuinely fills up. 5 minutes away from the screen restores measurable capacity.",
    "the 90-minute focus wall is real and documented. your ability to catch logical errors right now is lower than it was at the start. this is not motivational poster content, it's how the prefrontal cortex works.",
    "past 90 min of sustained focus your brain's error-detection drops. which means you and the AI are both at a disadvantage right now. break. come back. the code is not going anywhere.",
  ],

  // ── Trigger: same error pasted 3+ times ──────────────────────────────────
  errorLoop: [
    "that error has appeared in this session at least 3 times. the AI has no new information each time you paste it. YOU do — you now know 2 approaches that don't work. that's a diagnosis, not just a paste.",
    "pasting the same traceback multiple times is not debugging. the AI will generate a different-sounding answer each time and all of them will miss the root cause. read the error. locate the line. then prompt.",
    "the AI can't fix what it hasn't been told to look for. 3 occurrences of the same error means the approach is wrong, not the prompt. step back before you paste it again.",
    "you've shown the AI the same error repeatedly. it will confidently give you a new-sounding wrong answer every time. errors have root causes. find the cause. then bring it to the AI.",
  ],

  // ── Trigger: 4+ prompts in under 60 seconds ───────────────────────────────
  panicPrompt: [
    "4 prompts in under a minute. rapid-fire prompting fills your context window with low-signal turns. the model does not process faster because you send faster. it just has less room for good reasoning.",
    "sending prompts faster does not make the AI smarter. it fills the context with noise and degrades the quality of what comes next. slow down. one clear prompt with full context beats four panicked ones.",
    "panic prompting detected. each rapid follow-up you send before reading the previous output shrinks the useful context available. the AI's quality drops proportionally. breathe. read first.",
    "you sent multiple prompts in quick succession without waiting for a useful response. this is the AI equivalent of hitting a vending machine repeatedly. it doesn't help and it costs you context.",
  ],

  // ── Trigger: 'fix this' / 'debug' with no error or code context ───────────
  noContext: [
    "'fix this' or 'debug' with no error message, no stack trace, no reproduction steps. the AI will guess. its guess will sound confident. it will be wrong. then you'll paste it again.",
    "asking the AI to debug without the error is asking a doctor to diagnose without symptoms. the model will confabulate a plausible-sounding answer. plausible is not correct.",
    "the three things a debugging prompt needs: what you expected, what happened, where it happened. your prompt had zero of those. the AI's answer will have the same quality as your input.",
    "the AI needs the error message, the relevant code, and what you tried. 'it doesn't work' contains none of that. the output will reflect the quality of the input.",
  ],

  // ── Trigger: large output, then silence for 2+ min ────────────────────────
  postOutput: [
    "the AI just produced a large output and you haven't asked a single follow-up question. 16 of 18 AI-code production failures studied in 2025 started with unreviewed large outputs. you are the peer review.",
    "large AI output, zero follow-up questions. the model is not peer-reviewed. it does not catch its own edge cases, unhandled nulls, or logic that breaks outside the happy path. someone has to. that's you.",
    "you accepted a significant block of AI output without questioning it. this is how subscription systems get accidentally bypassed and databases get silently corrupted. read it before you run it.",
    "a large output with no verification step is a liability, not a deliverable. the AI does not know your production constraints, your edge cases, or what 'done' actually means. you do.",
  ],

  // ── Trigger: weekend + session > 2hr ─────────────────────────────────────
  weekendOverwork: [
    "2 hours coding on a weekend. burnout research consistently links this pattern to reduced cognitive output on Monday and Tuesday. you're borrowing against the week.",
    "weekend session past 2 hours. recovery time is not optional for the brain — it's when memory consolidates and creative problem-solving resets. what you're doing right now has a measurable cost later.",
    "2+ hours on your day off. the research on recovery and performance is unambiguous: this trade-off doesn't pay out the way it feels like it does in the moment.",
  ],

  // ── Trigger: after midnight + AI session active ────────────────────────────
  midnight: [
    "it's past midnight and you're in an active AI coding session. sleep deprivation at this level impairs logical reasoning at roughly the same rate as a blood alcohol level of 0.05. your PR reviewers will be sober.",
    "after midnight, your prefrontal cortex — the part that catches bad logic and edge cases — is measurably offline. the AI makes the same mistakes at 2am as at 2pm. you don't.",
    "coding past midnight: the bugs you introduce now will take you 3x longer to find tomorrow. this is documented in software engineering research, not just a feeling.",
    "your brain's error-detection drops significantly after midnight. combined with an AI that doesn't catch its own mistakes, you're now shipping code reviewed by no one who's fully awake.",
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRoast(trigger) {
  const bank = ROASTS[trigger];
  if (bank) return pick(bank);
  return null; // no roast without a reason
}

module.exports = { getRoast, ROASTS };

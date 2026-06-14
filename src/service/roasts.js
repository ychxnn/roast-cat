// Short, punchy, meme-forward roasts. Every line still has a documented reason
// baked in — just compressed. Rule: impactful > long. Screenshot-worthy one-liners.

const ROASTS = {

  // ── session > 60 min ──
  contextRot60: [
    "60 min in one chat. it forgot your first instruction 40 messages ago. context rot is crazy 💀",
    "an hour deep. minute-one you is dead to this model. new chat, bestie.",
    "this convo is cooked. attention's finite — restart it.",
  ],

  // ── session > 90 min ──
  contextRot90: [
    "90 min, one context. it's hallucinating its own code now 💀",
    "hour and a half. the middle of this chat is /dev/null. it forgot.",
    "the model's got no object permanence at this length. fresh chat. now.",
  ],

  // ── session > 2hr ──
  contextRot120: [
    "2 hours, one chat. the context window is a landfill 🗑️ new session.",
    "outputs getting weird? that's not the model, that's the rot. restart.",
    "2hr session. it's guessing AND gaslighting you. close it.",
  ],

  // ── 90-min cognitive wall ──
  cogWall: [
    "90 min locked in. brain cache full. 5 min break = hard refresh.",
    "you hit the focus wall. not dumb, just full. go touch grass 🌱",
    "working memory at 100%. you'll catch the bug after a break, not before.",
  ],

  // ── same error 3+ times ──
  errorLoop: [
    "same error, 3rd time. the AI's got nothing new. you do. read it 🔍",
    "pasting the traceback again is not a personality. find the line.",
    "this error is giving 'you didn't actually read it'. it has a root cause.",
  ],

  // ── 4+ prompts in under 60s ──
  panicPrompt: [
    "4 prompts in a minute. you're mashing the vending machine 💀",
    "slow down bestie. spam ≠ speed. one good prompt > four panicked ones.",
    "rapid-firing just feeds it noise. breathe, then prompt.",
  ],

  // ── 'fix this' with no context ──
  noContext: [
    "'fix this' with no error? it'll guess. confidently. wrongly.",
    "debugging by vibes. give it symptoms or get fan-fiction.",
    "what you expected, what happened, where. you gave it none of that 💀",
  ],

  // ── large output, then silence ──
  postOutput: [
    "huge output, zero questions. you ARE the code review. read it.",
    "you accepted that wall of code raw. that's a prod incident loading 🫡",
    "it doesn't catch its own edge cases. that part's literally your job.",
  ],

  // ── weekend + session > 2hr ──
  weekendOverwork: [
    "2hr grind on a weekend. you're borrowing from monday-you. they're livid.",
    "recovery isn't optional, it's the patch notes. log off 🌱",
    "the repo survives without you for a day. main character moment: rest.",
  ],

  // ── after midnight + active ──
  midnight: [
    "past midnight coding = reasoning at 0.05 BAC. your reviewers are sober 💀",
    "2am brain doesn't catch bugs, it ships them. go to sleep.",
    "midnight bugs take 3x longer to find tomorrow. log off, bestie.",
  ],

  // ══ HEALTH (real activity, via the idle clock — not random) ══

  // ── ~25 min continuous: 20-20-20 eye rule ──
  eyeRest: [
    "20-20-20, babe: look 20ft away for 20s. your eyeballs are cooked 👀",
    "when did you last blink? do it. now. for me.",
    "screen's been in your face 25 min. look at something far away 👀",
  ],

  // ── ~50 min continuous, no break ──
  noBreak: [
    "50 min without moving. your spine filed a complaint 🦴 stand up.",
    "you're fused to that chair. stretch, bestie.",
    "no break in nearly an hour. go touch grass, or at least the kitchen 🌱",
  ],

  // ── 8h+ active today ──
  longDay: [
    "8 hours active today. that's a full shift. clock out 🫡",
    "you've done a whole workday. past this it's for the plot, not the PR.",
    "8h in. you're not building anymore, you're grinding. log off.",
  ],

  // ── 7+ consecutive days used ──
  dayStreak: [
    "7 days straight. even God rested 🙏 take a day off.",
    "a full week, no day off. that's not dedication, it's a burnout speedrun.",
    "7-day streak. impressive. also: stop. rest is a feature, not a bug.",
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

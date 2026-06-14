// Pure trigger-evaluation functions.
// Each takes current state as arguments and returns a boolean or event object.
// No side effects — callers own all mutation.

function contextRotMilestone(sessionStartMs, firedSet) {
  if (!sessionStartMs) return null;
  const min = (Date.now() - sessionStartMs) / 60000;
  if (min >= 120 && !firedSet.has('contextRot120')) return { trigger: 'contextRot120', emotion: 'angry'   };
  if (min >= 90  && !firedSet.has('contextRot90'))  return { trigger: 'contextRot90',  emotion: 'angry'   };
  if (min >= 60  && !firedSet.has('contextRot60'))  return { trigger: 'contextRot60',  emotion: 'shocked' };
  return null;
}

function cogWallReached(sessionStartMs, firedSet) {
  if (!sessionStartMs || firedSet.has('cogWall')) return false;
  return (Date.now() - sessionStartMs) / 60000 >= 90;
}

function isErrorLoop(sig, errorHistory) {
  const prefix = sig.slice(0, 40);
  return errorHistory.slice(-6).filter(s => s.startsWith(prefix)).length >= 2;
}

function isPanicPrompting(promptTimes) {
  return promptTimes.length >= 4;
}

function isNoContextPrompt(prompt, contextSlice) {
  const DEBUG_RX = /\b(fix this|debug|doesn'?t work|not working|broken|why (is|isn'?t|doesn'?t)|what'?s wrong)\b/i;
  if (!DEBUG_RX.test(prompt)) return false;
  const hasError = /^(Error|TypeError|Traceback|FAILED)/m.test(contextSlice);
  const hasCode  = /```|def |function |class |import |require/.test(contextSlice);
  return !hasError && !hasCode;
}

function isPostOutputSilence(largeOutputAt, lastActivityAt, now, lastFiredAt) {
  if (!largeOutputAt) return false;
  if (now - largeOutputAt < 2 * 60 * 1000) return false;
  if (lastActivityAt && lastActivityAt - largeOutputAt > 5000) return false;
  if (lastFiredAt && now - lastFiredAt < 20 * 60 * 1000) return false;
  return true;
}

function isWeekendOverwork(sessionStartMs, firedSet) {
  if (!sessionStartMs || firedSet.has('weekendOverwork')) return false;
  const day = new Date().getDay();
  if (day !== 0 && day !== 6) return false;
  return (Date.now() - sessionStartMs) / 60000 >= 120;
}

function isMidnight(lastFiredAt) {
  const h = new Date().getHours();
  if (h < 0 || h >= 4) return false;
  return !lastFiredAt || Date.now() - lastFiredAt >= 45 * 60 * 1000;
}

module.exports = {
  contextRotMilestone,
  cogWallReached,
  isErrorLoop,
  isPanicPrompting,
  isNoContextPrompt,
  isPostOutputSilence,
  isWeekendOverwork,
  isMidnight,
};

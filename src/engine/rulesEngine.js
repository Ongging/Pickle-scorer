/**
 * RULES ENGINE
 * ---------------------------------------------------------------------
 * Pure functions only — no React, no storage, no DOM. This is the part
 * of the app that encodes the actual pickleball rules (singles/doubles,
 * traditional/rally/casual scoring, the serve-position model). It's
 * covered by rulesEngine.test.js — run `npm test` after any change here.
 */

export const sideFor = (score) => (score % 2 === 0 ? 'right' : 'left');
export const otherTeam = (t) => (t === 'A' ? 'B' : 'A');

export function checkWin(score, oppScore, winningScore) {
  return score >= winningScore && score - oppScore >= 2;
}

export function createGame(config) {
  return {
    config,
    teamA: { name: config.teamAName || 'Team A', score: 0 },
    teamB: { name: config.teamBName || 'Team B', score: 0 },
    servingTeam: config.firstServer === 'B' ? 'B' : 'A',
    // "First Server Exception" (traditional doubles only): the very first
    // server of the game is already the "second" server for scoring
    // purposes (0-0-2), so one fault sends it straight to Side Out. No
    // special-case branch needed elsewhere.
    serverNumber: config.type === 'doubles' && config.mode === 'traditional' ? 2 : 1,
    // Doubles position model: a new serving turn always starts on the
    // right; the active server's side flips on every point played (won
    // or lost to a same-team handoff) until an actual side-out resets it
    // to right for the new team. Singles instead derives position from
    // the server's own score parity at render time (no state needed).
    position: 'right',
    awaitingSideOut: false,
    lastScorer: null,
    manualServingTeam: 'A',
    manualServerNumber: 1,
    manualPosition: 'right',
    gameOver: false,
    winner: null,
    events: [],
    past: [],
  };
}

function snapshot(state) {
  const { past: _past, ...rest } = state;
  return rest;
}

export function gameReducer(state, action) {
  if (state.gameOver && action.type !== 'UNDO') return state;
  // Once both serves are exhausted, scoring/faulting is paused until the
  // Side Out is explicitly confirmed — otherwise the still-recorded
  // servingTeam could keep scoring past their exhausted serves.
  if (state.awaitingSideOut && (action.type === 'POINT' || action.type === 'FAULT')) return state;

  switch (action.type) {
    case 'POINT': {
      const { team } = action;
      const { config } = state;
      const teamKey = team === 'A' ? 'teamA' : 'teamB';
      const oppKey = team === 'A' ? 'teamB' : 'teamA';
      const prev = snapshot(state);
      let next = { ...state, past: [...state.past, prev] };

      if (config.mode === 'traditional') {
        if (team !== state.servingTeam) return state;
        const newScore = state[teamKey].score + 1;
        next[teamKey] = { ...state[teamKey], score: newScore };
        next.lastScorer = team;
        if (config.type === 'doubles') {
          next.position = state.position === 'right' ? 'left' : 'right';
        }
        next.events = [...state.events, { type: 'point', team, score: newScore }];
        if (checkWin(newScore, state[oppKey].score, config.winningScore)) {
          next.gameOver = true;
          next.winner = team;
        }
        return next;
      }

      if (config.mode === 'rally') {
        const isServer = team === state.servingTeam;
        const projected = state[teamKey].score + 1;
        const wouldWin = checkWin(projected, state[oppKey].score, config.winningScore);
        const withheld = config.gamePointMustServe && wouldWin && !isServer;
        if (!withheld) {
          next[teamKey] = { ...state[teamKey], score: projected };
          next.lastScorer = team;
          if (isServer && config.type === 'doubles') {
            next.position = state.position === 'right' ? 'left' : 'right';
          }
          next.events = [...state.events, { type: 'point', team, score: projected }];
          if (wouldWin) {
            next.gameOver = true;
            next.winner = team;
            return next;
          }
        } else {
          next.events = [...state.events, { type: 'point-withheld', team }];
        }
        if (!isServer) {
          next.servingTeam = team;
          next.serverNumber = 1;
          if (config.type === 'doubles') next.position = 'right';
        }
        return next;
      }

      // casual — freeform, no serve consequences tied to scoring
      const newScore = state[teamKey].score + 1;
      next[teamKey] = { ...state[teamKey], score: newScore };
      next.lastScorer = team;
      next.events = [...state.events, { type: 'point', team, score: newScore }];
      if (checkWin(newScore, state[oppKey].score, config.winningScore)) {
        next.gameOver = true;
        next.winner = team;
      }
      return next;
    }

    case 'FAULT': {
      // Traditional mode only. Rally/Casual record a lost rally through
      // the opponent's own +1 button instead.
      const { config } = state;
      if (config.mode !== 'traditional') return state;
      const prev = snapshot(state);
      let next = {
        ...state,
        past: [...state.past, prev],
        events: [...state.events, { type: 'fault', team: state.servingTeam }],
      };

      if (config.type === 'singles') {
        next.servingTeam = otherTeam(state.servingTeam);
        next.serverNumber = 1;
        return next;
      }
      if (state.serverNumber === 1) {
        // Handoff to Server 2, who is already standing on whichever side
        // Server 1 was NOT just serving from.
        next.serverNumber = 2;
        next.position = state.position === 'right' ? 'left' : 'right';
      } else {
        next.awaitingSideOut = true; // position is irrelevant until confirmed
      }
      return next;
    }

    case 'SIDE_OUT': {
      if (!state.awaitingSideOut) return state;
      const prev = snapshot(state);
      return {
        ...state,
        past: [...state.past, prev],
        servingTeam: otherTeam(state.servingTeam),
        serverNumber: 1,
        position: 'right', // every side-out restarts from the right
        awaitingSideOut: false,
        events: [...state.events, { type: 'side-out' }],
      };
    }

    case 'MANUAL_TOGGLE': {
      if (state.manualServerNumber === 1 && state.config.type === 'doubles') {
        return {
          ...state,
          manualServerNumber: 2,
          manualPosition: state.manualPosition === 'right' ? 'left' : 'right',
        };
      }
      return {
        ...state,
        manualServingTeam: otherTeam(state.manualServingTeam),
        manualServerNumber: 1,
        manualPosition: 'right',
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const last = state.past[state.past.length - 1];
      return { ...last, past: state.past.slice(0, -1) };
    }

    default:
      return state;
  }
}

export function buildAnnouncement(state, format) {
  const { config, teamA, teamB, servingTeam, serverNumber, lastScorer } = state;
  const showServerNum = config.type === 'doubles' && config.mode === 'traditional';
  const servingScore = servingTeam === 'A' ? teamA.score : teamB.score;
  const receivingScore = servingTeam === 'A' ? teamB.score : teamA.score;

  if (format === 'traditional') {
    return showServerNum
      ? `${servingScore}-${receivingScore}-${serverNumber}`
      : `${servingScore}-${receivingScore}`;
  }
  const scorer = lastScorer || servingTeam;
  const scorerScore = scorer === 'A' ? teamA.score : teamB.score;
  const oppScore = scorer === 'A' ? teamB.score : teamA.score;
  const scorerName = scorer === 'A' ? teamA.name : teamB.name;
  return showServerNum
    ? `${scorerScore}-${oppScore}-${serverNumber} (${scorerName})`
    : `${scorerScore}-${oppScore} (${scorerName})`;
}

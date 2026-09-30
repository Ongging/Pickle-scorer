import { describe, it, expect } from 'vitest';
import { createGame, gameReducer, buildAnnouncement, sideFor, checkWin } from './rulesEngine';

function dispatch(state, action) {
  return gameReducer(state, action);
}

describe('Singles Traditional', () => {
  it('starts with A serving, no first-server exception', () => {
    const s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    expect(s.servingTeam).toBe('A');
    expect(s.serverNumber).toBe(1);
  });

  it('a non-server POINT is a no-op at the reducer level', () => {
    const s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    const s2 = dispatch(s, { type: 'POINT', team: 'B' });
    expect(s2).toBe(s);
  });

  it('position follows the server\'s own score parity', () => {
    let s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(sideFor(s.teamA.score)).toBe('left'); // 1 = odd
    s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(sideFor(s.teamA.score)).toBe('right'); // 2 = even
  });

  it('a fault is an immediate side-out (no second serve)', () => {
    let s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'FAULT' });
    expect(s.servingTeam).toBe('B');
    expect(s.serverNumber).toBe(1);
  });

  it('wins at target score with a 2+ lead', () => {
    let s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    expect(checkWin(10, 2, 11)).toBe(false);
    for (let i = 0; i < 11; i++) s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(s.gameOver).toBe(true);
    expect(s.winner).toBe('A');
  });

  it('enforces win-by-2 at deuce', () => {
    let s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    while (s.teamA.score < 10) s = dispatch(s, { type: 'POINT', team: 'A' });
    s = dispatch(s, { type: 'FAULT' });
    while (s.teamB.score < 10) s = dispatch(s, { type: 'POINT', team: 'B' });
    s = dispatch(s, { type: 'POINT', team: 'B' }); // 11-10
    expect(s.gameOver).toBe(false);
    s = dispatch(s, { type: 'FAULT' });
    s = dispatch(s, { type: 'POINT', team: 'A' }); // 11-11
    s = dispatch(s, { type: 'FAULT' });
    s = dispatch(s, { type: 'POINT', team: 'B' }); // 12-11
    expect(s.gameOver).toBe(false);
    s = dispatch(s, { type: 'POINT', team: 'B' }); // 13-11
    expect(s.gameOver).toBe(true);
    expect(s.winner).toBe('B');
  });
});

describe('Doubles Traditional (first-server exception + position model)', () => {
  it('starts labeled as server 2 (the 0-0-2 exception) at the right', () => {
    const s = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    expect(s.serverNumber).toBe(2);
    expect(s.position).toBe('right');
  });

  it('the first-server-exception fault is an immediate, single-tap side-out', () => {
    let s = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'FAULT' });
    expect(s.servingTeam).toBe('B');
    expect(s.serverNumber).toBe(1);
    expect(s.teamA.score).toBe(0);
  });

  it('side-out always resets position to right, regardless of the new server\'s carried-over score', () => {
    let s = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'FAULT' }); // first-server exception: immediate side-out
    expect(s.servingTeam).toBe('B');
    expect(s.position).toBe('right');

    // Drive A's score to an odd number, then have A (as server 2) fault
    // out — position must still reset to 'right' regardless of A's odd
    // carried-over score.
    let s2 = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    s2 = { ...s2, teamA: { ...s2.teamA, score: 3 }, servingTeam: 'B', serverNumber: 2 };
    s2 = dispatch(s2, { type: 'FAULT' });
    expect(s2.servingTeam).toBe('A');
    expect(s2.position).toBe('right'); // right regardless of A's odd score (3)
  });

  it('server handoff on fault gives server 2 the opposite side from server 1\'s last position', () => {
    let s = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'FAULT' }); // first-server exception: immediate side-out to B, server 1, right
    expect(s.servingTeam).toBe('B');
    expect(s.serverNumber).toBe(1);
    s = dispatch(s, { type: 'POINT', team: 'B' }); // right -> left
    expect(s.position).toBe('left');
    s = dispatch(s, { type: 'FAULT' }); // handoff to server 2
    expect(s.serverNumber).toBe(2);
    expect(s.position).toBe('right'); // opposite of left
  });
});

describe('Doubles Rally Scoring', () => {
  it('has no first-server exception (always starts at server 1)', () => {
    const s = createGame({ type: 'doubles', mode: 'rally', winningScore: 11, gamePointMustServe: true });
    expect(s.serverNumber).toBe(1);
    expect(s.position).toBe('right');
  });

  it('server continues on a won rally, flips position, keeps the score climbing', () => {
    let s = createGame({ type: 'doubles', mode: 'rally', winningScore: 11, gamePointMustServe: true });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(s.teamA.score).toBe(1);
    expect(s.position).toBe('left');
    expect(s.servingTeam).toBe('A');
  });

  it('receiver winning the rally scores AND immediately becomes server at the right', () => {
    let s = createGame({ type: 'doubles', mode: 'rally', winningScore: 11, gamePointMustServe: true });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    s = dispatch(s, { type: 'POINT', team: 'B' });
    expect(s.teamB.score).toBe(1);
    expect(s.servingTeam).toBe('B');
    expect(s.position).toBe('right');
  });

  it('withholds the game-winning point for a receiver when gamePointMustServe is on', () => {
    let s = createGame({ type: 'doubles', mode: 'rally', winningScore: 11, gamePointMustServe: true });
    s = { ...s, teamA: { ...s.teamA, score: 10 }, teamB: { ...s.teamB, score: 5 }, servingTeam: 'B' };
    s = dispatch(s, { type: 'POINT', team: 'A' }); // would be 11 for A, but A isn't serving
    expect(s.teamA.score).toBe(10); // withheld
    expect(s.gameOver).toBe(false);
    expect(s.servingTeam).toBe('A'); // still gets the side-out
    expect(s.position).toBe('right'); // side-out from a withheld point still resets to right
    s = dispatch(s, { type: 'POINT', team: 'A' }); // now serving legitimately
    expect(s.teamA.score).toBe(11);
    expect(s.gameOver).toBe(true);
    expect(s.winner).toBe('A');
  });

  it('lets a receiver win outright when gamePointMustServe is off', () => {
    let s = createGame({ type: 'doubles', mode: 'rally', winningScore: 11, gamePointMustServe: false });
    s = { ...s, teamA: { ...s.teamA, score: 10 }, teamB: { ...s.teamB, score: 5 }, servingTeam: 'B' };
    s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(s.teamA.score).toBe(11);
    expect(s.gameOver).toBe(true);
    expect(s.winner).toBe('A');
  });
});

describe('Casual mode', () => {
  it('either team scores freely, servingTeam is not touched by scoring', () => {
    let s = createGame({ type: 'doubles', mode: 'casual', winningScore: 11 });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    s = dispatch(s, { type: 'POINT', team: 'B' });
    s = dispatch(s, { type: 'POINT', team: 'B' });
    expect(s.teamA.score).toBe(1);
    expect(s.teamB.score).toBe(2);
    expect(s.servingTeam).toBe('A');
  });

  it('the manual tracker cycles server 1 -> server 2 -> next team', () => {
    let s = createGame({ type: 'doubles', mode: 'casual', winningScore: 11 });
    s = dispatch(s, { type: 'MANUAL_TOGGLE' });
    expect(s.manualServerNumber).toBe(2);
    expect(s.manualPosition).toBe('left');
    s = dispatch(s, { type: 'MANUAL_TOGGLE' });
    expect(s.manualServingTeam).toBe('B');
    expect(s.manualServerNumber).toBe(1);
    expect(s.manualPosition).toBe('right');
  });
});

describe('Undo', () => {
  it('steps back through scoring history and no-ops at the start', () => {
    let s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(s.teamA.score).toBe(2);
    s = dispatch(s, { type: 'UNDO' });
    expect(s.teamA.score).toBe(1);
    s = dispatch(s, { type: 'UNDO' });
    expect(s.teamA.score).toBe(0);
    const s2 = dispatch(s, { type: 'UNDO' });
    expect(s2).toBe(s);
  });
});

describe('Announcements', () => {
  it('calls doubles traditional with a third (server) number', () => {
    const s = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    expect(buildAnnouncement(s, 'traditional')).toBe('0-0-2');
  });

  it('calls singles with only two numbers', () => {
    const s = createGame({ type: 'singles', mode: 'traditional', winningScore: 11 });
    expect(buildAnnouncement(s, 'traditional')).toBe('0-0');
  });

  it('calls rally doubles with only two numbers (official rally calling convention)', () => {
    let s = createGame({ type: 'doubles', mode: 'rally', winningScore: 11, gamePointMustServe: true });
    s = dispatch(s, { type: 'POINT', team: 'A' });
    expect(buildAnnouncement(s, 'traditional')).toBe('1-0');
  });

  it('custom format leads with whoever scored last', () => {
    let s = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    s = dispatch(s, { type: 'FAULT' }); // first-server exception: immediate side-out
    s = dispatch(s, { type: 'POINT', team: 'B' });
    expect(buildAnnouncement(s, 'custom')).toMatch(/^1-0-1/);
  });
});

describe('First-serve choice', () => {
  it('defaults to A, honors firstServer: "B"', () => {
    const s1 = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11 });
    expect(s1.servingTeam).toBe('A');
    const s2 = createGame({ type: 'doubles', mode: 'traditional', winningScore: 11, firstServer: 'B' });
    expect(s2.servingTeam).toBe('B');
  });
});

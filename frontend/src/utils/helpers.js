export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Berger circle method — returns array of rounds, each round is an array of {homeClub, awayClub}.
// Guarantees every pair of clubs meets exactly once, balanced home/away distribution.
export function generateLeagueRounds(clubs) {
  const ids = clubs.map((c) => c._id);
  const n = ids.length;
  if (n < 2) return [];

  const list = n % 2 === 0 ? [...ids] : [...ids, null]; // null = bye
  const m = list.length;
  const fixed = list[0];
  const rotating = [...list.slice(1)];
  const rounds = [];

  for (let r = 0; r < m - 1; r++) {
    const round = [];
    const circle = [fixed, ...rotating];
    for (let i = 0; i < m / 2; i++) {
      const home = circle[i];
      const away = circle[m - 1 - i];
      if (home !== null && away !== null) {
        round.push({ homeClub: home, awayClub: away });
      }
    }
    rounds.push(round);
    rotating.unshift(rotating.pop()); // rotate: last → front
  }

  return rounds;
}

// Backward-compat flat version
export function generateRoundRobin(clubs) {
  return generateLeagueRounds(clubs).flat();
}

// Cup first round — shuffles clubs and pairs them up
export function generateCupBracket(clubs) {
  const shuffled = shuffleArray(clubs);
  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    pairs.push({
      homeClub: shuffled[i]._id,
      awayClub: shuffled[i + 1]._id,
    });
  }
  return pairs;
}

// Given an array of played cup-round matches (ordered by bracket position),
// extract winners and return pairs for the next round.
// Draw → home team advances (tiebreaker).
export function generateCupNextRoundPairs(playedMatches) {
  const sorted = [...playedMatches].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const winners = sorted.map((m) => {
    const homeId = m.homeClub?._id ?? m.homeClub;
    const awayId = m.awayClub?._id ?? m.awayClub;
    return m.scoreHome >= m.scoreAway ? homeId : awayId;
  });
  const pairs = [];
  for (let i = 0; i + 1 < winners.length; i += 2) {
    pairs.push({ homeClub: winners[i], awayClub: winners[i + 1] });
  }
  return pairs;
}

// Group all cup matches into bracket rounds based on the bracket structure.
// Matches are sorted by date; first Math.floor(clubCount/2) = round 1, next = round 2, etc.
export function groupMatchesIntoCupRounds(matches, clubCount) {
  if (!matches.length || clubCount < 2) return [];
  const sorted = [...matches].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const rounds = [];
  let idx = 0;
  let size = Math.floor(clubCount / 2);
  while (size >= 1 && idx < sorted.length) {
    const chunk = sorted.slice(idx, idx + size);
    if (chunk.length) rounds.push(chunk);
    idx += size;
    size = Math.floor(size / 2);
  }
  return rounds;
}

// Round name by position from start (not from end), given total club count.
// clubCount=8, roundIndex=0 → "Cuartos"
// clubCount=8, roundIndex=1 → "Semifinal"
// clubCount=8, roundIndex=2 → "Final"
export function getCupRoundName(clubCount, roundIndex) {
  const totalRounds = Math.log2(clubCount); // 4→2, 8→3, 16→4
  const fromEnd = totalRounds - roundIndex;
  if (fromEnd <= 1) return "Final";
  if (fromEnd <= 2) return "Semifinal";
  if (fromEnd <= 3) return "Cuartos";
  return "Octavos";
}

// Group league matches into jornadas (rounds) by date proximity.
// Matches less than 3 days apart are in the same jornada.
export function groupMatchesIntoJornadas(matches) {
  if (!matches.length) return [];
  const sorted = [...matches].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const jornadas = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      new Date(sorted[i].date) - new Date(sorted[i - 1].date);
    if (diff > THREE_DAYS) jornadas.push([]);
    jornadas[jornadas.length - 1].push(sorted[i]);
  }
  return jornadas;
}

export function getRoundName(clubCount) {
  if (clubCount >= 16) return "Octavos de final";
  if (clubCount >= 8) return "Cuartos de final";
  if (clubCount >= 4) return "Semifinales";
  return "Final";
}

export function isValidCupSize(count) {
  return [4, 8, 16].includes(count);
}

export function calculateMatchWinner(match) {
  const isPlayed = match.status === "played";
  return {
    isPlayed,
    homeWon: isPlayed && Number(match.scoreHome) >= Number(match.scoreAway),
    awayWon: isPlayed && Number(match.scoreAway) > Number(match.scoreHome),
  };
}

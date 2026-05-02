export default function Bracket({ matches }) {
  const rounds = groupMatchesByRound(matches);

  if (!matches.length) {
    return (
      <div className="card p-6 text-center text-gray-400">
        El bracket no ha sido generado aún
      </div>
    );
  }

  return (
    <div className="flex gap-8 overflow-x-auto p-4">
      {rounds.map((round, index) => (
        <div key={index} className="flex flex-col gap-6 min-w-[220px]">
          
          <div className="text-center text-xs text-[var(--fifa-mute)] uppercase">
            Ronda {index + 1}
          </div>

          {round.map((match) => (
            <div
              key={match._id}
              className="bg-black/30 border border-[var(--fifa-line)] rounded-xl p-3"
            >
              <div className="flex justify-between text-sm">
                <span>{match.homeClub?.name || "TBD"}</span>
                <span>{match.scoreHome}</span>
              </div>

              <div className="flex justify-between text-sm mt-1">
                <span>{match.awayClub?.name || "TBD"}</span>
                <span>{match.scoreAway}</span>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {match.status === "played" ? "Finalizado" : "Pendiente"}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function groupMatchesByRound(matches) {
  const rounds = {};

  matches.forEach((match) => {
    const r = match.round || 1;
    if (!rounds[r]) rounds[r] = [];
    rounds[r].push(match);
  });

  return Object.keys(rounds)
    .sort((a, b) => Number(a) - Number(b))
    .map((r) => rounds[r]);
}
function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function positionMultiplier(position) {
  return {
    Goalkeeper: 1.02,
    Defender: 1,
    Midfielder: 1.08,
    Forward: 1.12
  }[position] || 1;
}

function riskMultiplier(card, riskMode) {
  const unavailable = card.player.injured || card.player.suspended;

  if (unavailable) return 0.1;
  if (riskMode === "safe") return 0.96;
  if (riskMode === "aggressive") return 1.06;
  return 1;
}

function confirmationBoost(card, confirmations) {
  const related = confirmations.filter(c => c.playerSlug === card.player.slug);

  if (!related.length) return 1;

  const confidence = average(related.map(c => Number(c.confidence || 0)));
  return 1 + Math.min(confidence / 500, 0.2);
}

function projectCard(card, confirmations, riskMode) {
  const scores = card.player.scores || [];
  const recent = average(scores.slice(0, 5));
  const longTerm = average(scores);

  const base = recent * 0.68 + longTerm * 0.32;

  const projected =
    base *
    positionMultiplier(card.player.position) *
    riskMultiplier(card, riskMode) *
    confirmationBoost(card, confirmations);

  return {
    ...card,
    projected: Number(projected.toFixed(2)),
    explanation: [
      `Recent form ${recent.toFixed(1)}`,
      `Long-term form ${longTerm.toFixed(1)}`,
      `${card.player.position} multiplier applied`,
      card.player.injured ? "Injury risk penalty applied" : null,
      card.player.suspended ? "Suspension risk penalty applied" : null,
      confirmationBoost(card, confirmations) > 1
        ? "Trusted lineup confirmation boost applied"
        : null
    ].filter(Boolean)
  };
}

function pickRandom(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function buildRandomTeam(pool) {
  const byPosition = {
    Goalkeeper: pool.filter(c => c.player.position === "Goalkeeper"),
    Defender: pool.filter(c => c.player.position === "Defender"),
    Midfielder: pool.filter(c => c.player.position === "Midfielder"),
    Forward: pool.filter(c => c.player.position === "Forward")
  };

  const required = [
    pickRandom(byPosition.Goalkeeper),
    pickRandom(byPosition.Defender),
    pickRandom(byPosition.Midfielder),
    pickRandom(byPosition.Forward)
  ].filter(Boolean);

  const used = new Set(required.map(c => c.id));
  const extraPool = pool.filter(c => !used.has(c.id));
  const extra = pickRandom(extraPool);

  return [...required, extra].filter(Boolean);
}

export function simulateTeams({
  cards,
  confirmations = [],
  riskMode = "balanced",
  iterations = 1500
}) {
  const pool = cards
    .filter(card => card.player?.scores?.length)
    .map(card => projectCard(card, confirmations, riskMode))
    .filter(card => card.player.position !== "Unknown");

  const teams = [];

  for (let i = 0; i < iterations; i++) {
    const team = buildRandomTeam(pool);
    const unique = [...new Map(team.map(card => [card.id, card])).values()];

    if (unique.length !== 5) continue;

    const expectedScore = unique.reduce((sum, card) => {
      const variance = 0.86 + Math.random() * 0.28;
      return sum + card.projected * variance;
    }, 0);

    teams.push({
      cards: unique,
      expectedScore: Number(expectedScore.toFixed(2))
    });
  }

  return teams
    .sort((a, b) => b.expectedScore - a.expectedScore)
    .slice(0, 10)
    .map((team, index) => ({
      rank: index + 1,
      ...team,
      why:
        "This lineup ranks highly because it balances recent SO5 scores, positional value, availability, and lineup confirmation confidence."
    }));
}
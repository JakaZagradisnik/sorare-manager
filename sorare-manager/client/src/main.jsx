import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ShieldCheck,
  Trophy,
  Zap,
  Search,
  LogIn
} from "lucide-react";
import "./styles.css";

const API_URL = "http://localhost:4000/api";

function App() {
  const [auth, setAuth] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [cards, setCards] = useState(sampleCards);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [riskMode, setRiskMode] = useState("balanced");
  const [iterations, setIterations] = useState(1500);
  const [confirmation, setConfirmation] = useState({
    playerSlug: "",
    sourceName: "",
    url: "",
    confidence: 80
  });
  const [confirmations, setConfirmations] = useState([
    {
      playerSlug: "adam-kovac",
      sourceName: "Club preview",
      url: "https://example.com",
      confidence: 92
    }
  ]);

  const bestScore = useMemo(() => {
    if (!teams.length) return "—";
    return Math.max(...teams.map(t => t.expectedScore)).toFixed(1);
  }, [teams]);

  async function login(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAuth(data);
      await loadCards(data.token);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCards(token) {
    const response = await fetch(`${API_URL}/sorare/cards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    if (data.cards.length) setCards(data.cards);
  }

  async function runSimulation() {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/simulate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cards,
          confirmations,
          riskMode,
          iterations: Number(iterations)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setTeams(data.teams);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function addConfirmation(event) {
    event.preventDefault();

    if (!confirmation.playerSlug || !confirmation.sourceName) return;

    setConfirmations(prev => [...prev, confirmation]);
    setConfirmation({
      playerSlug: "",
      sourceName: "",
      url: "",
      confidence: 80
    });
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Sorare Manager Simulator</p>
          <h1>Predict lineups and build stronger Sorare teams.</h1>
          <p className="subtitle">
            Connect your Sorare account, import card images, add trusted lineup
            confirmations, and run simulations to find the best team options.
          </p>
        </div>

        <div className="heroCard">
          <Trophy size={44} />
          <strong>{cards.length}</strong>
          <span>cards loaded</span>
        </div>
      </section>

      <section className="stats">
        <Stat label="Best projected score" value={bestScore} />
        <Stat label="Simulation results" value={teams.length} />
        <Stat label="Confirmations" value={confirmations.length} />
        <Stat label="Account" value={auth ? "Connected" : "Demo"} />
      </section>

      <section className="grid">
        <div className="panel">
          <h2>
            <LogIn /> Sorare connection
          </h2>

          {!auth ? (
            <form onSubmit={login} className="stack">
              <input
                placeholder="Sorare email"
                value={loginForm.email}
                onChange={event =>
                  setLoginForm({ ...loginForm, email: event.target.value })
                }
              />

              <input
                placeholder="Sorare password"
                type="password"
                value={loginForm.password}
                onChange={event =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
              />

              <button disabled={loading}>
                {loading ? "Connecting..." : "Connect Sorare"}
              </button>

              <p className="hint">
                Demo data is shown by default. Real account cards appear after
                login.
              </p>
            </form>
          ) : (
            <div className="connected">
              <ShieldCheck />
              Connected as <b>{auth.user.nickname || auth.user.slug}</b>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>
            <Activity /> Simulator settings
          </h2>

          <div className="two">
            <label>
              Risk mode
              <select
                value={riskMode}
                onChange={event => setRiskMode(event.target.value)}
              >
                <option value="safe">Safe</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </label>

            <label>
              Simulations
              <select
                value={iterations}
                onChange={event => setIterations(Number(event.target.value))}
              >
                <option value={500}>500</option>
                <option value={1500}>1500</option>
                <option value={5000}>5000</option>
                <option value={10000}>10000</option>
              </select>
            </label>
          </div>

          <button className="full" onClick={runSimulation} disabled={loading}>
            <Zap size={18} />
            {loading ? "Running..." : "Run best-team simulator"}
          </button>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>
            <ShieldCheck /> Lineup confirmations
          </h2>

          <form className="stack" onSubmit={addConfirmation}>
            <input
              placeholder="Player slug, e.g. adam-kovac"
              value={confirmation.playerSlug}
              onChange={event =>
                setConfirmation({
                  ...confirmation,
                  playerSlug: event.target.value
                })
              }
            />

            <input
              placeholder="Source name"
              value={confirmation.sourceName}
              onChange={event =>
                setConfirmation({
                  ...confirmation,
                  sourceName: event.target.value
                })
              }
            />

            <input
              placeholder="Source URL"
              value={confirmation.url}
              onChange={event =>
                setConfirmation({ ...confirmation, url: event.target.value })
              }
            />

            <label>
              Confidence: {confirmation.confidence}%
              <input
                type="range"
                min="1"
                max="100"
                value={confirmation.confidence}
                onChange={event =>
                  setConfirmation({
                    ...confirmation,
                    confidence: Number(event.target.value)
                  })
                }
              />
            </label>

            <button>Add confirmation</button>
          </form>

          <div className="chips">
            {confirmations.map((item, index) => (
              <span key={`${item.playerSlug}-${index}`}>
                {item.playerSlug} · {item.confidence}%
              </span>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>
            <Search /> Best teams
          </h2>

          {!teams.length ? (
            <p className="hint">Run the simulator to see recommended teams.</p>
          ) : (
            <div className="teams">
              {teams.map(team => (
                <article className="team" key={team.rank}>
                  <div className="teamHead">
                    <strong>#{team.rank}</strong>
                    <span>{team.expectedScore} pts</span>
                  </div>

                  <div className="miniGrid">
                    {team.cards.map(card => (
                      <MiniCard key={card.id} card={card} />
                    ))}
                  </div>

                  <p>{team.why}</p>

                  <ul>
                    {team.cards.map(card => (
                      <li key={card.id}>
                        <b>{card.player.name}</b>:{" "}
                        {card.explanation?.join("; ")}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Imported cards</h2>

        <div className="cards">
          {cards.map(card => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Card({ card }) {
  return (
    <article className="card">
      <div className="cardImage">
        {card.image ? (
          <img src={card.image} alt={card.name} />
        ) : (
          <div className="shirt" />
        )}
      </div>

      <div className="cardBody">
        <strong>{card.player.name}</strong>
        <span>{card.player.club}</span>

        <div className="badges">
          <small>{card.player.position}</small>
          <small>{card.rarity}</small>
          <small>
            Form{" "}
            {average(card.player.scores)
              ? average(card.player.scores).toFixed(1)
              : "—"}
          </small>
        </div>
      </div>
    </article>
  );
}

function MiniCard({ card }) {
  return (
    <div className="miniCard">
      <div className="shirt" />
      <strong>{card.player.name}</strong>
      <span>{card.player.position}</span>
      <small>{card.projected} proj.</small>
    </div>
  );
}

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const sampleCards = [
  {
    id: "card-1",
    name: "Adam Kovac",
    rarity: "Rare",
    image: "",
    player: {
      slug: "adam-kovac",
      name: "Adam Kovac",
      position: "Midfielder",
      club: "Leverkusen",
      injured: false,
      suspended: false,
      scores: [81, 77, 86, 72, 84, 80, 79]
    }
  },
  {
    id: "card-2",
    name: "Elias Novak",
    rarity: "Unique",
    image: "",
    player: {
      slug: "elias-novak",
      name: "Elias Novak",
      position: "Forward",
      club: "Inter",
      injured: false,
      suspended: false,
      scores: [89, 76, 91, 85, 80, 82]
    }
  },
  {
    id: "card-3",
    name: "Marco Silva",
    rarity: "Rare",
    image: "",
    player: {
      slug: "marco-silva",
      name: "Marco Silva",
      position: "Goalkeeper",
      club: "Porto",
      injured: false,
      suspended: false,
      scores: [71, 65, 79, 60, 74, 73]
    }
  },
  {
    id: "card-4",
    name: "Lucas Weber",
    rarity: "Limited",
    image: "",
    player: {
      slug: "lucas-weber",
      name: "Lucas Weber",
      position: "Defender",
      club: "Bayern",
      injured: false,
      suspended: false,
      scores: [62, 68, 70, 73, 66, 69]
    }
  },
  {
    id: "card-5",
    name: "Victor Almeida",
    rarity: "Super Rare",
    image: "",
    player: {
      slug: "victor-almeida",
      name: "Victor Almeida",
      position: "Forward",
      club: "Braga",
      injured: false,
      suspended: false,
      scores: [84, 87, 79, 76, 88, 82]
    }
  },
  {
    id: "card-6",
    name: "Nico Duarte",
    rarity: "Rare",
    image: "",
    player: {
      slug: "nico-duarte",
      name: "Nico Duarte",
      position: "Defender",
      club: "Benfica",
      injured: false,
      suspended: false,
      scores: [77, 74, 69, 80, 72, 75]
    }
  }
];

createRoot(document.getElementById("root")).render(<App />);
import { useEffect, useState, type ReactNode } from "react";

import {
  Flame,
  Code2,
  ChevronRight,
  BarChart3,
  Trophy,
  Home,
  RefreshCw,
  CalendarDays,
  Target,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";

import {
  fetchCodeforcesSubmissions,
  getCodeforcesAcceptedDates,
} from "./services/codeforces";

import {
  fetchLeetCodeSubmissions,
  getLeetCodeAcceptedDates,
} from "./services/leetcode";

type Tab = "Home" | "Stats" | "Achievements";

const TIME_ZONE = "Asia/Kolkata";

function getDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return getDateKey(date);
}

function calculateStreak(dates: string[]): number {
  const dateSet = new Set(dates);
  const today = getDateKey(new Date());
  const yesterday = addDays(today, -1);

  let current = dateSet.has(today)
    ? today
    : dateSet.has(yesterday)
      ? yesterday
      : "";

  if (!current) return 0;

  let streak = 0;

  while (dateSet.has(current)) {
    streak++;
    current = addDays(current, -1);
  }

  return streak;
}

function calculateBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDays(sorted[i - 1], 1)) {
      current++;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
  }

  return best;
}

function getWeekDates(): string[] {
  const today = getDateKey(new Date());
  const day = new Date(`${today}T12:00:00`).getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(today, mondayOffset);

  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function formatDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Home");

  const [cfDates, setCfDates] = useState<string[]>([]);
  const [lcDates, setLcDates] = useState<string[]>([]);

  const [cfCount, setCfCount] = useState(0);
  const [lcCount, setLcCount] = useState(0);

  const [cfError, setCfError] = useState("");
  const [lcError, setLcError] = useState("");

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  async function refreshData() {
    setLoading(true);
    setCfError("");
    setLcError("");

    const [cfResult, lcResult] = await Promise.allSettled([
      fetchCodeforcesSubmissions("hretz"),
      fetchLeetCodeSubmissions("hretz"),
    ]);

    if (cfResult.status === "fulfilled") {
      const dates = getCodeforcesAcceptedDates(cfResult.value);
      setCfDates(dates);
      setCfCount(cfResult.value.filter((s) => s.verdict === "OK").length);
    } else {
      setCfError("Could not load Codeforces data.");
    }

    if (lcResult.status === "fulfilled") {
      const dates = getLeetCodeAcceptedDates(lcResult.value);
      setLcDates(dates);
      setLcCount(lcResult.value.length);
    } else {
      setLcError("Could not load LeetCode data.");
    }

    setLastUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setLoading(false);
  }

  useEffect(() => {
    void refreshData();
  }, []);

  const today = getDateKey(new Date());
  const lcDateSet = new Set(lcDates);

  // A qualifying day requires at least one accepted solution on BOTH platforms.
  const combinedDates = cfDates.filter((date) => lcDateSet.has(date));

  const cfStreak = calculateStreak(cfDates);
  const lcStreak = calculateStreak(lcDates);
  const combinedStreak = calculateStreak(combinedDates);

  const bestStreak = calculateBestStreak(combinedDates);

  const cfToday = cfDates.includes(today);
  const lcToday = lcDates.includes(today);
  const goalComplete = cfToday && lcToday;

  const weekDates = getWeekDates();
  const weeklyCompleted = weekDates.filter((date) =>
    combinedDates.includes(date)
  ).length;

  const totalQualifyingDays = combinedDates.length;

  const achievements = [
    {
      title: "First Steps",
      description: "Complete your first qualifying day",
      icon: Zap,
      unlocked: totalQualifyingDays >= 1,
    },
    {
      title: "3-Day Streak",
      description: "Stay consistent for three days",
      icon: Flame,
      unlocked: bestStreak >= 3,
    },
    {
      title: "7-Day Warrior",
      description: "Maintain a full week of coding",
      icon: Trophy,
      unlocked: bestStreak >= 7,
    },
    {
      title: "14-Day Discipline",
      description: "Two weeks of consistency",
      icon: Target,
      unlocked: bestStreak >= 14,
    },
    {
      title: "30-Day Legend",
      description: "Complete a 30-day streak",
      icon: Trophy,
      unlocked: bestStreak >= 30,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const recentDates = Array.from({ length: 14 }, (_, i) =>
    addDays(today, i - 13)
  );

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="top-bar">
          <div className="brand-icon">
            <Code2 size={29} />
          </div>

          <button
            className="icon-button"
            onClick={() => void refreshData()}
            aria-label="Refresh data"
            disabled={loading}
          >
            <RefreshCw size={21} className={loading ? "spinning" : ""} />
          </button>
        </header>

        <section className="greeting">
          <p className="eyebrow">Good evening,</p>
          <h1>hretz</h1>
          <p className="subtitle">Keep coding. Keep going.</p>
        </section>

        <main>
          {activeTab === "Home" && (
            <>
              <section className="streak-card">
                <div className="streak-main">
                  <div className="flame-wrap">
                    <Flame size={58} fill="currentColor" />
                  </div>

                  <div>
                    <h2>{combinedStreak} days</h2>
                    <p>Your coding streak</p>
                  </div>

                  <ChevronRight className="streak-arrow" />
                </div>

                <div className="card-divider" />

                <div className="personal-best">
                  <span>Personal Best</span>
                  <strong>{bestStreak} days</strong>
                </div>
              </section>

              <section className="platform-grid">
                <PlatformCard
                  name="Codeforces"
                  streak={cfStreak}
                  active={cfToday}
                  icon="cf"
                  count={cfCount}
                />

                <PlatformCard
                  name="LeetCode"
                  streak={lcStreak}
                  active={lcToday}
                  icon="lc"
                  count={lcCount}
                />
              </section>

              {(cfError || lcError) && (
                <div className="error-panel">
                  {cfError && <p>{cfError}</p>}
                  {lcError && <p>{lcError}</p>}
                  <button onClick={() => void refreshData()}>
                    Try again
                  </button>
                </div>
              )}

              <section className="section-block">
                <div className="section-heading">
                  <h3>This Week</h3>
                  <span>{weeklyCompleted} / 7 days</span>
                </div>

                <div className="week-grid">
                  {weekDates.map((date, index) => {
                    const completed = combinedDates.includes(date);
                    const isToday = date === today;

                    return (
                      <div className="week-day" key={date}>
                        <span className="day-label">{dayLabels[index]}</span>
                        <div
                          className={`day-circle ${
                            completed ? "completed" : ""
                          } ${isToday ? "today" : ""}`}
                        >
                          {completed ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <span>{new Date(`${date}T12:00:00`).getDate()}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="goal-card">
                <div className="goal-icon">
                  <Target size={23} />
                </div>
                <div className="goal-copy">
                  <h3>Daily commitment</h3>
                  <p>1 accepted problem on each platform</p>
                </div>
                <div className={`goal-status ${goalComplete ? "done" : ""}`}>
                  {goalComplete ? "Done" : "0/2"}
                </div>
              </section>

              <p className="update-note">
                {loading
                  ? "Syncing your profiles..."
                  : lastUpdated
                    ? `Last synced at ${lastUpdated}`
                    : "Waiting for profile data"}
              </p>
            </>
          )}

          {activeTab === "Stats" && (
            <section className="page-content">
              <div className="page-title">
                <p className="eyebrow">Your progress</p>
                <h2>Statistics</h2>
                <p className="subtitle">Small steps add up.</p>
              </div>

              <div className="stats-grid">
                <StatCard
                  label="Current streak"
                  value={`${combinedStreak}`}
                  suffix="days"
                  icon={<Flame />}
                />
                <StatCard
                  label="Personal best"
                  value={`${bestStreak}`}
                  suffix="days"
                  icon={<Trophy />}
                />
                <StatCard
                  label="Qualifying days"
                  value={`${totalQualifyingDays}`}
                  suffix="days"
                  icon={<CalendarDays />}
                />
                <StatCard
                  label="Weekly progress"
                  value={`${weeklyCompleted}/7`}
                  suffix="days"
                  icon={<Target />}
                />
              </div>

              <div className="content-card">
                <h3>Platform overview</h3>
                <div className="stat-row">
                  <span>Codeforces accepted submissions</span>
                  <strong>{cfCount}</strong>
                </div>
                <div className="stat-row">
                  <span>LeetCode accepted submissions</span>
                  <strong>{lcCount}</strong>
                </div>
                <div className="stat-row">
                  <span>Codeforces current streak</span>
                  <strong>{cfStreak} days</strong>
                </div>
                <div className="stat-row">
                  <span>LeetCode current streak</span>
                  <strong>{lcStreak} days</strong>
                </div>
              </div>

              <div className="content-card">
                <div className="section-heading">
                  <h3>Last 14 days</h3>
                  <span>Both platforms</span>
                </div>

                <div className="heatmap">
                  {recentDates.map((date) => {
                    const active = combinedDates.includes(date);

                    return (
                      <div className="heatmap-day" key={date}>
                        <div
                          className={`heat-cell ${active ? "active" : ""}`}
                          title={`${formatDate(date)} ${
                            active ? "Completed" : "No qualifying activity"
                          }`}
                        />
                        <span>{new Date(`${date}T12:00:00`).getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="data-disclaimer">
                LeetCode currently provides only the 20 most recent accepted
                submissions through this public query. Older activity and
                personal-best calculations may be incomplete.
              </p>
            </section>
          )}

          {activeTab === "Achievements" && (
            <section className="page-content">
              <div className="page-title">
                <p className="eyebrow">Keep showing up</p>
                <h2>Achievements</h2>
                <p className="subtitle">
                  {unlockedCount} of {achievements.length} milestones unlocked
                </p>
              </div>

              <div className="achievement-progress">
                <div className="progress-top">
                  <span>Your collection</span>
                  <strong>
                    {Math.round(
                      (unlockedCount / achievements.length) * 100
                    )}
                    %
                  </strong>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (unlockedCount / achievements.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="achievement-list">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;

                  return (
                    <div
                      className={`achievement-card ${
                        achievement.unlocked ? "unlocked" : ""
                      }`}
                      key={achievement.title}
                    >
                      <div className="achievement-icon">
                        {achievement.unlocked ? (
                          <Icon size={25} />
                        ) : (
                          <Lock size={23} />
                        )}
                      </div>

                      <div className="achievement-copy">
                        <h3>{achievement.title}</h3>
                        <p>{achievement.description}</p>
                      </div>

                      {achievement.unlocked && (
                        <CheckCircle2
                          className="achievement-check"
                          size={20}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="content-card achievement-tip">
                <Flame size={23} />
                <div>
                  <h3>Consistency beats intensity.</h3>
                  <p>
                    Solve at least one problem on both platforms every day to
                    keep your streak alive.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>

        <nav className="bottom-nav">
          <NavItem
            label="Home"
            active={activeTab === "Home"}
            onClick={() => setActiveTab("Home")}
            icon={<Home size={21} />}
          />
          <NavItem
            label="Stats"
            active={activeTab === "Stats"}
            onClick={() => setActiveTab("Stats")}
            icon={<BarChart3 size={21} />}
          />
          <NavItem
            label="Achievements"
            active={activeTab === "Achievements"}
            onClick={() => setActiveTab("Achievements")}
            icon={<Trophy size={21} />}
          />
        </nav>
      </div>
    </div>
  );
}

function PlatformCard({
  name,
  streak,
  active,
  icon,
  count,
}: {
  name: string;
  streak: number;
  active: boolean;
  icon: "cf" | "lc";
  count: number;
}) {
  return (
    <div className="platform-card">
      <div className={`platform-logo ${icon}`}>
        {icon === "cf" ? (
          <div className="cf-bars">
            <i />
            <i />
            <i />
          </div>
        ) : (
          <Code2 size={37} strokeWidth={3} />
        )}
      </div>

      <h3>{name}</h3>
      <strong className="platform-streak">{streak} days</strong>
      <p className="platform-caption">Current Streak</p>

      <div className="platform-bottom">
        <span className={`status-dot ${active ? "active" : ""}`} />
        <span>{active ? "Active today" : "Not active today"}</span>
      </div>

      <p className="submission-count">{count} accepted loaded</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  suffix: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{suffix}</small>
    </div>
  );
}

function NavItem({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;


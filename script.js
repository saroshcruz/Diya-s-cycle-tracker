const SUPABASE_URL = "https://ufjelnennrylumajcytq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamVsbmVubnJ5bHVtYWpjeXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MjIsImV4cCI6MjA4MjMwNTgyMn0.aAjyWvBfH1HBKpXQYGiukMt6nHbZnqLZRlT0vIWmnfk";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const poopBtn = document.getElementById("poopBtn");
const ring = document.querySelector(".cooldown-ring circle");
const todayCountEl = document.getElementById("todayCount");
const streakEl = document.getElementById("streak");
const celebration = document.getElementById("celebration");
const undoBtn = document.getElementById("undo");
const insightsEl = document.getElementById("insights");
const calendarEl = document.getElementById("calendar");
const shareBtn = document.getElementById("shareBtn");

let undoTimeout = null;
let lastCount = null;
let coolingDown = false;

const COOLDOWN_MS = 2000;

const affirmations = [
  "Yay you go girl 💛",
  "Healthy queen 👑",
  "Fiber paid off 🥗",
  "Gut feeling good ✨",
  "Iconic behavior 💅"
];

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function calculateStreak(data) {
  const map = new Map();
  data.forEach(row => map.set(row.date, row.count));

  let streak = 0;
  let day = new Date();

  while (true) {
    const key = formatDate(day);
    if (map.has(key) && map.get(key) > 0) {
      streak++;
      day.setDate(day.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

async function loadData() {
  const today = formatDate(new Date());

  const { data } = await supabaseClient
    .from("poops")
    .select("*")
    .order("date", { ascending: false })
    .limit(60);

  let todayCount = 0;
  let total = 0;

  data?.forEach(row => {
    if (row.date === today) todayCount = row.count;
    total += row.count;
  });

  const streak = calculateStreak(data || []);

  todayCountEl.textContent = `Poops today: ${todayCount} 💩`;
  streakEl.textContent = `🔥 Streak: ${streak} days`;

insightsEl.innerHTML = `
  <strong>Insights</strong>
  <table class="insights-table">
    <tr>
      <td>Average per day</td>
      <td>${(total / (data?.length || 1)).toFixed(1)}</td>
    </tr>
    <tr>
      <td>Current streak</td>
      <td>${streak} days</td>
    </tr>
  </table>
  `;

  drawCalendar(data || []);
  drawChart(data || []);
}

function drawCalendar(data) {
  calendarEl.innerHTML = "";
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const found = data.find(r => r.date === dateStr);
    calendarEl.innerHTML += `<div>${found ? "💩" : "·"}</div>`;
  }
}

let chart;
function drawChart(data) {
  const ctx = document.getElementById("weeklyChart");
  const last7 = data.slice(0, 7).reverse();

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: last7.map(r => r.date.slice(5)),
      datasets: [
        {
          data: last7.map(r => r.count),
          backgroundColor: "rgba(255,143,171,0.7)",
          borderRadius: 8
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

poopBtn.addEventListener("click", async () => {
  if (coolingDown) return;

  coolingDown = true;
  poopBtn.classList.add("cooldown");

  if (navigator.vibrate) navigator.vibrate(50);

  ring.style.transition = `stroke-dashoffset ${COOLDOWN_MS}ms linear`;
  ring.style.strokeDashoffset = "0";

  const today = formatDate(new Date());

  const { data } = await supabaseClient
    .from("poops")
    .select("count")
    .eq("date", today)
    .maybeSingle();

  lastCount = data?.count || 0;
  const newCount = lastCount + 1;

  await supabaseClient
    .from("poops")
    .upsert({ date: today, count: newCount }, { onConflict: "date" });

  celebration.textContent =
    affirmations[Math.floor(Math.random() * affirmations.length)];
  celebration.classList.remove("hidden");

  undoBtn.classList.remove("hidden");
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => undoBtn.classList.add("hidden"), 5000);

  loadData();

  setTimeout(() => {
    coolingDown = false;
    poopBtn.classList.remove("cooldown");
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "430";
  }, COOLDOWN_MS);
});

undoBtn.addEventListener("click", async () => {
  const today = formatDate(new Date());

  await supabaseClient
    .from("poops")
    .update({ count: lastCount })
    .eq("date", today);

  undoBtn.classList.add("hidden");
  loadData();
});

shareBtn.addEventListener("click", async () => {
  const text = todayCountEl.textContent + " 💛";
  if (navigator.share) {
    navigator.share({ text });
  } else {
    alert(text);
  }
});

loadData();

const SUPABASE_URL = "https://ufjelnennrylumajcytq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamVsbmVubnJ5bHVtYWpjeXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MjIsImV4cCI6MjA4MjMwNTgyMn0.aAjyWvBfH1HBKpXQYGiukMt6nHbZnqLZRlT0vIWmnfk";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const poopBtn = document.getElementById("poopBtn");
const todayCountEl = document.getElementById("todayCount");
const streakEl = document.getElementById("streak");
const celebration = document.getElementById("celebration");
const undoBtn = document.getElementById("undo");
const insightsEl = document.getElementById("insights");
const calendarEl = document.getElementById("calendar");
const shareBtn = document.getElementById("shareBtn");

let undoTimeout = null;
let lastCount = null;

const affirmations = [
  "Yay you go girl 💛",
  "Healthy queen 👑",
  "Fiber paid off 🥗",
  "Gut feeling good ✨",
  "Iconic behavior 💅"
];

async function loadData() {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabaseClient
    .from("poops")
    .select("*")
    .order("date", { ascending: false })
    .limit(31);

  let todayCount = 0;
  let streak = 0;
  let total = 0;

  data?.forEach((row, i) => {
    if (row.date === today) todayCount = row.count;
    if (i === streak && row.count > 0) streak++;
    total += row.count;
  });

  todayCountEl.textContent = `Poops today: ${todayCount} 💩`;
  streakEl.textContent = `🔥 Streak: ${streak} days`;

  insightsEl.innerHTML = `
    <strong>Insights</strong><br>
    Avg/day: ${(total / (data?.length || 1)).toFixed(1)}<br>
    Best streak: ${streak} days
  `;

  drawCalendar(data || []);
  drawChart(data || []);
}

function drawCalendar(data) {
  calendarEl.innerHTML = "";
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const found = data.find(r => r.date === dateStr);
    calendarEl.innerHTML += `<div>${found ? "💩" : "·"}</div>`;
  }
}

let chart;
function drawChart(data) {
  const ctx = document.getElementById("weeklyChart");
  const last7 = data.slice(0,7).reverse();

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: last7.map(r => r.date.slice(5)),
      datasets: [{
        data: last7.map(r => r.count),
        backgroundColor: "rgba(255,143,171,0.7)",
        borderRadius: 8
      }]
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
  if (navigator.vibrate) navigator.vibrate(50);

  const today = new Date().toISOString().split("T")[0];

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

  celebration.textContent = affirmations[Math.floor(Math.random() * affirmations.length)];
  celebration.classList.remove("hidden");

  undoBtn.classList.remove("hidden");
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => undoBtn.classList.add("hidden"), 5000);

  loadData();
});

undoBtn.addEventListener("click", async () => {
  const today = new Date().toISOString().split("T")[0];

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

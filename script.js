const SUPABASE_URL = "https://ufjelnennrylumajcytq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamVsbmVubnJ5bHVtYWpjeXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MjIsImV4cCI6MjA4MjMwNTgyMn0.aAjyWvBfH1HBKpXQYGiukMt6nHbZnqLZRlT0vIWmnfk";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const poopBtn = document.getElementById("poopBtn");
const counterEl = document.getElementById("counter");
const streakEl = document.getElementById("streak");
const celebration = document.getElementById("celebration");

const affirmations = [
  "Yay you go girl 💛",
  "Healthy queen behavior 👑",
  "Proud of you 😌",
  "Hydration paid off 💧",
  "Your gut says thanks ✨"
];

// 🎊 CONFETTI (minimal)
function fireConfetti() {
  const c = document.getElementById("confetti");
  const ctx = c.getContext("2d");
  c.width = window.innerWidth;
  c.height = window.innerHeight;

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 70%)`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * c.width,
      Math.random() * c.height / 2,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  setTimeout(() => ctx.clearRect(0, 0, c.width, c.height), 600);
}

// 🔁 Load today + streak
async function loadState() {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabaseClient
    .from("poops")
    .select("date, count")
    .order("date", { ascending: false })
    .limit(7);

  let todayCount = 0;
  let streak = 0;

  data?.forEach((row, i) => {
    if (row.date === today) todayCount = row.count;
    if (i === streak && row.count > 0) streak++;
  });

  counterEl.textContent = `Poops today: ${todayCount} 💩`;
  streakEl.textContent = `🔥 Streak: ${streak} days`;
}

poopBtn.addEventListener("click", async () => {
  if (navigator.vibrate) navigator.vibrate(50);

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabaseClient
    .from("poops")
    .select("count")
    .eq("date", today)
    .maybeSingle();

  const newCount = data ? data.count + 1 : 1;

  await supabaseClient
    .from("poops")
    .upsert({ date: today, count: newCount }, { onConflict: "date" });

  // 🎉 Celebration
  const msg = affirmations[Math.floor(Math.random() * affirmations.length)];
  celebration.textContent = msg;
  celebration.classList.remove("hidden");

  setTimeout(() => celebration.classList.add("hidden"), 1500);

  // 🎯 Milestones
  if ([3, 5, 7].includes(newCount)) {
    fireConfetti();
  }

  loadState();
});

// ⏱ Daily reset check
setInterval(loadState, 60 * 1000);

// 📱 PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

loadState();

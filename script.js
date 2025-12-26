const SUPABASE_URL = "https://ufjelnennrylumajcytq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamVsbmVubnJ5bHVtYWpjeXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MjIsImV4cCI6MjA4MjMwNTgyMn0.aAjyWvBfH1HBKpXQYGiukMt6nHbZnqLZRlT0vIWmnfk";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const poopBtn = document.getElementById("poopBtn");
const celebration = document.getElementById("celebration");

poopBtn.addEventListener("click", async () => {
  console.log("🔥 CLICK FIRED");

  // 📳 HAPTIC FEEDBACK (iPhone / PWA)
  if (navigator.vibrate) {
    navigator.vibrate(50); // subtle tap
  }

  const today = new Date().toISOString().split("T")[0];

  // 1️⃣ Get today’s current count
  const { data, error: fetchError } = await supabaseClient
    .from("poops")
    .select("count")
    .eq("date", today)
    .single();

  let newCount = 1;

  if (data) {
    newCount = data.count + 1;
  }

  // 2️⃣ Upsert with incremented count
  const { error: upsertError } = await supabaseClient
    .from("poops")
    .upsert(
      { date: today, count: newCount },
      { onConflict: "date" }
    );

  if (upsertError) {
    console.error("❌ Upsert failed:", upsertError);
    alert("DB error");
    return;
  }

  console.log("✅ Count updated:", newCount);

  // 3️⃣ Celebration
  celebration.classList.remove("hidden");
  setTimeout(() => celebration.classList.add("hidden"), 1500);
});

// 🔧 Service worker (PWA)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

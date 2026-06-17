import { motion } from "framer-motion";

export default function App() {
  return (
    <main className="min-h-full flex flex-col items-center justify-center gap-4 px-6 text-center pt-safe pb-safe">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="text-6xl"
        aria-hidden
      >
        ☀️
      </motion.div>
      <h1 className="text-3xl font-semibold text-sun-bright">Sunwise</h1>
      <p className="max-w-sm text-stone-400">
        Use your own solar — the best hours today to run power and make the most
        of your panels.
      </p>
      <span className="mt-2 rounded-full bg-dusk px-3 py-1 text-xs text-stone-500">
        Phase 0 · scaffold
      </span>
    </main>
  );
}

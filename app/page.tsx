import PromptBuilder from "@/components/PromptBuilder";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <div className="card p-4">
        <p className="text-sm text-neutral-300">
          Paste unorganized ideas and refine into a production-grade JSON prompt for Veo 3.1. Ensure character consistency, precise cinematography, and a clear shot plan.
        </p>
      </div>
      <PromptBuilder />
    </main>
  );
}

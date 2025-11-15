export default function AboutPage() {
  return (
    <main className="prose prose-invert max-w-3xl">
      <h2 className="text-xl font-semibold">About</h2>
      <p>
        This tool converts unstructured ideas into a production-grade structured JSON prompt tailored for Veo 3.1 video generation. It prioritizes high-budget cinematography, consistent characters, and precise shot planning.
      </p>
      <ul className="list-disc pl-6 text-neutral-300">
        <li>Heuristic idea parser to prefill key fields</li>
        <li>Explicit cinematography controls (lenses, movement, lighting)</li>
        <li>Character consistency via stable IDs and seeds</li>
        <li>Editable shot plan with durations and framing</li>
      </ul>
    </main>
  );
}

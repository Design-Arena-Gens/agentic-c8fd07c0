"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { ideaToDraft } from "@/lib/ideaParser";
import { defaultPrompt, PromptDraft, promptDraftSchema } from "@/lib/schema";
import { generateStructuredPrompt } from "@/lib/promptGenerator";
import { loadDraft, saveDraft } from "@/lib/storage";
import { z } from "zod";
import clsx from "clsx";

type Action = { type: "set"; path: string; value: any } | { type: "reset"; value?: PromptDraft };

function setAtPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const parts = path.split(".");
  const clone: any = { ...obj };
  let cur: any = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = Array.isArray(cur[p]) ? [...cur[p]] : { ...cur[p] };
    cur[p] = next;
    cur = next;
  }
  cur[parts[parts.length - 1]] = value;
  return clone;
}

function reducer(state: PromptDraft, action: Action): PromptDraft {
  switch (action.type) {
    case "set":
      return setAtPath(state, action.path, action.value);
    case "reset":
      return action.value ?? defaultPrompt();
    default:
      return state;
  }
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-3">
        <h3 className="section-title">{title}</h3>
        {description ? <p className="help-text mt-1">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function PromptBuilder() {
  const [state, dispatch] = useReducer(reducer, undefined, defaultPrompt);
  const [messyIdeas, setMessyIdeas] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const existing = loadDraft();
    if (existing) dispatch({ type: "reset", value: existing });
  }, []);

  // Persist
  useEffect(() => {
    saveDraft(state);
  }, [state]);

  function handleExtract() {
    const draft = ideaToDraft(messyIdeas, state);
    dispatch({ type: "reset", value: draft });
  }

  function handleGenerate() {
    setError(null);
    try {
      const validated = promptDraftSchema.parse(state);
      const out = generateStructuredPrompt(validated);
      setJsonOutput(JSON.stringify(out, null, 2));
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join("\n"));
      } else {
        setError((e as Error).message);
      }
    }
  }

  function copyJSON() {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
  }

  function downloadJSON() {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (state.title || "veo-structured-prompt") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Section title="Messy Ideas ? Guided Extraction" description="Paste any brain dump. We will prefill key fields (characters, tone, locations, shots).">
          <textarea className="textarea min-h-[120px]" placeholder="E.g., gritty neo-noir in rainy Tokyo at night, 30s, slow push-ins, 50mm and 85mm, deep shadows, protagonist Aya (pink bob cut, leather jacket), antagonist in chrome mask, neon reflections, opening wide establishing then close-ups, synthwave score, avoid extra hands..." value={messyIdeas} onChange={(e) => setMessyIdeas(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button className="button" onClick={handleExtract}>Extract structure</button>
            <button className="button secondary" onClick={() => setMessyIdeas("")}>Clear</button>
          </div>
        </Section>

        <Section title="Overview">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label>Title</label>
              <input className="input mt-1" value={state.title} onChange={(e) => dispatch({ type: "set", path: "title", value: e.target.value })} />
            </div>
            <div>
              <label>Duration (sec)</label>
              <input type="number" className="input mt-1" value={state.durationSeconds} onChange={(e) => dispatch({ type: "set", path: "durationSeconds", value: Number(e.target.value) })} />
            </div>
            <div>
              <label>Aspect Ratio</label>
              <input className="input mt-1" value={state.aspectRatio} onChange={(e) => dispatch({ type: "set", path: "aspectRatio", value: e.target.value })} />
            </div>
            <div>
              <label>FPS</label>
              <input type="number" className="input mt-1" value={state.fps} onChange={(e) => dispatch({ type: "set", path: "fps", value: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label>Summary</label>
              <textarea className="textarea mt-1" value={state.summary} onChange={(e) => dispatch({ type: "set", path: "summary", value: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="Characters" description="Maintain consistent identities with stable IDs and rich descriptors.">
          <div className="space-y-4">
            {state.characters.map((c, idx) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="badge">{c.id}</span>
                  <button className="button secondary" onClick={() => {
                    const copy = [...state.characters];
                    copy.splice(idx, 1);
                    dispatch({ type: "set", path: "characters", value: copy });
                  }}>Remove</button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label>Name</label>
                    <input className="input mt-1" value={c.name} onChange={(e) => {
                      const copy = [...state.characters];
                      copy[idx] = { ...c, name: e.target.value };
                      dispatch({ type: "set", path: "characters", value: copy });
                    }} />
                  </div>
                  <div>
                    <label>Wardrobe</label>
                    <input className="input mt-1" value={c.wardrobe}
                      onChange={(e) => { const copy = [...state.characters]; copy[idx] = { ...c, wardrobe: e.target.value }; dispatch({ type: "set", path: "characters", value: copy }); }} />
                  </div>
                  <div className="md:col-span-2">
                    <label>Description</label>
                    <textarea className="textarea mt-1" value={c.description}
                      onChange={(e) => { const copy = [...state.characters]; copy[idx] = { ...c, description: e.target.value }; dispatch({ type: "set", path: "characters", value: copy }); }} />
                  </div>
                </div>
              </div>
            ))}
            <button className="button" onClick={() => {
              const nextIndex = state.characters.length + 1;
              const id = `char_${nextIndex}`;
              dispatch({ type: "set", path: "characters", value: [...state.characters, { id, name: "", description: "", wardrobe: "" }] });
            }}>Add character</button>
          </div>
        </Section>

        <Section title="Locations">
          <div className="space-y-4">
            {state.locations.map((loc, idx) => (
              <div key={idx} className="card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label>Name</label>
                    <input className="input mt-1" value={loc.name} onChange={(e) => {
                      const copy = [...state.locations];
                      copy[idx] = { ...loc, name: e.target.value };
                      dispatch({ type: "set", path: "locations", value: copy });
                    }} />
                  </div>
                  <div>
                    <label>Time of day</label>
                    <input className="input mt-1" value={loc.timeOfDay} onChange={(e) => {
                      const copy = [...state.locations];
                      copy[idx] = { ...loc, timeOfDay: e.target.value };
                      dispatch({ type: "set", path: "locations", value: copy });
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label>Description</label>
                    <textarea className="textarea mt-1" value={loc.description} onChange={(e) => {
                      const copy = [...state.locations];
                      copy[idx] = { ...loc, description: e.target.value };
                      dispatch({ type: "set", path: "locations", value: copy });
                    }} />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="button secondary" onClick={() => {
                    const copy = [...state.locations]; copy.splice(idx, 1); dispatch({ type: "set", path: "locations", value: copy });
                  }}>Remove</button>
                </div>
              </div>
            ))}
            <button className="button" onClick={() => {
              dispatch({ type: "set", path: "locations", value: [...state.locations, { name: "", description: "", timeOfDay: "" }] });
            }}>Add location</button>
          </div>
        </Section>

        <Section title="Visual Style" description="Tone, genre, palette, and inspirations.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label>Tone</label>
              <input className="input mt-1" value={state.style.tone} onChange={(e) => dispatch({ type: "set", path: "style.tone", value: e.target.value })} />
            </div>
            <div>
              <label>Color Palette</label>
              <input className="input mt-1" value={state.style.colorPalette} onChange={(e) => dispatch({ type: "set", path: "style.colorPalette", value: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label>Inspirations (comma-separated)</label>
              <input className="input mt-1" value={state.style.inspirations.join(', ')} onChange={(e) => dispatch({ type: "set", path: "style.inspirations", value: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
            </div>
          </div>
        </Section>

        <Section title="Cinematography" description="Camera, lenses, movement, lighting, and color.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label>Camera Body</label>
              <input className="input mt-1" value={state.cinematography.cameraBody} onChange={(e) => dispatch({ type: "set", path: "cinematography.cameraBody", value: e.target.value })} />
            </div>
            <div>
              <label>Lens Set</label>
              <input className="input mt-1" value={state.cinematography.lenses} onChange={(e) => dispatch({ type: "set", path: "cinematography.lenses", value: e.target.value })} />
            </div>
            <div>
              <label>Movement</label>
              <input className="input mt-1" value={state.cinematography.movement} onChange={(e) => dispatch({ type: "set", path: "cinematography.movement", value: e.target.value })} />
            </div>
            <div>
              <label>Lighting Style</label>
              <input className="input mt-1" value={state.cinematography.lighting} onChange={(e) => dispatch({ type: "set", path: "cinematography.lighting", value: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label>Color/Grade Notes</label>
              <input className="input mt-1" value={state.cinematography.colorGrade} onChange={(e) => dispatch({ type: "set", path: "cinematography.colorGrade", value: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="Shot Plan" description="Define beats with durations and framing.">
          <div className="space-y-4">
            {state.shots.map((s, idx) => (
              <div key={s.id} className="card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                  <div>
                    <label>ID</label>
                    <input className="input mt-1" value={s.id} onChange={(e)=>{
                      const copy = [...state.shots]; copy[idx] = { ...s, id: e.target.value }; dispatch({ type: "set", path: "shots", value: copy });
                    }} />
                  </div>
                  <div>
                    <label>Duration (s)</label>
                    <input type="number" className="input mt-1" value={s.duration} onChange={(e)=>{
                      const copy = [...state.shots]; copy[idx] = { ...s, duration: Number(e.target.value) }; dispatch({ type: "set", path: "shots", value: copy });
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label>Type / Framing</label>
                    <input className="input mt-1" value={s.type} onChange={(e)=>{
                      const copy = [...state.shots]; copy[idx] = { ...s, type: e.target.value }; dispatch({ type: "set", path: "shots", value: copy });
                    }} />
                  </div>
                  <div className="md:col-span-2">
                    <label>Movement</label>
                    <input className="input mt-1" value={s.movement} onChange={(e)=>{
                      const copy = [...state.shots]; copy[idx] = { ...s, movement: e.target.value }; dispatch({ type: "set", path: "shots", value: copy });
                    }} />
                  </div>
                  <div className="md:col-span-3">
                    <label>Action</label>
                    <input className="input mt-1" value={s.action} onChange={(e)=>{
                      const copy = [...state.shots]; copy[idx] = { ...s, action: e.target.value }; dispatch({ type: "set", path: "shots", value: copy });
                    }} />
                  </div>
                  <div className="md:col-span-3">
                    <label>Notes</label>
                    <input className="input mt-1" value={s.notes} onChange={(e)=>{
                      const copy = [...state.shots]; copy[idx] = { ...s, notes: e.target.value }; dispatch({ type: "set", path: "shots", value: copy });
                    }} />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="button secondary" onClick={()=>{ const copy=[...state.shots]; copy.splice(idx,1); dispatch({type:"set", path:"shots", value: copy}); }}>Remove</button>
                </div>
              </div>
            ))}
            <button className="button" onClick={()=>{
              const nextIdx = state.shots.length + 1;
              dispatch({ type: "set", path: "shots", value: [...state.shots, { id: `S${nextIdx}`, duration: 3, type: "WS", movement: "static", action: "", notes: "" }] });
            }}>Add shot</button>
          </div>
        </Section>

        <Section title="Audio">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label>Music</label>
              <input className="input mt-1" value={state.audio.music} onChange={(e) => dispatch({ type: "set", path: "audio.music", value: e.target.value })} />
            </div>
            <div>
              <label>Sound Design</label>
              <input className="input mt-1" value={state.audio.soundDesign} onChange={(e) => dispatch({ type: "set", path: "audio.soundDesign", value: e.target.value })} />
            </div>
            <div>
              <label>Voiceover</label>
              <input className="input mt-1" value={state.audio.voiceover} onChange={(e) => dispatch({ type: "set", path: "audio.voiceover", value: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="Constraints">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label>Avoid (comma-separated)</label>
              <input className="input mt-1" value={state.constraints.avoid.join(', ')} onChange={(e)=>dispatch({ type: "set", path: "constraints.avoid", value: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
            </div>
            <div>
              <label>Negative Prompts (comma-separated)</label>
              <input className="input mt-1" value={state.negativePrompts.join(', ')} onChange={(e)=>dispatch({ type: "set", path: "negativePrompts", value: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
            </div>
          </div>
        </Section>

        <Section title="Consistency">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label>Seed</label>
              <input className="input mt-1" value={state.consistency.seed} onChange={(e)=>dispatch({ type: "set", path: "consistency.seed", value: e.target.value })} />
            </div>
            <div>
              <label>Character ID Map (JSON)</label>
              <input className="input mt-1" value={JSON.stringify(state.consistency.characterIdMap)} onChange={(e)=>{
                try { const obj = JSON.parse(e.target.value || '{}'); dispatch({ type: "set", path: "consistency.characterIdMap", value: obj }); } catch {}
              }} />
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Generate JSON">
          <div className="flex gap-2">
            <button className="button" onClick={handleGenerate}>Generate</button>
            <button className="button secondary" onClick={() => dispatch({ type: "reset" })}>Reset</button>
          </div>
          {error ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-red-950/40 p-3 text-red-300 border border-red-900 text-xs">{error}</pre>
          ) : null}
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="badge">Structured JSON</span>
              <div className="flex gap-2">
                <button className="button secondary" onClick={copyJSON}>Copy</button>
                <button className="button secondary" onClick={downloadJSON}>Download</button>
              </div>
            </div>
            <textarea className="textarea h-[420px] font-mono text-xs" readOnly value={jsonOutput} placeholder="Click Generate to produce JSON..." />
          </div>
        </Section>

        <Section title="High-Budget Cinematography Preset" description="Quickly apply filmic defaults (ARRI, Cooke, 24fps, 2.39:1).">
          <div className="grid grid-cols-1 gap-3">
            <button className="button" onClick={() => {
              dispatch({ type: "set", path: "fps", value: 24 });
              dispatch({ type: "set", path: "aspectRatio", value: "2.39:1" });
              dispatch({ type: "set", path: "cinematography.cameraBody", value: "ARRI Alexa LF" });
              dispatch({ type: "set", path: "cinematography.lenses", value: "Cooke S4/i, 32/50/85mm" });
              dispatch({ type: "set", path: "cinematography.movement", value: "Dolly and slow gimbal push-ins" });
              dispatch({ type: "set", path: "cinematography.lighting", value: "Soft key, motivated practicals, high contrast" });
              dispatch({ type: "set", path: "cinematography.colorGrade", value: "Filmic contrast, subtle teal/orange, Kodak 2393 vibe" });
            }}>Apply preset</button>
          </div>
        </Section>
      </div>
    </div>
  );
}

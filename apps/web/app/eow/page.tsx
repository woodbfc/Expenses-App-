"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type EowPack = {
  actions: { id: string; title: string }[];
  decisions: { id: string; title: string }[];
  risks: { id: string; title: string }[];
  projects: { id: string; name: string; rag: string }[];
};

export default function EowPage() {
  const [pack, setPack] = useState<EowPack | null>(null);

  useEffect(() => {
    apiGet<EowPack>("/dashboard/eow").then(setPack);
  }, []);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">End of Week Pack</h1>
          <p className="text-slate-400">Weekly summary (Mon–Sun)</p>
        </div>
        <div className="space-x-3">
          <a
            href="http://localhost:4000/dashboard/eow/export?format=markdown"
            className="text-sm text-indigo-300 underline"
          >
            Export Markdown
          </a>
          <a
            href="http://localhost:4000/dashboard/eow/export?format=pdf"
            className="text-sm text-indigo-300 underline"
          >
            Export PDF
          </a>
        </div>
      </header>

      <section className="bg-card rounded-lg p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Completed actions</h2>
          <ul className="list-disc list-inside">
            {pack?.actions.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Key decisions</h2>
          <ul className="list-disc list-inside">
            {pack?.decisions.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Project changes</h2>
          <ul className="list-disc list-inside">
            {pack?.projects.map((item) => (
              <li key={item.id}>{item.name} ({item.rag})</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">New risks</h2>
          <ul className="list-disc list-inside">
            {pack?.risks.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

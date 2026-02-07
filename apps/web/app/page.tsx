"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, sseUrl } from "../lib/api";

type KPI = {
  openActions: number;
  overdueActions: number;
  projectsAtRisk: number;
  actionsWaitingOn: number;
  actionsDueWeek: number;
};

type Brief = {
  topPriorities: { id: string; title: string; dueDate?: string }[];
  waitingOn: { id: string; title: string }[];
  topRisks: { id: string; title: string }[];
  next24h: { id: string; title: string }[];
};

type Project = {
  id: string;
  name: string;
  rag: string;
  value?: number;
  ownerId?: string;
  actions: { id: string }[];
  risks: { id: string }[];
  updatedAt: string;
};

type ExtractedItem = {
  id: string;
  type: string;
  rawSpan: string;
  confidence: number;
};

type SearchResults = {
  dumps: { id: string; rawText: string }[];
  actions: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  notes: { id: string; content: string }[];
  people: { id: string; name: string }[];
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inbox, setInbox] = useState<ExtractedItem[]>([]);
  const [dumpText, setDumpText] = useState("");
  const [status, setStatus] = useState("Ready");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const dumpRef = useRef<HTMLTextAreaElement | null>(null);

  const load = async () => {
    const [kpiData, briefData, projectData, inboxData] = await Promise.all([
      apiGet<KPI>("/dashboard/kpis"),
      apiGet<Brief>("/dashboard/brief"),
      apiGet<Project[]>("/dashboard/projects"),
      apiGet<ExtractedItem[]>("/dashboard/inbox")
    ]);
    setKpis(kpiData);
    setBrief(briefData);
    setProjects(projectData);
    setInbox(inboxData);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      const data = await apiGet<SearchResults>(`/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const source = new EventSource(sseUrl());
    source.onmessage = () => {
      load();
    };
    source.onerror = () => {
      setStatus("Realtime disconnected");
    };
    return () => source.close();
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        dumpRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const projectRows = useMemo(() => {
    return projects.map((project) => (
      <tr key={project.id} className="border-b border-slate-800">
        <td className="py-2 font-medium">{project.name}</td>
        <td className="py-2">{project.rag}</td>
        <td className="py-2">£{project.value?.toLocaleString() ?? "-"}</td>
        <td className="py-2">{project.actions.length}</td>
        <td className="py-2">{project.risks.length}</td>
        <td className="py-2 text-slate-400">{new Date(project.updatedAt).toLocaleDateString()}</td>
      </tr>
    ));
  }, [projects]);

  const handleSubmit = async () => {
    if (!dumpText.trim()) return;
    setStatus("Submitting dump...");
    await apiPost("/dumps", { rawText: dumpText, sourceType: "UI" });
    setDumpText("");
    setStatus("Dump sent, processing...");
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setDumpText(text);
  };

  const confirmItem = async (id: string) => {
    await apiPost("/extracted/confirm", { extractedItemId: id, action: "CONFIRM" });
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Ops Command Centre</h1>
          <p className="text-slate-400">Fast capture → structured command view</p>
        </div>
        <span className="text-xs text-slate-400">{status}</span>
      </header>

      <section className="bg-card rounded-lg p-4 space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search across dumps, actions, projects, notes, people"
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
        />
        {results && (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Actions</p>
              <ul className="list-disc list-inside">
                {results.actions.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-slate-400">Projects</p>
              <ul className="list-disc list-inside">
                {results.projects.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-slate-400">Notes</p>
              <ul className="list-disc list-inside">
                {results.notes.map((item) => (
                  <li key={item.id}>{item.content.slice(0, 80)}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-slate-400">People</p>
              <ul className="list-disc list-inside">
                {results.people.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="bg-card rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">+ Dump (⌘/Ctrl + D)</h2>
          <input type="file" accept=".txt,.md" onChange={handleFile} />
        </div>
        <textarea
          value={dumpText}
          onChange={(event) => setDumpText(event.target.value)}
          placeholder="Paste messy notes, transcript snippets, Slack dumps..."
          ref={dumpRef}
          className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3"
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-indigo-500 text-white rounded-md"
        >
          Send dump
        </button>
      </section>

      <section className="grid md:grid-cols-5 gap-4">
        {[
          { label: "Open actions", value: kpis?.openActions ?? 0 },
          { label: "Overdue", value: kpis?.overdueActions ?? 0 },
          { label: "Projects at risk", value: kpis?.projectsAtRisk ?? 0 },
          { label: "Waiting on", value: kpis?.actionsWaitingOn ?? 0 },
          { label: "Due this week", value: kpis?.actionsDueWeek ?? 0 }
        ].map((tile) => (
          <div key={tile.label} className="bg-card rounded-lg p-4">
            <p className="text-sm text-slate-400">{tile.label}</p>
            <p className="text-2xl font-semibold">{tile.value}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold">Command Brief (Today)</h2>
          <div>
            <h3 className="text-sm uppercase text-slate-400">Top priorities</h3>
            <ul className="list-disc list-inside">
              {brief?.topPriorities.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm uppercase text-slate-400">Waiting on</h3>
            <ul className="list-disc list-inside">
              {brief?.waitingOn.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm uppercase text-slate-400">Top risks</h3>
            <ul className="list-disc list-inside">
              {brief?.topRisks.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm uppercase text-slate-400">Next 24h</h3>
            <ul className="list-disc list-inside">
              {brief?.next24h.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Inbox (triage)</h2>
            <span className="text-xs text-slate-400">{inbox.length} items</span>
          </div>
          <ul className="space-y-2">
            {inbox.map((item) => (
              <li key={item.id} className="bg-slate-900 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-300">{item.type}</p>
                    <p>{item.rawSpan}</p>
                  </div>
                  <button
                    onClick={() => confirmItem(item.id)}
                    className="text-xs px-2 py-1 bg-emerald-500 rounded"
                  >
                    Confirm
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Project status grid</h2>
          <a
            href="/eow"
            className="text-sm text-indigo-300 underline"
          >
            View EOW pack
          </a>
        </div>
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-left">
            <tr>
              <th className="py-2">Project</th>
              <th>RAG</th>
              <th>Value</th>
              <th>Actions</th>
              <th>Risks</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>{projectRows}</tbody>
        </table>
      </section>
    </div>
  );
}

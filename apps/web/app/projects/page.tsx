"use client";

import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../../lib/api";

type Project = {
  id: string;
  name: string;
  rag: string;
  value?: number;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const load = () => {
    apiGet<Project[]>("/projects").then(setProjects);
  };

  useEffect(() => {
    load();
  }, []);

  const createProject = async () => {
    if (!name.trim()) return;
    await apiPost("/projects", { name, value: value ? Number(value) : undefined });
    setName("");
    setValue("");
    load();
  };

  const remove = async (id: string) => {
    await apiDelete(`/projects/${id}`);
    load();
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-slate-400">RAG status, value, and milestones</p>
      </header>

      <section className="bg-card rounded-lg p-4 space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Value (£)"
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
        />
        <button onClick={createProject} className="px-3 py-2 bg-indigo-500 rounded">
          Add project
        </button>
      </section>

      <section className="space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="bg-card rounded-lg p-3 flex justify-between">
            <div>
              <p className="font-medium">{project.name}</p>
              <p className="text-xs text-slate-400">{project.rag} • £{project.value ?? 0}</p>
            </div>
            <button onClick={() => remove(project.id)} className="text-xs text-red-300">
              Remove
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

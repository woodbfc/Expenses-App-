"use client";

import { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../../lib/api";

type Action = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string;
};

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [title, setTitle] = useState("");

  const load = () => {
    apiGet<Action[]>("/actions").then(setActions);
  };

  useEffect(() => {
    load();
  }, []);

  const createAction = async () => {
    if (!title.trim()) return;
    await apiPost("/actions", { title, priority: "MEDIUM" });
    setTitle("");
    load();
  };

  const remove = async (id: string) => {
    await apiDelete(`/actions/${id}`);
    load();
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Actions</h1>
        <p className="text-slate-400">Keyboard-first action capture</p>
      </header>

      <section className="bg-card rounded-lg p-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New action title"
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
        />
        <button onClick={createAction} className="px-3 py-2 bg-indigo-500 rounded">
          Add action
        </button>
      </section>

      <section className="space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="bg-card rounded-lg p-3 flex justify-between">
            <div>
              <p className="font-medium">{action.title}</p>
              <p className="text-xs text-slate-400">{action.priority}</p>
            </div>
            <button onClick={() => remove(action.id)} className="text-xs text-red-300">
              Remove
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

"use client";

import { type FormEvent, useId, useState } from "react";

export function PlayerNameField({
  name,
  onChange,
}: {
  name: string;
  onChange: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputId = useId();
  const shown = name.trim() || "Explorer";

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange(String(data.get("name") ?? "").trim());
    setEditing(false);
  }

  if (!editing) {
    return (
      <p className="text-sm text-muted">
        On today’s board as <span className="font-medium text-ink">{shown}</span>
        <span aria-hidden="true"> · </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sea underline-offset-4 hover:underline"
        >
          Change name
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="text-sm text-muted">
          Name on today’s board
        </label>
        <input
          id={inputId}
          name="name"
          defaultValue={name}
          maxLength={18}
          autoFocus
          autoComplete="nickname"
          placeholder="Explorer"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setEditing(false);
            }
          }}
          className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink sm:text-sm"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 rounded-full border border-line px-4 text-sm font-medium hover:bg-paper"
      >
        Save
      </button>
    </form>
  );
}

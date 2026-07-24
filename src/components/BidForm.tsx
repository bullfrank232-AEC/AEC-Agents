"use client";

import { useTransition } from "react";

type Department = { id: string; name: string };
type UserOption = { id: string; name: string };

type BidDefaults = {
  bidNumber?: string;
  projectName?: string;
  client?: string;
  departmentId?: string;
  ownerId?: string | null;
  estimatedValue?: number | null;
  dueDate?: string | null;
  submittedDate?: string | null;
  awardDate?: string | null;
  description?: string | null;
};

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function BidForm({
  action,
  departments,
  users,
  defaults,
  mode,
}: {
  action: (formData: FormData) => void | Promise<void>;
  departments: Department[];
  users: UserOption[];
  defaults?: BidDefaults;
  mode: "create" | "edit";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => action(formData))}
      className="flex max-w-2xl flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bid number">
          <input
            name="bidNumber"
            required
            defaultValue={defaults?.bidNumber}
            className="input"
            placeholder="BID-2026-003"
          />
        </Field>
        <Field label="Department">
          <select
            name="departmentId"
            required
            defaultValue={defaults?.departmentId ?? ""}
            className="input"
          >
            <option value="" disabled>
              Select department
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Project name">
        <input
          name="projectName"
          required
          defaultValue={defaults?.projectName}
          className="input"
        />
      </Field>

      <Field label="Client">
        <input name="client" required defaultValue={defaults?.client} className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Estimated value (USD)">
          <input
            name="estimatedValue"
            type="number"
            step="1000"
            defaultValue={defaults?.estimatedValue ?? undefined}
            className="input"
          />
        </Field>
        <Field label="Owner">
          <select name="ownerId" defaultValue={defaults?.ownerId ?? ""} className="input">
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Due date">
          <input
            name="dueDate"
            type="date"
            defaultValue={toDateInputValue(defaults?.dueDate)}
            className="input"
          />
        </Field>
        {mode === "edit" && (
          <>
            <Field label="Submitted date">
              <input
                name="submittedDate"
                type="date"
                defaultValue={toDateInputValue(defaults?.submittedDate)}
                className="input"
              />
            </Field>
            <Field label="Award date">
              <input
                name="awardDate"
                type="date"
                defaultValue={toDateInputValue(defaults?.awardDate)}
                className="input"
              />
            </Field>
          </>
        )}
      </div>

      <Field label="Description / scope notes">
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults?.description ?? undefined}
          className="input"
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : mode === "create" ? "Create bid" : "Save changes"}
      </button>

      <style jsx global>{`
        .input {
          border: 1px solid rgb(212 212 216);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          width: 100%;
        }
        .input:focus {
          outline: 2px solid rgb(24 24 27);
          outline-offset: -1px;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

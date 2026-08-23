"use client";

import type { Expense } from "@/types";

export type PendingExpenseData = Omit<Expense, "id" | "user_id" | "created_at" | "updated_at">;

export interface PendingExpense {
  /** Matches the id of the optimistic local row ("temp-…"). */
  key: string;
  data: PendingExpenseData;
  createdAt: string;
}

const DB_NAME = "expense-diary-offline";
const STORE_NAME = "pending-expenses";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const req = run(store);
      tx.oncomplete = () => {
        db.close();
        resolve(req && "result" in req ? (req.result as T) : null);
      };
      tx.onerror = () => {
        db.close();
        resolve(null);
      };
      tx.onabort = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function enqueuePendingExpense(item: PendingExpense): Promise<void> {
  await withStore("readwrite", (store) => {
    store.put(item);
  });
}

export async function listPendingExpenses(): Promise<PendingExpense[]> {
  const res = await withStore<PendingExpense[]>("readonly", (store) =>
    store.getAll() as IDBRequest<PendingExpense[]>
  );
  return res ?? [];
}

export async function removePendingExpense(key: string): Promise<void> {
  await withStore("readwrite", (store) => {
    store.delete(key);
  });
}

/** Heuristic for "the request never reached the server" — safe to retry later. */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /network|failed to fetch|fetch failed|load failed|offline|timed?\s?out/i.test(msg);
}

export function toPendingData(expense: Expense): PendingExpenseData {
  return {
    name: expense.name,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    payment_method: expense.payment_method,
    note: expense.note,
    receipt_url: expense.receipt_url,
    expense_type: expense.expense_type,
    recurring_payment_id: expense.recurring_payment_id,
  };
}

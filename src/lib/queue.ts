// Последовательное выполнение сохранений: быстрые повторные тапы не обгоняют друг друга
let chain: Promise<unknown> = Promise.resolve();

export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

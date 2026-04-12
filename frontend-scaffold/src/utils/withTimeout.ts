/**
 * Reject if `promise` does not settle within `ms` (Soroban RPC / wallet calls can hang).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = "Request"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.round(ms / 1000)}s. Check your network and RPC (VITE_SOROBAN_RPC_URL).`,
        ),
      );
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

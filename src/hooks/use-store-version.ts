import { useSyncExternalStore } from "react";
import { getVersion, subscribe } from "@/mocks/store";

/**
 * Bumps whenever a trade or launch changes the demo data. Add it to a fetch's
 * key to refetch after the user acts.
 */
export function useStoreVersion() {
  return useSyncExternalStore(subscribe, getVersion);
}

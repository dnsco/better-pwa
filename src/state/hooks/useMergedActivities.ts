import {
  noWait,
  selector,
  useRecoilTransaction_UNSTABLE as useRecoilTransaction,
  useRecoilValue,
} from "recoil";
import { useEffect } from "react";
import {
  Activity,
  storedActivities,
  storedIds,
  SyncStatus,
} from "../myActivities";
import { apiMyActivities } from "../api";
import { UUID } from "../../api/base";

export const useMergedActivities = (): Activity[] => {
  useMergeApiActivities();
  return useRecoilValue(allActivities);
};

/**
 * Sync remote activities with the local store.
 * must be in a react effect because:
 * - recoil atom effects cannot subscribe to selectors (allMyIds)
 * - we need to set the individual atoms to persist them
 */
const useMergeApiActivities = () => {
  const ids = useRecoilValue(allMyIds);
  const apiLoadable = useRecoilValue(noWait(apiMyActivities));

  const transaction = useRecoilTransaction(
    ({ set, get }) =>
      () => {
        if (apiLoadable.state !== "hasValue") return;
        apiLoadable.valueOrThrow().forEach((api) => {
          const storedAtom = storedActivities(api.uuid);
          const local = get(storedAtom);
          const merged: Activity = {
            ...local,
            ...api,
            status: SyncStatus.SYNCED,
          } as Activity;

          if (JSON.stringify(merged) !== JSON.stringify(local)) {
            set(storedAtom, merged);
          }
        });
      },
    [ids, apiLoadable]
  );

  useEffect(transaction);
};

const allActivities = selector<Activity[]>({
  key: "allActivities",
  get: ({ get }) => get(allMyIds).map((uuid) => get(storedActivities(uuid))),
});

const allMyIds = selector<UUID[]>({
  key: "allMyIds",
  get: ({ get }) => {
    const apiIds: UUID[] = (
      get(noWait(apiMyActivities)).valueMaybe() ?? []
    ).map((a) => a.uuid);
    return Array.from(new Set([...apiIds, ...get(storedIds)])).sort();
  },
});

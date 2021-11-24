import {
  atom,
  AtomEffect,
  atomFamily,
  DefaultValue,
  noWait,
  selector,
  useRecoilState,
  useRecoilTransaction_UNSTABLE as useRecoilTransaction,
  useRecoilValue,
} from "recoil";
import { useEffect, useMemo } from "react";
import { recoilPersist } from "recoil-persist";
import {
  Activity,
  ActivityFactory,
  createActivityFactory,
  SyncStatus,
} from "./activity";
import { apiMyActivities } from "./api";
import { Frequency, UUID } from "../api/responseTypes";
import { SUCCESS } from "../api/base";
import { apiState } from "./oauthState";

const { persistAtom } = recoilPersist({ key: "recoil-my-activities" });

export type UseMyActivitiesResult = [Activity[], ActivityFactory];
export const useMyActivities = (): UseMyActivitiesResult => {
  useMergeApiActivities();
  return useActivitiesAndFactory();
};

const useActivitiesAndFactory = (): UseMyActivitiesResult => {
  const [activities, setActivities] = useRecoilState(allActivities);

  return useMemo(
    () => [activities, createActivityFactory(setActivities)],
    [activities, setActivities]
  );
};

/**
 * Sync remote activities with the local store.
 * must be in a react effect, because recoil atom effects cannot subscribe to selectors (allMyIds)
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

const allMyIds = selector<UUID[]>({
  key: "allMyIds",
  get: ({ get }) => {
    const apiIds: UUID[] = (
      get(noWait(apiMyActivities)).valueMaybe() ?? []
    ).map((a) => a.uuid);
    return Array.from(new Set([...apiIds, ...get(storedIds)])).sort();
  },
});
/** Private atom to track ids
 *  used and managed by allActivities to return an array of all items
 *  items are inserted by set (create) allActivities
 *
 */
const storedIds = atom<UUID[]>({
  key: "localActivityIds",
  default: [],
  effects_UNSTABLE: [persistAtom],
});

const DEFAULT_ACTIVITY: Activity = {
  frequency: Frequency.DAILY,
  name: "New Default",
  status: SyncStatus.SYNCED,
  uuid: "",
};

/** Private atom family that actually stores the activity data
 * keys are held in storedIds
 * collection is managed by allActivities
 */
const storedActivities = atomFamily<Activity, UUID>({
  key: "myActivities",
  default: DEFAULT_ACTIVITY,
  effects_UNSTABLE: (uuid): AtomEffect<Activity>[] => {
    return [persistAtom, createNew(uuid)];
  },
});

const createNew: (uuid: UUID) => AtomEffect<Activity> =
  (_: UUID) =>
  ({ setSelf, getLoadable, onSet }) => {
    onSet((newValue) => {
      // if oldValue === null && newValue.state === NEW
      const api = getLoadable(apiState).valueOrThrow();

      if (newValue.status === SyncStatus.NEW) {
        api.createActivity(newValue).then((resp) => {
          if (resp.kind === SUCCESS) {
            setSelf({ ...newValue, ...resp.data, status: SyncStatus.SYNCED });
          } else {
            // todo: better error handling on response, but that's for later.
            // eslint-disable-next-line no-console
            console.error(resp.error);
          }
        });
      }
    });
  };

/** Private selector to expose all activities
 *  set function is actually a create function
 *  create take an array of *only* one element– the element to be created.
 */

const allActivities = selector<Activity[]>({
  key: "allActivities",
  get: ({ get }) => get(allMyIds).map((uuid) => get(storedActivities(uuid))),
  set: ({ get, set }, newActivityWrapped) => {
    if (newActivityWrapped instanceof DefaultValue) return;
    if (newActivityWrapped.length !== 1) return;
    const [newActivity] = newActivityWrapped as [Activity];
    const ids = get(allMyIds);
    set(storedIds, Array.from(new Set([...ids, newActivity.uuid])).sort());
    set(storedActivities(newActivity.uuid), newActivity);
  },
});

import {
  atom,
  AtomEffect,
  atomFamily,
  DefaultValue,
  noWait,
  selector,
  selectorFamily,
  useRecoilState,
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
import { apiMyActivities, apiMyActivitity, apiState } from "./api";
import { UUID } from "../api/responseTypes";
import { SUCCESS } from "../api/base";

const { persistAtom } = recoilPersist();

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

const useMergeApiActivities = () => {
  const [localActivities, setActivity] = useRecoilState(allActivities);
  const [currentIds, setIds] = useRecoilState(storedIds);

  const mergedActivities = useRecoilValue(allMerged);
  const allIds = useRecoilValue(allMyIds);

  useEffect(() => {
    // Adds remote items to the ids
    // must be in a react effect, because recoil atom effects cannot subscribe to selectors (allMyIds)
    if (JSON.stringify(allIds) !== JSON.stringify(currentIds)) {
      setIds(allIds);
    }

    mergedActivities.forEach((merged) => {
      const local = localActivities.find((a) => a.uuid === merged.uuid);

      if (JSON.stringify(merged) !== JSON.stringify(local)) {
        setActivity([merged]);
      }
    });
  }, [
    allIds,
    currentIds,
    setIds,
    localActivities,
    mergedActivities,
    setActivity,
  ]);
};

const mergedLocalAndSynced = selectorFamily<Activity | null, UUID>({
  key: "mergedActivities",
  get: (uuid) => {
    return ({ get }) => {
      const local = get(storedActivities(uuid));
      let api: Activity | null = null;
      const loadable = get(noWait(apiMyActivitity(uuid)));
      if (loadable.state === "hasValue") api = loadable.valueMaybe();

      if (local && api) {
        return { ...local, ...api } as Activity;
      }

      return local || api;
    };
  },
});

const allMerged = selector<Activity[]>({
  key: "allmergedActivities",
  get: ({ get }) =>
    get(allMyIds)
      .map((uuid) => get(mergedLocalAndSynced(uuid)))
      .filter(Boolean) as Activity[],
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

/** Private atom family that actually stores the activity data
 * keys are held in storedIds
 * collection is managed by allActivities
 */

const storedActivities = atomFamily<Activity | null, UUID>({
  key: "myActivities",
  default: null,
  effects_UNSTABLE: (uuid): AtomEffect<Activity | null>[] => {
    return [persistAtom, createNew(uuid)];
  },
});

const createNew: (uuid: UUID) => AtomEffect<Activity | null> =
  (_: UUID) =>
  ({ setSelf, getLoadable, onSet }) => {
    onSet((newValue) => {
      // if oldValue === null && newValue.state === NEW
      const api = getLoadable(apiState).valueOrThrow();
      if (newValue) {
        api.createActivity(newValue).then((resp) => {
          if (resp.kind === SUCCESS) {
            setSelf({ ...newValue, ...resp.data, status: SyncStatus.SYNCED });
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
  get: ({ get }) =>
    get(allMyIds)
      .map((uuid) => get(storedActivities(uuid)))
      .filter(Boolean) as Activity[],
  set: ({ get, set }, newActivityWrapped) => {
    if (newActivityWrapped instanceof DefaultValue) return;
    if (newActivityWrapped.length !== 1) return;
    const [newActivity] = newActivityWrapped as [Activity];
    const ids = get(allMyIds);
    set(storedIds, Array.from(new Set([...ids, newActivity.uuid])).sort());
    set(storedActivities(newActivity.uuid), newActivity);
  },
});

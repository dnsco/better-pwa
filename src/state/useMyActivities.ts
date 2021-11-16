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
import { apiMyActivities, apiState } from "./api";
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
  useMergeLocalAndSyncedIds();
  const ids = useRecoilValue(allMyIds);
  const loadable = useRecoilValue(noWait(apiMyActivities));

  const transaction = useRecoilTransaction(
    ({ set, get }) =>
      () => {
        if (loadable.state === "hasValue") {
          const apiActs = loadable.valueOrThrow();
          const mergedActivities = ids
            .map((uuid): Activity | null | undefined => {
              const local = get(storedActivities(uuid));
              const api = apiActs.find((a) => a.uuid === uuid);

              if (local && api) {
                return {
                  ...local,
                  ...api,
                  status: SyncStatus.SYNCED,
                } as Activity;
              }

              return (
                local || (api ? { ...api, status: SyncStatus.SYNCED } : null)
              );
            })
            .filter(Boolean) as Activity[];

          mergedActivities.forEach((merged) => {
            const storedAtom = storedActivities(merged.uuid);

            if (JSON.stringify(merged) !== JSON.stringify(get(storedAtom))) {
              set(storedAtom, merged);
            }
          });
        }
      },
    [ids, loadable]
  );

  useEffect(transaction);
};

/** Adds remote item ids to the locally-stored ids
 *
 * must be in a react effect, because recoil atom effects cannot subscribe to selectors (allMyIds)
 */
const useMergeLocalAndSyncedIds = () => {
  const [currentIds, setIds] = useRecoilState(storedIds);
  const allIds = useRecoilValue(allMyIds);
  useEffect(() => {
    if (JSON.stringify(allIds) !== JSON.stringify(currentIds)) {
      setIds(allIds);
    }
  }, [allIds, currentIds, setIds]);
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

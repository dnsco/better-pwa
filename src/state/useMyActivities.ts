import {
  atom,
  AtomEffect,
  atomFamily,
  DefaultValue,
  selector,
  useRecoilState,
  useRecoilValueLoadable,
} from "recoil";
import { useEffect, useMemo } from "react";
import { recoilPersist } from "recoil-persist";
import {
  Activity,
  ActivityFactory,
  createActivityFactory,
  SyncStatus,
} from "./activity";
import { apiMyActivities, apiMyActivitity } from "./api";
import { UUID } from "../api/responseTypes";

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
  const apiActivities = useRecoilValueLoadable(apiMyActivities).valueMaybe();
  const [currentIds, setIds] = useRecoilState(myActivityIds);

  useEffect(() => {
    const apiIds = (apiActivities || []).map((a) => a.uuid);
    const allIds = Array.from(new Set([...apiIds, ...currentIds])).sort();

    if (JSON.stringify(allIds) !== JSON.stringify(currentIds)) {
      setIds(allIds);
    }
  }, [apiActivities, currentIds, setIds]);
};

/** Private atom to track ids
 *  used and managed by allActivities to return an array of all items
 *  items are inserted by set (create) allActivities
 *
 */
const myActivityIds = atom<string[]>({
  key: "localActivityIds",
  default: [],
  effects_UNSTABLE: [persistAtom],
});

/** Private atom family that actually stores the activity data
 * keys are held in myActivityIds
 * collection is managed by allActivities
 */

const myActivities = atomFamily<Activity | null, UUID>({
  key: "myActivities",
  default: null,
  effects_UNSTABLE: (uuid): AtomEffect<Activity | null>[] => {
    return [mergeRemote(uuid), persistAtom];
  },
});

const mergeRemote: (uuid: UUID) => AtomEffect<Activity | null> =
  (uuid: UUID) =>
  ({ trigger, setSelf, getLoadable }) => {
    if (trigger === "get") {
      // const currentValue = getLoadable(node)
      const loadable = getLoadable(apiMyActivitity(uuid));
      const remote = loadable.valueMaybe();
      if (!remote) return;
      // todo be better with merging here.
      const synced = { ...remote, status: SyncStatus.SYNCED };
      setSelf(synced);
    }
  };

/** Private selector to expose all activities
 *  set function is actually a create function
 *  create take an array of *only* one element– the element to be created.
 */

const allActivities = selector<Activity[]>({
  key: "allActivities",
  get: ({ get }) =>
    get(myActivityIds)
      .map((uuid) => get(myActivities(uuid)))
      .filter(Boolean) as Activity[],
  set: ({ set, get }, newActivityWrapped) => {
    if (newActivityWrapped instanceof DefaultValue) return;
    if (newActivityWrapped.length !== 1) return;
    const [newActivity] = newActivityWrapped as [Activity];
    const ids = get(myActivityIds);
    set(myActivityIds, [...ids, newActivity.uuid]);
    set(myActivities(newActivity.uuid), newActivity);
  },
});

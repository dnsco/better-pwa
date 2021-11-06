import { atom, AtomEffect, atomFamily, DefaultValue, selector } from "recoil";
import { recoilPersist } from "recoil-persist";
import { Api, SUCCESS } from "../api/base";
import { nullApi } from "../api/nullApi";
import { ApiActivity, Frequency } from "../api/responseTypes";

const { persistAtom } = recoilPersist();

export interface Activity extends ApiActivity {
  status: SyncStatus;
}

export enum SyncStatus {
  NEW = "new",
  SYNCED = "synced",
}

export const apiState = atom<Api>({
  key: "api",
  default: nullApi,
});

export const createActivity: AtomEffect<Activity[]> = ({
  onSet,
  setSelf,
  getLoadable,
}) => {
  onSet((newValue) => {
    // eslint-disable-next-line no-console
    console.log("DOING IT");
    const newActivities = newValue.filter((a) => a.status === SyncStatus.NEW);
    const api = getLoadable(apiState).valueOrThrow();
    newActivities.forEach((a) => {
      api.createActivity(a).then(() => {
        // todo sync from response
        const activity: Activity = { ...a, status: SyncStatus.SYNCED };
        setSelf([activity]);
      });
    });
  });
};

const mergeApiIds: AtomEffect<string[]> = ({
  setSelf,
  getPromise,
  getLoadable,
  node,
}) => {
  getPromise(apiMyActivies)
    .then((activities) => activities.map((a) => a.uuid))
    .then((apiIds) => {
      const currentIds = getLoadable(node).valueOrThrow();
      const allIds = Array.from(new Set([...apiIds, ...currentIds])).sort();

      // todo only set if unequal
      setSelf(allIds);
    });
};

export const myActivityIds = atom<string[]>({
  key: "localActivityIds",
  default: [],
  effects_UNSTABLE: [mergeApiIds, persistAtom],
});

const mergeLocalAndRemote: AtomEffect<Activity> = (params) => {
  const { onSet, setSelf, trigger, getLoadable, node } = params;
  // console.log(getInfo_UNSTABLE(node));
  if (trigger === "get") {
    const value = getLoadable(node).getValue();
    if (value.status !== SyncStatus.SYNCED) {
      const remote = getLoadable(apiMyActivies)
        .valueOrThrow()
        .find((a) => a.uuid === value.uuid);

      if (remote) {
        setSelf({ ...remote, status: SyncStatus.SYNCED });
      }
    }
  }
  onSet((newValue, oldValue) => {
    // eslint-disable-next-line no-console
    console.log("ON SET", newValue, oldValue);
    setSelf({ ...newValue });
  });
};

const myActivities = atomFamily<Activity, string>({
  key: "myActivities",
  default: (uuid) => {
    const defaultActivity: Activity = {
      frequency: Frequency.DAILY,
      name: "New Activity",
      status: SyncStatus.NEW,
      uuid,
    };
    return defaultActivity;
  },
  effects_UNSTABLE: [mergeLocalAndRemote, persistAtom],
});

// const _wat = {
//   async({ get }) {
//     const localActs = get(localMyActivities);
//     const apiActs = get(apiMyActivies);
//
//     return localActs.concat(
//       apiActs.map((a) => ({ ...a, status: SyncStatus.SYNCED }))
//     );
//   },
// };

export const allActivities = selector<Activity[]>({
  key: "allActivities",
  get: ({ get }) => get(myActivityIds).map((uuid) => get(myActivities(uuid))),
  set: ({ set, get }, newActivityWrapped) => {
    if (newActivityWrapped instanceof DefaultValue) return;
    if (newActivityWrapped.length !== 1) return;
    const [newActivity] = newActivityWrapped as [Activity];
    const ids = get(myActivityIds);
    set(myActivityIds, [...ids, newActivity.uuid]);
    set(myActivities(newActivity.uuid), newActivity);
  },
});

const fiveMinutes = 300000;

export const shouldFetchOwnActivitiesAt = atom<Date>({
  key: "shouldFetchOwnActivitiesAt",
  default: new Date(),
  effects_UNSTABLE: [
    ({ setSelf }) => {
      const interval = setInterval(() => {
        setSelf(new Date());
      }, fiveMinutes);

      return () => clearInterval(interval);
    },
  ],
});

export const apiMyActivies = selector<ApiActivity[]>({
  key: "apiMyActivities",
  get: async ({ get }) => {
    const api = get(apiState);
    get(shouldFetchOwnActivitiesAt);

    const resp = await api.myActivities();
    return resp.kind === SUCCESS ? resp.data : [];
  },
});

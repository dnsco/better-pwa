import { atom, selector } from "recoil";
import { recoilPersist } from "recoil-persist";
import { Api, nullApi, SUCCESS } from "./api";

const { persistAtom } = recoilPersist();

export type Activity = { name: string };

export const apiState = atom<Api>({
  key: "api",
  default: nullApi,
});

export const localMyActivities = atom<Activity[]>({
  key: "localActivities",
  default: [],
  effects_UNSTABLE: [persistAtom],
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

export const apiMyActivies = selector<Activity[]>({
  key: "apiMyActivities",
  get: async ({ get }) => {
    const api = get(apiState);
    get(shouldFetchOwnActivitiesAt);

    const resp = await api.myActivities();
    return resp.kind === SUCCESS ? resp.data : [];
  },
});

export const mergedActivities = selector<Activity[]>({
  key: "mergedMyActivities",
  get: async ({ get }) => {
    const localActs = get(localMyActivities);
    const apiActs = get(apiMyActivies);

    return localActs.concat(apiActs);
  },
});

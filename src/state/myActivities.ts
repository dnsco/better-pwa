import { atom, selector } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export type Activity = { name: string };

export interface Api {
  myActivities(): Promise<Activity[]>;
}

const nullApi: Api = {
  myActivities(): Promise<Activity[]> {
    return Promise.resolve([]);
  },
};

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
  get: ({ get }) => {
    const api = get(apiState);
    get(shouldFetchOwnActivitiesAt);
    return api.myActivities();
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

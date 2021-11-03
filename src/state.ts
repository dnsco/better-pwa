import { atom, selector } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export type Activity = { name: string };

const api = {
  myActivities(): Promise<Activity[]> {
    return Promise.resolve([{ name: "Mudkips" }]);
  },
};

export const activityState = atom<Activity[]>({
  key: "activities",
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

export const myActivityState = selector<Activity[]>({
  key: "myActivities",
  get: ({ get }) => {
    get(shouldFetchOwnActivitiesAt);
    return api.myActivities();
  },
});

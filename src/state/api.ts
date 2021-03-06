import { atom, selector } from "recoil";
import { ApiActivity, SUCCESS } from "../api/base";
import { apiState } from "./oauthState";

const FIVE_MINUTES = 300000;

export const apiMyActivities = selector<ApiActivity[]>({
  key: "apiMyActivities",
  get: async ({ get }) => {
    const api = get(apiState);
    get(shouldFetchOwnActivitiesAt);

    const resp = await api.myActivities();
    return resp.kind === SUCCESS ? resp.data : [];
  },
});

export const shouldFetchOwnActivitiesAt = atom<Date>({
  key: "shouldFetchOwnActivitiesAt",
  default: new Date(),
  effects_UNSTABLE: [
    ({ setSelf }) => {
      const interval = setInterval(() => {
        setSelf(new Date());
      }, FIVE_MINUTES);

      return () => clearInterval(interval);
    },
  ],
});

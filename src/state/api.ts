import { atom, selector } from "recoil";
import { ApiActivity } from "../api/responseTypes";
import { Api, SUCCESS } from "../api/base";
import { nullApi } from "../api/nullApi";

const FIVE_MINUTES = 300000;

export const apiState = atom<Api>({
  key: "api",
  default: nullApi,
});

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

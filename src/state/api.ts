import { atom, selector } from "recoil";
import { ApiActivity } from "../api/responseTypes";
import { Api, SUCCESS } from "../api/base";
import { nullApi } from "../api/nullApi";
import { persistAtom } from "./useMyActivities";
import { OauthApi } from "../api/oauthApi";

const FIVE_MINUTES = 300000;

export const oauthState = atom<string | undefined>({
  key: "oauthToken",
  default: undefined,
  effects_UNSTABLE: [persistAtom],
});

export const apiState = atom<Api>({
  key: "api",
  default: selector<Api>({
    key: "apiState/default",
    get: ({ get }) => {
      const token = get(oauthState);
      return token ? new OauthApi(token) : nullApi;
    },
  }),
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

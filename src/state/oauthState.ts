import { atom, selector } from "recoil";
import { recoilPersist } from "recoil-persist";
import { Api } from "../api/base";
import { OauthApi } from "../api/oauthApi";
import { nullApi } from "../api/nullApi";

export const { persistAtom } = recoilPersist({ key: "recoil-oauth" });

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

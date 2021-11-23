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

/**
 * Atom that holds an Oauth or null Api
 * should only be set in tests
 * delegates to default selector
 * perhaps should be re-written as a writable selector that sets the oauth token on set
 * - this could make testing potentially less flexible?
 */
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

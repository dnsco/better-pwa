import { selectorFamily, useRecoilValue, useRecoilValueLoadable } from "recoil";
import { apiState } from "../oauthState";
import { SUCCESS, UUID } from "../../api/base";
import { shouldFetchOwnActivitiesAt } from "../api";

export type ActivityCompletion = { uuid: UUID; doneAt: Date };

export const useActivityCompletions = (
  activtyId: UUID
): ActivityCompletion[] => {
  const loadable = useRecoilValueLoadable(apiCompletions(activtyId));
  if (loadable.state !== "hasValue") return [];
  return loadable.valueOrThrow();
};

const apiCompletions = selectorFamily<ActivityCompletion[], UUID>({
  key: "activityCompletions",
  get:
    (activityId) =>
    async ({ get }) => {
      get(shouldFetchOwnActivitiesAt);
      const api = get(apiState);
      const response = await api.activityCompletions({ activityId });
      if (response.kind !== SUCCESS) return [];
      return response.data.map(
        (remote): ActivityCompletion => ({
          uuid: remote.uuid,
          doneAt: new Date(remote.done_at),
        })
      );
    },
});

import { recoilHookRenderContext } from "recoil-test-render-hooks";
import { v4 } from "uuid";
import { randomInt } from "crypto";
import { useActivityCompletions } from "../useActivityCompletions";
import { apiState } from "../../oauthState";
import { nullApi } from "../../../api/nullApi";
import {
  Api,
  ApiActivityCompletion,
  apiPromiseSuccess,
  NOOP,
  UUID,
} from "../../../api/base";

describe("useActivityCompletions", () => {
  const ACTIVITY_ID_2_COMPLETIONS = v4();

  const newActivityCompletion = (
    activitityId: UUID,
    date = new Date()
  ): ApiActivityCompletion => ({
    activity_uuid: activitityId,
    id: randomInt(1000000),
    uuid: v4(),
    done_at: date.toISOString(),
  });

  const FIRST_DONE_AT = new Date();

  const FAKE_DB = {
    [ACTIVITY_ID_2_COMPLETIONS]: [
      newActivityCompletion(ACTIVITY_ID_2_COMPLETIONS, FIRST_DONE_AT),
      newActivityCompletion(ACTIVITY_ID_2_COMPLETIONS),
    ],
  };

  const ApiWithFakeResponses: Api = {
    ...nullApi,
    activityCompletions({ activityId }) {
      const completions = FAKE_DB[activityId];
      if (!completions) throw new Error("FAILLL");

      return apiPromiseSuccess(completions);
    },
  };

  it("returns the completions for an activity UUID", async () => {
    const { getCurrentValue } = recoilHookRenderContext((s) =>
      s.set(apiState, ApiWithFakeResponses)
    );
    const completions = await getCurrentValue(() =>
      useActivityCompletions(ACTIVITY_ID_2_COMPLETIONS)
    );
    expect(completions).toHaveLength(2);
    expect(completions[0]?.doneAt).toEqual(FIRST_DONE_AT);
  });

  describe("When the api has not yet returned", () => {
    it("returns an empty array", async () => {
      const { getCurrentValue } = recoilHookRenderContext((s) =>
        s.set(apiState, {
          ...nullApi,
          activityCompletions() {
            return new Promise(NOOP); // pending
          },
        })
      );

      const completions = await getCurrentValue(() =>
        useActivityCompletions(ACTIVITY_ID_2_COMPLETIONS)
      );
      expect(completions).toHaveLength(0);
    });
  });
});

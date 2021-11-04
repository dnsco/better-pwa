import { Api, ApiPromise, ERROR, ErrorResponse, SUCCESS } from "./api";
import { Activity } from "./myActivities";

class OauthApi implements Api {
  oauthToken: string;

  constructor(oauthToken: string) {
    this.oauthToken = oauthToken;
  }

  myActivities(): ApiPromise<Activity[]> {
    const token = this.oauthToken;
    return fetch("https://better.ngrok.io/api/v0/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (resp) => {
        if (resp.ok) {
          return resp.json();
        }
        throw resp;
      })
      .then(
        (json) => ({ kind: SUCCESS, data: json }),
        (e): ErrorResponse => ({ kind: ERROR, error: e })
      );
  }
}

describe("API INTEGRATOIN", () => {
  const oauthToken = "PVL2EGwJgYjwiWndR4SCfBTDUBsc0iGfuwlpV5D3G78";

  it("Fetches my activities", async () => {
    const api = new OauthApi(oauthToken);

    const activitiesResp = await api.myActivities();

    if (activitiesResp.kind === ERROR) {
      throw activitiesResp.error;
    }

    const activities = activitiesResp.data;

    expect(activities.length).toBeGreaterThan(0);
  });
});

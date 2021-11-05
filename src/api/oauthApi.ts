import { Activity } from "../state/myActivities";
import { Api, ApiPromise, ERROR, ErrorResponse, SUCCESS } from "./base";
import { ApiActivity, UUID } from "./responseTypes";

export class OauthApi implements Api {
  oauthToken: string;

  constructor(oauthToken: string) {
    this.oauthToken = oauthToken;
  }

  myActivities(): ApiPromise<ApiActivity[]> {
    const url = "https://better.ngrok.io/api/v0/activities";
    return this.parseResponse(url);
  }

  private parseResponse<T>(url: string): ApiPromise<T> {
    const token = this.oauthToken;
    return fetch(url, {
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

  createActivity(
    _name: string,
    _uuid: UUID,
    _frequency: number
  ): ApiPromise<Activity> {
    return this.parseResponse("CREATELOLOl");
  }
}

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { ActivitiesForm } from "./ActivitiesForm";
import { Activity } from "../state/myActivities";

describe("THE APP", () => {
  beforeAll(() => {
    const app = render(
      <RecoilRoot>
        <ActivitiesForm />
      </RecoilRoot>
    );

    const name = app.getByLabelText("name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "YES" } });
    fireEvent.click(app.getByLabelText("create"));
  });

  test("adds the newly created activity to the page", () => {
    expect(screen.getByTestId("activity-YES")).toBeInTheDocument();
  });

  test("it persists the activities to local storage", () => {
    const { localActivities = [] } = recoilLocalStorage();
    expect(localActivities[0]?.name).toBe("YES");
  });

  function recoilLocalStorage(): { localActivities?: Activity[] } {
    return JSON.parse(localStorage.getItem("recoil-persist") || "{}");
  }
});

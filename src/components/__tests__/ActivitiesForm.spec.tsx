import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { act } from "react-dom/test-utils";
import { ActivitiesForm } from "../ActivitiesForm";

describe("THE APP", () => {
  async function renderAndCreateActivity() {
    render(
      <RecoilRoot>
        <ActivitiesForm />
      </RecoilRoot>
    );

    await act(() => {
      const name = screen.getByLabelText("name") as HTMLInputElement;
      fireEvent.change(name, { target: { value: "NewActivity1" } });
      fireEvent.click(screen.getByLabelText("create"));
      return Promise.resolve();
    });
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it("adds the newly created activity to the page", async () => {
    await renderAndCreateActivity();
    expect(screen.getByTestId("activity-NewActivity1")).toBeInTheDocument();
  });

  it("adds new items to  a list", async () => {
    await renderAndCreateActivity();

    await act(() => {
      const name = screen.getByLabelText("name") as HTMLInputElement;
      fireEvent.change(name, { target: { value: "NewActivity2" } });
      fireEvent.click(screen.getByLabelText("create"));
      return Promise.resolve();
    });
    expect(screen.getByTestId("activity-NewActivity2")).toBeInTheDocument();
    expect(screen.getByTestId("activity-NewActivity1")).toBeInTheDocument();
  });
});

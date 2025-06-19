import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen } from "__support__/ui";
import type { SetupStep } from "metabase/setup/types";
import type { Locale } from "metabase-types/store";
import {
  createMockLocale,
  createMockSettingsState,
  createMockSetupState,
  createMockState,
} from "metabase-types/store/mocks";

import { LanguageStep } from "./LanguageStep";

interface SetupOpts {
  step?: SetupStep;
  locale?: Locale;
}

const setup = ({ step = "language", locale }: SetupOpts = {}) => {
  const state = createMockState({
    setup: createMockSetupState({
      step,
      locale,
    }),
    settings: createMockSettingsState({
      "available-locales": [
        ["en", "English"],
        ["fr", "French"],
      ],
    }),
  });

  renderWithProviders(<LanguageStep stepLabel={0} />, {
    storeInitialState: state,
  });
};

describe("LanguageStep", () => {
  it("should render in inactive state", () => {
    setup({
      step: "user_info",
      locale: createMockLocale({ name: "English" }),
    });

    expect(screen.getByText(/set to English/)).toBeInTheDocument();
  });

  it("should allow language selection", async () => {
    setup({
      step: "language",
    });

    const option = screen.getByRole("radio", { name: "English" });
    await userEvent.click(option);

    expect(option).toBeChecked();
  });

  it("should enable Next button when language is selected", async () => {
    setup({
      step: "language",
    });

    // Initially, Next button should be disabled
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();

    // Select a language
    const frenchOption = screen.getByRole("radio", { name: "French" });
    await userEvent.click(frenchOption);

    // Verify the radio button is checked (local state updated)
    expect(frenchOption).toBeChecked();

    // Next button should now be enabled
    expect(nextButton).toBeEnabled();
  });

  it("should show selected language in radio button state", async () => {
    setup({
      step: "language",
      locale: createMockLocale({ name: "English", code: "en" }),
    });

    // Initially English should be selected
    const englishOption = screen.getByRole("radio", { name: "English" });
    const frenchOption = screen.getByRole("radio", { name: "French" });

    expect(englishOption).toBeChecked();
    expect(frenchOption).not.toBeChecked();

    // Select French
    await userEvent.click(frenchOption);

    // French should now be selected
    expect(frenchOption).toBeChecked();
    expect(englishOption).not.toBeChecked();
  });
});

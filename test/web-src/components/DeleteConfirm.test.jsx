import { fireEvent, render, screen } from "@testing-library/react";

import DeleteConfirm from "../../../src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm";

jest.mock("@adobe/react-spectrum", () => ({
  DialogContainer: ({ children }) => (
    <div data-testid="dialog-container">{children}</div>
  ),
  AlertDialog: ({
    title,
    children,
    primaryActionLabel,
    cancelLabel,
    onPrimaryAction,
    onCancel,
  }) => (
    <div>
      <div>{title}</div>
      <div>{children}</div>
      <button onClick={onPrimaryAction} type="button">
        {primaryActionLabel}
      </button>
      <button onClick={onCancel} type="button">
        {cancelLabel}
      </button>
    </div>
  ),
}));

describe("DeleteConfirm", () => {
  const mockRule = { country: "US", region: "CA" };
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the rule country and region in the dialog body", () => {
    render(
      <DeleteConfirm
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        rule={mockRule}
      />,
    );

    expect(
      screen.getByText("Are you sure you want to delete the rule for US / CA?"),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the delete button is clicked", () => {
    render(
      <DeleteConfirm
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        rule={mockRule}
      />,
    );

    fireEvent.click(screen.getByText("Delete"));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    render(
      <DeleteConfirm
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        rule={mockRule}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when cancel is clicked", () => {
    render(
      <DeleteConfirm
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        rule={mockRule}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("does not call onCancel when delete is clicked", () => {
    render(
      <DeleteConfirm
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        rule={mockRule}
      />,
    );

    fireEvent.click(screen.getByText("Delete"));

    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});

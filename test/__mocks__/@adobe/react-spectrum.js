const React = require("react");

const DialogContainer = ({ children, onDismiss }) =>
  React.createElement(
    "div",
    { "data-testid": "dialog-container", onClick: onDismiss },
    children,
  );

const AlertDialog = ({
  title,
  children,
  primaryActionLabel,
  cancelLabel,
  onPrimaryAction,
  onCancel,
}) =>
  React.createElement(
    "div",
    null,
    React.createElement("div", null, title),
    React.createElement("div", null, children),
    React.createElement(
      "button",
      { onClick: onPrimaryAction },
      primaryActionLabel,
    ),
    React.createElement("button", { onClick: onCancel }, cancelLabel),
  );

const Provider = ({ children }) => React.createElement("div", null, children);

const lightTheme = {};

module.exports = { DialogContainer, AlertDialog, Provider, lightTheme };

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

const TableView = ({ children, ...props }) =>
  React.createElement(
    "div",
    { "data-testid": "table-view", ...props },
    children,
  );

const TableHeader = ({ children }) =>
  React.createElement("div", { "data-testid": "table-header" }, children);

const TableBody = ({ children }) =>
  React.createElement("div", { "data-testid": "table-body" }, children);

const Column = ({ children }) =>
  React.createElement("div", { "data-testid": "column" }, children);

const Row = ({ children }) =>
  React.createElement("div", { "data-testid": "row" }, children);

const Cell = ({ children }) =>
  React.createElement("div", { "data-testid": "cell" }, children);

const ActionButton = ({ children, onPress, ...props }) =>
  React.createElement("button", { onClick: onPress, ...props }, children);

const Button = ({ children, onPress, ...props }) =>
  React.createElement("button", { onClick: onPress, ...props }, children);

const Flex = ({ children, ...props }) =>
  React.createElement("div", { "data-testid": "flex", ...props }, children);

const View = ({ children, ...props }) =>
  React.createElement("div", { "data-testid": "view", ...props }, children);

const Heading = ({ children, ...props }) =>
  React.createElement("h2", props, children);

const ProgressCircle = ({ "aria-label": ariaLabel, ...props }) =>
  React.createElement("div", {
    "data-testid": "loading-indicator",
    "aria-label": ariaLabel,
    ...props,
  });

const Text = ({ children, ...props }) =>
  React.createElement("span", props, children);

const Dialog = ({ children, ...props }) =>
  React.createElement("div", { "data-testid": "dialog", ...props }, children);

const Divider = (props) =>
  React.createElement("hr", { "data-testid": "divider", ...props });

const Content = ({ children, ...props }) =>
  React.createElement("div", { "data-testid": "content", ...props }, children);

const Form = ({ children, ...props }) =>
  React.createElement("form", { "data-testid": "form", ...props }, children);

const TextField = ({ label, value, onChange, errorMessage, ...props }) =>
  React.createElement(
    "div",
    null,
    React.createElement("label", null, label),
    React.createElement("input", {
      "data-testid": `field-${label?.toLowerCase()}`,
      value: value || "",
      onChange: (e) => onChange?.(e.target.value),
      ...props,
    }),
    errorMessage &&
      React.createElement("span", { "data-testid": "error" }, errorMessage),
  );

const NumberField = ({ label, value, onChange, errorMessage, ...props }) =>
  React.createElement(
    "div",
    null,
    React.createElement("label", null, label),
    React.createElement("input", {
      "data-testid": `field-${label?.toLowerCase()}`,
      type: "number",
      value: value !== undefined && value !== null ? value : "",
      onChange: (e) => onChange?.(Number.parseFloat(e.target.value) || 0),
      ...props,
    }),
    errorMessage &&
      React.createElement("span", { "data-testid": "error" }, errorMessage),
  );

const ButtonGroup = ({ children, ...props }) =>
  React.createElement(
    "div",
    { "data-testid": "button-group", ...props },
    children,
  );

module.exports = {
  DialogContainer,
  AlertDialog,
  Provider,
  lightTheme,
  TableView,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  ActionButton,
  Button,
  Flex,
  View,
  Heading,
  ProgressCircle,
  Text,
  Dialog,
  Divider,
  Content,
  Form,
  TextField,
  NumberField,
  ButtonGroup,
};

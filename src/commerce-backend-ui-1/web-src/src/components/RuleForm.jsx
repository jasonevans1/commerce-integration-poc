import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  Divider,
  Form,
  Heading,
  NumberField,
  TextField,
} from "@adobe/react-spectrum";
import React, { useState } from "react";

import { createRule, updateRule } from "../utils/api";

const EMPTY_FORM = { country: "", region: "", name: "", type: "", value: null };

function validateForm(fields) {
  const errors = {};
  if (!fields.country) {
    errors.country = "Country is required.";
  }
  if (!fields.region) {
    errors.region = "Region is required.";
  }
  if (!fields.name) {
    errors.name = "Name is required.";
  }
  if (!fields.type) {
    errors.type = "Type is required.";
  }
  if (
    fields.value === null ||
    fields.value === undefined ||
    fields.value <= 0
  ) {
    errors.value = "Value must be a positive number.";
  }
  return errors;
}

export default function RuleForm({ rule, ims, onSuccess, onCancel }) {
  const isEditMode = rule !== null && rule !== undefined;

  const [fields, setFields] = useState(
    isEditMode ? { ...rule } : { ...EMPTY_FORM },
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleFieldChange(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    const validationErrors = validateForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const saved = isEditMode
        ? await updateRule(ims, fields)
        : await createRule(ims, fields);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  }

  return React.createElement(
    Dialog,
    null,
    React.createElement(Heading, null, isEditMode ? "Edit Rule" : "Add Rule"),
    React.createElement(Divider, null),
    React.createElement(
      Content,
      null,
      React.createElement(
        Form,
        null,
        React.createElement(TextField, {
          label: "Country",
          value: fields.country,
          onChange: (val) => handleFieldChange("country", val),
          errorMessage: errors.country,
        }),
        React.createElement(TextField, {
          label: "Region",
          value: fields.region,
          onChange: (val) => handleFieldChange("region", val),
          errorMessage: errors.region,
        }),
        React.createElement(TextField, {
          label: "Name",
          value: fields.name,
          onChange: (val) => handleFieldChange("name", val),
          errorMessage: errors.name,
        }),
        React.createElement(TextField, {
          label: "Type",
          value: fields.type,
          onChange: (val) => handleFieldChange("type", val),
          errorMessage: errors.type,
        }),
        React.createElement(NumberField, {
          label: "Value",
          value: fields.value,
          onChange: (val) => handleFieldChange("value", val),
          errorMessage: errors.value,
        }),
      ),
    ),
    React.createElement(
      ButtonGroup,
      null,
      React.createElement(
        Button,
        { variant: "secondary", onPress: onCancel },
        "Cancel",
      ),
      React.createElement(
        Button,
        {
          variant: "cta",
          onPress: handleSubmit,
          isDisabled: submitting,
          disabled: submitting,
        },
        "Save",
      ),
    ),
  );
}

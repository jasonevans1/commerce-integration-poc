import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../utils/api.js";
import { useImsToken } from "../utils/GuestConnectionContext.js";

const MAX_PERCENTAGE = 100;

function validate(fields) {
  if (!fields.country) {
    return "country is required";
  }
  if (!fields.region) {
    return "region is required";
  }
  if (!fields.name) {
    return "name is required";
  }
  if (fields.type !== "fixed" && fields.type !== "percentage") {
    return "type must be fixed or percentage";
  }
  const numValue = Number.parseFloat(fields.value);
  if (Number.isNaN(numValue) || numValue <= 0) {
    return "value must be a positive number";
  }
  if (fields.type === "percentage" && numValue > MAX_PERCENTAGE) {
    return "percentage value must not exceed 100";
  }
  return null;
}

export default function RuleForm() {
  const { country: editCountry, region: editRegion } = useParams();
  const isEditMode = Boolean(editCountry && editRegion);
  const navigate = useNavigate();
  const imsToken = useImsToken();

  const [fields, setFields] = useState({
    country: "",
    region: "",
    name: "",
    type: "",
    value: "",
  });
  const [loading, setLoading] = useState(isEditMode);
  const [validationError, setValidationError] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }
    setLoading(true);
    api
      .getRule(imsToken, editCountry, editRegion)
      .then((rule) => {
        setFields({
          country: rule.country,
          region: rule.region,
          name: rule.name,
          type: rule.type,
          value: rule.value,
        });
        setLoading(false);
      })
      .catch((err) => {
        setApiError(err.message);
        setLoading(false);
      });
  }, [isEditMode, imsToken, editCountry, editRegion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    const error = validate(fields);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    try {
      await api.createRule(imsToken, {
        country: fields.country,
        region: fields.region,
        name: fields.name,
        type: fields.type,
        value: fields.value,
      });
      navigate("/");
    } catch (err) {
      setApiError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {validationError && <div role="alert">{validationError}</div>}
      {apiError && <div role="alert">{apiError}</div>}

      <div>
        <label htmlFor="country">Country</label>
        <input
          id="country"
          name="country"
          onChange={handleChange}
          readOnly={isEditMode}
          type="text"
          value={fields.country}
        />
      </div>

      <div>
        <label htmlFor="region">Region</label>
        <input
          id="region"
          name="region"
          onChange={handleChange}
          readOnly={isEditMode}
          type="text"
          value={fields.region}
        />
      </div>

      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          onChange={handleChange}
          type="text"
          value={fields.name}
        />
      </div>

      <div>
        <label htmlFor="type">Type</label>
        <select
          id="type"
          name="type"
          onChange={handleChange}
          value={fields.type}>
          <option value="">-- select --</option>
          <option value="fixed">fixed</option>
          <option value="percentage">percentage</option>
        </select>
      </div>

      <div>
        <label htmlFor="value">Value</label>
        <input
          id="value"
          name="value"
          onChange={handleChange}
          type="number"
          value={fields.value}
        />
      </div>

      <button type="submit">Save</button>
    </form>
  );
}

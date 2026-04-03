import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../utils/api.js";
import { useImsToken } from "../utils/GuestConnectionContext.js";
import DeleteConfirm from "./DeleteConfirm.jsx";

const RuleList = () => {
  const imsToken = useImsToken();
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listRules(imsToken);
      setRules(data);
    } catch (_err) {
      setError("Failed to load rules.");
    } finally {
      setLoading(false);
    }
  }, [imsToken]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleDelete = async () => {
    await api.deleteRule(imsToken, ruleToDelete.country, ruleToDelete.region);
    setRuleToDelete(null);
    await fetchRules();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <button onClick={() => navigate("/rules/new")} type="button">
        Create New Rule
      </button>
      {rules.length === 0 ? (
        <p>No rules found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Country</th>
              <th>Region</th>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={`${rule.country}-${rule.region}`}>
                <td>{rule.country}</td>
                <td>{rule.region}</td>
                <td>{rule.name}</td>
                <td>{rule.type}</td>
                <td>{rule.value}</td>
                <td>
                  <button
                    onClick={() =>
                      navigate(`/rules/edit/${rule.country}/${rule.region}`)
                    }
                    type="button">
                    Edit
                  </button>
                  <button onClick={() => setRuleToDelete(rule)} type="button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {ruleToDelete !== null && (
        <DeleteConfirm
          onCancel={() => setRuleToDelete(null)}
          onConfirm={handleDelete}
          rule={ruleToDelete}
        />
      )}
    </div>
  );
};

export default RuleList;

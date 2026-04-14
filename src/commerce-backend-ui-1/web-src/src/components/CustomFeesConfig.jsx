import {
  ActionButton,
  Button,
  Cell,
  Column,
  Flex,
  Heading,
  ProgressCircle,
  Row,
  TableBody,
  TableHeader,
  TableView,
  Text,
  View,
} from "@adobe/react-spectrum";
import { useCallback, useEffect, useState } from "react";

import { listRules } from "../utils/api";
import DeleteConfirm from "./DeleteConfirm";
import RuleForm from "./RuleForm";

const STATE_IDLE = "idle";
const STATE_LOADING = "loading";
const STATE_ERROR = "error";

export default function CustomFeesConfig({ ims }) {
  const [rules, setRules] = useState([]);
  const [fetchState, setFetchState] = useState(STATE_LOADING);
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingRule, setDeletingRule] = useState(null);

  const fetchRules = useCallback(async () => {
    setFetchState(STATE_LOADING);
    try {
      const fetched = await listRules(ims);
      setRules(fetched);
      setFetchState(STATE_IDLE);
    } catch (_err) {
      setFetchState(STATE_ERROR);
    }
  }, [ims]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleAddRule = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDeleteRule = (rule) => {
    setDeletingRule(rule);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingRule(null);
    await fetchRules();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleDeleteConfirm = async () => {
    setDeletingRule(null);
    await fetchRules();
  };

  const handleDeleteCancel = () => {
    setDeletingRule(null);
  };

  if (fetchState === STATE_LOADING) {
    return (
      <View>
        <ProgressCircle aria-label="Loading rules" isIndeterminate />
      </View>
    );
  }

  if (fetchState === STATE_ERROR) {
    return (
      <View>
        <Text>Failed to load rules. Please try again.</Text>
      </View>
    );
  }

  return (
    <View>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={1}>Delivery Fee Rules</Heading>
        <Button onPress={handleAddRule} variant="cta">
          Add Rule
        </Button>
      </Flex>

      {showForm && (
        <RuleForm
          ims={ims}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
          rule={editingRule}
        />
      )}

      {deletingRule && (
        <DeleteConfirm
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          rule={deletingRule}
        />
      )}

      {rules.length === 0 ? (
        <Text>No delivery fee rules found.</Text>
      ) : (
        <TableView aria-label="Delivery fee rules">
          <TableHeader>
            <Column>Country</Column>
            <Column>Region</Column>
            <Column>Name</Column>
            <Column>Type</Column>
            <Column>Value</Column>
            <Column>Actions</Column>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <Row key={`${rule.country}-${rule.region}`}>
                <Cell>{rule.country}</Cell>
                <Cell>{rule.region}</Cell>
                <Cell>{rule.name}</Cell>
                <Cell>{rule.type}</Cell>
                <Cell>{rule.value}</Cell>
                <Cell>
                  <ActionButton onPress={() => handleEditRule(rule)}>
                    Edit
                  </ActionButton>
                  <ActionButton onPress={() => handleDeleteRule(rule)}>
                    Delete
                  </ActionButton>
                </Cell>
              </Row>
            ))}
          </TableBody>
        </TableView>
      )}
    </View>
  );
}

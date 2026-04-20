import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  Divider,
  Heading,
  Text,
} from "@adobe/react-spectrum";

export default function DeleteConfirm({ rule, onConfirm, onCancel }) {
  const identifier = `${rule.country} / ${rule.region}`;

  return (
    <Dialog>
      <Heading>Delete Delivery Fee Rule</Heading>
      <Divider />
      <Content>
        <Text>
          Are you sure you want to delete the rule for {identifier}? This action
          cannot be undone.
        </Text>
      </Content>
      <ButtonGroup>
        <Button onPress={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onPress={onConfirm} variant="negative">
          Delete
        </Button>
      </ButtonGroup>
    </Dialog>
  );
}

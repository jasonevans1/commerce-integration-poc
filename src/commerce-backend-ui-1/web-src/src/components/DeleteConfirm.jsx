import { AlertDialog, DialogContainer } from "@adobe/react-spectrum";

const DeleteConfirm = ({ rule, onConfirm, onCancel }) => {
  return (
    <DialogContainer onDismiss={onCancel}>
      <AlertDialog
        cancelLabel="Cancel"
        onCancel={onCancel}
        onPrimaryAction={onConfirm}
        primaryActionLabel="Delete"
        title="Delete Rule"
        variant="destructive">
        {`Are you sure you want to delete the rule for ${rule.country} / ${rule.region}?`}
      </AlertDialog>
    </DialogContainer>
  );
};

export default DeleteConfirm;

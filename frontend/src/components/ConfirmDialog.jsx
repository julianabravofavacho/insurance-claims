import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'

export function ConfirmDialog({ claim, onCancel, onConfirm, submitting }) {
  return (
    <Modal
      opened={Boolean(claim)}
      onClose={onCancel}
      title="Excluir sinistro"
      centered
      radius="lg"
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Stack gap="lg">
        <Text c="dimmed">
          Confirma a exclusão do sinistro <Text span fw={800}>{claim?.claimNumber}</Text>? O registro será removido da
          listagem, mas permanecerá preservado no banco.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button color="red" leftSection={<IconTrash size={16} />} onClick={onConfirm} loading={submitting}>
            Excluir
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

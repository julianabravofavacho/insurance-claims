import { Drawer } from '@mantine/core'
import { ClaimForm } from './ClaimForm'

export function ClaimDrawer({ claim, claimTypes, isOpen, onSubmit, onClose, submitting }) {
  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="right"
      size="lg"
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
    >
      <ClaimForm
        claim={claim}
        claimTypes={claimTypes}
        onSubmit={onSubmit}
        onCancel={onClose}
        submitting={submitting}
      />
    </Drawer>
  )
}

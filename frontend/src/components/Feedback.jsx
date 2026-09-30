import { useEffect } from 'react'
import { Alert, Transition } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'

const SUCCESS_DURATION_MS = 5000

export function Feedback({ message, type, onClose }) {
  useEffect(() => {
    if (!message || type !== 'success') {
      return undefined
    }

    const timeoutId = window.setTimeout(onClose, SUCCESS_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [message, type, onClose])

  const isSuccess = type === 'success'

  return (
    <Transition mounted={Boolean(message)} transition="slide-down" duration={180} timingFunction="ease">
      {(styles) => (
        <Alert
          className="feedback-alert"
          style={styles}
          color={isSuccess ? 'green' : 'red'}
          icon={isSuccess ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
          role="alert"
          withCloseButton
          closeButtonLabel="Fechar mensagem"
          onClose={onClose}
          title={isSuccess ? 'Sucesso' : 'Atenção'}
        >
          {message}
        </Alert>
      )}
    </Transition>
  )
}

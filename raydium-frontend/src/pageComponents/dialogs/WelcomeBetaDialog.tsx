import React, * as react from 'react'

import { twMerge } from 'tailwind-merge'

import useToggle from '@/hooks/useToggle'

import Button from '../../components/Button'
import Card from '../../components/Card'
import Col from '../../components/Col'
import Dialog from '../../components/Dialog'
import Icon, { AppHeroIconName } from '../../components/Icon'

export default function WelcomeBetaDialog(props: { content: react.ReactNode; onConfirm?: () => void }) {
  const [isOpen, { off: _close }] = useToggle(true)
  const hasConfirmed = react.useRef(false)

  const confirm = react.useCallback(() => {
    props.onConfirm?.()
    hasConfirmed.current = true
    _close()
  }, [_close])

  const close = react.useCallback(() => {
    _close()
  }, [_close])

  return (
    <Dialog open={isOpen} onClose={close}>
      <Card
        className={twMerge(
          `p-8 rounded-3xl w-[min(480px,95vw)] mx-8 border-1.5 border-[rgba(171,196,255,0.2)]  bg-cyberpunk-card-bg shadow-cyberpunk-card`
        )}
        size="lg"
      >
        <Col className="items-center">
          {props.content}

          <div className="self-stretch">
            <Col>
              <Button className={`frosted-glass-teal`} onClick={confirm}>
                OK
              </Button>
            </Col>
          </div>
        </Col>
      </Card>
    </Dialog>
  )
}

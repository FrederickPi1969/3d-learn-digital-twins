import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export function BootOverlay() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1150)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="boot-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="boot-overlay__core">
            <span className="boot-overlay__ring" />
            <strong>数字孪生场景初始化</strong>
            <small>SCENE GRAPH · TELEMETRY · POST PROCESSING</small>
            <i><b /></i>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

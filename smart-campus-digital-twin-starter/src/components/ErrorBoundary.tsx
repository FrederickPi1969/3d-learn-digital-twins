import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Digital twin rendering failed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <div>
            <span>WEBGL RENDERING ERROR</span>
            <h1>数字孪生场景启动失败</h1>
            <p>{this.state.error.message}</p>
            <p>请确认浏览器已启用 WebGL 2，并更新显卡驱动后重试。</p>
            <button type="button" onClick={() => window.location.reload()}>重新加载</button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

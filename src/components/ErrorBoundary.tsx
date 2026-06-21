import React from 'react'

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log error to an external service here
    // console.error(error, info)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Terjadi error saat merender komponen</h1>
          <pre className="whitespace-pre-wrap text-sm bg-red-50 border border-red-200 p-4 rounded">{String(this.state.error.stack || this.state.error.message)}</pre>
        </div>
      )
    }

    return this.props.children
  }
}
